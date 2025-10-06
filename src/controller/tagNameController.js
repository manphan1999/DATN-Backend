import { TagnameModel } from '../configs/connectDB'
import { dataFormat, dataType, functionCodeModbus } from '../configs/convertData'
import { connectAllDevice } from '../protocol/modbus/devicesHandlers'

const getAllTagName = async () => {
    try {
        const tagList = await TagnameModel.findAsync({})
        return {
            EM: 'List Tag',
            EC: 0,
            DT: tagList
        }
    } catch (error) {
        return {
            EM: 'Error from server',
            EC: -2,
            DT: ''
        }
    }
}

const createTagName = async (rawData) => {
    try {
        // console.log('check new tag: ', rawData);
        const {
            channel,
            name,
            device,
            symbol,
            unit,
            offset,
            gain,
            lowSet,
            highSet,
            slaveId,
            functionCode,
            address,
            dataFormat,
            dataType,
            functionText,
            selectFTP,
        } = rawData;

        const checkChannel = await TagnameModel.findOneAsync({ channel: Number(channel) });
        if (checkChannel) {
            return {
                EM: "Channel already exists",
                EC: -1,
                DT: '',
            };
        }
        const checkName = await TagnameModel.findOneAsync({ name });
        if (checkName) {
            return {
                EM: "Tag Name already exists",
                EC: -1,
                DT: '',
            };
        }

        // insert nếu không trùng
        const newTag = await TagnameModel.insertAsync({
            channel: Number(channel),
            name,
            device,
            symbol,
            unit,
            offset: Number(offset),
            gain: Number(gain),
            lowSet: Number(lowSet),
            highSet: Number(highSet),
            slaveId: Number(slaveId),
            functionCode: Number(functionCode),
            address: Number(address),
            dataFormat: Number(dataFormat),
            dataType: Number(dataType),
            functionText,
            selectFTP,
        });

        await TagnameModel.loadDatabaseAsync();

        return {
            EM: "Add Tag Success",
            EC: 0,
            DT: newTag,
        };
    } catch (error) {
        console.error("createTagName error:", error);
        return {
            EM: "Error from server",
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
                EM: `Can't find device`,
                EC: 1,
                DT: "",
            };
        }
        // console.log('check update tag: ', rawData);
        const {
            channel,
            name,
            device,
            symbol,
            unit,
            offset,
            gain,
            lowSet,
            highSet,
            slaveId,
            functionCode,
            address,
            dataFormat,
            dataType,
            functionText,
            selectFTP,
        } = rawData;

        await TagnameModel.updateAsync(
            { _id: id },
            {
                $set: {
                    channel: Number(channel),
                    name,
                    device,
                    symbol,
                    unit,
                    offset: Number(offset),
                    gain: Number(gain),
                    lowSet: Number(lowSet),
                    highSet: Number(highSet),
                    slaveId: Number(slaveId),
                    functionCode: Number(functionCode),
                    address: Number(address),
                    dataFormat: Number(dataFormat),
                    dataType: Number(dataType),
                    functionText,
                    selectFTP,
                }
            },
            { returnUpdatedDocs: true }
        );

        await TagnameModel.loadDatabaseAsync();

        return {
            EM: "Update Channel Successfully",
            EC: 0,
            DT: '',
        };
    } catch (error) {
        return {
            EM: "Error from server",
            EC: -2,
            DT: "",
        };
    }
};

const deleteChannel = async (rawData) => {
    try {
        // console.log('Check ids delete: ', rawData)
        const { ids } = rawData
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return {
                EM: `No device selected`,
                EC: 1,
                DT: ''
            }
        }

        // Xoá nhiều thiết bị theo danh sách _id
        await TagnameModel.removeAsync(
            { _id: { $in: ids } },   // tìm tất cả _id nằm trong mảng ids
            { multi: true }          // cho phép xoá nhiều record
        )
        await TagnameModel.compactDatafile()
        await TagnameModel.loadDatabaseAsync()

        return {
            EM: 'Delete Tag successfully',
            EC: 0,
            DT: ''
        }
    } catch (error) {
        return {
            EM: 'Error from server',
            EC: -2,
            DT: ''
        }
    }

}

const getDataFormat = async () => {
    try {
        return {
            EM: 'List Data Format',
            EC: 0,
            DT: dataFormat
        }
    } catch (error) {
        return {
            EM: 'Error from server',
            EC: -2,
            DT: ''
        }
    }
}

const getDataType = async () => {
    try {
        return {
            EM: 'List Data type',
            EC: 0,
            DT: dataType
        }
    } catch (error) {
        return {
            EM: 'Error from server',
            EC: -2,
            DT: ''
        }
    }
}

const getFunctionCodeModbus = async () => {
    try {
        return {
            EM: 'List Function Code Modbus',
            EC: 0,
            DT: functionCodeModbus
        }
    } catch (error) {
        return {
            EM: 'Error from server',
            EC: -2,
            DT: ''
        }
    }
}

module.exports = { createTagName, getAllTagName, updateTagName, deleteChannel, getDataFormat, getDataType, getFunctionCodeModbus }
