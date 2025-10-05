const dataFormat = [
    { _id: 1, name: '16-bit Signed' },
    { _id: 2, name: '16-bit Unsigned' },
    { _id: 3, name: '32-bit Signed' },
    { _id: 4, name: '32-bit Unsigned' },
    { _id: 5, name: '32-bit Float' },
    { _id: 6, name: '64-bit Signed' },
    { _id: 7, name: '64-bit Unsigned' },
    { _id: 8, name: '64-bit Double' },
]

const dataType = [
    // Float 32 bit
    { _id: 3, name: 'Big-endian (ABCD)' },
    { _id: 4, name: 'Little-endian (DCBA)' },
    { _id: 5, name: 'Big-endian byte swap (BADC)' },
    { _id: 6, name: 'Little-endian byte swap (CDAB)' },
    // Int32
    { _id: 7, name: 'Big-endian (ABCD)' },
    { _id: 8, name: 'Little-endian (DCBA)' },
    { _id: 9, name: 'Big-endian byte swap (BADC)' },
    { _id: 10, name: 'Little-endian byte swap (CDAB)' },
    // Uint32
    { _id: 11, name: 'Big-endian (ABCD)' },
    { _id: 12, name: 'Little-endian (DCBA)' },
    { _id: 13, name: 'Big-endian byte swap (BADC)' },
    { _id: 14, name: 'Little-endian byte swap (CDAB)' },
    // Int64
    { _id: 15, name: 'Big-endian (ABCD)' },
    { _id: 16, name: 'Little-endian (DCBA)' },
    { _id: 17, name: 'Big-endian byte swap (BADC)' },
    { _id: 18, name: 'Little-endian byte swap (CDAB)' },
    // Uint64
    { _id: 19, name: 'Big-endian (ABCD)' },
    { _id: 20, name: 'Little-endian (DCBA)' },
    { _id: 21, name: 'Big-endian byte swap (BADC)' },
    { _id: 22, name: 'Little-endian byte swap (CDAB)' },
    // Float64
    { _id: 23, name: 'Big-endian (ABCD)' },
    { _id: 24, name: 'Little-endian (DCBA)' },
    { _id: 25, name: 'Big-endian byte swap (BADC)' },
    { _id: 26, name: 'Little-endian byte swap (CDAB)' },

]

const functionCodeModbus = [
    { _id: 1, name: '01 Read Coil (0x)' },
    { _id: 2, name: '02 Read Discrete Input (1x)' },
    { _id: 3, name: '03 Read Holding Registers (4x)' },
    { _id: 4, name: '04 Read Input Registers (3x)' },
    { _id: 5, name: '05 Write Single Coil' },
    { _id: 6, name: '06 Write Single Register' },
    // { _id: 7, name: '15 Write Multiple Coil' },
    // { _id: 8, name: '16 Write Multiple Register' },
]

const getDataLenght = (type) => {
    let addressByte = 2
    switch (type) {
        case 1:
        case 2: {
            addressByte = 1
            break
        }
        case 3:
        case 4:
        case 5: {
            addressByte = 2
            break
        }
        case 6:
        case 7:
        case 8: {
            addressByte = 4
            break
        }
    }

    return addressByte
}

