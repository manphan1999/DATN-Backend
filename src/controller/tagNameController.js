import { TagnameModel, TagHistorical } from '../configs/connectDB'
import { dataFormat, dataType, functionCodeModbus } from '../configs/convertData'
import { connectAllDevice } from '../protocol/modbus/devicesHandlers'

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
        console.log('check new tag: ', rawData);

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
            permission,
            selectFTP,
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

        const newTag = await TagnameModel.insertAsync({
            channel: Number(channel),
            name,
            device,
            symbol,
            unit,
            offset: Number(offset) || 0,
            gain: Number(gain) || 0,
            lowSet: Number(lowSet) || 0,
            highSet: Number(highSet) || 0,
            slaveId: Number(slaveId) || 0,
            functionCode: Number(functionCode) || 0,
            address: Number(address) || 0,
            dataFormat: Number(dataFormat) || 0,
            dataType: Number(dataType) || 0,
            functionText,
            permission,
            selectFTP,
        });
        await TagnameModel.loadDatabaseAsync();

        return {
            EM: "Thêm Tag thành công",
            EC: 0,
            DT: newTag,
        };
    } catch (error) {
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
            permission,
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
                    permission,
                    selectFTP,
                }
            },
            { returnUpdatedDocs: true }
        );

        await TagnameModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật Tag thành công",
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
};

const deleteChannel = async (rawData) => {
    try {
        // console.log('Check ids delete: ', rawData)
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
            { _id: { $in: ids } },   // tìm tất cả _id nằm trong mảng ids
            { multi: true }          // cho phép xoá nhiều record
        )

        await TagHistorical.removeAsync(
            { id: { $in: ids } },   // tìm tất cả _id nằm trong mảng ids
            { multi: true }          // cho phép xoá nhiều record
        )

        await TagnameModel.compactDatafile()
        await TagnameModel.loadDatabaseAsync()

        await TagHistorical.compactDatafile()
        await TagHistorical.loadDatabaseAsync()

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

const getFunctionCodeModbus = async () => {
    try {
        return {
            EM: 'Danh sách Function Code Modbus',
            EC: 0,
            DT: functionCodeModbus
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

module.exports = { createTagName, getAllTagName, updateTagName, deleteChannel, getDataFormat, getDataType, getFunctionCodeModbus }
