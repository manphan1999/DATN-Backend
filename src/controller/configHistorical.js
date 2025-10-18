import { ConfigHistorical } from '../configs/connectDB'

const getAllConfig = async () => {
    try {
        const configList = await ConfigHistorical.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách cấu hình Histotical',
            EC: 0,
            DT: configList
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createConfig = async (rawData) => {
    // try {
    //     const { name } = rawData;

    //     // Check trùng tên
    //     const checkName = await DeviceModel.findOneAsync({ name });
    //     if (checkName) {
    //         return {
    //             EM: "Name Device Axis",
    //             EC: -1,
    //             DT: "",
    //         };
    //     }

    //     // Lọc trường hợp lệ
    //     const newData = filterValidFields(rawData, [
    //         "name",
    //         "serialPort",
    //         "ipAddress",
    //         "port",
    //         "protocol",
    //         "driverName",
    //         "timeOut",
    //     ]);

    //     const newDevice = await DeviceModel.insertAsync(newData);
    //     await DeviceModel.loadDatabaseAsync();

    //     return {
    //         EM: "Add Device Success",
    //         EC: 0,
    //         DT: newDevice,
    //     };
    // } catch (error) {
    //     return {
    //         EM: "Lỗi Server!!!",
    //         EC: -2,
    //         DT: "",
    //     };
    // }
};

const updateConfig = async (rawData) => {
    try {
        // console.log('check data upadate config: ', rawData)
        const { name, id, cycle, type } = rawData
        if (!id) {
            return {
                EM: `Không tìm thấy cấu hình`,
                EC: 1,
                DT: ''
            }
        }

        const edit = await ConfigHistorical.updateAsync(
            {
                _id: id,
            },
            {
                $set: {
                    cycle: cycle ? Number(cycle) : null,
                    name,
                    type,
                },
            },
            { returnUpdatedDocs: true }
        )

        await ConfigHistorical.loadDatabaseAsync()
        return {
            EM: 'Cập nhật cấu hình thành công',
            EC: 0,
            DT: edit
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }

}


module.exports = { getAllConfig, updateConfig }