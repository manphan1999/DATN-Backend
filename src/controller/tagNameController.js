import { TagnameModel, TagHistorical, TagAlarmModel } from '../configs/connectDB'
import { dataFormat, dataType } from '../configs/convertData'
// import { connectAllDevice } from '../protocol/modbus/devicesHandlers'
import HistoricalValueModel from '../controller/historicalValueController'
import AlarmValueModel from '../controller/alarmValueController'


const getAllTagName = async () => {
    try {
        const tagList = await TagnameModel.findAsync({})
        return {
            EM: 'Danh sách Tag',
            EC: 0,
            DT: tagList
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createTagName = async (rawData) => {
    try {
        const {
            channel,
            name,
            device,
            symbol,
            unit,
            offset,
            gain,
            slaveId,
            functionCode,
            address,
            topic,
            dataFormat,
            dataType,
            functionText,
            permission,
            selectFTP,
            selectMySQL,
            selectSQL,
        } = rawData;

        const checkChannel = await TagnameModel.findOneAsync({ channel: Number(channel) });
        if (checkChannel) {
            return {
                EM: `Channel đã tồn tại: ${checkChannel.channel}`,
                EC: -1,
                DT: '',
            };
        }

        const checkName = await TagnameModel.findOneAsync({ name });
        if (checkName) {
            return {
                EM: `Tên Tag đã tồn tại: ${checkName.name}`,
                EC: -1,
                DT: '',
            };
        }

        // Tạo object dữ liệu chỉ chứa các trường có giá trị
        const tagData = {
            channel: Number(channel),
            name,
            device,
            symbol,
            functionText,
            permission,
            selectFTP,
            selectMySQL,
            selectSQL,
        };

        // Chỉ thêm các trường nếu có giá trị (khác rỗng, 0, null, undefined)
        if (unit) tagData.unit = unit;
        if (offset !== '' && offset !== null && offset !== undefined) tagData.offset = Number(offset);
        if (gain !== '' && gain !== null && gain !== undefined) tagData.gain = Number(gain);
        if (slaveId !== '' && slaveId !== null && slaveId !== undefined) tagData.slaveId = Number(slaveId);
        if (functionCode !== '' && functionCode !== null && functionCode !== undefined) tagData.functionCode = Number(functionCode);
        if (address !== '' && address !== null && address !== undefined) tagData.address = Number(address);
        if (topic) tagData.topic = topic;
        if (dataFormat !== '' && dataFormat !== null && dataFormat !== undefined) tagData.dataFormat = Number(dataFormat);
        if (dataType !== '' && dataType !== null && dataType !== undefined) tagData.dataType = Number(dataType);

        const newTag = await TagnameModel.insertAsync(tagData);
        await TagnameModel.loadDatabaseAsync();

        return {
            EM: "Thêm Tag thành công",
            EC: 0,
            DT: newTag,
        };
    } catch (error) {
        console.error('Error creating tag:', error);
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const updateTagName = async (rawData) => {
    try {
        const { id } = rawData;
        if (!id) {
            return {
                EM: `Không tìm thấy Tag`,
                EC: 1,
                DT: "",
            };
        }

        const {
            channel,
            name,
            device,
            symbol,
            unit,
            offset,
            gain,
            slaveId,
            functionCode,
            address,
            topic,
            dataFormat,
            dataType,
            functionText,
            permission,
            selectFTP,
            selectMySQL,
            selectSQL,
        } = rawData;

        // Tạo object cho $set
        const setData = {
            channel: Number(channel),
            name,
            device,
            symbol,
            functionText,
            permission,
            selectFTP,
            selectMySQL,
            selectSQL,
        };

        // Tạo object cho $unset (các trường cần xóa)
        const unsetData = {};

        // Xử lý các trường có điều kiện
        if (unit !== undefined && unit !== null && unit !== '') {
            setData.unit = unit;
        } else {
            unsetData.unit = "";
        }

        if (offset !== undefined && offset !== null && offset !== '') {
            setData.offset = Number(offset);
        } else {
            unsetData.offset = "";
        }

        if (gain !== undefined && gain !== null && gain !== '') {
            setData.gain = Number(gain);
        } else {
            unsetData.gain = "";
        }

        if (slaveId !== undefined && slaveId !== null && slaveId !== '') {
            setData.slaveId = Number(slaveId);
        } else {
            unsetData.slaveId = "";
        }

        if (functionCode !== undefined && functionCode !== null && functionCode !== '') {
            setData.functionCode = Number(functionCode);
        } else {
            unsetData.functionCode = "";
        }

        if (address !== undefined && address !== null && address !== '') {
            setData.address = Number(address);
        } else {
            unsetData.address = "";
        }

        if (topic !== undefined && topic !== null && topic !== '') {
            setData.topic = topic;
        } else {
            unsetData.topic = "";
        }

        if (dataFormat !== undefined && dataFormat !== null && dataFormat !== '') {
            setData.dataFormat = Number(dataFormat);
        } else {
            unsetData.dataFormat = "";
        }

        if (dataType !== undefined && dataType !== null && dataType !== '') {
            setData.dataType = Number(dataType);
        } else {
            unsetData.dataType = "";
        }

        // Tạo update object
        const updateObj = {};
        if (Object.keys(setData).length > 0) {
            updateObj.$set = setData;
        }
        if (Object.keys(unsetData).length > 0) {
            updateObj.$unset = unsetData;
        }

        await TagnameModel.updateAsync(
            { _id: id },
            updateObj,
            { returnUpdatedDocs: true }
        );

        await TagnameModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật Tag thành công",
            EC: 0,
            DT: '',
        };
    } catch (error) {
        console.error('Error updating tag:', error);
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const deleteChannel = async (rawData) => {
    try {
        console.log('check delete tagname: ', rawData)
        const { ids } = rawData
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return {
                EM: `Không có Tag nào được chọn`,
                EC: 1,
                DT: ''
            }
        }

        // Xoá nhiều thiết bị theo danh sách _id
        await TagnameModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );

        await TagHistorical.removeAsync(
            { id: { $in: ids } },
            { multi: true }
        );

        await TagAlarmModel.removeAsync(
            { tagnameId: { $in: ids } },
            { multi: true }
        );

        await HistoricalValueModel.deleteValueHistoricalTagNameId(rawData)
        await AlarmValueModel.deleteValueAlarmTagNameId(rawData)
        await TagnameModel.compactDatafile();
        await TagnameModel.loadDatabaseAsync();

        await TagHistorical.compactDatafile();
        await TagHistorical.loadDatabaseAsync();

        await TagAlarmModel.compactDatafile();
        await TagAlarmModel.loadDatabaseAsync();

        return {
            EM: 'Xóa Tag thành công',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }

}

const getDataFormat = async () => {
    try {
        return {
            EM: 'Danh sách Format',
            EC: 0,
            DT: dataFormat
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const getDataType = async () => {
    try {
        return {
            EM: 'Danh sách Data type',
            EC: 0,
            DT: dataType
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}


module.exports = { createTagName, getAllTagName, updateTagName, deleteChannel, getDataFormat, getDataType, }
