import { DeviceModel, TagnameModel } from '../configs/connectDB'

const filterValidFields = (data, allowedFields) => {
    const result = {}
    allowedFields.forEach((field) => {
        if (data[field] !== null && data[field] !== undefined && data[field] !== "") {
            // ép kiểu number cho port và timeOut 
            if ((field === "port" || field === "timeOut") && data[field] !== "") {
                result[field] = Number(data[field])
            } else {
                result[field] = data[field]
            }
        }
    })
    return result;
}


const getAllDevice = async () => {
    try {
        const deviceList = await DeviceModel.findAsync({})
        return {
            EM: 'List Device',
            EC: 0,
            DT: deviceList
        }
    } catch (error) {
        return {
            EM: 'Error from server',
            EC: -2,
            DT: ''
        }
    }
}

const createDeviceController = async (rawData) => {
    try {
        const { name } = rawData;

        // Check trùng tên
        const checkName = await DeviceModel.findOneAsync({ name });
        if (checkName) {
            return {
                EM: "Name Device Axis",
                EC: -1,
                DT: "",
            };
        }

        // Lọc trường hợp lệ
        const newData = filterValidFields(rawData, [
            "name",
            "serialPort",
            "ipAddress",
            "port",
            "protocol",
            "driverName",
            "timeOut",
        ]);

        const newDevice = await DeviceModel.insertAsync(newData);
        await DeviceModel.loadDatabaseAsync();

        return {
            EM: "Add Device Success",
            EC: 0,
            DT: newDevice,
        };
    } catch (error) {
        return {
            EM: "Error from server",
            EC: -2,
            DT: "",
        };
    }
};

const updateDevice = async (rawData) => {
    try {
        const { id } = rawData;
        if (!id) {
            return {
                EM: `Can't find device`,
                EC: 1,
                DT: "",
            };
        }

        // Lọc trường hợp lệ
        const updateData = filterValidFields(rawData, [
            "name",
            "serialPort",
            "ipAddress",
            "port",
            "protocol",
            "driverName",
            "timeOut",
        ]);

        if (Object.keys(updateData).length === 0) {
            return {
                EM: "No valid fields to update",
                EC: -1,
                DT: "",
            };
        }

        const device = await DeviceModel.updateAsync(
            { _id: id },
            { $set: updateData },
            { returnUpdatedDocs: true }
        );

        await DeviceModel.loadDatabaseAsync();

        return {
            EM: "Update Device Successfully",
            EC: 0,
            DT: device,
        };
    } catch (error) {
        return {
            EM: "Error from server",
            EC: -2,
            DT: "",
        };
    }
};


const deleteDevice = async (rawData) => {
    try {
        console.log('check rawData Delete: ', rawData)
        const { ids } = rawData
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return {
                EM: `No device selected`,
                EC: 1,
                DT: ''
            }
        }

        // Xoá nhiều thiết bị theo danh sách _id
        await DeviceModel.removeAsync(
            { _id: { $in: ids } },   // tìm tất cả _id nằm trong mảng ids
            { multi: true }          // cho phép xoá nhiều record
        )
        await TagnameModel.removeAsync({
            $where: function () {
                return this.device && ids.includes(this.device._id);
            }
        }, { multi: true });

        //  reload
        await DeviceModel.loadDatabaseAsync();
        await TagnameModel.loadDatabaseAsync();

        return {
            EM: 'Delete devices successfully',
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

module.exports = { createDeviceController, getAllDevice, updateDevice, deleteDevice }
