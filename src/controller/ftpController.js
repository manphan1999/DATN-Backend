import { FTPServerModel } from '../configs/connectDB'

const getAllFTPServer = async () => {
    try {
        const listFTPServer = await FTPServerModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách FTP Server',
            EC: 0,
            DT: listFTPServer
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createFTPServer = async (rawData) => {
    try {
        // Lấy tổng số FTP Server hiện tại
        const allServers = await FTPServerModel.findAsync({});
        if (allServers.length >= 5) {
            return {
                EM: `Giới hạn Max 5 FTP Server. Không thể tạo thêm.`,
                EC: -1,
                DT: "",
            };
        }

        // Kiểm tra trùng tên
        const name = rawData.name;
        const existing = allServers.filter(s => s.name === name);
        if (existing.length > 0) {
            return {
                EM: `Tên FTP Server đã tồn tại: ${existing.map(e => e.name).join(', ')}`,
                EC: -1,
                DT: "",
            };
        }

        await FTPServerModel.insertAsync(rawData);
        await FTPServerModel.loadDatabaseAsync();

        return {
            EM: "Thêm mới cấu hình FTP Server thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        console.error(error);
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
    }
};

const updateFTPServer = async (rawData) => {
    try {
        // console.log('check data update: ', rawData);

        const { id, name, host, port, username, password, interval, fileName, fileType, folderName } = rawData;

        if (!id) {
            return {
                EM: "Không tìm thấy Server để cập nhật",
                EC: 1,
                DT: "",
            };
        }

        await FTPServerModel.updateAsync(
            { _id: id },
            {
                $set: {
                    name,
                    host,
                    port,
                    username,
                    password,
                    interval,
                    fileName,
                    fileType,
                    folderName
                }
            },
            { returnUpdatedDocs: true }
        );

        await FTPServerModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật FTP Server thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        console.error("ERROR UPDATE FTP:", error);
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const deleteFTPServer = async (rawData) => {
    try {
        const { list } = rawData;
        //  console.log('check rawData Delete FTP Server: ', rawData);
        if (!list || !Array.isArray(list) || list.length === 0) {
            return {
                EM: 'Không có dữ liệu nào được chọn để xóa',
                EC: 1,
                DT: ''
            };
        }

        // Lấy ra mảng id và tagnameId từ list
        const ids = list.map(item => item.id);
        await FTPServerModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );

        await FTPServerModel.loadDatabaseAsync();

        return {
            EM: 'Xóa  FTP Server thành công',
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

module.exports = { getAllFTPServer, updateFTPServer, createFTPServer, deleteFTPServer }