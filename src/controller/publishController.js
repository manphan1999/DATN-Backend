import { PublishModel, PublishConfigModel } from '../configs/connectDB'

const getAllPublish = async () => {
    try {
        const listTagPublish = await PublishModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách thẻ Publish là:',
            EC: 0,
            DT: listTagPublish
        }
    } catch (error) {
        return {
            EM: 'Lỗi Server!!!',
            EC: -2,
            DT: ''
        }
    }
}

const getAllConfigPublish = async () => {
    try {
        const listConfigPublish = await PublishConfigModel.findAsync({})
        // console.log('check comList: ', comList)
        return {
            EM: 'Danh sách cấu hình Piblish là:',
            EC: 0,
            DT: listConfigPublish
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

const createConfigPublish = async (rawData) => {
    try {
        //  console.log('check createPublish: ', rawData)
        const existing = await PublishConfigModel.findAsync({ name: rawData.name });
        if (existing && existing.length > 0) {
            return {
                EM: `Thiết bị đã tồn tại: ${existing[0].name}`,
                EC: -1,
                DT: "",
            };
        }
        await PublishConfigModel.insertAsync(rawData);
        await PublishConfigModel.loadDatabaseAsync();
        return {
            EM: "Thêm mới thiết bị thành công",
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
        // console.log("check updatePublish: ", rawData);
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

const updateConfigPublish = async (rawData) => {
    try {
        const { id, ...updateFields } = rawData;
        if (!id) {
            return {
                EM: "Không tìm thấy ID để cập nhật",
                EC: 1,
                DT: "",
            };
        }

        await PublishConfigModel.updateAsync(
            { _id: id },
            { $set: updateFields },
            {}
        );

        await PublishConfigModel.loadDatabaseAsync();

        return {
            EM: "Cập nhật thiết bị thành công",
            EC: 0,
            DT: "",
        };

    } catch (error) {
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

const deleteConfigPublish = async (rawData) => {
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
        await PublishConfigModel.removeAsync(
            { _id: { $in: ids } },
            { multi: true }
        );
        await PublishConfigModel.loadDatabaseAsync();
        return {
            EM: 'Xóa thiết bị thành công',
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

module.exports = {
    getAllPublish, updatePublish, createPublish, deletePublish,
    getAllConfigPublish, updateConfigPublish, createConfigPublish, deleteConfigPublish
}