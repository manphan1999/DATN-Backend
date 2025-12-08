import NetworkInfomation from '../ultils/networkInfo';
import { HeaderModel } from '../configs/connectDB';

const getAllNetwork = () => {
    try {
        const network = NetworkInfomation.networkInfo();
        return { EM: 'Danh sách cổng LAN', EC: 0, DT: network };
    } catch (error) {
        return { EM: 'Lỗi Server!!!', EC: -2, DT: '' };
    }
}

const getContentHeader = async () => {
    try {
        const contentHeader = await HeaderModel.findAsync({})
        return { EM: 'Nội dung Header là', EC: 0, DT: contentHeader };
    } catch (error) {
        return { EM: 'Lỗi Server!!!', EC: -2, DT: '' };
    }
}

const createContentHeader = async (rawData) => {
    try {
        await HeaderModel.insertAsync(rawData);
        await HeaderModel.loadDatabaseAsync();

        return { EM: "Thêm nội dung Header thành công", EC: 0, DT: '', };
    } catch (error) { return { EM: "Lỗi Server!!!", EC: -2, DT: "", }; }
};

const updateContentHeader = async (rawData) => {
    try {
        const { id, content } = rawData;
        if (!id) {
            return { EM: `Không tìm thấy nội dung`, EC: 1, DT: "" };
        }

        await HeaderModel.updateAsync(
            { _id: id },
            { $set: { content } },
            { returnUpdatedDocs: true }
        );

        await HeaderModel.loadDatabaseAsync()
        return {
            EM: "Cập nhật nội dung thành công",
            EC: 0,
            DT: '',
        }
    } catch (error) { return { EM: "Lỗi Server!!!", EC: -2, DT: "", }; }
};

module.exports = { getAllNetwork, getContentHeader, createContentHeader, updateContentHeader }