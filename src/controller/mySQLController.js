import { MySQLServerModel } from '../configs/connectDB'

const getAllMySQL = async () => {
    try {
        const listMySQL = await MySQLServerModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách MySQL Server',
            EC: 0,
            DT: listMySQL
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createMySQL = async (rawData) => {
    try {
        // Lấy tổng số MySQL Server hiện tại
        const allServers = await MySQLServerModel.findAsync({});
        if (allServers.length >= 5) {
            return {
                EM: `Giới hạn Max 5 MySQL Server. Không thể tạo thêm.`,
                EC: -1,
                DT: "",
            };
        }

        // Kiểm tra trùng tên
        const name = rawData.name;
        const existing = allServers.filter(s => s.name === name);
        if (existing.length > 0) {
            return {
                EM: `Tên MySQL Server đã tồn tại: ${existing.map(e => e.name).join(', ')}`,
                EC: -1,
                DT: "",
            };
        }

        await MySQLServerModel.insertAsync(rawData);
        await MySQLServerModel.loadDatabaseAsync();

        return {
            EM: "Thêm mới cấu hình MySQL Server thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        console.error(error);
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
    }
};

const updateMySQL = async (rawData) => {
    try {
        const { id, name, host, port, username, password, interval, dataBase, tableName } = rawData;

        if (!id) {
            return {
                EM: "Không tìm thấy Server để cập nhật",
                EC: 1,
                DT: "",
            };
        }

        await MySQLServerModel.updateAsync(
            { _id: id },
            {
                $set: {
                    name, host, port, username, password, interval, dataBase, tableName
                }
            },
            { returnUpdatedDocs: true }
        );

        await MySQLServerModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật MySQL Server thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        console.error("ERROR UPDATE MySQL:", error);
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const deleteMySQL = async (rawData) => {
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
        await MySQLServerModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );

        await MySQLServerModel.loadDatabaseAsync();

        return {
            EM: 'Xóa  MySQL Server thành công',
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

module.exports = { getAllMySQL, updateMySQL, createMySQL, deleteMySQL }