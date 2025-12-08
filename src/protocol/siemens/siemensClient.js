const snap7 = require('node-snap7');

class S7Client {
    constructor() {
        this.s7client = new snap7.S7Client();
        this.isConnected = false;
    }

    // Kết nối đến PLC
    async connect(ip = '192.168.1.135', rack = 0, slot = 1) {
        return new Promise((resolve, reject) => {
            this.s7client.ConnectTo(ip, rack, slot, (err) => {
                if (err) {
                    reject(new Error(`Kết nối thất bại: ${err}`));
                    return;
                }
                this.isConnected = true;
                console.log(`Đã kết nối đến PLC ${ip}`);
                resolve();
            });
        });
    }

    // Ngắt kết nối
    async disconnect() {
        return new Promise((resolve) => {
            if (this.isConnected) {
                this.s7client.Disconnect(() => {
                    this.isConnected = false;
                    console.log('Đã ngắt kết nối PLC');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // Đọc Input byte
    async readInputByte(byteOffset) {
        const buffer = Buffer.alloc(1);
        return new Promise((resolve, reject) => {
            this.s7client.ABRead(byteOffset, 1, buffer, (err) => {
                if (err) reject(err);
                else resolve(buffer.readUInt8(0));
            });
        });
    }

    // Đọc Input bit
    async readInputBit(byteOffset, bitOffset) {
        const byteValue = await this.readInputByte(byteOffset);
        return (byteValue & (1 << bitOffset)) !== 0;
    }

    // Đọc Output byte
    async readOutputByte(byteOffset) {
        const buffer = Buffer.alloc(1);
        return new Promise((resolve, reject) => {
            this.s7client.AERead(byteOffset, 1, buffer, (err) => {
                if (err) reject(err);
                else resolve(buffer.readUInt8(0));
            });
        });
    }

    // Ghi Output bit
    async writeOutputBit(byteOffset, bitOffset, value) {
        const byteValue = await this.readOutputByte(byteOffset);
        let newValue;

        if (value) {
            newValue = byteValue | (1 << bitOffset); // Set bit
        } else {
            newValue = byteValue & ~(1 << bitOffset); // Clear bit
        }

        const buffer = Buffer.alloc(1);
        buffer.writeUInt8(newValue, 0);

        return new Promise((resolve, reject) => {
            this.s7client.AEWrite(byteOffset, 1, buffer, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Đọc Memory bit
    async readMemoryBit(byteOffset, bitOffset) {
        const buffer = Buffer.alloc(1);
        return new Promise((resolve, reject) => {
            this.s7client.MBRead(byteOffset, 1, buffer, (err) => {
                if (err) reject(err);
                else {
                    const byteValue = buffer.readUInt8(0);
                    resolve((byteValue & (1 << bitOffset)) !== 0);
                }
            });
        });
    }

    // Ghi Memory bit - ĐÃ SỬA LỖI
    async writeMemoryBit(byteOffset, bitOffset, value) {
        // Đọc giá trị hiện tại trước
        const currentBuffer = Buffer.alloc(1);

        return new Promise((resolve, reject) => {
            this.s7client.MBRead(byteOffset, 1, currentBuffer, (readErr) => {
                if (readErr) {
                    reject(readErr);
                    return;
                }

                let byteValue = currentBuffer.readUInt8(0);
                if (value) {
                    byteValue |= (1 << bitOffset); // Set bit
                } else {
                    byteValue &= ~(1 << bitOffset); // Clear bit
                }

                const writeBuffer = Buffer.alloc(1);
                writeBuffer.writeUInt8(byteValue, 0);

                this.s7client.MBWrite(byteOffset, 1, writeBuffer, (writeErr) => {
                    if (writeErr) reject(writeErr);
                    else resolve();
                });
            });
        });
    }

    // Đọc Memory Word (MW)
    async readMemoryWord(byteOffset) {
        const buffer = Buffer.alloc(2);
        return new Promise((resolve, reject) => {
            this.s7client.MBRead(byteOffset, 2, buffer, (err) => {
                if (err) reject(err);
                else resolve(buffer.readUInt16BE(0));
            });
        });
    }

    // Đọc Memory Double Word (MD)
    async readMemoryDWord(byteOffset) {
        const buffer = Buffer.alloc(4);
        return new Promise((resolve, reject) => {
            this.s7client.MBRead(byteOffset, 4, buffer, (err) => {
                if (err) reject(err);
                else resolve(buffer.readUInt32BE(0));
            });
        });
    }

    // Ghi Memory Word
    async writeMemoryWord(byteOffset, value) {
        const buffer = Buffer.alloc(2);
        buffer.writeUInt16BE(value, 0);

        return new Promise((resolve, reject) => {
            this.s7client.MBWrite(byteOffset, 2, buffer, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Đọc Data Block
    async readDB(dbNumber, startByte, length) {
        const buffer = Buffer.alloc(length);
        return new Promise((resolve, reject) => {
            this.s7client.DBRead(dbNumber, startByte, length, buffer, (err) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });
    }

    // Ghi Data Block
    async writeDB(dbNumber, startByte, data) {
        return new Promise((resolve, reject) => {
            this.s7client.DBWrite(dbNumber, startByte, data.length, data, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Ví dụ đọc DB1 với các kiểu dữ liệu khác nhau
    async readDB1VariousTypes() {
        const buffer = await this.readDB(1, 0, 10); // Đọc 10 byte từ DB1

        return {
            boolValue: (buffer.readUInt8(0) & 1) !== 0,    // DB1.DBX0.0
            intValue: buffer.readInt16BE(2),               // DB1.DBW2
            realValue: buffer.readFloatBE(4),              // DB1.DBD4
            dwordValue: buffer.readUInt32BE(8)             // DB1.DBD8
        };
    }
}

module.exports = S7Client;