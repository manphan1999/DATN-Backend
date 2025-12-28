import fs from 'fs'
import { CronJob } from 'cron';
import fileName from '../configs/fileName'
import {
    TagnameModel, HistoricalValueModel, AlarmValueModel, FTPServerModel,
    MySQLServerModel, SQLServerModel, RTUServerModel, TCPServerModel, PublishModel,
    PublishConfigModel
} from '../configs/connectDB';
import TagHistorical from '../controller/tagHistoricalController';
import TagAlarm from '../controller/tagAlarmController'
import { getAllProtocol } from '../configs/protocol';
import { swapData, getDataLenght, writeDataLenght, dataType } from '../configs/convertData';
import { sendTelegramAlert, formatAlertMessage } from '../ultils/telegramApp'
import { sendLineAlert, formatLineAlert } from '../ultils/lineApp'
import configHistorical from '../controller/configHistoricalController'
import ModbusConnectionManager from '../protocol/modbus/modbusClient';
import ModbusServerRTU from '../protocol/modbus/modbusRTUServer';
import ModbusServerTCP from '../protocol/modbus/modbusTCPServer';
import { publishMQTT } from '../protocol/mqtt/mqtt';
import AppNotifyAlarm from '../controller/configAppNotifyController'
import { writeFileTxt, writeFileCsv, deleteFileFtp, sendFtp } from '../ultils/ftpHandler'
import { insertTagValues } from '../ultils/mysqlHandler';
import { insertTagValuesSQL } from '../ultils/sqlHandler'

class GatewayHandler {
    constructor() {
        this.lastPublishedData = new Map();
        this.modbusManager = new ModbusConnectionManager();
        this.devices = {};
        this.data = [];
        this.reconnectInterval = {};
        this.cronJobUploadFtp = {};
        this.cronJobUploadMysql = {};
        this.cronJobUploadSql = {};
        this.mqttServer = {};
        this.intervalMqttServer = {};
        this.modbusServer = {};
        this.intervalModbusServer = {
            TCP: null,
            RTU: null,
        };
        this.modbusClient = null;
        this.calibrateStatus = 0;
        this.currentConfig = null;
        this.saveDataTimer = null;
        this.saveDataJob = null;
        this.currentHistoricalTagsHash = null;
        this.mqttConfig = {
            enabled: false,
            publishTopics: {},
            subscribeTopics: {}
        };
    }

    async connectAllMQTT() {
        mqttClient.connect();
    }

    async connectAll() {
        try {
            // Sử dụng ModbusManager để kết nối tất cả thiết bị
            const results = await this.modbusManager.connectAll();
            // console.log('check results: ', results)
            // Đồng bộ devices với ModbusManager
            this.syncDevicesWithModbusManager();
            return results;
        } catch (error) { throw error; }
    }

    /**
     * ĐỒNG BỘ DEVICES VỚI MODBUSMANAGER
     */
    syncDevicesWithModbusManager() {
        this.devices = {};
        const allConnections = this.modbusManager.getAllConnections();

        allConnections.forEach(conn => {
            if (conn.isConnected) {
                this.devices[conn.deviceId] = {
                    client: this.modbusManager.getClient(conn.deviceId),
                    info: {
                        protocol: conn.type,
                        deviceId: conn.deviceId,
                        deviceName: conn.deviceName
                    }
                };
            }
        });
    }

    async connectCom() {
        try {
            // Đóng tất cả kết nối cũ
            this.modbusManager.closeAllSerial();

            // Kết nối lại tất cả
            await this.connectAll();
        } catch (error) { throw error; }
    }

    async connectTcpDevice(deviceId) {
        try {
            // Sử dụng ModbusManager để reconnect device cụ thể
            const result = await this.modbusManager.reconnectDevice(deviceId);

            if (result.success) {
                // Đồng bộ lại devices
                this.syncDevicesWithModbusManager();
            } else { }

            return result;
        } catch (error) {
            throw error;
        }
    }

    async readData() {

        try {
            setInterval(async () => {
                const result = []
                const tagnames = await TagnameModel.findAsync();
                for (let tagname of tagnames) {
                    const modbusClient = this.devices[tagname.device._id]
                    if (!modbusClient?.client) {
                        result.push({
                            tagnameId: tagname._id,
                            channel: tagname.channel,
                            slaveId: tagname.slaveId,
                            tagname: tagname.name,
                            deviceName: tagname.device.name,
                            deviceId: tagname.device._id,
                            rawValue: 0,
                            value: 0,
                            unit: tagname.unit,
                            symbol: tagname.symbol,
                            status: this.calibrateStatus == 1 ? 4 : 3, // 4 calibration  3 is error, 1 is normal
                            // lowSet: tagname.lowSet,
                            // highSet: tagname.highSet,
                            selectFTP: tagname.selectFTP,
                            selectMySQL: tagname.selectMySQL,
                            selectSQL: tagname.selectSQL,
                        })
                        continue
                    }

                    modbusClient.client.setID(tagname.slaveId)

                    switch (tagname.functionCode) {
                        case 1: // read coils
                        case 5: // write single coil
                        case 15: // write multiple coils
                            {
                                const data = await this.handleDataModbus(
                                    modbusClient,
                                    'readCoils',
                                    tagname
                                )
                                result.push(data)
                                break
                            }

                        case 2: // read discrete inputs
                            {
                                const data = await this.handleDataModbus(
                                    modbusClient,
                                    'readDiscreteInputs',
                                    tagname
                                )
                                result.push(data)
                                break
                            }

                        case 3: // read holding registers
                        case 6: // write single register
                        case 16: // write multiple registers
                            {
                                const data = await this.handleDataModbus(
                                    modbusClient,
                                    'readHoldingRegisters',
                                    tagname
                                )
                                result.push(data)
                                break
                            }

                        case 4: // read input registers
                            {
                                const data = await this.handleDataModbus(
                                    modbusClient,
                                    'readInputRegisters',
                                    tagname
                                )
                                result.push(data)
                                break
                            }
                    }
                }
                this.data = result
                // console.log(
                //     'Check data tag name status:',
                //     this.data.map(item => item.status)
                // )
                global._io.emit('SERVER SEND HOME DATA', this.data)
            }, 1000)// Tần số quét dữ liệu
        } catch (error) { console.error('Error in readData:', error); }
    }

