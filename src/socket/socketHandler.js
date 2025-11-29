import GatewayHandler from '../gateway/gatewayHandler';
import { dropMySQLTabledele } from '../ultils/mysqlHandler'
import { dropSQLTable } from '../ultils/sqlHandler'

let gateway;

// Khởi tạo ứng dụng
(async () => {
    try {
        gateway = new GatewayHandler();
        await gateway.connectAll();
        await gateway.readData();
        //await gateway.connectModbusServer('TCP');
        await gateway.writeDataToModbusServer();
        await gateway.saveHistoricalToDb();
        await gateway.saveAlarmToDb();
        await gateway.saveToFileAndSendFtp();
        await gateway.sentMySQL();
        await gateway.sentSQL();
    } catch (error) { }
})();

const connect = (socket) => {
    socket.on("disconnect", async () => {
        console.log("Client disconnected:", socket.id);
    });

    socket.on("CLIENT WRITE TAG", async (data) => {
        try {
            const result = await gateway.writeDataModbus(data);
            socket.emit("SERVER WRITE RESULT", result);
        } catch (err) {
        }
    });

    socket.on("UPDATE COM", async () => {
        await gateway.connectCom();
    });

    socket.on("CHANGE DEVICE", async () => {
        await gateway.connectCom();
        await gateway.connectAll();
        await gateway.saveHistoricalToDb();
    });

    socket.on("CHANGE TAGNAME", async () => {
        await gateway.connectAll();
    });

    socket.on("CHANGE HISTORICAL", async () => {
        await gateway.saveHistoricalToDb();
    });

    socket.on("CHANGE ALARM", async () => {
        await gateway.saveAlarmToDb();
    });

    socket.on("DELETE ALARM", async () => {
        await gateway.stopSaveAlarmToDb();
    });

    socket.on("CHANGE FTP SERVER", async (data) => {
        await gateway.updateSendFtp(data._id);
    });

    socket.on("SYNC FTP SERVER", async () => {
        const result = await gateway.updateAllSendFtp();
        socket.emit("SERVER SYNC RESULT", result);
    });

    socket.on("DELETE FTP SERVER", async (data) => {
        for (let dt of data) {
            await gateway.stopSendFtp(dt.id)
        }
    });

    socket.on("CREATE TABLE MYSQL", async () => {
        await gateway.sentMySQL();
    });

    socket.on("CREATE TABLE SQL", async () => {
        await gateway.sentSQL();
    });

    socket.on("DELETE MYSQL SERVER", async (data) => {
        const serverIds = data.map(d => d.id);
        await gateway.deleteMySQLConfigs(serverIds);
        // await gateway.dropMySQLTabledele(serverIds);
    });

    socket.on("DELETE SQL SERVER", async (data) => {
        const serverIds = data.map(d => d.id);
        await gateway.deleteSQLConfigs(serverIds);
        //  await gateway.dropSQLTable(serverIds);
    });

    socket.on('START TCP SERVER', async (callback) => {
        try {
            await gateway.connectModbusServer('TCP');
            await gateway.writeDataToModbusServer();
            callback({ success: true, message: 'Start thành công' });
        } catch (error) {
            callback({ success: false, message: 'Start thất bại', error });
        }
    });

    socket.on('STOP TCP SERVER', (callback) => {
        try {
            gateway.disconnectModbusServer('TCP');
            callback({ success: true, message: 'Stop thành công' });
        } catch (error) {
            callback({ success: false, message: 'Stop thất bại', error });
        }
    });

    socket.on('RELOAD TCP SERVER', async (callback) => {
        try {
            gateway.disconnectModbusServer('TCP');
            await gateway.connectModbusServer('TCP');
            await gateway.writeDataToModbusServer();
            callback({ success: true, message: 'Reload thành công' });
        } catch (error) {
            callback({ success: false, message: 'Reload thất bại', error });
        }
    });

    socket.on('START RTU SERVER', async (callback) => {
        try {
            await gateway.connectModbusServer('RTU');
            await gateway.writeDataToModbusServer();
            callback({ success: true, message: 'Start thành công' });
        } catch (error) {
            callback({ success: false, message: 'Start thất bại', error });
        }
    });

    socket.on('STOP RTU SERVER', (callback) => {
        try {
            gateway.disconnectModbusServer('RTU');
            callback({ success: true, message: 'Stop thành công' });
        } catch (error) {
            callback({ success: false, message: 'Stop thất bại', error });
        }
    });

    socket.on('RELOAD RTU SERVER', async (callback) => {
        try {
            gateway.disconnectModbusServer('RTU');
            await gateway.connectModbusServer('RTU');
            await gateway.writeDataToModbusServer();
            callback({ success: true, message: 'Reload thành công' });
        } catch (error) {
            callback({ success: false, message: 'Reload thất bại', error });
        }
    });

};

export default connect;