import sql from "mssql";
import moment from "moment-timezone";

const connectToSQLServer = async (serverConfig) => {
    const { host, port, username, password, dataBase } = serverConfig;

    const config = {
        user: username,
        password: password,
        server: host,
        port: Number(port),
        database: dataBase,
        options: { encrypt: false, trustServerCertificate: true }
    };

    try {
        const pool = await sql.connect(config);
        return {
            EM: "Kết nối SQL Server thành công",
            EC: 0,
            DT: pool
        };
    } catch (e) {
        console.log('check error: ', e)
        return {
            EM: "Kết nối SQL Server thất bại",
            EC: -2,
            DT: e.message
        };
    }
};

const generateTableFromTagsSQL = async (serverConfig, tags) => {
    const { host, port, username, password, dataBase, tableName } = serverConfig;

    const config = {
        user: username,
        password: password,
        server: host,
        port: Number(port),
        database: dataBase,
        options: { encrypt: false, trustServerCertificate: true }
    };

    const pool = await sql.connect(config);

    const typeMap = {
        1: "SMALLINT",
        2: "SMALLINT",
        3: "INT",
        4: "INT",
        5: "FLOAT",
        6: "BIGINT",
        7: "BIGINT",
        8: "FLOAT"
    };

    // Kiểm tra bảng tồn tại
    const tableCheck = await pool.request().query(`
        SELECT * FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = '${tableName}'
    `);

    const isTableExists = tableCheck.recordset.length > 0;

    // Nếu bảng chưa tồn tại → tạo mới 
    if (!isTableExists) {
        let columns = `
            id INT IDENTITY(1,1) PRIMARY KEY,
            time DATETIME DEFAULT GETDATE()
        `;

        for (let tag of tags) {
            if (tag.selectSQL) {
                const colName = tag.name
                    .replace(/[^a-zA-Z0-9]/g, "_")
                    .replace(/_+/g, "_")
                    .replace(/^_+|_+$/g, "");

                const sqlType = typeMap[tag.dataFormat] || "FLOAT";

                columns += `,
                    [${colName}] ${sqlType} NULL
                `;
            }
        }

        await pool.request().query(`
            CREATE TABLE [${tableName}] (${columns})
        `);

        return {
            EM: "Đã tạo bảng mới và thêm các cột SQL Server thành công",
            EC: 0,
            DT: ""
        };
    }

    // Bảng đã tồn tại → xử lý thêm cột
    const colResult = await pool.request().query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'
    `);

    const existingColumns = colResult.recordset.map(c => c.COLUMN_NAME);

    let existedTags = [];
    let newColumns = [];

    for (let tag of tags) {
        if (!tag.selectSQL) continue;

        const colName = tag.name
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_+|_+$/g, "");

        if (existingColumns.includes(colName)) {
            existedTags.push(colName);
        } else {
            newColumns.push({ colName, type: typeMap[tag.dataFormat] || "FLOAT" });
        }
    }

    // Nếu có tag trùng → STOP, báo lỗi, không thêm cột
    if (existedTags.length > 0) {
        return {
            EM: "Các tag sau đã tồn tại trên SQL Server, vui lòng bỏ chọn:",
            EC: 1,
            DT: existedTags
        };
    }

    // Không có trùng → thêm đồng loạt các cột mới 
    for (let col of newColumns) {
        await pool.request().query(`
            ALTER TABLE [${tableName}]
            ADD [${col.colName}] ${col.type} NULL;
        `);
    }

    return {
        EM: "Đã tạo thêm các cột mới thành công",
        EC: 0,
        DT: newColumns.map(c => c.colName)
    };
};

const insertTagValuesSQL = async (serverConfig, tags) => {
    const { host, port, username, password, dataBase, tableName } = serverConfig;

    const config = {
        user: username,
        password: password,
        server: host,
        port: Number(port),
        database: dataBase,
        options: { encrypt: false, trustServerCertificate: true }
    };

    const pool = await sql.connect(config);

    let columns = "time";
    let values = [];

    const now = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
    values.push(`'${now}'`);

    for (let tag of tags) {
        if (tag.selectSQL) {
            columns += `, [${tag.tagname}]`;
            values.push(tag.value);
        }
    }

    const sqlInsert = `
        INSERT INTO [${tableName}] (${columns}) 
        VALUES (${values.join(", ")})
    `;

    try {
        await pool.request().query(sqlInsert);
        return { success: true, message: "Gửi dữ liệu thành công" };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

const deleteSQLConfig = async (serverId) => {
    try {
        const deleted = await MySQLServerModel.findByIdAndDelete(serverId);
        if (!deleted) return { success: false, message: "Không tìm thấy config" };

        return { success: true, message: "Đã xoá config SQL Server" };
    } catch (e) {
        return { success: false, message: e.message };
    }
};

const dropSQLTable = async (serverConfig) => {
    const { host, port, username, password, dataBase, tableName } = serverConfig;

    const config = {
        user: username,
        password: password,
        server: host,
        port: Number(port),
        database: dataBase,
        options: { encrypt: false, trustServerCertificate: true }
    };

    const pool = await sql.connect(config);

    try {
        await pool.request().query(`DROP TABLE IF EXISTS [${tableName}]`);
        return { success: true, message: `Đã xoá table ${tableName}` };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

module.exports = {
    connectToSQLServer,
    generateTableFromTagsSQL,
    insertTagValuesSQL,
    deleteSQLConfig,
    dropSQLTable
};
