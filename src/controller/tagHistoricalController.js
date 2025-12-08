import { TagHistorical, HistoricalValueModel } from '../configs/connectDB'

const getHistorical = async () => {
    try {
        const listTagHistorical = await TagHistorical.findAsync({})
        return {
            EM: 'Danh sách Tag Historical',
            EC: 0,
            DT: listTagHistorical
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createHistorical = async (rawData) => {
    try {
        //console.log('Add tag historical: ', rawData)
        const names = rawData.map(item => item.name);

        const existing = await TagHistorical.findAsync({ name: { $in: names } });
        if (existing && existing.length > 0) {
            return {
                EM: `Tag đã tồn tại: ${existing.map(e => e.name).join(', ')}`,
                EC: -1,
                DT: "",
            };
        }

        const newHistorical = await TagHistorical.insertAsync(rawData);
        await TagHistorical.loadDatabaseAsync();

        return {
            EM: "Thêm mới Tag Historical thành công",
            EC: 0,
            DT: newHistorical,
        };

    } catch (error) {
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const updateHistorical = async (rawData) => {
    // try {
    //     console.log('check rawdata upadate com: ', rawData)
    //     const { id, baudRate, parity, dataBit, stopBit } = rawData
    //     if (!id) {
    //         return {
    //             EM: `Can't not device`,
    //             EC: 1,
    //             DT: ''
    //         }
    //     }

    //     const device = await ComModel.updateAsync(
    //         {
    //             _id: id,
    //         },
    //         {
    //             $set: {
    //                 baudRate: baudRate ? Number(baudRate) : null,
    //                 parity,
    //                 dataBit: dataBit ? Number(dataBit) : null,
    //                 stopBit: stopBit ? Number(stopBit) : null,

    //             },
    //         },
    //         { returnUpdatedDocs: true }
    //     )

    //     await ComModel.loadDatabaseAsync()
    //     return {
    //         EM: 'Update Com Successfully',
    //         EC: 0,
    //         DT: device
    //     }
    // } catch (error) {
    //     return {
    //         EM: 'Lỗi Server!!!',
    //         EC: -2,
    //         DT: ''
    //     }
    // }

}

const deleteHistorical = async (rawData) => {
    try {
        //console.log('check rawData Delete: ', rawData);
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
        const tagnameIds = list.map(item => item.tagnameId);

        console.log(`[deleteHistorical] Xóa ${ids.length} tags:`, tagnameIds);

        await TagHistorical.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );

        if (tagnameIds.length > 0) {
            await removeTagsFromHistoricalData(tagnameIds);
        }

        await TagHistorical.loadDatabaseAsync();
        await HistoricalValueModel.loadDatabaseAsync();

        return {
            EM: 'Xóa Tag Historical và dữ liệu lịch sử thành công',
            EC: 0,
            DT: { deletedTagIds: tagnameIds }
        };
    } catch (error) {
        console.log('Error deleteHistorical:', error);
        return {
            EM: 'Lỗi ở Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

const removeTagsFromHistoricalData = async (tagnameIds) => {
    try {
        // Lấy tất cả documents historical
        const allHistoricalData = await HistoricalValueModel.findAsync({});
        let modifiedCount = 0;
        let deletedEntriesCount = 0;

        for (let doc of allHistoricalData) {
            if (doc.values && Array.isArray(doc.values)) {
                let hasChanges = false;
                let newValues = [];

                // Duyệt qua từng giá trị trong values
                for (let valueItem of doc.values) {
                    if (valueItem && valueItem.value) {
                        const newValue = { ...valueItem.value };
                        let itemHasTagToDelete = false;

                        // Xóa các tagnameId cần xóa khỏi value object
                        for (let tagnameId of tagnameIds) {
                            if (newValue[tagnameId]) {
                                delete newValue[tagnameId];
                                itemHasTagToDelete = true;
                                deletedEntriesCount++;
                            }
                        }

                        // Nếu value object không rỗng sau khi xóa, giữ lại 
                        if (Object.keys(newValue).length > 0) {
                            newValues.push({
                                value: newValue,
                                ts: valueItem.ts
                            });
                        } else {
                            // Nếu value rỗng, bỏ 
                            hasChanges = true;
                        }

                        if (itemHasTagToDelete) {
                            hasChanges = true;
                        }
                    } else {
                        // Giữ lại các entry không có value
                        newValues.push(valueItem);
                    }
                }

                if (hasChanges) {
                    if (newValues.length === 0) {
                        // Nếu không còn value nào, xóa document
                        await HistoricalValueModel.removeAsync({ _id: doc._id });
                        modifiedCount++;
                    } else {
                        // Cập nhật values mới
                        await HistoricalValueModel.updateAsync(
                            { _id: doc._id },
                            { $set: { values: newValues } }
                        );
                        modifiedCount++;
                    }
                }
            }
        }
        return { deletedEntriesCount, modifiedDocuments: modifiedCount };

    } catch (error) {
        throw error;
    }
};

module.exports = { getHistorical, updateHistorical, createHistorical, deleteHistorical }