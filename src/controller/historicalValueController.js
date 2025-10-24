import { HistoricalValueModel } from '../configs/connectDB'

const getAllValueHistorical = async () => {
    try {
        const historicalListData = await HistoricalValueModel.findAsync({})
        return {
            EM: 'Danh sách lịch sử dữ liệu',
            EC: 0,
            DT: historicalListData
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const deleteValueHistorical = async () => {
    try {
        // XÓA TOÀN BỘ DỮ LIỆU
        await HistoricalValueModel.removeAsync({}, { multi: true });

        await HistoricalValueModel.loadDatabaseAsync();

        console.log(`[deleteValueHistorical] Đã xóa toàn bộ dữ liệu historical`);

        return {
            EM: 'Đã xóa toàn bộ dữ liệu historical thành công',
            EC: 0,
            DT: 'all_data_deleted'
        };
    } catch (error) {
        console.error('deleteValueHistorical error:', error);
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

module.exports = { getAllValueHistorical, deleteValueHistorical }