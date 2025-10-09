import ModbusClient from './modbusClient'
import { ComModel, DeviceModel } from '../../configs/connectDB'
import { getAllProtocol } from '../../configs/protocol'

class DeviceHandler {
    constructor() {
        this.connectionComs = {}
        this.connectionDevices = {}
        this.reconnectInterval = {}
    }

    // Kết nối tất cả các COM RTU
    async connectCom() {
        try {
            const coms = await ComModel.findAsync()
            for (let com of coms) {
                const modbus = new ModbusClient(com)
                this.connectionComs[com.serialPort] = modbus
                this.connectionComs[com.serialPort].client = await modbus.connectRTU(com)
            }
        } catch (error) {
            console.error("Lỗi connectCom:", error.message)
        }
    }

    //  Ngắt tất cả COM
    async disconnectCom() {
        try {
            for (let comId of Object.keys(this.connectionComs)) {
                this.connectionComs[comId].close()
            }
            this.connectionComs = {}
        } catch (error) {
            console.error("disconnectCom:", error.message)
        }
    }

    async connectRtu(deviceId) {
        try {
            const device = await DeviceModel.findOneAsync({ _id: deviceId })
            if (device) {
                const client = this.connectionComs[device.serialPort]
                if (client) {
                    this.connectionDevices[device._id] = client
                    console.log(`[RTU] Kết nối device ${device.name} qua ${device.serialPort}`)
                }
            }
        } catch (error) { }
    }

    async connectTcp(deviceId) {
        try {
            const device = await DeviceModel.findOneAsync({ _id: deviceId })
            if (device) {
                const modbus = new ModbusClient(device)
                this.connectionDevices[device._id] = modbus
                this.connectionDevices[device._id].client = await modbus.connectTCP()
                console.log(`[TCP] Kết nối device ${device.name} ${device.ipAddress}:${device.port}`)
            }
            clearInterval(this.reconnectInterval[deviceId])
        } catch (error) {
            if (!this.reconnectInterval[deviceId]) {
                this.reconnectInterval[deviceId] = setInterval(async () => {
                    this.connectTcp(deviceId)
                }, 5000)
            }
        }
    }

    async connectAllDevice() {
        try {
            const devices = await DeviceModel.findAsync()
            const protocols = getAllProtocol()

            for (const device of devices) {
                const current = this.connectionDevices[device._id]

                if (device.driverName === protocols.Modbus[0].name) {
                    // RTU
                    await this.connectRtu(device._id)
                }

                if (device.driverName === protocols.Modbus[1].name) {
                    // TCP
                    if (
                        !current ||
                        current.ipAddress !== device.ipAddress ||
                        current.port !== device.port
                    ) {
                        await this.disconnectDevice(device._id)
                        await this.connectTcp(device._id)
                    }
                }
            }
        } catch (error) {
            console.error('Lỗi connectAllDevice:', error.message)
        }
    }

    async disconnectDevice(deviceId) {
        try {
            if (this.connectionDevices[deviceId]) {
                this.connectionDevices[deviceId].close?.()
                delete this.connectionDevices[deviceId]
            }
        } catch (error) {
            console.error('Lỗi disconnectDevice:', error.message)
        }
    }

    // Hàm này gọi khi có thay đổi cấu hình Device
    async reconnectDevice(deviceId) {
        try {
            const device = await DeviceModel.findOneAsync({ _id: deviceId })
            const protocols = getAllProtocol()
            if (!device) return

            console.log(`[INFO] Cập nhật cấu hình device ${device.name} → reconnect...`)

            // Ngắt kết nối cũ
            await this.disconnectDevice(deviceId)

            if (device.driverName === protocols.Modbus[0].name) {
                await this.connectRtu(deviceId)
            } else if (device.driverName === protocols.Modbus[1].name) {
                await this.connectTcp(deviceId)
            }
        } catch (error) {
            console.error("reconnectDevice error:", error.message)
        }
    }

}

module.exports = new DeviceHandler()


