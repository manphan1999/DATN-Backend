import { UserModel } from '../configs/connectDB'
import bcrypt from "bcryptjs";

const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

const getAllUser = async () => {
    try {
        const listUser = await UserModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách User',
            EC: 0,
            DT: listUser
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createUser = async (rawData) => {
    try {
        const existing = await UserModel.findOneAsync({ name: rawData.name });
        if (existing) {
            return {
                EM: `Tên User đã tồn tại: ${rawData.name}`,
                EC: -1,
                DT: "",
            };
        }

        const passwordHash = hashPassword(rawData.pass);

        await UserModel.insertAsync({ ...rawData, password: passwordHash });
        await UserModel.loadDatabaseAsync();

        return {
            EM: "Thêm mới User thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        console.error(error);
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
    }
};

const updateUser = async (rawData) => {
    try {
        const { id, password } = rawData;

        if (!id) {
            return {
                EM: "Không tìm thấy ID để cập nhật",
                EC: 1,
                DT: "",
            };
        }

        if (password) {
            password = hashPassword(password);
        }

        await UserModel.updateAsync(
            { _id: id },
            { $set: password },
            { returnUpdatedDocs: true }
        );

        await UserModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật User thành công",
            EC: 0,
            DT: '',
        };

    } catch (error) {
        console.error("ERROR UPDATE User:", error);
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const deleteUser = async (rawData) => {
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
        console.log('check ids Delete User Server: ', ids);
        // Xóa các tag alarm
        await UserModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );

        await UserModel.loadDatabaseAsync();

        return {
            EM: 'Xóa  User Server thành công',
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

module.exports = { getAllUser, updateUser, createUser, deleteUser }