import ModbusRTU from 'modbus-serial';
import { DeviceModel, ComModel } from '../../configs/connectDB';

class ModbusConnectionManager {
    constructor() {
        this.connections = new Map();
        this.deviceConfigs = new Map();
        this.reconnectIntervals = new Map();
    }

    /**
     * LẤY CLIENT TỪ DEVICEID
     */
    getClient(deviceId) {
        const connection = this.connections.get(deviceId);
        return connection ? connection.client : null;
    }

    /**
     * KẾT NỐI TẤT CẢ THIẾT BỊ 
     */
    async connectAll() {
        try {
            const devices = await DeviceModel.findAsync({});
            const coms = await ComModel.findAsync({});
            const comMap = new Map(coms.map(com => [com.serialPort, com]));

            const results = [];

            for (const device of devices) {
                try {
                    let result;
                    let connectionAttempts = 3;

                    for (let attempt = 1; attempt <= connectionAttempts; attempt++) {
                        try {
                            if (device.driverName === 'Modbus RTU Client' && device.serialPort) {
                                const comConfig = comMap.get(device.serialPort);
                                if (!comConfig) {
                                    break;
                                }
                                result = await this.connectRTU(device, comConfig);

                            } else if (device.driverName === 'Modbus ASCII Client' && device.serialPort) {
                                const comConfig = comMap.get(device.serialPort);
                                if (!comConfig) {
                                    break;
                                }
                                result = await this.connectASCII(device, comConfig);

                            } else if (device.driverName === 'Modbus TCP Client' && device.ipAddress) {
                                result = await this.connectTCP(device);

                            } else {
                                break;
                            }

                            results.push({
                                deviceId: device._id,
                                name: device.name,
                                success: true,
                                type: result.type
                            });
                            break; // Thành công, thoát vòng lặp retry

                        } catch (error) {
                            if (attempt === connectionAttempts) {
                                throw error;
                            }
                            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        }
                    }

                } catch (error) {
                    results.push({
                        deviceId: device._id,
                        name: device.name,
                        success: false,
                        error: error.message
                    });
                }
            }

            return results;

        } catch (error) {
            throw error;
        }
    }

    /**
     * KẾT NỐI RTU 
     */
    async connectRTU(device, comConfig) {
        const client = new ModbusRTU();
        const config = {
            baudRate: Number(comConfig.baudRate),
            dataBits: Number(comConfig.dataBit),
            stopBits: Number(comConfig.stopBit),
            parity: comConfig.parity
        };

        try {
            await client.connectRTUBuffered(comConfig.serialPort, config);
            client.setTimeout(Number(device.timeOut || 5000));
            // console.log(`check config: `, config, `check comConfig: ${comConfig.serialPort}`)
            const connectionInfo = {
                client,
                type: 'RTU',
                isConnected: true,
                reconnecting: false,
                deviceId: device._id,
                deviceName: device.name,
                serialPort: comConfig.serialPort
            };

            this.connections.set(device._id, connectionInfo);
            this.deviceConfigs.set(device._id, {
                type: 'RTU',
                serialPort: comConfig.serialPort,
                config,
                timeOut: client._timeout,
                device,
                comConfig
            });

            this.setupAutoReconnect(device._id);

            return { type: 'RTU', client };
        } catch (error) {
            throw error;
        }
    }

    async connectASCII(device, comConfig) {
        const client = new ModbusRTU();
        const config = {
            baudRate: Number(comConfig.baudRate),
            dataBits: Number(comConfig.dataBit),
            stopBits: Number(comConfig.stopBit),
            parity: comConfig.parity
        };

        try {
            await client.connectAsciiSerial(comConfig.serialPort, config);
            client.setTimeout(Number(device.timeOut || 5000));

            const connectionInfo = {
                client,
                type: 'ASCII',
                isConnected: true,
                reconnecting: false,
                deviceId: device._id,
                deviceName: device.name,
                serialPort: comConfig.serialPort
            };

            this.connections.set(device._id, connectionInfo);
            this.deviceConfigs.set(device._id, {
                type: 'ASCII',
                serialPort: comConfig.serialPort,
                config,
                timeOut: client._timeout,
                device,
                comConfig
            });
            this.setupAutoReconnect(device._id);

            return { type: 'ASCII', client };
        } catch (error) {
            throw error;
        }
    }

