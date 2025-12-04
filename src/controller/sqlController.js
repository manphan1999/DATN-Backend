import { SQLServerModel } from '../configs/connectDB'

const getAllSQL = async () => {
    try {
        const listSQL = await SQLServerModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách SQL Server',
            EC: 0,
            DT: listSQL
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createSQL = async (rawData) => {
    try {
        // Lấy tổng số SQL Server hiện tại
        const allServers = await SQLServerModel.findAsync({});
        if (allServers.length >= 5) {
            return {
                EM: `Giới hạn Max 5 SQL Server. Không thể tạo thêm.`,
                EC: -1,
                DT: "",
            };
        }

        // Kiểm tra trùng tên
        const name = rawData.name;
        const existing = allServers.filter(s => s.name === name);
        if (existing.length > 0) {
            return {
                EM: `Tên SQL Server đã tồn tại: ${existing.map(e => e.name).join(', ')}`,
                EC: -1,
                DT: "",
            };
        }

        await SQLServerModel.insertAsync(rawData);
        await SQLServerModel.loadDatabaseAsync();

        return {
            EM: "Thêm mới cấu hình SQL Server thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        console.error(error);
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
    }
};

const updateSQL = async (rawData) => {
    try {
        console.log('check data update: ', rawData);

        const { id, name, host, port, username, password, interval, dataBase, tableName } = rawData;

        if (!id) {
            return {
                EM: "Không tìm thấy ID để cập nhật",
                EC: 1,
                DT: "",
            };
        }

        await SQLServerModel.updateAsync(
            { _id: id },
            {
                $set: {
                    name, host, port, username, password, interval, dataBase, tableName
                }
            },
            { returnUpdatedDocs: true }
        );

        await SQLServerModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật SQL Server thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        console.error("ERROR UPDATE SQL:", error);
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const deleteSQL = async (rawData) => {
    try {
        const { list } = rawData;
        console.log('check rawData Delete SQL Server: ', rawData);
        if (!list || !Array.isArray(list) || list.length === 0) {
            return {
                EM: 'Không có dữ liệu nào được chọn để xóa',
                EC: 1,
                DT: ''
            };
        }

        // Lấy ra mảng id và tagnameId từ list
        const ids = list.map(item => item.id);
        console.log('check ids Delete SQL Server: ', ids);
        // Xóa các tag alarm
        await SQLServerModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );

        await SQLServerModel.loadDatabaseAsync();

        return {
            EM: 'Xóa  SQL Server thành công',
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

module.exports = { getAllSQL, updateSQL, createSQL, deleteSQL }