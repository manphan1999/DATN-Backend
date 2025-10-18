import { DeviceModel, TagnameModel, TagHistorical } from '../configs/connectDB'
import deviceHandler from '../protocol/modbus/devicesHandlers'

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

const createDeviceController = async (rawData) => {
    try {
        console.log('Tạo mới device: ', rawData);
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
            "name",
            "serialPort",
            "ipAddress",
            "port",
            "protocol",
            "driverName",
            "timeOut",
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

        const oldDevice = await DeviceModel.findOneAsync({ _id: id });

        const updateData = filterValidFields(rawData, [
            "name", "serialPort", "ipAddress", "port",
            "protocol", "driverName", "timeOut"
        ]);

        const device = await DeviceModel.updateAsync(
            { _id: id },
            { $set: updateData },
            { returnUpdatedDocs: true }
        );

        await DeviceModel.loadDatabaseAsync();

        // Khi có bất kỳ thay đổi cấu hình nào → gọi reconnect
        await deviceHandler.reconnectDevice(id);

        return {
            EM: "Cập nhật thiết bị thành công",
            EC: 0,
            DT: device,
        };
    } catch (error) {
        return { EM: "Lỗi Server!!!", EC: -2, DT: "" };
    }
};

const deleteDevice = async (rawData) => {
    try {
        //console.log('check rawData Delete: ', rawData)
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

        //  reload
        await DeviceModel.loadDatabaseAsync();
        await TagnameModel.loadDatabaseAsync();
        await TagHistorical.loadDatabaseAsync();

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

}

module.exports = { createDeviceController, getAllDevice, updateDevice, deleteDevice }
