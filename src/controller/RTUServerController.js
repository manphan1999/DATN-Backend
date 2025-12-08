import { RTUServerModel } from '../configs/connectDB'

const getAllRTUServer = async () => {
    try {
        const listRTUServer = await RTUServerModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách RTU Server',
            EC: 0,
            DT: listRTUServer
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createRTUServer = async (rawData) => {
    try {
        const allServers = await RTUServerModel.findAsync({});
        const dataToInsert = { ...rawData };
        delete dataToInsert.selectMySQL;
        delete dataToInsert.selectSQL;
        delete dataToInsert.unit;
        delete dataToInsert.channel;
        delete dataToInsert.symbol;

        const { name, address, slaveId } = rawData;

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
        const existingModbus = allServers.filter(s => s.slaveId === slaveId && s.address === address);
        if (existingModbus.length > 0) {
            return {
                EM: `Đã tồn tại SlaveId ${slaveId} với Address ${address}. Không thể tạo trùng Address!`,
                EC: -1,
                DT: "",
            };
        }

        // Nếu ok thì insert
        await RTUServerModel.insertAsync(dataToInsert);
        await RTUServerModel.loadDatabaseAsync();

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

const updateRTUServer = async (rawData) => {
    try {
        const dataToInsert = { ...rawData };
        delete dataToInsert.selectMySQL;
        delete dataToInsert.selectSQL;
        delete dataToInsert.unit;
        delete dataToInsert.channel;
        delete dataToInsert.symbol;
        const { id, name, deviceId, deviceName, functionCode, dataFormat, dataType, slaveId, address } = dataToInsert;

        if (!id) {
            return {
                EM: "Không tìm thấy ID để cập nhật",
                EC: 1,
                DT: "",
            };
        }

        await RTUServerModel.updateAsync(
            { _id: id },
            { $set: { name, deviceId, deviceName, functionCode, dataFormat, dataType, slaveId, address } },
            { returnUpdatedDocs: true }
        );

        await RTUServerModel.loadDatabaseAsync();

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

const deleteRTUServer = async (rawData) => {
    try {
        const { list } = rawData;
        if (!list || !Array.isArray(list) || list.length === 0) {
            return {
                EM: 'Không có dữ liệu nào được chọn để xóa',
                EC: 1,
                DT: ''
            };
        }

        const ids = list.map(item => item.id);
        // Xóa các tag alarm
        await RTUServerModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );

        await RTUServerModel.loadDatabaseAsync();

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

module.exports = { getAllRTUServer, updateRTUServer, createRTUServer, deleteRTUServer }