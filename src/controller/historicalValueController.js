import { HistoricalValueModel } from '../configs/connectDB'

const getAllValueHistorical = async () => {
    try {
        const historicalListData = await HistoricalValueModel.findAsync({})
        return {
            EM: 'Danh sách tất cả lịch sử dữ liệu',
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
    //console.log('Check search data from time: ', rawData)
    try {
        const { startTime, endTime, tagNameId } = rawData

        // Chuyển đổi sang timestamp
        const fromDate = new Date(startTime).getTime();
        const toDate = new Date(endTime).getTime();

        // Query theo date field với timestamp
        const result = await HistoricalValueModel.findAsync({
            date: {
                $gte: fromDate,
                $lte: toDate,
            },
        });

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
        return {
            EM: 'Danh sách lịch sử dữ liệu theo thời gian',
            EC: 0,
            DT: valueData
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const deleteAllValueHistorical = async (rawData) => {
    try {
        // console.log('Check ids delete: ', rawData)
        await HistoricalValueModel.removeAsync({}, { multi: true });
        await HistoricalValueModel.loadDatabaseAsync();
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

const deleteValueHistoricalTagNameId = async (rawData) => {
    try {
        if (!rawData.ids || !Array.isArray(rawData.ids) || rawData.ids.length === 0) {
            return {
                EM: 'Danh sách ids không hợp lệ',
                EC: -1,
                DT: ''
            };
        }

        let totalDeleted = 0;
        const deletedFromDocuments = [];

        // Lấy tất cả documents
        const documents = await HistoricalValueModel.findAsync({});

        for (const doc of documents) {
            if (!doc.values || !Array.isArray(doc.values)) continue;

            let hasChanges = false;
            const originalValuesCount = doc.values.length;

            // Duyệt qua từng item trong mảng values
            for (let i = 0; i < doc.values.length; i++) {
                const item = doc.values[i];

                // Kiểm tra nếu item có value là object
                if (item.value && typeof item.value === 'object' && !Array.isArray(item.value)) {
                    const idsToDelete = rawData.ids.filter(id =>
                        item.value.hasOwnProperty(id)
                    );

                    // Nếu có ID cần xóa trong object value
                    if (idsToDelete.length > 0) {
                        hasChanges = true;

                        // Xóa từng key trong object value
                        idsToDelete.forEach(id => {
                            delete item.value[id];
                            totalDeleted++;
                        });

                        // Kiểm tra nếu object value trống sau khi xóa
                        if (Object.keys(item.value).length === 0) {
                            // Nếu object value trống, xóa luôn cả item 
                            doc.values.splice(i, 1);
                            i--; // Giảm index vì đã xóa item hiện tại
                        }
                    }
                }
            }

            // Nếu có thay đổi, cập nhật document
            if (hasChanges) {
                await HistoricalValueModel.updateAsync(
                    { _id: doc._id },
                    { $set: { values: doc.values } }
                );

                const currentValuesCount = doc.values.length;
                const deletedItemsCount = originalValuesCount - currentValuesCount;

                deletedFromDocuments.push({
                    documentId: doc._id,
                    deletedTagnameIds: rawData.ids,
                    deletedItemsCount: deletedItemsCount,
                    deletedPropertiesCount: totalDeleted
                });
            }
        }

        await HistoricalValueModel.loadDatabaseAsync();

        return {
            EM: `Đã xóa thành công ${totalDeleted} thuộc tính historical`,
            EC: 0,
            DT: {
                deletedCount: totalDeleted,
                deletedIds: rawData.ids,
                affectedDocuments: deletedFromDocuments
            }
        };
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

const deleteValueHistoricalDeviceId = async (rawData) => {
    try {
        // console.log('check rawData Delete: ', rawData);
        const { ids } = rawData;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return {
                EM: 'Không có deviceId nào được chọn để xóa',
                EC: 1,
                DT: ''
            };
        }

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
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

module.exports = {
    getAllValueHistorical, getValueHistoricalTime,
    deleteAllValueHistorical, deleteValueHistoricalDeviceId,
    deleteValueHistoricalTagNameId
}