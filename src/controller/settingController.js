import NetworkInfomation from '../ultils/networkInfo';
import { HeaderModel } from '../configs/connectDB';

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

const getAllNetwork = async () => {
    try {
        const network = await NetworkInfomation.networkInfo();
        return {
            EM: 'Danh sách cổng LAN',
            EC: 0,
            DT: network
        };
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: error.toString()
        };
    }
};

const setIpAddress = async (rawData) => {
    try {
        const { ipAddress, subnet, gateway, dns } = rawData;

        const network = await NetworkInfomation.setManual({
            ip: ipAddress,
            subnet,
            gateway,
            dns
        });

        return {
            EM: 'Cấu hình IP thành công',
            EC: 0,
            DT: network
        };
    } catch (error) {
        return {
            EM: error.message,
            EC: -2,
            DT: null
        };
    }
};

const confirmReboot = () => {
    setTimeout(() => {
        NetworkInfomation.rebootDevice();
    }, 300);

    return {
        EM: 'Thiết bị đang khởi động lại',
        EC: 0,
        DT: null
    };
};


module.exports = { getAllNetwork, setIpAddress, confirmReboot, getContentHeader, createContentHeader, updateContentHeader }