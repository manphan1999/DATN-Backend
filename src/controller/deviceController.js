import { DeviceModel, TagnameModel, TagHistorical, TagAlarmModel } from '../configs/connectDB';
import HistoricalValue from '../controller/historicalValueController';
import TagAlarmValue from '../controller/alarmValueController';

const getAllDevice = async () => {
    try {
        const deviceList = await DeviceModel.findAsync({})
        return {
            EM: 'Danh sách thiết bị đã kết nối',
            EC: 0,
            DT: deviceList
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const filterValidFields = (data, allowedFields) => {
    const result = {}
    allowedFields.forEach((field) => {
        if (data[field] !== undefined && data[field] !== null && data[field] !== "") {
            // ép kiểu number cho port và timeOut
            if ((field === "port" || field === "timeOut")) {
                result[field] = Number(data[field])
            } else {
                result[field] = data[field]
            }
        }
    })
    return result;
}

const createDeviceController = async (rawData) => {
    try {
        const { name } = rawData;
        // Kiểm tra trùng tên
        const checkName = await DeviceModel.findAsync({ name });
        if (checkName && checkName.length > 0) {
            return {
                EM: `Tên thiết bị đã tồn tại: ${checkName.map(e => e.name).join(', ')}`,
                EC: -1,
                DT: "",
            };
        }

        // Lọc trường hợp lệ
        const newData = filterValidFields(rawData, [
            "name", "serialPort", "ipAddress", "port", "protocol",
            "driverName", "username", "password", "timeOut",
        ]);

        // Thêm mới vào database
        const newDevice = await DeviceModel.insertAsync(newData);
        await DeviceModel.loadDatabaseAsync();

        return {
            EM: "Thêm thiết bị thành công",
            EC: 0,
            DT: newDevice,
        };
    } catch (error) {
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const updateDevice = async (rawData) => {
    try {
        const { id } = rawData;
        if (!id) {
            return { EM: `Không tìm thấy thiết bị`, EC: 1, DT: "" };
        }

        // Lọc ra các trường hợp hợp lệ
        let updateData = filterValidFields(rawData, [
            "name", "serialPort", "ipAddress", "port",
            "protocol", "username", "password", "driverName", "timeOut"
        ]);

        if (updateData.driverName === "Modbus RTU Client") {
            await DeviceModel.updateAsync(
                { _id: id },
                { $unset: { ipAddress: "", port: "", username: "", password: "" } }
            );
            delete updateData.ipAddress;
            delete updateData.port;
            delete updateData.username;
            delete updateData.password;
        }

        else if (updateData.driverName === "Modbus TCP Client" || updateData.driverName === "S7-1200") {
            await DeviceModel.updateAsync(
                { _id: id },
                { $unset: { serialPort: "", username: "", password: "" } }
            );
            delete updateData.serialPort;
            delete updateData.username;
            delete updateData.password;
        }

        else if (updateData.driverName === "MQTT Client") {
            await DeviceModel.updateAsync(
                { _id: id },
                { $unset: { serialPort: "" } }
            );
            delete updateData.serialPort;
        }

        // Tiếp tục cập nhật phần còn lại
        const device = await DeviceModel.updateAsync(
            { _id: id },
            { $set: updateData },
            { returnUpdatedDocs: true }
        );

        await DeviceModel.loadDatabaseAsync();

        // Gọi reconnect
        //await deviceHandler.reconnectDevice(id);

        return {
            EM: "Cập nhật thiết bị thành công",
            EC: 0,
            DT: device,
        };
    } catch (error) {
        console.error(error);
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
    }
};

const deleteDevice = async (rawData) => {
    try {
        console.log('check Device Delete: ', rawData)
        const { ids } = rawData
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return {
                EM: `Không có thiết bị nào được chọn`,
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
        await TagHistorical.removeAsync({
            $where: function () {
                return this.device && ids.includes(this.device._id);
            }
        }, { multi: true });
        await TagAlarmModel.removeAsync(
            { deviceId: { $in: ids } },
            { multi: true }
        );

        await HistoricalValue.deleteValueHistoricalDeviceId(rawData);
        await TagAlarmValue.deleteValueAlarmDeviceId(rawData);

        //  reload
        await DeviceModel.loadDatabaseAsync();
        await TagnameModel.loadDatabaseAsync();
        await TagHistorical.loadDatabaseAsync();
        await TagAlarmModel.loadDatabaseAsync();

        return {
            EM: 'Xóa thiết bị thành công',
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

};


module.exports = { createDeviceController, getAllDevice, updateDevice, deleteDevice }
