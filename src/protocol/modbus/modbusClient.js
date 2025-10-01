import ModbusSerial from 'modbus-serial'

class ModbusClient {
    constructor(info) {
        // Lưu lại cấu hình truyền vào khi khởi tạo
        this.info = info
        // Ban đầu chưa có kết nối (client = null)
        this.client = null
    }

    // Kết nối Modbus RTU (qua cổng COM/Serial)
    async connectRTU() {
        try {
            // console.error("Check Info:", this.info)
            const { serialPort, baudRate, dataBit, stopBit, parity, timeOut } = this.info
            const client = new ModbusSerial()
            client.setTimeout(timeOut)
            const config = {
                baudRate: Number(baudRate),
                dataBits: Number(dataBit),
                stopBits: Number(stopBit),
                parity: parity,
            }
            await client.connectRTUBuffered(serialPort, config)
            this.client = client
            return client
        } catch (error) {
            // console.error("Lỗi connectRTU:", error.message)
            return null
        }
    }

    // Kết nối Modbus ASCII (Serial)
    async connectAsciiSerial() {
        const { urlPort, baudrate, dataBit, stopBit, parity, timeOut, startOfSlaveFrameChar } = this.info
        const client = new ModbusSerial()
        client.setTimeout(timeOut)

        const config = {
            baudRate: Number(baudrate),
            dataBits: Number(dataBit),
            stopBits: Number(stopBit),
            parity: parity,
            startOfSlaveFrameChar, // ký tự ':' hoặc ';'
        }

        await client.connectAsciiSerial(urlPort, config)
        this.client = client
        return client
    }

    // Kết nối Modbus TCP
    async connectTCP() {
        // console.error("Check Info:", this.info)
        const { ipAddress, port, timeOut } = this.info
        const client = new ModbusSerial()
        client.setTimeout(timeOut) // Timeout đọc Modbus TCP

        await client.connectTCP(ipAddress, { port })
        this.client = client
        return client
    }

    // Đọc Coil (bit đầu ra)
    async readCoils(addr, len) {
        if (!this.client) throw new Error('Client chưa kết nối')
        const data = await this.client.readCoils(addr, len)
        return data.data[0] // lấy giá trị đầu tiên
    }

    // Đọc Discrete Input (bit đầu vào)
    async readDiscreteInputs(addr, len) {
        if (!this.client) throw new Error('Client chưa kết nối')
        return await this.client.readDiscreteInputs(addr, len)
    }

    // Đọc Holding Registers (word ghi được)
    async readHoldingRegisters(addr, len) {
        if (!this.client) throw new Error('Client chưa kết nối')
        return await this.client.readHoldingRegisters(addr, len)
    }

    // Đọc Input Registers (word chỉ đọc)
    async readInputRegisters(addr, len) {
        if (!this.client) throw new Error('Client chưa kết nối')
        return await this.client.readInputRegisters(addr, len)
    }

    // Ghi 1 Coil (bit)
    async writeCoil(addr, value) {
        if (!this.client) throw new Error('Client chưa kết nối')
        return await this.client.writeCoil(addr, value)
    }

    // Ghi 1 thanh ghi (word)
    async writeRegister(addr, value) {
        if (!this.client) throw new Error('Client chưa kết nối')
        return await this.client.writeRegister(addr, value)
    }

    // Đóng kết nối
    close() {
        if (this.client) {
            this.client.close()
            this.client = null
        }
    }
}

module.exports = ModbusClient
