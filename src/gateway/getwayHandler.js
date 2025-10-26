import fs from 'fs'
import { CronJob } from 'cron';
import fileName from '../configs/fileName'
import deviceHandler from '../protocol/modbus/devicesHandlers';
import { TagnameModel, HistoricalValueModel } from '../configs/connectDB';
import TagHistorical from '../controller/tagHistorical';
import { getAllProtocol } from '../configs/protocol';
import { swapData, getDataLenght, writeDataLenght, dataType } from '../configs/convertData';
import configHistorical from '../controller/configHistorical'

class GatewayHandler {
    constructor() {
        this.deviceHandler = deviceHandler
        this.devices = {}
        this.data
        this.reconnectInterval = {}
        this.cronJobUploadFtp = {}
        this.modbusServer = {}
        this.intervalModbusServer = {}
        this.modbusClient
        this.calibrateStatus = 0
        this.currentConfig = null

        this.saveDataTimer = null
        this.saveDataJob = null
        this.currentHistoricalTagsHash = null
    }

    setCalibrate(status) {
        try {
            this.calibrateStatus = status
        } catch (error) {
            // console.log(`gateway > gatewayHandler > setCalibrate [error]: ${error}`)
        }
    }

    getCalibrate() {
        try {
            return this.calibrateStatus
        } catch (error) {
            // console.log(`gateway > gatewayHandler > getCalibrate [error]: ${error}`)
        }
    }

    async connectAll() {
        try {
            await this.deviceHandler.connectCom()
            await this.deviceHandler.connectAllDevice()
            this.devices = this.deviceHandler.connectionDevices
        } catch (error) {
            console.error("GatewayHandler.connectAll error:", error)
        }
    }

    async connectCom() {
        try {
            this.deviceHandler.disconnectCom()
            await this.connectAll()
        } catch (error) {

        }
    }

    async connectTcpDevice(deviceId) {
        try {
            // kiểm tra thử deviceId này có phải là TCP không rồi mới connectTcp
            if (this.deviceHandler) {
                const client = await this.deviceHandler.connectTcp(deviceId)
                // this.devices[deviceId] = client
                this.devices = this.deviceHandler.connectionDevices
            }
        } catch (error) {
            // console.log(
            // `gateway > gatewayHandler > connectTcpDevice [error]: ${error}`
            // )
        }
    }

