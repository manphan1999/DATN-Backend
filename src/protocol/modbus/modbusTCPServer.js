import ModbusRTU from 'modbus-serial';

class ModbusServerTCP {
    constructor() {
        this.serverTCP = null;
        this.data = {
            holdingRegisters: [],
            inputRegisters: [],
            coils: [],
            discreteInputs: [],
        };
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

        this.serverTCP = new ModbusRTU.ServerTCP(vector, {
            host: '0.0.0.0',
            port: 8502,
            debug: true
        });
    }

    disconnectModbusServer() {
        if (this.serverTCP) {
            this.serverTCP.close(() => {
                console.log('Modbus TCP server disconnected');
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

export default ModbusServerTCP;