import ModbusClient from './modbusClient'
import { ComModel, DeviceModel } from '../../configs/connectDB'
import { getAllProtocol } from '../../configs/protocol'

class DeviceHandler {
    constructor() {
        this.connectionComs = {}
        this.connectionDevices = {}
        this.reconnectInterval = {}
    }

    async connectCom() {
        try {
            const coms = await ComModel.findAsync()
            //console.log("Tìm thấy danh sách COM trong DB:", coms)
            for (let com of coms) {
                const modbus = new ModbusClient(com)
                this.connectionComs[com.serialPort] = modbus
                this.connectionComs[com.serialPort].client = await modbus.connectRTU(com)
                //console.log("Đã kết nối:", com.name)
                //console.log("Đối tượng client:", this.connectionComs[com.serialPort].client ? "Có client" : "Không có client")
            }
        } catch (error) {
            console.error("Lỗi connectCom:", error.message)
        }
    }

    async disconnectCom() {
        try {
            for (let comId of Object.keys(this.connectionComs)) {
                this.connectionComs[comId].close()
            }
        } catch (error) { }
    }

    async connectRtu(deviceId) {
        try {
            const device = await DeviceModel.findOneAsync({ _id: deviceId })
            if (device) {
                this.connectionDevices[device._id] = this.connectionComs[device.serialPort]
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

            for (let device of devices) {
                switch (device.driverName) {
                    case protocols.Modbus[0].name: // "Modbus RTU Client"
                        this.connectionDevices[device._id] = this.connectionComs[device.serialPort]
                        break

                    case protocols.Modbus[1].name: // "Modbus TCP Client"
                        await this.connectTcp(device._id)
                        break
                }
            }
            //console.log("Tất cả COM đã kết nối:", Object.keys(this.connectionComs))
            //console.log('Check connectionDevices: ', this.connectionDevices)
        } catch (error) {
            console.error('Lỗi connectAllDevice:', error.message)
        }
    }

    async disconnectDevice(deviceId) {
        try {
            const device = await DeviceModel.findOneAsync({ _id: deviceId })
            const protocols = getAllProtocol()

            if (device.driverName === protocols.Modbus[1].name) {
                this.connectionDevices[deviceId].close()
            }

            delete this.connectionDevices[deviceId]
        } catch (error) {
            console.error('Lỗi disconnectDevice:', error.message)
        }
    }

}
module.exports = DeviceHandler

// Thông tin thiết bị qua TCP
// const info = {
//     ipAddress: '127.0.0.1',
//     port: 502,
// }

// // Tạo client mới
// const client = new ModbusClient(info)

// const test = async () => {
//     try {
//         await client.connectTCP()
//         const coil = await client.readCoils(0, 1)
//         console.log('Coil[0] =', coil)
//         await client.writeCoil(0, true)
//     } catch (err) {
//         console.error(err)
//     } finally {
//         client.close()
//     }
// }

