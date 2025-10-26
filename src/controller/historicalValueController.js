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

const getValueHistoricalTime = async (rawData) => {
    console.log('Check search data from time: ', rawData)
    try {
        const { startTime, endTime, tagNameId } = rawData

        // Chuyển đổi sang timestamp
        const fromDate = new Date(startTime).getTime();
        const toDate = new Date(endTime).getTime();

        console.log('Searching for:', {
            tagNameId: tagNameId,
            fromDate: fromDate,
            toDate: toDate
        });

        // Query theo date field với timestamp
        const result = await HistoricalValueModel.findAsync({
            date: {
                $gte: fromDate,
                $lte: toDate,
            },
        });

        console.log('Found documents:', result.length);

        // Xử lý dữ liệu theo cấu trúc
        let valueData = []
        for (let doc of result) {
            valueData.push(...doc.values)
        }

        valueData = valueData.map((item) => {
            return {
                value: item.value[tagNameId],
                ts: item.ts,
            }
        })

        valueData = valueData.filter((item) => {
            // Thêm điều kiện filter theo ts
            const itemTime = new Date(item.ts).getTime();
            return item.value && itemTime >= fromDate && itemTime <= toDate;
        })

        console.log('Final results:', valueData.length, 'records');

        return {
            EM: 'Danh sách lịch sử dữ liệu theo thời gian',
            EC: 0,
            DT: valueData
        }
    } catch (error) {
        console.log('Error in getValueHistoricalTime:', error)
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const deleteAllValueHistorical = async () => {
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

const deleteValueHistoricalDeviceId = async (rawData) => {
    try {
        console.log('check rawData Delete: ', rawData);
        const { ids } = rawData;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return {
                EM: 'Không có deviceId nào được chọn để xóa',
                EC: 1,
                DT: ''
            };
        }

        console.log(`[deleteValueHistorical] Xóa dữ liệu historical cho deviceIds:`, ids);

        let deletedEntriesCount = 0;
        let deletedDocumentsCount = 0;
        let modifiedDocumentsCount = 0;

        const allHistoricalData = await HistoricalValueModel.findAsync({});

        for (let doc of allHistoricalData) {
            if (doc.values && Array.isArray(doc.values)) {
                let hasChanges = false;
                let newValues = [];

                for (let valueItem of doc.values) {
                    if (valueItem && valueItem.value) {
                        const newValue = { ...valueItem.value };
                        let itemHasDeviceToDelete = false;

                        // Xóa các tag có deviceId nằm trong mảng ids
                        for (let tagId in newValue) {
                            if (newValue[tagId] && ids.includes(newValue[tagId].deviceId)) {
                                delete newValue[tagId];
                                itemHasDeviceToDelete = true;
                                deletedEntriesCount++;
                            }
                        }

                        if (Object.keys(newValue).length > 0) {
                            newValues.push({
                                value: newValue,
                                ts: valueItem.ts
                            });
                        } else {
                            hasChanges = true;
                        }

                        if (itemHasDeviceToDelete) {
                            hasChanges = true;
                        }
                    } else {
                        newValues.push(valueItem);
                    }
                }

                if (hasChanges) {
                    if (newValues.length === 0) {
                        // Xóa document nếu không còn value nào
                        await HistoricalValueModel.removeAsync({ _id: doc._id });
                        deletedDocumentsCount++;
                    } else {
                        // Cập nhật document với values mới
                        await HistoricalValueModel.updateAsync(
                            { _id: doc._id },
                            { $set: { values: newValues } }
                        );
                        modifiedDocumentsCount++;
                    }
                }
            }
        }

        await HistoricalValueModel.loadDatabaseAsync();

        console.log(`[deleteValueHistorical] Đã xóa ${deletedEntriesCount} entries, ${deletedDocumentsCount} documents, cập nhật ${modifiedDocumentsCount} documents`);

        return {
            EM: `Đã xóa dữ liệu historical của ${ids.length} devices thành công`,
            EC: 0,
            DT: {
                deletedEntries: deletedEntriesCount,
                deletedDocuments: deletedDocumentsCount,
                modifiedDocuments: modifiedDocumentsCount,
                deviceIds: ids
            }
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

module.exports = { getAllValueHistorical, getValueHistoricalTime, deleteAllValueHistorical, deleteValueHistoricalDeviceId }