    getData() {
        try {
            return this.data
        } catch (error) {
            // console.log(`gateway > gatewayHandler > getData [error]: ${error}`)
        }
    }

    async handleDataModbus(modbusClient, functionCode, tagname) {
        try {
            const deviceId = tagname.device._id;
            let data;

            // SỬ DỤNG MODBUSMANAGER ĐỂ ĐỌC DỮ LIỆU VỚI RETRY
            try {
                switch (functionCode) {
                    case 'readCoils':
                        data = await this.modbusManager.readCoils(deviceId, tagname.slaveId, tagname.address,
                            getDataLenght(tagname.dataFormat));
                        break;

                    case 'readDiscreteInputs':
                        data = await this.modbusManager.readDiscreteInputs(deviceId, tagname.slaveId, tagname.address,
                            getDataLenght(tagname.dataFormat));
                        break;

                    case 'readHoldingRegisters':
                        data = await this.modbusManager.readHoldingRegisters(deviceId, tagname.slaveId, tagname.address,
                            getDataLenght(tagname.dataFormat));
                        break;

                    case 'readInputRegisters':
                        data = await this.modbusManager.readInputRegisters(deviceId, tagname.slaveId, tagname.address,
                            getDataLenght(tagname.dataFormat));
                        break;
                }

                // Xóa reconnect interval nếu tồn tại
                if (this.reconnectInterval[deviceId]) {
                    clearInterval(this.reconnectInterval[deviceId]);
                    this.reconnectInterval[deviceId] = null;
                }

            } catch (error) {
                // Tự động reconnect cho TCP devices
                const protocols = getAllProtocol();
                if (!this.reconnectInterval[deviceId] && modbusClient.info.protocol === protocols.Modbus[1].name) {
                    this.reconnectInterval[deviceId] = setInterval(() => {
                        this.connectTcpDevice(deviceId);
                    }, 10000);
                }
                throw error;
            }

            let rawValue = 0, value = 0, status = 1;

            switch (functionCode) {
                case 'readHoldingRegisters':
                case 'readInputRegisters':
                    rawValue = swapData(data.buffer, tagname.dataType);
                    value = rawValue * tagname.gain + tagname.offset;
                    if (tagname.functionText) {
                        try {
                            const fn = eval(`(${tagname.functionText})`);
                            value = fn(value);
                        } catch (err) { }
                    }
                    status = 1;
                    break;

                case 'readCoils':
                case 'readDiscreteInputs':
                    rawValue = data?.data?.[0] ? 1 : 0;
                    value = rawValue;
                    status = 1;
                    break;
            }
            return {
                tagnameId: tagname._id,
                channel: tagname.channel,
                slaveId: tagname.slaveId,
                address: tagname.address,
                tagname: tagname.name,
                symbol: tagname.symbol,
                deviceName: tagname.device.name,
                deviceId: tagname.device?._id,
                functionCode: tagname.functionCode,
                dataFormat: tagname.dataFormat,
                dataType: tagname.dataType,
                permission: tagname.permission,
                rawValue,
                value,
                unit: tagname.unit,
                status: this.calibrateStatus == 1 ? 4 : status,
                // lowSet: tagname.lowSet,
                // highSet: tagname.highSet,
                selectFTP: tagname.selectFTP,
                selectMySQL: tagname.selectMySQL,
                selectSQL: tagname.selectSQL,
            };

        } catch (error) {
            return {
                tagnameId: tagname._id,
                channel: tagname.channel,
                slaveId: tagname.slaveId,
                tagname: tagname.name,
                symbol: tagname.symbol,
                deviceName: tagname.device.name,
                deviceId: tagname.device?._id,
                functionCode: tagname.functionCode,
                dataFormat: tagname.dataFormat,
                dataType: tagname.dataType,
                permission: tagname.permission,
                rawValue: 0,
                value: 0,
                unit: tagname.unit,
                status: this.calibrateStatus == 1 ? 4 : 3,
                lowSet: tagname.lowSet,
                highSet: tagname.highSet,
                selectFTP: tagname.selectFTP,
                selectMySQL: tagname.selectMySQL,
                selectSQL: tagname.selectSQL,
            };
        }
    }

