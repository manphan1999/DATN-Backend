import fs from "fs";
import fsPromises from "fs/promises";
import { Client } from "basic-ftp";
import filePath from "../configs/fileName.js";

const writeFileTxt = async (serverFtp, dateTime, datas) => {
    try {
        const { _id, fileName, fileType } = serverFtp;

        // YYYYMMDDHHmmss
        const d = new Date(dateTime);
        const fileDateTime = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
            d.getDate()
        ).padStart(2, "0")}${String(d.getHours()).padStart(2, "0")}${String(
            d.getMinutes()
        ).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;

        const folderStorage = `${filePath.FTP_FOLDER_PATH}/${_id}`;

        // Tạo thư mục
        await fsPromises.mkdir(folderStorage, { recursive: true });

        const fileFullPath = `${folderStorage}/${fileName}_${fileDateTime}.${fileType}`;

        let contentFile = "";

        for (let key of Object.keys(datas)) {
            const item = datas[key];
            if (item.selectFTP) {
                const statusCode =
                    item.status === 4 ? "01" : item.status === 3 ? "02" : "00";

                contentFile += `${item.tagname}\t${item.value}\t${item.unit}\t${fileDateTime}\t${statusCode}\n`;
            }
        }

        await fsPromises.writeFile(fileFullPath, contentFile, "utf8");
    } catch (error) {
        console.error("writeFileTxt error:", error);
    }
};

const writeFileCsv = async (serverFtp, dateTime, datas, tagnames) => {
    try {
        const { _id, fileName, fileType } = serverFtp;

        const d = new Date(dateTime);
        const fileDate = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
            d.getDate()
        ).padStart(2, "0")}`;

        const folderStorage = `${filePath.FTP_FOLDER_PATH}/${_id}`;

        await fsPromises.mkdir(folderStorage, { recursive: true });

        const fileFullPath = `${folderStorage}/${fileName}_${fileDate}.${fileType}`;

        let contentFile = "ID,DateTime";

        tagnames.forEach((tag) => {
            if (tag.selectFTP) {
                contentFile += `,${tag.name}(${tag.unit})`;
            }
        });
        contentFile += "\n";

        datas.forEach((data, index) => {
            const t = new Date(data.ts);
            const ts = `${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()} ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}`;

            let row = `${index + 1},${ts}`;

            tagnames.forEach((tag) => {
                if (tag.selectFTP) {
                    const val = data.value[tag._id]?.value ?? "-";
                    row += `,${val}`;
                }
            });

            contentFile += row + "\n";
        });

        await fsPromises.writeFile(fileFullPath, contentFile, "utf8");
    } catch (error) { }
};

const deleteFileFtp = async (id) => {
    try {
        const dir = `${filePath.FTP_FOLDER_PATH}/${id}`;

        if (fs.existsSync(dir)) {
            await fsPromises.rm(dir, { recursive: true, force: true });
        }
    } catch (error) { }
};

const sendFtp = async (serverFtp) => {
    const client = new Client();
    client.ftp.verbose = false;

    try {
        const { _id, host, port, username, password, folderName } = serverFtp;

        await client.access({
            host,
            port,
            user: username,
            password,
        });

        const dir = `${filePath.FTP_FOLDER_PATH}/${_id}`;

        if (!fs.existsSync(dir)) return;

        const files = await fsPromises.readdir(dir);

        for (let file of files) {
            try {
                // tách timestamp trong file
                const fileNameNoExt = file.split(".")[0];
                const timestamp = fileNameNoExt.split("_").pop();

                const year = timestamp.slice(0, 4);
                const month = timestamp.slice(4, 6);
                const day = timestamp.slice(6, 8);

                const folderOnFtp = `/${folderName}/${year}/${month}/${day}`;

                await client.ensureDir(folderOnFtp);

                await client.uploadFrom(
                    `${dir}/${file}`,
                    `${folderOnFtp}/${file}`
                );

                console.log(`Uploaded OK: ${file}`);

                // XÓA FILE KHI UPLOAD THÀNH CÔNG
                await fsPromises.unlink(`${dir}/${file}`);
            } catch (err) {
                console.error(`Upload FAIL: ${file}`, err);

                // Ghi log lại để retry lần sau
                await fsPromises.appendFile(
                    `${dir}/ftp_error.log`,
                    `${new Date().toISOString()} | ${file} | ${err.message}\n`
                );
            }
        }
    } catch (error) {
        console.error("sendFtp error:", error);
    } finally {
        client.close();
    }
};

module.exports = {
    writeFileTxt,
    writeFileCsv,
    deleteFileFtp,
    sendFtp,
};
