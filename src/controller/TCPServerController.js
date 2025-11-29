import { TCPServerModel } from '../configs/connectDB'

const getAllTCPServer = async () => {
    try {
        const listTCPServer = await TCPServerModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách TCP Server',
            EC: 0,
            DT: listTCPServer
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createTCPServer = async (rawData) => {
    try {
        const allServers = await TCPServerModel.findAsync({});
        const dataToInsert = { ...rawData };
        delete dataToInsert.selectMySQL;
        delete dataToInsert.selectSQL;
        delete dataToInsert.unit;
        delete dataToInsert.channel;
        delete dataToInsert.symbol;
        delete dataToInsert.slaveId;
        const { name, address } = rawData;

        // Kiểm tra trùng tên
        const existingName = allServers.filter(s => s.name === name);
        if (existingName.length > 0) {
            return {
                EM: `Tên Tag đã tồn tại: ${existingName.map(e => e.name).join(', ')}`,
                EC: -1,
                DT: "",
            };
        }

        // Kiểm tra trùng slaveId + address (Modbus)
        const existingAddress = allServers.filter(s => s.address === address);
        if (existingAddress.length > 0) {
            return {
                EM: `Đã tồn tại Address ${address}. Không thể tạo trùng Address!`,
                EC: -1,
                DT: "",
            };
        }

        // Nếu ok thì insert
        await TCPServerModel.insertAsync(dataToInsert);
        await TCPServerModel.loadDatabaseAsync();

        return {
            EM: "Thêm Tag thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        console.error(error);
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
    }
};

const updateTCPServer = async (rawData) => {
    try {
        const dataToInsert = { ...rawData };
        delete dataToInsert.selectMySQL;
        delete dataToInsert.selectSQL;
        delete dataToInsert.unit;
        delete dataToInsert.channel;
        delete dataToInsert.symbol;
        delete dataToInsert.slaveId;
        const { id, name, deviceId, deviceName, functionCode, dataFormat, dataType, address } = dataToInsert;
        console.log(dataToInsert)
        if (!id) {
            return {
                EM: "Không tìm thấy ID để cập nhật",
                EC: 1,
                DT: "",
            };
        }

        await TCPServerModel.updateAsync(
            { _id: id },
            { $set: { name, deviceId, deviceName, functionCode, dataFormat, dataType, address } },
            { returnUpdatedDocs: true }
        );

        await TCPServerModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật Tag thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const deleteTCPServer = async (rawData) => {
    try {
        const { list } = rawData;
        if (!list || !Array.isArray(list) || list.length === 0) {
            return {
                EM: 'Không có dữ liệu nào được chọn để xóa',
                EC: 1,
                DT: ''
            };
        }

        // Lấy ra mảng id và tagnameId từ list
        const ids = list.map(item => item.id);
        // Xóa các tag alarm
        await TCPServerModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );

        await TCPServerModel.loadDatabaseAsync();

        return {
            EM: 'Xóa Tag thành công',
            EC: 0,
            DT: ''
        };
    } catch (error) {
        return {
            EM: 'Lỗi ở Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

module.exports = { getAllTCPServer, updateTCPServer, createTCPServer, deleteTCPServer }