    /**
     * TẠO RESPONSE LỖI
     */
    createErrorResponse(tagname) {
        return {
            tagnameId: tagname._id,
            channel: tagname.channel,
            slaveId: tagname.slaveId,
            tagname: tagname.name,
            symbol: tagname.symbol,
            deviceName: tagname.device.name,
            deviceId: tagname.device?._id,
            functionCode: tagname.functionCode,
            dataFormat: tagname.dataFormat,
            dataType: tagname.dataType,
            permission: tagname.permission,
            rawValue: 0,
            value: 0,
            unit: tagname.unit,
            status: this.calibrateStatus == 1 ? 4 : 3,
            lowSet: tagname.lowSet,
            highSet: tagname.highSet,
            selectFTP: tagname.selectFTP,
            selectMySQL: tagname.selectMySQL,
            selectSQL: tagname.selectSQL,
        };
    }

    async writeDataModbus({ deviceId, slaveId, address, functionCode, dataType, dataFormat, newValue }) {
        try {
            switch (functionCode) {
                case 5: // Write Single Coil (bit)
                    await this.modbusManager.writeCoil(deviceId, slaveId, address, newValue > 0);
                    break;

                case 6: // Write Single Register (16-bit)
                    {
                        const writeBuffer = writeDataLenght(newValue, dataType);
                        const singleValue = writeBuffer.readUInt16BE(0);
                        await this.modbusManager.writeRegister(deviceId, slaveId, address, singleValue);
                    }
                    break;

                case 15: // Write Multiple Coils (bit array)
                    let coilsArray = [];

                    if (Array.isArray(newValue)) {
                        coilsArray = newValue.map(v => v > 0);
                    } else if (typeof newValue === 'number') {
                        const bitCount = dataFormat || (Math.floor(Math.log2(newValue)) + 1);
                        for (let i = 0; i < bitCount; i++) {
                            coilsArray.push(((newValue >> i) & 1) === 1);
                        }
                    } else {
                        throw new Error("Giá trị ghi coil không hợp lệ");
                    }

                    // Nếu vẫn rỗng , tạo mảng toàn false đúng với số coil cần ghi
                    if (coilsArray.length === 0) {
                        const bitCount = dataFormat || 1;
                        coilsArray = new Array(bitCount).fill(false);
                    }

                    await this.modbusManager.writeCoils(deviceId, slaveId, address, coilsArray);
                    break;

                case 16: //  Write Multiple Registers (32-bit, 64-bit, float…)
                    {
                        const writeBuffer = writeDataLenght(newValue, dataType);
                        // chia buffer thành mảng 16-bit
                        const registers = [];
                        for (let i = 0; i < writeBuffer.length; i += 2) {
                            registers.push(writeBuffer.readUInt16BE(i));
                        }
                        await this.modbusManager.writeRegisters(deviceId, slaveId, address, registers);
                    }
                    break;

                default:
                    throw new Error("Function code không hỗ trợ ghi");
            }
            return { success: true, message: "Ghi thành công" };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
    * LẤY DỮ LIỆU THEO TAGNAME ID 
    */
    async getDataByTagnameId(tagnameId) {
        try {
            const result = this.data.find(item =>
                item.tagnameId.toString() === tagnameId.toString()
            );

            if (!result) {
                console.log(`No data found for tagnameId: ${tagnameId}`);
            }

            return result;
        } catch (error) {
            return null;
        }
    }

    /**
    * PUBLISH MQTT
    */
    async publishDataTobroker() {
        try {
            if (!this.mqttServer) return;

            if (this.intervalMqttServer) {
                clearInterval(this.intervalMqttServer);
                this.intervalMqttServer = null;
            }

            this.intervalMqttServer = setInterval(async () => {
                try {
                    const tagPublish = await PublishModel.findAsync();
                    const brokersMqtt = await PublishConfigModel.findAsync();

                    for (const broker of brokersMqtt) {

                        const payload = {};

                        for (const tag of tagPublish) {
                            const tagData = await this.getDataByTagnameId(tag.id);
                            if (!tagData) continue;

                            payload[tag.symbol] = tagData.value;
                        }

                        if (Object.keys(payload).length === 0) continue;

                        const messageObj = { datalogger: payload };
                        const messageStr = JSON.stringify(messageObj);

                        const lastMessage = this.lastPublishedData.get(broker._id);

                        // Gửi khi Data thay đổi
                        if (lastMessage === messageStr) {
                            continue;
                        }

                        this.lastPublishedData.set(broker._id, messageStr);

                        console.log(
                            `[MQTT PUBLISH] ${broker.ipAddress}:${broker.port} -> ${broker.topic}`,
                            messageStr
                        );

                        publishMQTT(broker, broker.topic, messageStr);
                    }

                } catch (error) {
                    console.error('Error in MQTT Server interval:', error);
                }
            }, 1000);

        } catch (error) {
            console.error('Error in writeDataTobroker:', error);
        }
    }
    /**
     * MODBUS SERVER
     */

    //CHUYỂN ĐỔI GIÁ TRỊ THÀNH REGISTERS
    valueToRegisters(value, dataType) {
        try {
            const bufferToRegisters = (buffer) => {
                const regs = [];
                for (let i = 0; i < buffer.length; i += 2) {
                    regs.push(buffer.readUInt16BE(i));
                }
                return regs;
            };
            const buf = writeDataLenght(value, dataType);
            const regs = bufferToRegisters(buf);
            return regs;
        } catch (error) {
            console.error('Error in valueToRegisters:', error);
            return [0];
        }
    }

    async connectModbusServer(type) {
        try {
            if (type == 'TCP' && !this.modbusServer[type]) {
                this.modbusServer[type] = new ModbusServerTCP()
                this.modbusServer[type].connectModbusServer()
            } else if (type == 'RTU' && !this.modbusServer[type]) {
                this.modbusServer[type] = new ModbusServerRTU()
                this.modbusServer[type].connectModbusServer()
            }
        } catch (error) { }
    }

    /**
    * GHI DỮ LIỆU VÀO MODBUS SERVER
    */
    async writeDataToModbusServer() {
        try {
            const ensureArraySize = (arr, size) => {
                while (arr.length <= size) {
                    arr.push(0);
                }
            };
            // Xử lý cho TCP Server
            if (this.modbusServer['TCP']) {
                if (this.intervalModbusServer['TCP']) {
                    clearInterval(this.intervalModbusServer['TCP']);
                    this.intervalModbusServer['TCP'] = null;
                }

                this.intervalModbusServer['TCP'] = setInterval(async () => {
                    try {
                        const modbusServerTCPList = await TCPServerModel.findAsync();
                        for (let modbusServerTCP of modbusServerTCPList) {
                            const tagData = await this.getDataByTagnameId(modbusServerTCP.id);
                            if (!tagData) { continue; }

                            const value = tagData.value;
                            if (value === undefined) continue;

                            switch (modbusServerTCP.functionCode) {
                                case 1:
                                    this.modbusServer['TCP'].data.coils[modbusServerTCP.address] = value > 0;
                                    break;
                                case 2:
                                    this.modbusServer['TCP'].data.discreteInputs[modbusServerTCP.address] = value > 0;
                                    break;
                                case 3: {
                                    const regs = this.valueToRegisters(value, modbusServerTCP.dataType);
                                    const addr = Number(modbusServerTCP.address);
                                    ensureArraySize(this.modbusServer['TCP'].data.holdingRegisters, addr + regs.length);

                                    regs.forEach((v, i) => {
                                        this.modbusServer['TCP'].data.holdingRegisters[addr + i] = v;
                                    });
                                    break;
                                }

                                case 4: {
                                    const regs = this.valueToRegisters(value, modbusServerTCP.dataType);
                                    const addr = Number(modbusServerTCP.address);

                                    ensureArraySize(this.modbusServer['TCP'].data.inputRegisters, addr + regs.length);

                                    regs.forEach((v, i) => {
                                        this.modbusServer['TCP'].data.inputRegisters[addr + i] = v;
                                    });
                                    break;
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error in TCP Server interval:', error);
                    }
                }, 400);
            }
            // Xử lý cho RTU Server
            if (this.modbusServer['RTU']) {
                if (this.intervalModbusServer['RTU']) {
                    clearInterval(this.intervalModbusServer['RTU']);
                    this.intervalModbusServer['RTU'] = null;
                }

                this.intervalModbusServer['RTU'] = setInterval(async () => {
                    try {
                        const modbusServerRTUList = await RTUServerModel.findAsync();
                        for (let modbusServerRTU of modbusServerRTUList) {
                            const tagData = await this.getDataByTagnameId(modbusServerRTU.id);
                            if (!tagData) continue;

                            const value = tagData.value;
                            if (value === undefined) continue;

                            const addr = Number(modbusServerRTU.address);
                            const server = this.modbusServer['RTU'];

                            // Hàm đảm bảo array đủ lớn
                            const ensureArraySize = (arr, size) => {
                                while (arr.length <= size) arr.push(0);
                            };

                            switch (modbusServerRTU.functionCode) {
                                case 1: // Coils
                                    server.data.coils[addr] = value > 0;
                                    break;

                                case 2: // Discrete Inputs
                                    server.data.discreteInputs[addr] = value > 0;
                                    break;

                                case 3: { // Holding Registers
                                    const regs = this.valueToRegisters(value, modbusServerRTU.dataType);
                                    const addr = Number(modbusServerRTU.address);
                                    ensureArraySize(server.data.holdingRegisters, addr + regs.length);
                                    regs.forEach((v, i) => {
                                        server.setData(addr + i, v, 'holdingRegisters');
                                    });
                                    break;
                                }

                                case 4: { // Input Registers
                                    const regs = this.valueToRegisters(value, modbusServerRTU.dataType);
                                    const addr = Number(modbusServerRTU.address);
                                    ensureArraySize(server.data.inputRegisters, addr + regs.length);
                                    regs.forEach((v, i) => {
                                        server.setData(addr + i, v, 'inputRegisters');
                                    });
                                    break;
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error in RTU Server interval:', error);
                    }
                }, 400);
            }
        } catch (error) {
            console.error('Error in writeDataToModbusServer:', error);
        }
    }

    /**
     * NGẮT KẾT NỐI MODBUS SERVER 
     */
    async disconnectModbusServer(type) {
        try {
            if (this.modbusServer[type]) {
                this.modbusServer[type].disconnectModbusServer();
                delete this.modbusServer[type];
            }
            // Clear interval riêng cho từng loại server
            if (this.intervalModbusServer[type]) {
                clearInterval(this.intervalModbusServer[type]);
                delete this.intervalModbusServer[type];
            }
            console.log(` Modbus ${type} Server disconnected`);
        } catch (error) {
            console.error(`Error disconnecting Modbus ${type} Server:`, error);
        }
    }

    /**
 * LƯU TRỮ DATA HISTORICAL
 */
    async saveHistoricalToDb() {
        try {
            const getData = this.getData.bind(this);

            const listTagHistorical = await TagHistorical.getHistorical();
            const historicalTags = listTagHistorical?.DT || [];
            const historicalTagIds = new Set();
            historicalTags.forEach(tag => {
                historicalTagIds.add(tag.id);
            });

            // Lấy cấu hình từ configHistorical
            const dataConfig = await configHistorical.getAllConfig();
            const list = dataConfig?.DT || [];
            const cfg = list[0];

            const currentHistoricalTagsHash = JSON.stringify(Array.from(historicalTagIds).sort());
            const shouldRestart =
                !this.currentConfig ||
                this.currentConfig.type !== cfg?.type ||
                this.currentConfig.cycle !== cfg?.cycle ||
                this.currentHistoricalTagsHash !== currentHistoricalTagsHash;

            if (!shouldRestart) {
                return;
            }

            // Lưu hash của historical tags hiện tại để so sánh lần sau
            this.currentHistoricalTagsHash = currentHistoricalTagsHash;
            this.currentConfig = cfg ? { ...cfg } : null;

            if (!historicalTags || historicalTags.length === 0) {

                // Xóa job cũ nếu đang chạy
                if (this.saveDataTimer) {
                    clearInterval(this.saveDataTimer);
                    this.saveDataTimer = null;
                }
                if (this.saveDataJob) {
                    this.saveDataJob.stop();
                    this.saveDataJob = null;
                }

                this.currentConfig = null;
                this.currentHistoricalTagsHash = null;
                return;
            }

            if (!cfg) {
                // Xóa job cũ nếu không có config
                if (this.saveDataTimer) {
                    clearInterval(this.saveDataTimer);
                    this.saveDataTimer = null;
                }
                if (this.saveDataJob) {
                    this.saveDataJob.stop();
                    this.saveDataJob = null;
                }
                this.currentHistoricalTagsHash = null;
                return;
            }

            const { type, cycle } = cfg;

            // Xóa job cũ nếu đang chạy
            if (this.saveDataTimer) {
                clearInterval(this.saveDataTimer);
                this.saveDataTimer = null;
            }
            if (this.saveDataJob) {
                this.saveDataJob.stop();
                this.saveDataJob = null;
            }

            // Trường hợp 1: type = "Cycle"
            if (type === 'Cycle') {
                const intervalSec = Number(cycle) || 10;
                this.saveDataTimer = setInterval(async () => {
                    try {
                        const datas = getData();
                        if (!Array.isArray(datas) || datas.length === 0) return;
                        const date = new Date();
                        const startDate = new Date(date).setHours(0, 0, 0, 0);
                        const value = {};

                        let savedCount = 0;
                        for (let data of datas) {
                            if (historicalTagIds.has(data.tagnameId)) {
                                value[data.tagnameId] = data;
                                savedCount++;
                            }
                        }

                        if (Object.keys(value).length !== 0) {
                            await HistoricalValueModel.updateAsync(
                                { date: startDate },
                                {
                                    $push: {
                                        values: { value, ts: date },
                                    },
                                },
                                { upsert: true }
                            );
                        }

                        await HistoricalValueModel.loadDatabaseAsync();

                        setTimeout(() => {
                            fs.copyFile(
                                `${fileName.DATABASE_FOLDER_PATH}/historicalvalue.db`,
                                `${fileName.DATABASE_FOLDER_PATH}/historicalvalue.db.backup`,
                                (err) => err && console.log(err)
                            );
                        }, 20000);
                    } catch (error) {
                    }
                }, intervalSec * 1000);
            }

            // Trường hợp 2: type = "TT10/20211
            else if (type === 'TT10/2021') {
                this.saveDataJob = new CronJob(
                    '0 */5 * * * *', // Mỗi 5 phút
                    async () => {
                        try {
                            const datas = getData();
                            if (!Array.isArray(datas) || datas.length === 0) return;

                            const date = new Date();
                            const startDate = new Date(date).setHours(0, 0, 0, 0);
                            const value = {};

                            let savedCount = 0;
                            for (let data of datas) {
                                if (historicalTagIds.has(data.tagnameId)) {
                                    value[data.tagnameId] = data;
                                    savedCount++;
                                }
                            }

                            if (Object.keys(value).length !== 0) {
                                await HistoricalValueModel.updateAsync(
                                    { date: startDate },
                                    {
                                        $push: {
                                            values: {
                                                value,
                                                ts: date.setHours(
                                                    date.getHours(),
                                                    date.getMinutes(),
                                                    0,
                                                    0
                                                ),
                                            },
                                        },
                                    },
                                    { upsert: true }
                                );
                            }

                            await HistoricalValueModel.loadDatabaseAsync();

                            setTimeout(() => {
                                fs.copyFile(
                                    `${fileName.DATABASE_FOLDER_PATH}/historicalvalue.db`,
                                    `${fileName.DATABASE_FOLDER_PATH}/historicalvalue.db.backup`,
                                    (err) => err && console.log(err)
                                );
                            }, 20000);

                        } catch (error) {
                        }
                    },
                    null,
                    true,
                    'Asia/Ho_Chi_Minh'
                );

            }

            // Trường hợp 3: type = "Trigger" 
            else if (type === 'Trigger') {
                // console.log(`[saveHistoricalToDb] Trigger mode - No automatic saving`);
            }

            // Trường hợp không hợp lệ
            else { }
        } catch (error) { }
    }

    /**
    * LƯU TRỮ DATA ALARM
    */
    async saveAlarmToDb(intervalSec = 1000) {

        if (!this.alarmPreviousState) this.alarmPreviousState = new Map(); // lưu trạng thái alarm trước đó

        if (this.alarmSaveTimer) clearInterval(this.alarmSaveTimer);

        this.alarmSaveTimer = setInterval(async () => {
            try {
                if (!Array.isArray(this.data) || this.data.length === 0) return;

                const datas = this.data;
                const listTagAlarm = await TagAlarm.getAllTagAlarm();
                const alarmTags = listTagAlarm?.DT || [];
                if (!alarmTags.length) return;

                const date = new Date();
                const startDate = new Date(date).setHours(0, 0, 0, 0);
                const alarmToSave = [];

                const alarmTagMap = new Map(alarmTags.map(t => [t.tagnameId, t]));

                for (let data of datas) {
                    const alarmTag = alarmTagMap.get(data.tagnameId);
                    if (!alarmTag) continue;

                    const val = Number(data.value);
                    const threshold = Number(alarmTag.rangeAlarm);
                    const condition = alarmTag.condition;

                    const isAlarmNow = {
                        '>': val > threshold,
                        '>=': val >= threshold,
                        '<': val < threshold,
                        '<=': val <= threshold,
                        '==': val === threshold,
                        '!=': val !== threshold
                    }[condition] || false;

                    const wasAlarmBefore = this.alarmPreviousState.get(data.tagnameId) || false;

                    // Ghi dữ liệu chỉ khi từ bình thường -> alarm
                    if (isAlarmNow && !wasAlarmBefore) {
                        const alarmInfo = {
                            tagnameId: data.tagnameId,
                            tagName: data.tagname,
                            deviceId: data.deviceId,
                            value: data.value,
                            unit: data.unit,
                            condition: alarmTag.condition,
                            rangeAlarm: alarmTag.rangeAlarm,
                            content: alarmTag.content,
                            title: alarmTag.title,
                            type: alarmTag.type,
                            selection: alarmTag.selection,
                        };

                        alarmToSave.push(alarmInfo);
                        const contentSendApp = `${alarmInfo.content} ${alarmInfo.value} ${alarmInfo.unit}`;

                        const notifyBell = {
                            id: Date.now(),
                            type: alarmInfo.type,
                            message: `Lỗi thẻ ${alarmInfo.tagName} với nội dung là: ${alarmInfo.content}`,
                            time: new Date().toISOString()
                        }

                        global._io.emit('notify', notifyBell);

                        if (alarmInfo.selection?.Line === true) {
                            await this.sendAlarmToLine(alarmInfo.title, contentSendApp, alarmInfo.type);
                        }

                        if (alarmInfo.selection?.Telegram === true) {
                            await this.sendAlarmToTelegram(alarmInfo.title, contentSendApp, alarmInfo.type);
                        }
                    }

                    // Cập nhật trạng thái hiện tại
                    this.alarmPreviousState.set(data.tagnameId, isAlarmNow);
                }

                if (!alarmToSave.length) return;

                await AlarmValueModel.updateAsync(
                    { date: startDate },
                    { $push: { alarms: { alarm: alarmToSave, ts: date } } },
                    { upsert: true }
                );
                await AlarmValueModel.loadDatabaseAsync();

                console.log(`[Alarm AutoSave] Đã lưu ${Object.keys(alarmToSave).length} cảnh báo lúc ${date.toLocaleTimeString()}`);

                // Backup DB sau 20s
                setTimeout(() => {
                    fs.copyFile(
                        `${fileName.DATABASE_FOLDER_PATH}/alarmvalue.db`,
                        `${fileName.DATABASE_FOLDER_PATH}/alarmvalue.db.backup`,
                        err => err && console.log(err)
                    );
                }, 20000);

            } catch (error) { }
        }, intervalSec);
    };

    stopSaveAlarmToDb() {
        if (this.alarmSaveTimer) {
            clearInterval(this.alarmSaveTimer);
            this.alarmSaveTimer = null;
            console.log(`[Alarm AutoSave] Đã dừng lưu cảnh báo tự động lúc ${new Date().toLocaleTimeString()}`);
        } else {
            console.log(`[Alarm AutoSave] Không có tiến trình nào đang chạy để dừng.`);
        }
    }

    clearDb() {
        try {
            const job = new CronJob(
                '30 0 0 * * *',
                async function () {
                    const date = new Date()
                    const dateOf60DaysAgo = date.setMonth(date.getMonth - 2)
                    HistoricalValueModel.removeAsync(
                        { date: { $lte: dateOf60DaysAgo } },
                        { multi: true }
                    )
                    AlarmValueModel.removeAsync(
                        { date: { $lte: dateOf60DaysAgo } },
                        { multi: true }
                    )
                    await HistoricalValueModel.loadDatabaseAsync()
                    await AlarmValueModel.loadDatabaseAsync()
                },
                null,
                true,
                'Asia/Ho_Chi_Minh'
            )
            job.start()
        } catch (error) {
            // console.log(`gateway > gatewayHandler > clearDb [error]: ${error}`)
        }
    }

    /**
     * GỬI CẢNH BÁO ĐẾN APP
     */
    async sendAlarmToTelegram(title, content, type) {
        const result = [];
        const configTelegram = await AppNotifyAlarm.getAllApp();
        const appNames = configTelegram?.DT || [];

        // Lọc ra Telegram
        for (let appName of appNames) {
            if (appName.name === 'Telegram') {
                result.push({
                    name: appName.name,
                    tokenTele: appName.token,
                    groupId: appName.groupId,
                    _id: appName._id
                });
            }
        }

        if (result.length === 0) {
            return;
        }

        // Lấy phần tử đầu tiên
        const { tokenTele, groupId } = result[0];
        const alertMessage = formatAlertMessage(title, content, type);

        try {
            const res = await sendTelegramAlert(
                tokenTele,
                groupId,
                alertMessage,
                {
                    parseMode: 'HTML',
                    disableNotification: false
                }
            );
        } catch (error) {
            console.error('Gửi cảnh báo thất bại:', error);
        }
    }

    async sendAlarmToLine(title, content, type) {
        const result = [];
        const configTelegram = await AppNotifyAlarm.getAllApp();
        const appNames = configTelegram?.DT || [];

        // Lọc ra Line
        for (let appName of appNames) {
            if (appName.name === 'Line') {
                result.push({
                    name: appName.name,
                    tokenLine: appName.token,
                    groupId: appName.groupId,
                    _id: appName._id
                });
            }
        }

        if (result.length === 0) {
            return;
        }

        // Lấy phần tử đầu tiên
        const { tokenLine, groupId } = result[0];

        // Tạo Flex Message
        const alertMessage = formatLineAlert(title, content, type);

        try {
            const sendResult = await sendLineAlert(tokenLine, groupId, alertMessage, {
                notificationDisabled: false
            });
            return sendResult;

        } catch (error) {
            console.error('Lỗi gửi cảnh báo Line:', error);
            throw error;
        }
    }

    /**
     *  GỬI FTP
     */
    async saveToFileAndSendFtp() {
        try {
            const ftpList = await FTPServerModel.findAsync();
            for (const ftp of ftpList) {

                // stop job cũ nếu có
                if (this.cronJobUploadFtp[ftp._id]) {
                    try { this.cronJobUploadFtp[ftp._id].stop(); } catch (e) { }
                }

                const cronTime = `0 */${ftp.interval} * * * *`;

                this.cronJobUploadFtp[ftp._id] = new CronJob(
                    cronTime,
                    async () => {
                        try {
                            const now = new Date();

                            const dateTime = new Date(
                                now.getFullYear(),
                                now.getMonth(),
                                now.getDate(),
                                now.getHours(),
                                now.getMinutes(),
                                0,
                                0
                            );

                            const searchDate = new Date();
                            searchDate.setHours(0, 0, 0, 0);

                            const datas = await HistoricalValueModel.findOneAsync({
                                date: searchDate.getTime(),
                            });

                            if (!datas || !Array.isArray(datas.values) || datas.values.length === 0) {
                                console.warn(`No data for FTP ${ftp._id}`);
                                return;
                            }

                            // TXT → chỉ lấy giá trị cuối ngày
                            if (ftp.fileType === "TXT") {
                                const sorted = datas.values.sort((a, b) => a.ts - b.ts);
                                const last = sorted[sorted.length - 1];

                                if (!last || !last.value) return;

                                await writeFileTxt(ftp, dateTime, last.value);
                            }

                            // CSV → ghi toàn bộ dữ liệu trong ngày
                            else if (ftp.fileType === "CSV") {
                                const tagnames = await TagnameModel.findAsync().sort({ channel: 1 });
                                await writeFileCsv(ftp, dateTime, datas.values, tagnames);
                            }

                            // upload FTP
                            await sendFtp(ftp);

                        } catch (err) {
                            console.error(`Cron FTP error at ${ftp._id}:`, err);
                        }
                    },
                    null,
                    false,
                    'Asia/Ho_Chi_Minh'
                );

                this.cronJobUploadFtp[ftp._id].start();
            }
        } catch (error) {
            console.error("saveToFileAndSendFtp error:", error);
        }
    }

    async updateSendFtp(ftpId) {
        try {
            this.cronJobUploadFtp[ftpId]?.stop();
            const ftp = await FTPServerModel.findOneAsync({ _id: ftpId });
            if (!ftp) return;

            const cronTime = `0 */${ftp.interval} * * * *`;

            this.cronJobUploadFtp[ftp._id] = new CronJob(
                cronTime,
                async () => {
                    try {
                        const now = new Date();
                        const dateTime = new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            now.getDate(),
                            now.getHours(),
                            now.getMinutes(),
                            0,
                            0
                        );

                        const searchDate = new Date();
                        searchDate.setHours(0, 0, 0, 0);

                        const datas = await HistoricalValueModel.findOneAsync({
                            date: searchDate.getTime(),
                        });

                        if (!datas || !Array.isArray(datas.values) || datas.values.length === 0) {
                            return;
                        }

                        if (ftp.fileType === "TXT") {
                            const sorted = datas.values.sort((a, b) => a.ts - b.ts);
                            const last = sorted[sorted.length - 1];
                            await writeFileTxt(ftp, dateTime, last.value);
                        }

                        else if (ftp.fileType === "CSV") {
                            const tagnames = await TagnameModel.findAsync().sort({ channel: 1 });
                            await writeFileCsv(ftp, dateTime, datas.values, tagnames);
                        }

                        await sendFtp(ftp);

                    } catch (err) { }
                },
                null,
                true,
                'Asia/Ho_Chi_Minh'
            );

            this.cronJobUploadFtp[ftp._id].start();
        } catch (error) { }
    }

    async updateAllSendFtp() {
        try {
            const list = await FTPServerModel.findAsync();
            if (list.length > 0) {
                for (const ftp of list) {
                    await this.updateSendFtp(ftp._id);
                }
            }
            else {
                return { EC: -1, EM: "Không có Server nào để đồng bộ" };
            }
            return { EC: 0, EM: "Đồng bộ tất cả FTP server thành công" };
        } catch (error) {
            return { EC: -1, EM: "Đồng bộ tất cả FTP server thất bại", DT: error.message };
        }
    }

    async stopSendFtp(ftpId) {
        try {
            this.cronJobUploadFtp[ftpId]?.stop();
            await deleteFileFtp(ftpId);
        } catch (error) { }
    }

    async sentMySQL() {
        try {
            const listServer = await MySQLServerModel.findAsync();
            if (!Array.isArray(listServer) || listServer.length === 0) {
                //  console.log("Không có server MySQL nào được cấu hình. Bỏ qua việc gửi dữ liệu.");
                return;
            }

            for (const mysqlServer of listServer) {

                // Stop job cũ nếu có
                if (this.cronJobUploadMysql[mysqlServer._id]) {
                    try { this.cronJobUploadMysql[mysqlServer._id].stop(); } catch (e) { }
                }

                const cronTime = `0 */${mysqlServer.interval} * * * *`;
                this.cronJobUploadMysql[mysqlServer._id] = new CronJob(
                    cronTime,
                    async () => {
                        try {
                            const getData = this.getData.bind(this);
                            const datas = getData();

                            if (!Array.isArray(datas) || datas.length === 0) return;

                            // Chỉ lấy các tag được chọn gửi MySQL
                            const tagsToSend = datas.filter(d => d.selectMySQL === true);
                            //console.log('check tagsToSend.length: ', tagsToSend.length)
                            if (tagsToSend.length === 0) return;
                            //   console.log("tagsToSend: ", tagsToSend);

                            // Gửi lên server
                            await insertTagValues(mysqlServer, tagsToSend);

                        } catch (error) { }
                    },
                    null,
                    true, // start ngay
                    'Asia/Ho_Chi_Minh'
                );
            }
        } catch (error) {
            console.error("sentMySQL error:", error);
        }
    }

    async deleteMySQLConfigs(serverIds) {
        try {
            for (const id of serverIds) {
                if (this.cronJobUploadMysql[id]) {
                    try {
                        this.cronJobUploadMysql[id].stop();
                        delete this.cronJobUploadMysql[id];
                    } catch (e) { }
                }
            }
            await MySQLServerModel.deleteMany({ _id: { $in: serverIds } });
            return { success: true, message: "Đã xoá cấu hình MySQL & ngừng gửi dữ liệu" };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    async sentSQL() {
        try {
            const listServer = await SQLServerModel.findAsync();

            if (!Array.isArray(listServer) || listServer.length === 0) {
                return;
            }

            for (const sqlServer of listServer) {

                // Stop job cũ nếu có
                if (this.cronJobUploadSql[sqlServer._id]) {
                    try { this.cronJobUploadSql[sqlServer._id].stop(); } catch (e) { }
                }

                const cronTime = `0 */${sqlServer.interval} * * * *`;
                this.cronJobUploadSql[sqlServer._id] = new CronJob(
                    cronTime,
                    async () => {
                        try {
                            const getData = this.getData.bind(this);
                            const datas = getData();

                            if (!Array.isArray(datas) || datas.length === 0) return;

                            // Chỉ lấy các tag được chọn gửi SQL
                            const tagsToSend = datas.filter(d => d.selectSQL === true);
                            //console.log('check tagsToSend.length: ', tagsToSend.length)
                            if (tagsToSend.length === 0) return;

                            // Gửi lên server
                            await insertTagValuesSQL(sqlServer, tagsToSend);

                        } catch (error) { }
                    },
                    null,
                    true, // start ngay
                    'Asia/Ho_Chi_Minh'
                );
            }
        } catch (error) {
            console.error("sentMySQL error:", error);
        }
    }

    async deleteSQLConfigs(serverIds) {
        try {
            for (const id of serverIds) {
                if (this.cronJobUploadSql[id]) {
                    try {
                        this.cronJobUploadSql[id].stop();
                        delete this.cronJobUploadSql[id];
                    } catch (e) { }
                }
            }
            await SQLServerModel.deleteMany({ _id: { $in: serverIds } });
            return { success: true, message: "Đã xoá cấu hình SQL & ngừng gửi dữ liệu" };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    /**
     * LẤY TRẠNG THÁI TẤT CẢ KẾT NỐI
     */
    getAllConnectionStatus() {
        try {
            return this.modbusManager.getAllConnections();
        } catch (error) {
            return [];
        }
    }

    /**
     * LẤY TRẠNG THÁI KẾT NỐI CỤ THỂ
     */
    getConnectionStatus(deviceId) {
        try {
            return this.modbusManager.getConnectionStatus(deviceId);
        } catch (error) {
            return null;
        }
    }

    /**
     * KIỂM TRA THIẾT BỊ CÓ ĐANG KẾT NỐI KHÔNG
     */
    isDeviceConnected(deviceId) {
        const status = this.getConnectionStatus(deviceId);
        return status ? status.isConnected : false;
    }
}

export default GatewayHandler;