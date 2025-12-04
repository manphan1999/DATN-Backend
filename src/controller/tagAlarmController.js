import { TagAlarmModel, AlarmValueModel } from '../configs/connectDB'

const getAllTagAlarm = async () => {
    try {
        const listTagAlarm = await TagAlarmModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách Tag Alarm',
            EC: 0,
            DT: listTagAlarm
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createTagAlarm = async (rawData) => {
    try {
        //console.log('check rawData:', rawData);
        const dataToInsert = { ...rawData };
        delete dataToInsert.id;
        const name = rawData.name;
        const existing = await TagAlarmModel.findAsync({ name });

        if (existing && existing.length > 0) {
            return {
                EM: `Tag đã tồn tại: ${existing.map(e => e.name).join(', ')}`,
                EC: -1,
                DT: "",
            };
        }

        const newAlarmTag = await TagAlarmModel.insertAsync(dataToInsert);
        await TagAlarmModel.loadDatabaseAsync();

        return {
            EM: "Thêm mới Tag Alarm thành công",
            EC: 0,
            DT: newAlarmTag,
        };

    } catch (error) {
        console.error(error);
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
    }
};

const updateTagAlarm = async (rawData) => {
    try {
        const {
            id, tagnameId, name, deviceId, deviceName, condition,
            content, rangeAlarm, selection, type, title } = rawData;

        if (!id) {
            return {
                EM: `Không tìm thấy Tag`,
                EC: 1,
                DT: "",
            };
        }
        // console.log('check update tag: ', rawData);

        await TagAlarmModel.updateAsync(
            { _id: id },
            {
                $set: {
                    rangeAlarm: parseFloat(rangeAlarm), name, tagnameId, deviceId,
                    deviceName, condition, content, selection, type, title
                }
            },
            { returnUpdatedDocs: true }
        );

        await TagAlarmModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật Tag Alarm thành công",
            EC: 0,
            DT: '',
        };
    } catch (error) {
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
}

const deleteTagAlarm = async (rawData) => {
    try {
        console.log('check rawData Delete Tag Alarm: ', rawData);
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

        // Xóa các tag alarm
        await TagAlarmModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );

        if (tagnameIds.length > 0) {
            await removeTagsFromAlarm(tagnameIds);
        }

        await TagAlarmModel.loadDatabaseAsync();
        await AlarmValueModel.loadDatabaseAsync();

        return {
            EM: 'Xóa Tag Alarm và dữ liệu lịch sử thành công',
            EC: 0,
            DT: { deletedTagIds: tagnameIds }
        };
    } catch (error) {
        console.error('Error in deleteTagAlarm:', error);
        return {
            EM: 'Lỗi ở Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

const removeTagsFromAlarm = async (tagnameIds) => {
    try {
        // Lấy tất cả documents Alarm
        const allAlarmData = await AlarmValueModel.findAsync({});
        let modifiedCount = 0;
        let deletedEntriesCount = 0;
        let deletedDocumentsCount = 0;

        for (let doc of allAlarmData) {
            if (doc.alarms && Array.isArray(doc.alarms)) {
                let hasChanges = false;
                let newAlarms = [];

                // Duyệt qua từng alarm trong alarms
                for (let alarmItem of doc.alarms) {
                    if (alarmItem && alarmItem.alarm && Array.isArray(alarmItem.alarm)) {
                        let newAlarmArray = [];
                        let alarmHasChanges = false;

                        // Duyệt qua từng alarm trong mảng alarm
                        for (let alarm of alarmItem.alarm) {
                            // Kiểm tra nếu alarm có tagnameId nằm trong danh sách cần xóa
                            if (alarm.tagnameId && tagnameIds.includes(alarm.tagnameId)) {
                                // Tag này cần bị xóa
                                alarmHasChanges = true;
                                deletedEntriesCount++;
                            } else {
                                // Giữ lại alarm không bị xóa
                                newAlarmArray.push(alarm);
                            }
                        }

                        // Nếu mảng alarm không rỗng sau khi xóa, giữ lại alarmItem
                        if (newAlarmArray.length > 0) {
                            newAlarms.push({
                                alarm: newAlarmArray,
                                ts: alarmItem.ts
                            });
                        } else {
                            // Nếu tất cả alarm trong alarmItem đều bị xóa, bỏ alarmItem này
                            hasChanges = true;
                        }

                        if (alarmHasChanges) {
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
                    } else {
                        // Cập nhật alarms mới
                        await AlarmValueModel.updateAsync(
                            { _id: doc._id },
                            { $set: { alarms: newAlarms } }
                        );
                        modifiedCount++;
                    }
                }
            }
        }

        console.log(`Deleted ${deletedEntriesCount} alarm entries, modified ${modifiedCount} documents, deleted ${deletedDocumentsCount} documents`);
        return { deletedEntriesCount, modifiedDocuments: modifiedCount, deletedDocumentsCount };

    } catch (error) {
        console.error('Error in removeTagsFromAlarm:', error);
        throw error;
    }
};

module.exports = { getAllTagAlarm, updateTagAlarm, createTagAlarm, deleteTagAlarm }