    /**
     * KẾT NỐI TCP
     */
    async connectTCP(device) {
        const client = new ModbusRTU();

        try {
            await client.connectTCP(device.ipAddress, {
                port: Number(device.port || 502)
            });
            client.setTimeout(Number(device.timeOut || 5000));

            const connectionInfo = {
                client,
                type: 'TCP',
                isConnected: true,
                reconnecting: false,
                deviceId: device._id,
                deviceName: device.name,
                host: device.ipAddress,
                port: device.port
            };

            this.connections.set(device._id, connectionInfo);
            this.deviceConfigs.set(device._id, {
                type: 'TCP',
                host: device.ipAddress,
                port: Number(device.port || 502),
                timeOut: client._timeout,
                device
            });

            this.setupAutoReconnect(device._id);

            return { type: 'TCP', client };
        } catch (error) {
            throw error;
        }
    }

    /**
     * SETUP AUTO RECONNECT 
     */
    setupAutoReconnect(deviceId) {
        const connection = this.connections.get(deviceId);
        if (!connection) return;
    }

    /**
     * KẾT NỐI LẠI MỘT THIẾT BỊ 
     */
    async reconnectDevice(deviceId) {
        const savedConfig = this.deviceConfigs.get(deviceId);
        if (!savedConfig) {
            throw new Error(`No config found for device: ${deviceId}`);
        }

        // Dừng auto reconnect đang chạy
        this.stopAutoReconnect(deviceId);

        // Đóng connection cũ
        this.closeConnection(deviceId);

        // Kết nối lại
        try {
            let result;
            if (savedConfig.type === 'RTU') {
                result = await this.connectRTU(savedConfig.device, savedConfig.comConfig);
            } else if (savedConfig.type === 'ASCII') {
                result = await this.connectASCII(savedConfig.device, savedConfig.comConfig);
            } else if (savedConfig.type === 'TCP') {
                result = await this.connectTCP(savedConfig.device);
            }

            return {
                success: true,
                deviceId,
                deviceName: savedConfig.device.name
            };
        } catch (error) {
            return {
                success: false,
                deviceId,
                deviceName: savedConfig.device?.name,
                error: error.message
            };
        }
    }

    /**
     * DỪNG AUTO RECONNECT
     */
    stopAutoReconnect(deviceId) {
        const intervalId = this.reconnectIntervals.get(deviceId);
        if (intervalId) {
            clearTimeout(intervalId);
            this.reconnectIntervals.delete(deviceId);
        }
    }

    /**
     * THỰC HIỆN RECONNECT
     */
    async attemptReconnect(deviceId) {
        const connection = this.connections.get(deviceId);
        const savedConfig = this.deviceConfigs.get(deviceId);

        if (!connection || !savedConfig || connection.reconnecting) return;

        connection.reconnecting = true;
        connection.isConnected = false;

        let retryCount = 0;
        const maxRetries = 3;

        const tryReconnect = async () => {
            try {
                retryCount++;
                // Đóng connection cũ
                try {
                    if (connection.client && connection.client.isOpen) {
                        connection.client.close(() => { });
                    }
                } catch (e) {
                    // Ignore
                }

                // Tạo client mới
                const newClient = new ModbusRTU();

                // Reconnect theo type
                if (savedConfig.type === 'RTU') {
                    await newClient.connectRTUBuffered(savedConfig.serialPort, savedConfig.config);
                } else if (savedConfig.type === 'ASCII') {
                    await newClient.connectAsciiSerial(savedConfig.serialPort, savedConfig.config);
                } else if (savedConfig.type === 'TCP') {
                    await newClient.connectTCP(savedConfig.host, { port: savedConfig.port });
                }

                newClient.setTimeout(savedConfig.timeOut);
                connection.client = newClient;
                connection.isConnected = true;
                connection.reconnecting = false;

                // Clear interval
                this.stopAutoReconnect(deviceId);
                this.setupAutoReconnect(deviceId);

            } catch (error) {
                if (retryCount < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
                    // Lưu interval để có thể clear
                    const intervalId = setTimeout(tryReconnect, delay);
                    this.reconnectIntervals.set(deviceId, intervalId);
                } else {
                    connection.reconnecting = false;
                    this.stopAutoReconnect(deviceId);
                }
            }
        };

        const intervalId = setTimeout(tryReconnect, 1000);
        this.reconnectIntervals.set(deviceId, intervalId);
    }

    /**
     * ĐÓNG MỘT KẾT NỐI CỤ THỂ
     */
    closeConnection(deviceId) {
        const connection = this.connections.get(deviceId);
        if (connection) {
            this.stopAutoReconnect(deviceId);

            try {
                if (connection.client && connection.client.isOpen) {
                    connection.client.close(() => { });
                }
            } catch (e) {
                // Ignore close errors
            }

            this.connections.delete(deviceId);
        }
    }

