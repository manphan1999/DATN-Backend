import ModbusRTU from 'modbus-serial';

class ModbusServerRTU {
    constructor() {
        this.serverRTU = null;
        this.data = {
            coils: {},
            discreteInputs: {},
            inputRegisters: {},
            holdingRegisters: {},
        };

        this.connectModbusServer = this.connectModbusServer.bind(this);
        this.disconnectModbusServer = this.disconnectModbusServer.bind(this);
    }

    connectModbusServer() {
        const data = this.data;
        const vector = {
            getInputRegister: function (addr) {
                return data.inputRegisters[addr] || 0;
            },
            getMultipleInputRegisters: function (startAddr, length) {
                const values = [];
                for (let i = 0; i < length; i++) {
                    values[i] = data.inputRegisters[startAddr + i] || 0;
                }
                return values;
            },
            getDiscreteInput: function (addr) {
                return data.discreteInputs[addr] || false;
            },
            getHoldingRegister: function (addr) {
                return data.holdingRegisters[addr] || 0;
            },
            getMultipleHoldingRegisters: function (startAddr, length) {
                const values = [];
                for (let i = 0; i < length; i++) {
                    values[i] = data.holdingRegisters[startAddr + i] || 0;
                }
                return values;
            },
            getCoil: function (addr) {
                return data.coils[addr] || false;
            },
            setCoil: function (addr, value) {
                data.coils[addr] = value;
                console.log(`Coil [${addr}] = ${value}`);
                return true;
            },
            setRegister: function (addr, value) {
                data.holdingRegisters[addr] = value;
                console.log(`Holding Register [${addr}] = ${value}`);
                return true;
            },
            setMultipleRegisters: function (startAddr, values) {
                for (let i = 0; i < values.length; i++) {
                    data.holdingRegisters[startAddr + i] = values[i];
                }
                console.log(`Multiple Registers [${startAddr}-${startAddr + values.length - 1}] =`, values);
                return true;
            }
        };

        try {
            this.serverRTU = new ModbusRTU.ServerSerial(vector, {
                port: '/dev/ttyS8',
                baudRate: 9600,
                debug: true,
                unitID: 1,
            });

            // Thêm event handlers
            this.serverRTU.on('initialized', () => {
                console.log('Modbus RTU Server initialized on /dev/ttyAMA4');
            });

            this.serverRTU.on('error', (err) => {
                console.error('Modbus Server Error:', err);
            });

        } catch (error) {
            console.error('Failed to create Modbus server:', error);
        }
    }

    disconnectModbusServer() {
        if (this.serverRTU) {
            this.serverRTU.close(() => {
                console.log('Modbus server disconnected');
            });
        }
    }

    setData(address, value, type = 'holdingRegisters') {
        if (this.data[type] !== undefined) {
            this.data[type][address] = value;
        }
    }

    getData(address, type = 'holdingRegisters') {
        return this.data[type] ? this.data[type][address] : undefined;
    }
}

export default ModbusServerRTU;