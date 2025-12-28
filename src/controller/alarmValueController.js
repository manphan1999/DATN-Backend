import { AlarmValueModel } from '../configs/connectDB'

const getAllValueAlarm = async () => {
    try {
        const AlarmListData = await AlarmValueModel.findAsync({})
        return {
            EM: 'Danh sách tất cả cảnh báo dữ liệu',
            EC: 0,
            DT: AlarmListData
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const getValueAlarmTime = async (rawData) => {
    try {
        const { startTime, endTime, tagNameId } = rawData

        // Chuyển đổi sang timestamp
        const fromDate = new Date(startTime).getTime();
        const toDate = new Date(endTime).getTime();

        // Query theo date field với timestamp
        const result = await AlarmValueModel.findAsync({
            date: {
                $gte: fromDate,
                $lte: toDate,
            },
        });

        let valueData = [];
        for (let doc of result) {
            for (let alarmGroup of doc.alarms) {
                for (let alarmItem of alarmGroup.alarm) {
                    if (!tagNameId || alarmItem.tagnameId === tagNameId) {
                        const tsTime = new Date(alarmGroup.ts).getTime();
                        if (tsTime >= fromDate && tsTime <= toDate) {
                            valueData.push({
                                tagnameId: alarmItem.tagnameId,
                                tagName: alarmItem.tagName,
                                value: alarmItem.value,
                                condition: alarmItem.condition,
                                rangeAlarm: alarmItem.rangeAlarm,
                                content: alarmItem.content,
                                ts: alarmGroup.ts,
                                title: alarmItem.title,
                                type: alarmItem.type
                            });
                        }
                    }
                }
            }
        }
        return {
            EM: 'Danh sách cảnh báo dữ liệu theo thời gian',
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

const deleteAllValueAlarm = async () => {
    try {
        // console.log('Check ids delete: ', rawData)
        await AlarmValueModel.removeAsync({}, { multi: true });
        await AlarmValueModel.loadDatabaseAsync();
        return {
            EM: 'Đã xóa toàn bộ dữ liệu Alarm thành công',
            EC: 0,
            DT: 'all_data_deleted'
        };
    } catch (error) {
        console.error('deleteValueAlarm error:', error);
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

const deleteValueAlarmTagNameId = async (rawData) => {
    try {
        console.log('Check rawData Delete Tag Alarm:', rawData);

        if (!rawData.ids || !Array.isArray(rawData.ids) || rawData.ids.length === 0) {
            return {
                EM: 'Danh sách tagnameId không hợp lệ',
                EC: -1,
                DT: ''
            };
        }

        // Lấy danh sách tagnameId cần xóa từ trường ids
        const idsToDelete = rawData.ids;
        let totalDeleted = 0;
        const affectedDocuments = [];

        // Lấy toàn bộ document
        const documents = await AlarmValueModel.findAsync({});

        for (const doc of documents) {
            if (!doc.alarms || !Array.isArray(doc.alarms)) continue;

            let hasChanges = false;
            let deletedInDoc = 0;
            const newAlarms = [];

            // Duyệt qua từng alarm item
            for (const alarmItem of doc.alarms) {
                if (!alarmItem.alarm || !Array.isArray(alarmItem.alarm)) {
                    // Giữ lại các alarmItem không có alarm array hợp lệ
                    newAlarms.push(alarmItem);
                    continue;
                }

                const beforeCount = alarmItem.alarm.length;
                // Giữ lại các alarm KHÔNG có tagnameId nằm trong idsToDelete
                const filteredAlarm = alarmItem.alarm.filter(a => !idsToDelete.includes(a.tagnameId));
                const afterCount = filteredAlarm.length;

                if (afterCount < beforeCount) {
                    hasChanges = true;
                    deletedInDoc += (beforeCount - afterCount);
                }

                // Chỉ thêm alarmItem vào newAlarms nếu vẫn còn alarm sau khi lọc
                if (filteredAlarm.length > 0) {
                    newAlarms.push({
                        ...alarmItem,
                        alarm: filteredAlarm
                    });
                }
            }

            // Nếu có thay đổi thì cập nhật DB
            if (hasChanges) {
                if (newAlarms.length === 0) {
                    // Nếu không còn alarm nào, xóa toàn bộ document
                    await AlarmValueModel.removeAsync({ _id: doc._id });
                    affectedDocuments.push({
                        documentId: doc._id,
                        deletedCount: deletedInDoc,
                        action: 'deleted_document'
                    });
                } else {
                    // Cập nhật alarms mới
                    await AlarmValueModel.updateAsync(
                        { _id: doc._id },
                        { $set: { alarms: newAlarms } }
                    );
                    affectedDocuments.push({
                        documentId: doc._id,
                        deletedCount: deletedInDoc,
                        action: 'updated_document'
                    });
                }

                totalDeleted += deletedInDoc;
            }
        }

        await AlarmValueModel.loadDatabaseAsync();

        return {
            EM: `Đã xóa thành công ${totalDeleted} alarm theo tagnameId`,
            EC: 0,
            DT: {
                deletedCount: totalDeleted,
                deletedTagnameIds: idsToDelete,
                affectedDocumentsCount: affectedDocuments.length,
                affectedDocuments
            }
        };
    } catch (error) {
        console.error('Error in deleteValueAlarmTagNameId:', error);
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

const deleteValueAlarmDeviceId = async (rawData) => {
    try {
        // console.log('Check rawData Delete Device Alarm:', rawData);
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
        const affectedDocuments = [];

        const allAlarmData = await AlarmValueModel.findAsync({});

        for (let doc of allAlarmData) {
            if (doc.alarms && Array.isArray(doc.alarms)) {
                let hasChanges = false;
                let newAlarms = [];
                let deletedInDoc = 0;

                for (let alarmItem of doc.alarms) {
                    if (alarmItem.alarm && Array.isArray(alarmItem.alarm)) {
                        let newAlarmArray = [];
                        let alarmHasChanges = false;

                        for (let alarm of alarmItem.alarm) {
                            // Kiểm tra nếu alarm có deviceId nằm trong danh sách cần xóa
                            if (alarm.deviceId && ids.includes(alarm.deviceId)) {
                                // Alarm này cần bị xóa
                                alarmHasChanges = true;
                                deletedEntriesCount++;
                                deletedInDoc++;
                            } else {
                                // Giữ lại alarm không bị xóa
                                newAlarmArray.push(alarm);
                            }
                        }

                        // Chỉ thêm alarmItem nếu còn alarm sau khi lọc
                        if (newAlarmArray.length > 0) {
                            newAlarms.push({
                                ...alarmItem,
                                alarm: newAlarmArray
                            });
                            if (alarmHasChanges) {
                                hasChanges = true;
                            }
                        } else {
                            // Nếu không còn alarm nào trong alarmItem, đánh dấu có thay đổi
                            hasChanges = true;
                        }
                    } else {
                        // Giữ lại các alarmItem không có alarm array hợp lệ
                        newAlarms.push(alarmItem);
                    }
                }

                if (hasChanges) {
                    if (newAlarms.length === 0) {
                        // Nếu không còn alarm nào, xóa toàn bộ document
                        await AlarmValueModel.removeAsync({ _id: doc._id });
                        deletedDocumentsCount++;
                        affectedDocuments.push({
                            documentId: doc._id,
                            deletedCount: deletedInDoc,
                            action: 'deleted_document'
                        });
                    } else {
                        // Cập nhật alarms mới
                        await AlarmValueModel.updateAsync(
                            { _id: doc._id },
                            { $set: { alarms: newAlarms } }
                        );
                        modifiedDocumentsCount++;
                        affectedDocuments.push({
                            documentId: doc._id,
                            deletedCount: deletedInDoc,
                            action: 'updated_document'
                        });
                    }
                }
            }
        }

        await AlarmValueModel.loadDatabaseAsync();

        return {
            EM: `Đã xóa thành công ${deletedEntriesCount} alarm entries từ ${ids.length} devices`,
            EC: 0,
            DT: {
                deletedEntries: deletedEntriesCount,
                deletedDocuments: deletedDocumentsCount,
                modifiedDocuments: modifiedDocumentsCount,
                deviceIds: ids,
                affectedDocuments
            }
        };
    } catch (error) {
        console.error('Error in deleteValueAlarmDeviceId:', error);
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

module.exports = {
    getAllValueAlarm, getValueAlarmTime, deleteAllValueAlarm,
    deleteValueAlarmDeviceId, deleteValueAlarmTagNameId
}