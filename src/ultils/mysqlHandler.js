import { Sequelize } from "sequelize";
import { MySQLServerModel } from "../configs/connectDB";
import moment from 'moment-timezone';

const connectToMySQL = async (serverConfig) => {
    // console.log('check data connect: ', serverConfig)
    const { host, port, username, password, dataBase } = serverConfig;

    const sequelize = new Sequelize(dataBase, username, password, {
        host,
        port: Number(port),
        dialect: "mysql",
        logging: false,
    });

    try {
        const result = await sequelize.authenticate();
        // console.log('check result: ', result)
        return {
            EM: 'Kết nối Dabase thành công',
            EC: 0,
            DT: result
        }
    } catch (error) {
        console.log('check error: ', error)
        //return { success: false, message: error.message };
        return {
            EM: 'Kết nối Dabase thất bại',
            EC: -2,
            DT: error.message
        }
    }
};

// const generateTableFromTags = async (serverConfig, tags) => {
//     const { host, port, username, password, dataBase, tableName } = serverConfig;

//     // Map dataFormat -> MySQL Type
//     const mysqlTypeMap = {
//         1: "SMALLINT",
//         2: "SMALLINT UNSIGNED",
//         3: "INT",
//         4: "INT UNSIGNED",
//         5: "FLOAT",
//         6: "BIGINT",
//         7: "BIGINT UNSIGNED",
//         8: "DOUBLE",
//     };

//     const sequelize = new Sequelize(dataBase, username, password, {
//         host,
//         port: Number(port),
//         dialect: "mysql",
//         logging: false,
//     });

//     // Kiểm tra bảng tồn tại
//     const [rows] = await sequelize.query(`SHOW TABLES LIKE '${tableName}'`);
//     const isTableExists = rows.length > 0;

//     // Nếu chưa có => tạo bảng
//     if (!isTableExists) {
//         const createSQL = `
//             CREATE TABLE \`${tableName}\` (
//                 id INT AUTO_INCREMENT PRIMARY KEY,
//                 time DATETIME DEFAULT CURRENT_TIMESTAMP
//             )
//         `;
//         await sequelize.query(createSQL);
//     }

//     // Đọc danh sách cột tồn tại
//     const [colData] = await sequelize.query(`SHOW COLUMNS FROM \`${tableName}\``);
//     const existingColumns = colData.map(c => c.Field);

//     // Tạo thêm các cột mới
//     for (let tag of tags) {
//         const colName = tag.name; // cột = tag.name
//         const mysqlType = mysqlTypeMap[tag.dataFormat] || "FLOAT";

//         if (!existingColumns.includes(colName)) {
//             const alterSQL = `
//                 ALTER TABLE \`${tableName}\` 
//                 ADD COLUMN \`${colName}\` ${mysqlType} NULL
//             `;
//             await sequelize.query(alterSQL);
//         }
//     }
//     // await gateway.sentMySQL();
//     return {
//         EM: "Table đã được tạo/đồng bộ thành công",
//         EC: 0,
//         DT: ''
//     }
// };

const generateTableFromTags = async (serverConfig, tags) => {
    const { host, port, username, password, dataBase, tableName } = serverConfig;

    const mysqlTypeMap = {
        1: "SMALLINT",
        2: "SMALLINT UNSIGNED",
        3: "INT",
        4: "INT UNSIGNED",
        5: "FLOAT",
        6: "BIGINT",
        7: "BIGINT UNSIGNED",
        8: "DOUBLE",
    };

    const sequelize = new Sequelize(dataBase, username, password, {
        host,
        port: Number(port),
        dialect: "mysql",
        logging: false,
    });

    const [rows] = await sequelize.query(`SHOW TABLES LIKE '${tableName}'`);
    const isTableExists = rows.length > 0;

    if (!isTableExists) {
        let columnDefinitions = `
            id INT AUTO_INCREMENT PRIMARY KEY,
            time DATETIME DEFAULT CURRENT_TIMESTAMP
        `;

        for (let tag of tags) {
            if (tag.selectMySQL) {
                const colName = tag.name
                    .replace(/[^a-zA-Z0-9]/g, "_")
                    .replace(/_+/g, "_")
                    .replace(/^_+|_+$/g, "");

                const mysqlType = mysqlTypeMap[tag.dataFormat] || "FLOAT";

                columnDefinitions += `,
                    \`${colName}\` ${mysqlType} NULL
                `;
            }
        }

        await sequelize.query(`
            CREATE TABLE \`${tableName}\` (${columnDefinitions})
        `);

        return {
            EM: "Đã tạo bảng mới và thêm các cột MySQL thành công",
            EC: 0,
            DT: ""
        };
    }

    const [colData] = await sequelize.query(`SHOW COLUMNS FROM \`${tableName}\``);
    const existingColumns = colData.map(c => c.Field);

    let existedTags = [];
    let newColumns = [];

    for (let tag of tags) {
        if (!tag.selectMySQL) continue;

        const colName = tag.name
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_+|_+$/g, "");

        if (existingColumns.includes(colName)) {
            existedTags.push(colName);
        } else {
            newColumns.push({
                colName,
                type: mysqlTypeMap[tag.dataFormat] || "FLOAT"
            });
        }
    }

    if (existedTags.length > 0) {
        return {
            EM: "Các Tag sau đã tồn tại trên MySQL, vui lòng bỏ chọn:",
            EC: 1,
            DT: existedTags
        };
    }

    for (let col of newColumns) {
        await sequelize.query(`
            ALTER TABLE \`${tableName}\`
            ADD COLUMN \`${col.colName}\` ${col.type} NULL
        `);
    }

    return {
        EM: "Đã tạo thêm các cột MySQL mới thành công",
        EC: 0,
        DT: newColumns.map(c => c.colName)
    };
};

const insertTagValues = async (serverConfig, tags) => {
    const { host, port, username, password, dataBase, tableName } = serverConfig;

    const sequelize = new Sequelize(dataBase, username, password, {
        host,
        port: Number(port),
        dialect: "mysql",
        logging: false,
    });

    let columns = "time";
    let values = [];

    const now = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
    values.push(`'${now}'`); // đặt thời gian VN

    for (let tag of tags) {
        if (tag.selectMySQL) {
            columns += `, \`${tag.tagname}\``;
            values.push(tag.value);
        }
    }

    const sql = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values.join(', ')})`;

    try {
        await sequelize.query(sql);
        return { success: true, message: "Gửi dữ liệu thành công" };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const deleteMySQLConfig = async (serverId) => {
    try {
        const deleted = await MySQLServerModel.findByIdAndDelete(serverId);

        if (!deleted) {
            return { success: false, message: "Không tìm thấy cấu hình để xoá" };
        }

        return { success: true, message: "Đã xoá cấu hình MySQL & ngừng gửi dữ liệu" };
    } catch (err) {
        return { success: false, message: err.message };
    }
};

const dropMySQLTable = async (serverConfig) => {
    const { host, port, username, password, dataBase, tableName } = serverConfig;

    const sequelize = new Sequelize(dataBase, username, password, {
        host,
        port: Number(port),
        dialect: "mysql",
        logging: false,
    });

    try {
        await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        return { success: true, message: `Đã xoá table ${tableName}` };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

module.exports = {
    connectToMySQL,
    generateTableFromTags,
    insertTagValues,
    deleteMySQLConfig,
    dropMySQLTable
};
