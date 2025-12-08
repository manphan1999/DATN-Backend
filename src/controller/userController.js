import { UserModel } from '../configs/connectDB'
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

const checkPassWord = (inputPass, hashPass) => {
    return bcrypt.compareSync(inputPass, hashPass);
}

const handleUserLogin = async (rawData) => {
    try {
        const user = await UserModel.findOneAsync({ username: rawData.username });

        if (user) {
            let isCheckPassword = checkPassWord(rawData.password, user.password);

            if (isCheckPassword === true) {
                // TẠO JWT
                const token = jwt.sign(
                    { user: { id: user._id, username: user.username } },
                    process.env.JWT_ACCESS_TOKEN_PRIVATE_KEY,
                    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
                );

                return {
                    EM: 'Đăng nhập thành công',
                    EC: 0,
                    DT: { access_token: token } // trả token về frontend
                };
            }
            else {
                return {
                    EM: 'Đăng nhập không thành công',
                    EC: 0,
                    DT: ''
                };
            }

        }

        return {
            EM: 'Đăng nhập thất bại',
            EC: 1,
            DT: ''
        };

    } catch (error) {
        console.log(error);
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

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
        const existing = await UserModel.findOneAsync({ username: rawData.username });
        if (existing) {
            return {
                EM: `Tên User đã tồn tại: ${rawData.username}`,
                EC: -1,
                DT: "",
            };
        }

        if (!rawData.password) {
            return {
                EM: "Thiếu password!",
                EC: 1,
                DT: "",
            };
        }

        const passwordHash = hashPassword(rawData.password);

        await UserModel.insertAsync({
            username: rawData.username,
            password: passwordHash
        });

        await UserModel.loadDatabaseAsync();

        return { EM: "Thêm User thành công", EC: 0, DT: "" };

    } catch (error) {
        console.error(error);
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
    }
};

const updateUser = async (rawData) => {
    try {
        const { id, username, password } = rawData;

        if (!id) {
            return { EM: "Không tìm thấy ID để cập nhật", EC: 1, DT: "" };
        }

        let updateData = {};

        if (username) updateData.username = username;

        if (password && password.trim() !== "") {
            updateData.password = hashPassword(password);
        }

        await UserModel.updateAsync(
            { _id: id },
            { $set: updateData },
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
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
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

module.exports = { handleUserLogin, getAllUser, updateUser, createUser, deleteUser }