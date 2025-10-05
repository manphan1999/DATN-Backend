import DeviceHandler from '../protocol/modbus/devicesHandlers'
import { TagnameModel } from '../configs/connectDB'
import { getAllProtocol } from '../configs/protocol'
import { swapData, getDataLenght } from '../configs/convertData'
class GatewayHandler {
    constructor() {
        this.deviceHandler = new DeviceHandler()
        this.devices
        this.data
        this.reconnectInterval = {}
        this.cronJobUploadFtp = {}
        this.modbusServer = {}
        this.intervalModbusServer = {}
        this.modbusClient
        this.calibrateStatus = 0
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

    async readData() {
        try {
            setInterval(async () => {
                //console.log("Check this.devices: ", this.devices)
                const result = []
                const tagnames = await TagnameModel.findAsync().sort({
                    // Fillter tagname in list database
                    channel: 1,
                })

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
                        case 1: {
                            const data = await this.handleData(modbusClient, 'readCoils', tagname)
                            result.push(data)
                            break
                        }
                        case 2: {
                            const data = await this.handleData(
                                modbusClient,
                                'readDiscreteInputs',
                                tagname

                            )
                            result.push(data)
                            break
                        }
                        case 3: {
                            const data = await this.handleData(
                                modbusClient,
                                'readHoldingRegisters',
                                tagname
                            )

                            result.push(data)
                            break
                        }
                        case 4: {
                            const data = await this.handleData(
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
            }, 5000)// Tần số quét dữ liệu
        } catch (error) {
            // console.log(`gateway > gatewayHandler > readData [error]: ${error}`)
        }
    }

    async handleData(modbusClient, functionCode, tagname) {

        let connectTcpDevice = this.connectTcpDevice.bind(this)
        try {
            // Đọc data thô
            const protocols = getAllProtocol()
            let data
            try {
                // data = await modbusClient[functionCode](
                //     tagname.address,
                //     getDataLenght(tagname.dataFormat) //lấy số byte cần đọc

                // )
                data = await modbusClient.client[functionCode](
                    tagname.address,
                    getDataLenght(tagname.dataFormat)
                )
                if (this.reconnectInterval[tagname.device._id]) {
                    clearInterval(this.reconnectInterval[tagname.device._id])
                    this.reconnectInterval[tagname.device._id] = null
                }
            } catch (error) {
                console.error(`[handleData] Error reading ${tagname.name}:`, error.message);
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
            let rawValue, valueGainOffset, value
            if (functionCode === 'readHoldingRegisters' || functionCode === 'readInputRegisters') {
                rawValue = swapData(data.buffer, tagname.dataType)
            } else {
                rawValue = data ? 1 : 0
            }

            valueGainOffset = (rawValue * tagname.gain + tagname.offset)

            value = valueGainOffset
            // Xử lý data qua function
            if (tagname.functionText) {
                try {
                    const fn = eval(`(${tagname.functionText})`) // tạo hàm cục bộ
                    value = fn(value)
                } catch (err) {
                    console.error(`Lỗi khi xử lý functionText của tag ${tagname.tagname}:`, err)
                }
            }

            const status =
                value < tagname.lowSet || value > tagname.highSet ? 2 : 1 // 1 là bình thường, 2 là vượt ngưỡng
            return {
                tagnameId: tagname._id,
                channel: tagname.channel,
                slaveId: tagname.slaveId,
                address: tagname.address,
                tagname: tagname.name,
                symbol: tagname.symbol,
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
}

module.exports = GatewayHandler