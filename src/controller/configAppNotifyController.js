import { AppNotifyModel } from '../configs/connectDB';

const getAllApp = async () => {
    try {
        const appList = await AppNotifyModel.findAsync({})
        return {
            EM: 'Danh sách ứng dụng cảnh báo',
            EC: 0,
            DT: appList
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createApp = async (rawData) => {
    try {
        console.log('Tạo mới app: ', rawData);
        const newApp = await AppNotifyModel.insertAsync(rawData);
        await AppNotifyModel.loadDatabaseAsync();

        return {
            EM: "Thêm ứng dụng cảnh báo thành công",
            EC: 0,
            DT: newApp,
        };
    } catch (error) {
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const updateApp = async (rawData) => {
    try {
        //console.log('check rawdata upadate com: ', rawData)
        const { id, token, groupId } = rawData;
        if (!id) {
            return { EM: `Không tìm thấy ứng dụng`, EC: 1, DT: "" };
        }

        const appIs = await AppNotifyModel.updateAsync(
            { _id: id, },
            { $set: { token, groupId }, },
            { returnUpdatedDocs: true }
        )

        await AppNotifyModel.loadDatabaseAsync()
        return {
            EM: "Cập nhật ứng dụng thành công",
            EC: 0,
            DT: appIs,
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }

}

module.exports = { getAllApp, createApp, updateApp }
