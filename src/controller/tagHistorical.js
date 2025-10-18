import { TagHistorical } from '../configs/connectDB'

const getHistorical = async () => {
    try {
        const listTagHistorical = await TagHistorical.findAsync({})
        // console.log('check comList: ', comList)
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
        //console.log('check rawData: ', rawData);
        // Lấy danh sách tên
        const names = rawData.map(item => item.name);
        // Kiểm tra có trùng tên trong DB không
        const existing = await TagHistorical.findAsync({ name: { $in: names } });
        if (existing && existing.length > 0) {
            return {
                EM: `Tag đã tồn tại: ${existing.map(e => e.name).join(', ')}`,
                EC: -1,
                DT: "",
            };
        }
        // Thêm mới tất cả
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
        //console.log('check rawData Delete: ', rawData)
        // Lấy danh sách ids từ dữ liệu gửi lên
        const { ids } = rawData;

        // Kiểm tra input hợp lệ
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return {
                EM: 'Không có ID nào được chọn để xóa',
                EC: 1,
                DT: ''
            };
        }

        // Xóa tất cả bản ghi có _id nằm trong mảng ids
        await TagHistorical.removeAsync(
            { _id: { $in: ids } },   // tìm tất cả _id nằm trong mảng ids
            { multi: true }          // cho phép xoá nhiều record
        );

        // Reload lại database
        await TagHistorical.loadDatabaseAsync();

        return {
            EM: 'Xóa Tag Historical thành công',
            EC: 0,
            DT: ''
        };
    } catch (error) {
        return {
            EM: 'Lỗi ở ser Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

module.exports = { getHistorical, updateHistorical, createHistorical, deleteHistorical }