import { PublishModel } from '../configs/connectDB'

const getAllPublish = async () => {
    try {
        const listPublish = await PublishModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách RTU Server',
            EC: 0,
            DT: listPublish
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const createPublish = async (rawData) => {
    try {
        //  console.log('check createPublish: ', rawData)
        const existing = await PublishModel.findAsync({ name: rawData.name });
        if (existing && existing.length > 0) {
            return {
                EM: `Tag đã tồn tại: ${existing[0].name}`,
                EC: -1,
                DT: "",
            };
        }
        await PublishModel.insertAsync(rawData);
        await PublishModel.loadDatabaseAsync();
        return {
            EM: "Thêm mới Tag thành công",
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

const updatePublish = async (rawData) => {
    try {
        //  console.log("check updatePublish: ", rawData);
        const { id, ...updateFields } = rawData;
        if (!id) {
            return {
                EM: "Không tìm thấy ID để cập nhật",
                EC: 1,
                DT: "",
            };
        }

        await PublishModel.updateAsync(
            { _id: id },
            { $set: updateFields },
            {}
        );

        await PublishModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật Tag thành công",
            EC: 0,
            DT: "",
        };

    } catch (error) {
        console.log("ERROR UPDATE >>> ", error);
        return {
            EM: "Lỗi Server!!!",
            EC: -2,
            DT: "",
        };
    }
};

const deletePublish = async (rawData) => {
    try {
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
        await PublishModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );
        await PublishModel.loadDatabaseAsync();
        return {
            EM: 'Xóa Tag thành công',
            EC: 0,
            DT: ''
        };
    } catch (error) {
        return {
            EM: 'Lỗi ở Server!!!',
            EC: -2,
            DT: ''
        };
    }
};

module.exports = { getAllPublish, updatePublish, createPublish, deletePublish }