    /**
     * GET CONNECTION STATUS
     */
    getConnectionStatus(deviceId) {
        const conn = this.connections.get(deviceId);
        if (!conn) return null;

        return {
            deviceId: conn.deviceId,
            deviceName: conn.deviceName,
            type: conn.type,
            isConnected: conn.isConnected,
            reconnecting: conn.reconnecting,
            serialPort: conn.serialPort
        };
    }

    async executeWithRetry(deviceId, operation, maxRetries = 3) {
        const connection = this.connections.get(deviceId);
        if (!connection) throw new Error(`Device ${deviceId} not found`);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (connection.reconnecting) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }

                if (!connection.isConnected) {
                    throw new Error('Device not connected');
                }

                return await operation(connection.client);

            } catch (error) {
                if (!error.message.includes('Timed out') && !connection.reconnecting) {
                    connection.isConnected = false;
                    this.attemptReconnect(deviceId);
                }

                if (attempt === maxRetries) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            }
        }
    }

    /**
     * MODBUS FUNCTION CODES
     */

    // FC01: Read Coils
    async readCoils(deviceId, slaveId, startAddr, len) {
        return await this.executeWithRetry(deviceId, async (client) => {
            client.setID(slaveId);
            return await client.readCoils(startAddr, len);
        });
    }

    // FC02: Read Discrete Inputs
    async readDiscreteInputs(deviceId, slaveId, startAddr, len) {
        return await this.executeWithRetry(deviceId, async (client) => {
            client.setID(slaveId);
            return await client.readDiscreteInputs(startAddr, len);
        });
    }

    // FC03: Read Holding Registers
    async readHoldingRegisters(deviceId, slaveId, startAddr, len) {
        return await this.executeWithRetry(deviceId, async (client) => {
            client.setID(slaveId);
            return await client.readHoldingRegisters(startAddr, len);
        });
    }

    // FC04: Read Input Registers
    async readInputRegisters(deviceId, slaveId, startAddr, len) {
        return await this.executeWithRetry(deviceId, async (client) => {
            client.setID(slaveId);
            return await client.readInputRegisters(startAddr, len);
        });
    }

    // FC05: Write Single Coil
    async writeCoil(deviceId, slaveId, addr, value) {
        return await this.executeWithRetry(deviceId, async (client) => {
            client.setID(slaveId);
            return await client.writeCoil(addr, value);
        });
    }

    // FC06: Write Single Register
    async writeRegister(deviceId, slaveId, addr, value) {
        return await this.executeWithRetry(deviceId, async (client) => {
            client.setID(slaveId);
            return await client.writeRegister(addr, value);
        });
    }

    // FC15: Write Multiple Coils
    async writeCoils(deviceId, slaveId, startAddr, values) {
        return await this.executeWithRetry(deviceId, async (client) => {
            client.setID(slaveId);
            return await client.writeCoils(startAddr, values);
        });
    }

    // FC16: Write Multiple Registers
    async writeRegisters(deviceId, slaveId, startAddr, values) {
        return await this.executeWithRetry(deviceId, async (client) => {
            client.setID(slaveId);
            return await client.writeRegisters(startAddr, values);
        });
    }

    /**
     * LẤY TẤT CẢ TRẠNG THÁI KẾT NỐI
     */
    getAllConnections() {
        const statuses = [];
        for (const [deviceId, conn] of this.connections) {
            statuses.push(this.getConnectionStatus(deviceId));
        }
        return statuses;
    }

    /**
     * ĐÓNG TẤT CẢ KẾT NỐI SERIAL (COM) - RTU/ASCII
     */
    closeAllSerial() {
        const devicesToClose = [];

        // Tìm tất cả deviceId cần đóng (chỉ serial)
        for (const [deviceId, conn] of this.connections) {
            if (conn.type === 'RTU' || conn.type === 'ASCII') {
                devicesToClose.push(deviceId);
            }
        }
        // Đóng từng kết nối serial
        devicesToClose.forEach(deviceId => {
            this.closeConnection(deviceId);
        });

        return {
            closed: devicesToClose.length,
            message: `Đã đóng ${devicesToClose.length} kết nối serial`
        };
    }

    /**
     * ĐÓNG TẤT CẢ KẾT NỐI 
     */
    closeAll() {
        // Clear all reconnect intervals
        for (const [deviceId, intervalId] of this.reconnectIntervals) {
            clearTimeout(intervalId);
        }
        this.reconnectIntervals.clear();

        // Close all connections
        for (const [deviceId, conn] of this.connections) {
            try {
                if (conn.client && conn.client.isOpen) {
                    conn.client.close(() => { });
                }
            } catch (e) { }
        }

        this.connections.clear();
    }
}

export default ModbusConnectionManager;