    async readDataModbus() {
        try {
            setInterval(async () => {
                //console.log("Check this.devices: ", this.devices)
                const result = []
                // const tagnames = await TagnameModel.findAsync().sort({
                //     // Fillter tagname in list database
                //     channel: 1,
                // })
                const tagnames = await TagnameModel.findAsync();

                for (let tagname of tagnames) {
                    // Create connect according to id device
                    const modbusClient = this.devices[tagname.device._id]
                    //console.log('Check modbusClient: ', modbusClient)
                    if (!modbusClient?.client) {
                        // if not connect don't try read so set value = 0 and status = 3 --> Err
                        result.push({
                            tagnameId: tagname._id,
                            channel: tagname.channel,
                            slaveId: tagname.slaveId,
                            tagname: tagname.name,
                            deviceId: tagname.device._id,
                            rawValue: 0,
                            value: 0,
                            unit: tagname.unit,
                            symbol: tagname.symbol,
                            status: this.calibrateStatus == 1 ? 4 : 3, // 4 calibration  3 is error, 1 is normal
                            lowSet: tagname.lowSet,
                            highSet: tagname.highSet,
                            selectFTP: tagname.selectFTP,
                        })
                        // if (tagname.name != constant.TAGNAME_GET_SAMPLE) {

                        // }
                        continue
                    }
                    // if (tagname.name == constant.TAGNAME_GET_SAMPLE) {
                    //     continue
                    // }
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
                //console.log('Check data tag name: ', this.data)
                global._io.emit('SERVER SEND HOME DATA', this.data)
            }, 1000)// Tần số quét dữ liệu
        } catch (error) {
            // console.log(`gateway > gatewayHandler > readDataModbus [error]: ${error}`)
        }
    }

    async handleDataModbus(modbusClient, functionCode, tagname) {

        let connectTcpDevice = this.connectTcpDevice.bind(this)
        try {
            // Đọc data thô
            const protocols = getAllProtocol()
            let data
            try {
                data = await modbusClient.client[functionCode](
                    tagname.address,
                    getDataLenght(tagname.dataFormat)
                )
                if (this.reconnectInterval[tagname.device._id]) {
                    clearInterval(this.reconnectInterval[tagname.device._id])
                    this.reconnectInterval[tagname.device._id] = null
                }
            } catch (error) {
                //console.error(`[handleDataModbus] Error reading ${tagname.name}:`, error.message);
                if (
                    !this.reconnectInterval[tagname.device._id] &&
                    modbusClient.info.protocol === protocols.Modbus[1].name
                ) {
                    this.reconnectInterval[tagname.device._id] = setInterval(
                        () => {
                            connectTcpDevice(tagname.device._id)
                        },
                        5000
                    )
                }
                throw Error
            }

            // Xử lý kiểu dữ liệu
            let rawValue = 0, value = 0, status = 3; // khởi tạo mặc định

            switch (functionCode) {
                case 'readHoldingRegisters':
                case 'readInputRegisters':
                    rawValue = swapData(data.buffer, tagname.dataType);
                    value = rawValue * tagname.gain + tagname.offset;
                    if (tagname.functionText) {
                        try {
                            const fn = eval(`(${tagname.functionText})`);
                            value = fn(value);
                        } catch (err) {
                            console.error(`Lỗi khi xử lý functionText của tag ${tagname.name}:`, err);
                        }
                    }
                    status = (value < tagname.lowSet || value > tagname.highSet) ? 2 : 1;
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
                deviceId: tagname.device?._id,
                functionCode: tagname.functionCode,
                dataFormat: tagname.dataFormat,
                dataType: tagname.dataType,
                permission: tagname.permission,
                rawValue,
                value,
                unit: tagname.unit,
                status: this.calibrateStatus == 1 ? 4 : status,
                lowSet: tagname.lowSet,
                highSet: tagname.highSet,
                selectFTP: tagname.selectFTP,
            }
        } catch (error) {
            return {
                tagnameId: tagname._id,
                channel: tagname.channel,
                slaveId: tagname.slaveId,
                // address: tagname.address,
                tagname: tagname.name,
                symbol: tagname.symbol,
                deviceId: tagname.device?._id,
                functionCode: tagname.functionCode,
                dataFormat: tagname.dataFormat,
                dataType: tagname.dataType,
                permission: tagname.permission,
                rawValue: 0,
                value: 0,
                unit: tagname.unit,
                status: this.calibrateStatus == 1 ? 4 : 3, //đang lỗi
                lowSet: tagname.lowSet,
                highSet: tagname.highSet,
                selectFTP: tagname.selectFTP,
            }
        }
    }

    getData() {
        try {
            return this.data
        } catch (error) {
            // console.log(`gateway > gatewayHandler > getData [error]: ${error}`)
        }
    }

    async writeDataModbus({ deviceId, slaveId, address, functionCode, dataType, dataFormat, newValue }) {
        try {
            const modbusClient = this.devices[deviceId];
            if (!modbusClient?.client) throw new Error("Thiết bị chưa kết nối");

            modbusClient.client.setID(slaveId);

            switch (functionCode) {
                case 5: // Write Single Coil (bit)
                    await modbusClient.client.writeCoil(address, newValue > 0);
                    break;

                case 6: //  Write Single Register (16-bit)
                    {
                        const writeBuffer = writeDataLenght(newValue, dataType);
                        const singleValue = writeBuffer.readUInt16BE(0);
                        await modbusClient.client.writeRegister(address, singleValue);
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

                    await modbusClient.client.writeCoils(address, coilsArray);
                    break;

                case 16: //  Write Multiple Registers (32-bit, 64-bit, float…)
                    {
                        const writeBuffer = writeDataLenght(newValue, dataType);
                        // chia buffer thành mảng 16-bit
                        const registers = [];
                        for (let i = 0; i < writeBuffer.length; i += 2) {
                            registers.push(writeBuffer.readUInt16BE(i));
                        }
                        await modbusClient.client.writeRegisters(address, registers);
                    }
                    break;

                default:
                    throw new Error("Function code không hỗ trợ ghi");
            }

            // console.log(`Ghi thành công: ${newValue} vào ${address}`);

            // Sau khi ghi xong, đọc lại để cập nhật ngay
            try {
                const tagname = await TagnameModel.findOne({ device: deviceId, address: address })
                if (tagname) {
                    // Chọn hàm đọc đúng theo loại thẻ
                    let readFunction = null;
                    if ([1, 5, 15].includes(tagname.functionCode)) {
                        readFunction = 'readCoils';
                    } else if ([3, 6, 16].includes(tagname.functionCode)) {
                        readFunction = 'readHoldingRegisters';
                    } else if (tagname.functionCode === 2) {
                        readFunction = 'readDiscreteInputs';
                    } else if (tagname.functionCode === 4) {
                        readFunction = 'readInputRegisters';
                    }

                    // if (readFunction) {
                    //     const updatedData = await this.handleDataModbus(modbusClient, readFunction, tagname);
                    //     global._io.emit('SERVER UPDATE TAG', updatedData);
                    // }
                }
            }
            catch (err) {
                console.error('Không đọc lại được giá trị sau khi ghi:', err.message);
            }

            return { success: true, message: "Ghi thành công" };

        } catch (error) {
            console.error("writeDataModbus error:", error.message);
            return { success: false, error: error.message };
        }
    }

    async saveDataToDb() {
        try {
            // Lấy danh sách thẻ Historical được tạo
            const listTagHistorical = await TagHistorical.getHistorical();
            const historicalTags = listTagHistorical?.DT || []; // Lấy mảng tags từ response
            console.log('check historicalTags: ', historicalTags)
            // Tạo Set chứa các id cần lưu historical để check nhanh
            const historicalTagIds = new Set();
            historicalTags.forEach(tag => {
                historicalTagIds.add(tag.id); // Sử dụng trường 'id' từ response
            });

            console.log(`[saveDataToDb] Danh sách tag historical cần lưu:`, Array.from(historicalTagIds));

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
                console.log(`[saveDataToDb] Config và historical tags không thay đổi, bỏ qua restart`);
                return;
            }

            // Lưu hash của historical tags hiện tại để so sánh lần sau
            this.currentHistoricalTagsHash = currentHistoricalTagsHash;

            console.log(`[saveDataToDb] Có thay đổi - Config từ: ${this.currentConfig?.type}-${this.currentConfig?.cycle} sang: ${cfg?.type}-${cfg?.cycle}, Tags: ${historicalTags.length} tags`);

            this.currentConfig = cfg ? { ...cfg } : null;

            if (!historicalTags || historicalTags.length === 0) {
                console.log(`[saveDataToDb] Không có tag historical nào, dừng tất cả jobs`);

                // Xóa job cũ nếu đang chạy
                if (this.saveDataTimer) {
                    clearInterval(this.saveDataTimer);
                    this.saveDataTimer = null;
                    console.log(`[saveDataToDb] Đã dừng Cycle timer`);
                }
                if (this.saveDataJob) {
                    this.saveDataJob.stop();
                    this.saveDataJob = null;
                    console.log(`[saveDataToDb] Đã dừng TT10/2021 CronJob`);
                }

                this.currentConfig = null;
                this.currentHistoricalTagsHash = null;
                return;
            }

            if (!cfg) {
                console.warn('[saveDataToDb] Không có cấu hình historical nào!');
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
                console.log(`[saveDataToDb] Cleared old timer`);
            }
            if (this.saveDataJob) {
                this.saveDataJob.stop();
                this.saveDataJob = null;
                console.log(`[saveDataToDb] Stopped old CronJob`);
            }

            const getData = this.getData.bind(this);

            // -------------------------------
            // Trường hợp 1: type = "Cycle"
            // -------------------------------
            if (type === 'Cycle') {
                const intervalSec = Number(cycle) || 10;
                console.log(`[saveDataToDb] Cycle interval = ${intervalSec}s`);
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

                        console.log(`[saveDataToDb] [CYCLE] Saved ${savedCount}/${datas.length} tags at ${new Date().toLocaleTimeString()}`);
                    } catch (error) {
                        console.error('[saveDataToDb] [CYCLE] Error:', error);
                    }
                }, intervalSec * 1000);

                console.log(`[saveDataToDb] Started CYCLE timer (every ${intervalSec}s)`);
            }

            // -------------------------------
            // Trường hợp 2: type = "TT10/2021"
            // -------------------------------
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

                            console.log(`[saveDataToDb] [TT10/2021] Saved ${savedCount}/${datas.length} tags at ${new Date().toLocaleTimeString()}`);
                        } catch (error) {
                            console.error('[saveDataToDb] [TT10/2021] Error:', error);
                        }
                    },
                    null,
                    true,
                    'Asia/Ho_Chi_Minh'
                );

                console.log(`[saveDataToDb] Started TT10/2021 CronJob (every 5 minutes)`);
            }

            // -------------------------------
            // Trường hợp 3: type = "Trigger" 
            // -------------------------------
            else if (type === 'Trigger') {
                console.log(`[saveDataToDb] Trigger mode - No automatic saving`);

            }

            // -------------------------------
            // Trường hợp không hợp lệ
            // -------------------------------
            else {
                console.log(`[saveDataToDb] Unknown type: ${type}`);
            }
        } catch (error) {
            console.error('saveDataToDb error:', error);
        }
    }
}

module.exports = GatewayHandler