const swapData = (dataBuffer, type) => {
    if (!Buffer.isBuffer(dataBuffer)) return null;
    const view = new DataView(dataBuffer.buffer, dataBuffer.byteOffset, dataBuffer.byteLength);

    const swapBytes = (arr) => new Uint8Array(arr);
    const swapABCD = (arr) => new Uint8Array(arr);
    const swapDCBA = (arr) => new Uint8Array([...arr].reverse());
    const swapBADC = (arr) => new Uint8Array([arr[1], arr[0], arr[3], arr[2], arr[5], arr[4], arr[7], arr[6]]);
    const swapCDAB = (arr) => new Uint8Array([arr[2], arr[3], arr[0], arr[1], arr[6], arr[7], arr[4], arr[5]]);

    let data = null;

    switch (type) {
        // 16-bit
        case 1: // Int16 BE
            data = view.getInt16(0, false);
            break;
        case 2: // Uint16 BE
            data = view.getUint16(0, false);
            break;
        // 32-bit
        case 3: // Float32 ABCD
            data = new DataView(swapABCD(dataBuffer).buffer).getFloat32(0, false);
            break;
        case 4: // Float32 DCBA
            data = new DataView(swapDCBA(dataBuffer).buffer).getFloat32(0, false);
            break;
        case 5: // Float32 BADC
            data = new DataView(swapBADC(dataBuffer).buffer).getFloat32(0, false);
            break;
        case 6: // Float32 CDAB
            data = new DataView(swapCDAB(dataBuffer).buffer).getFloat32(0, false);
            break;
        case 7: // Int32 ABCD
            data = new DataView(swapABCD(dataBuffer).buffer).getInt32(0, false);
            break;
        case 8: // Int32 DCBA
            data = new DataView(swapDCBA(dataBuffer).buffer).getInt32(0, false);
            break;
        case 9: // Int32 BADC
            data = new DataView(swapBADC(dataBuffer).buffer).getInt32(0, false);
            break;
        case 10: // Int32 CDAB
            data = new DataView(swapCDAB(dataBuffer).buffer).getInt32(0, false);
            break;
        case 11: // Uint32 ABCD
            data = new DataView(swapABCD(dataBuffer).buffer).getUint32(0, false);
            break;
        case 12: // Uint32 DCBA
            data = new DataView(swapDCBA(dataBuffer).buffer).getUint32(0, false);
            break;
        case 13: // Uint32 BADC
            data = new DataView(swapBADC(dataBuffer).buffer).getUint32(0, false);
            break;
        case 14: // Uint32 CDAB
            data = new DataView(swapCDAB(dataBuffer).buffer).getUint32(0, false);
            break;

        // 64-bit
        case 15: // BigInt64 ABCD
            data = new DataView(swapABCD(dataBuffer).buffer).getBigInt64(0, false);
            break;
        case 16: // BigInt64 DCBA
            data = new DataView(swapDCBA(dataBuffer).buffer).getBigInt64(0, false);
            break;
        case 17: // BigInt64 BADC
            data = new DataView(swapBADC(dataBuffer).buffer).getBigInt64(0, false);
            break;
        case 18: // BigInt64 CDAB
            data = new DataView(swapCDAB(dataBuffer).buffer).getBigInt64(0, false);
            break;
        case 19: // BigUint64 ABCD
            data = new DataView(swapABCD(dataBuffer).buffer).getBigUint64(0, false);
            break;
        case 20: // BigUint64 DCBA
            data = new DataView(swapDCBA(dataBuffer).buffer).getBigUint64(0, false);
            break;
        case 21: // BigUint64 BADC
            data = new DataView(swapBADC(dataBuffer).buffer).getBigUint64(0, false);
            break;
        case 22: // BigUint64 CDAB
            data = new DataView(swapCDAB(dataBuffer).buffer).getBigUint64(0, false);
            break;
        case 23: // Float64 ABCD
            data = new DataView(swapABCD(dataBuffer).buffer).getFloat64(0, false);
            break;
        case 24: // Float64 DCBA
            data = new DataView(swapDCBA(dataBuffer).buffer).getFloat64(0, false);
            break;
        case 25: // Float64 BADC
            data = new DataView(swapBADC(dataBuffer).buffer).getFloat64(0, false);
            break;
        case 26: // Float64 CDAB
            data = new DataView(swapCDAB(dataBuffer).buffer).getFloat64(0, false);
            break;

    }

    return data;
};


module.exports = { dataFormat, dataType, functionCodeModbus, swapData, getDataLenght }

/*
const swapData = (dataBuffer, type) => {
    let data = null
    switch (type) {
        case 1: {
            const hexToUint8 = (str) =>
                Uint8Array.from(
                    str.match(/.{1,2}/g).map((comp) => parseInt(comp, 16))
                )
            const dataBufferString = dataBuffer.toString('hex')
            const [A, B] = hexToUint8(dataBufferString)
            const reordered = new Uint8Array([A, B])
            data = new DataView(reordered.buffer).getInt16(0)
            break
        }
        case 2: {
            const hexToUint8 = (str) =>
                Uint8Array.from(
                    str.match(/.{1,2}/g).map((comp) => parseInt(comp, 16))
                )
            const dataBufferString = dataBuffer.toString('hex')
            const [A, B] = hexToUint8(dataBufferString)
            const reordered = new Uint8Array([A, B])
            data = new DataView(reordered.buffer).getUint16(0)
            break
        }
        case 3: {
            const hexToUint8 = (str) =>
                Uint8Array.from(
                    str.match(/.{1,2}/g).map((comp) => parseInt(comp, 16))
                )
            const dataBufferString = dataBuffer.toString('hex')
            const [A, B, C, D] = hexToUint8(dataBufferString)
            const reordered = new Uint8Array([A, B, C, D])

            data = new DataView(reordered.buffer).getFloat32(0)
            break
        }
        case 4: {
            const hexToUint8 = (str) =>
                Uint8Array.from(
                    str.match(/.{1,2}/g).map((comp) => parseInt(comp, 16))
                )
            const dataBufferString = dataBuffer.toString('hex')
            const [A, B, C, D] = hexToUint8(dataBufferString)
            const reordered = new Uint8Array([D, C, B, A])
            data = new DataView(reordered.buffer).getFloat32(0)
            break
        }
        case 5: {
            const hexToUint8 = (str) =>
                Uint8Array.from(
                    str.match(/.{1,2}/g).map((comp) => parseInt(comp, 16))
                )
            const dataBufferString = dataBuffer.toString('hex')
            const [A, B, C, D] = hexToUint8(dataBufferString)
            const reordered = new Uint8Array([B, A, D, C])
            data = new DataView(reordered.buffer).getFloat32(0)
            break
        }
        case 6: {
            const hexToUint8 = (str) =>
                Uint8Array.from(
                    str.match(/.{1,2}/g).map((comp) => parseInt(comp, 16))
                )
            const dataBufferString = dataBuffer.toString('hex')
            const [A, B, C, D] = hexToUint8(dataBufferString)
            const reordered = new Uint8Array([C, D, A, B])
            data = new DataView(reordered.buffer).getFloat32(0)
            break
        }
    }
    return data
}
*/