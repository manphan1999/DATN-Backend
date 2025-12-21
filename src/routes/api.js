import express from "express";
import apiController from "../controller/apiControllers";
import authMiddleware from "../middlewares/authentication";

const router = express.Router();

const initApiRoutes = (app) => {
    // path, handle
    // rest api
    // GET -R, POST -C, PUT -U, DELETE -D

    router.get("/protocol/get-protocol", apiController.handleGetAllProtocol);
    /* API Devices */
    router.get("/device", authMiddleware.authentication, apiController.handleGetAllDevice);
    router.get("/devices/get-device", apiController.handleGetAllDevice);
    router.post('/devices/create-device', apiController.handleCreateNewDevice);
    router.put("/devices/update-device", apiController.handleUpdateDevice);
    router.delete("/devices/delete-device", apiController.handleDeleteDevice);
    /* API Coms */
    router.get("/coms/get-coms", apiController.handleGetAllComs);
    router.put("/coms/update-com", apiController.handleUpdateCom);
    /* API Channels */
    router.get("/tagname", authMiddleware.authentication, apiController.handleGetAllChannels);
    router.get("/channels/get-channels", apiController.handleGetAllChannels);
    router.post('/channels/create-channel', apiController.handleCreateNewTag);
    router.put("/channels/update-channel", apiController.handleUpdateChannel);
    router.delete("/channels/delete-channel", apiController.handleDeleteChannel);
    router.get("/channels/get-channels/data-format", apiController.handleGetDataFormat);
    router.get("/channels/get-channels/data-type", apiController.handleGetDataType);
    router.get("/channels/get-channels/function-code", apiController.handleGetFunctionCode);
    /* API Historical */
    router.get("/historical/get-taghistorical", apiController.handleGetAllHistorical);
    router.post('/historical/create-taghistorical', apiController.handleCreateTagHistorical);
    router.delete("/historical/delete-taghistorical", apiController.handleDeleteHistorical);
    router.get("/historical/get-config", apiController.handleGetAllConfig);
    router.put("/historical/update-config", apiController.handleUpdateConfig);
    /* API Historical Value */
    router.get("/historical/get-listdata", apiController.handleGetHistoricalValue);
    router.post("/historical/get-listdata-time", apiController.handleSearchHistorical);
    router.delete("/historical/delete-tagvalue", apiController.handleDeleteValueHistorical);
    /* API Alarm */
    router.get("/alarm/get-tagalram", apiController.handleGetAllTagAlarm);
    router.post("/alarm/create-tagalram", apiController.handleCreateTagAlarm);
    router.put("/alarm/update-tagalram", apiController.handleUpdateTagAlarm);
    router.delete("/alarm/delete-tagalarm", apiController.handleDeleteTagAlarm);
    router.get("/alarm/get-app", apiController.handleGetAllApp);
    router.post("/alarm/create-app", apiController.handleCreateApp);
    router.put("/alarm/update-app", apiController.handleUpdateApp);
    /* API Historical Value */
    router.get("/alarm/get-listdata", apiController.handleGetAllAlarmValue);
    router.post("/alarm/get-listdata-time", apiController.handleSearchAlarmValue);
    router.delete("/alarm/delete-tagvalue", apiController.handleDeleteValueAlarm);
    /* API FTP */
    router.get("/configuration", authMiddleware.authentication, apiController.handleGetAllFTPServer);
    router.get("/ftp/get-ftpserver", apiController.handleGetAllFTPServer);
    router.post('/ftp/create-ftpserver', apiController.handleCreateFTPServer);
    router.put("/ftp/update-ftpserver", apiController.handleUpdateFTPServer);
    router.delete("/ftp/delete-ftpserver", apiController.handleDeleteFTPServer);
    /* API MYSQL */
    router.post('/mysql/testconnect-mysqlserver', apiController.handleConnectMySQLServer);
    router.post('/mysql/createtable-mysqlserver', apiController.handleCreateTableMySQL);
    // router.post('/mysql/create-mysqlserver', apiController.handleCreateMySQLServer);
    router.get("/mysql/get-mysqlserver", apiController.handleGetAllMySQLServer);
    router.post('/mysql/create-mysqlserver', apiController.handleCreateMySQLServer);
    router.put("/mysql/update-mysqlserver", apiController.handleUpdateMySQLServer);
    router.delete("/mysql/delete-mysqlserver", apiController.handleDeleteMySQLServer);

    /* API SQL */
    router.post('/sql/testconnect-sqlserver', apiController.handleConnectSQLServer);
    router.post('/sql/createtable-sqlserver', apiController.handleCreateTableSQL);
    router.get("/sql/get-sqlserver", apiController.handleGetAllSQLServer);
    router.post('/sql/create-sqlserver', apiController.handleCreateSQLServer);
    router.put("/sql/update-sqlserver", apiController.handleUpdateSQLServer);
    router.delete("/sql/delete-sqlserver", apiController.handleDeleteSQLServer);

    /* API Publish */
    router.get("/servers", authMiddleware.authentication, apiController.handleGetAllPublish);
    router.get("/publish/get-mqtt", apiController.handleGetAllPublish);
    router.post('/publish/create-mqtt', apiController.handleCreatePublish);
    router.put("/publish/update-mqtt", apiController.handleUpdatePublish);
    router.delete("/publish/delete-mqtt", apiController.handleDeletePublish);

    /* API RTU Server */
    router.get("/server/get-rtu", apiController.handleGetAllRTUServer);
    router.post('/server/create-rtu', apiController.handleCreateRTUServer);
    router.put("/server/update-rtu", apiController.handleUpdateRTUServer);
    router.delete("/server/delete-rtu", apiController.handleDeleteRTUServer);

    /* API TCP Server */
    router.get("/server/get-tcp", apiController.handleGetAllTCPServer);
    router.post('/server/create-tcp', apiController.handleCreateTCPServer);
    router.put("/server/update-tcp", apiController.handleUpdateTCPServer);
    router.delete("/server/delete-tcp", apiController.handleDeleteTCPServer);

    /* API User */
    router.get("/user", authMiddleware.authentication, apiController.handleGetAllUser);
    router.get("/user/get-user", apiController.handleGetAllUser);
    router.post('/user/create-user', apiController.handleCreateUser);
    router.put("/user/update-user", apiController.handleUpdateUser);
    router.delete("/user/delete-user", apiController.handleDeleteUser);
    router.post('/login', apiController.handleLogin);

    /* API Setting */
    router.get("/setting", authMiddleware.authentication, apiController.handleGetAllNetwork);
    router.get("/setting/get-network", apiController.handleGetAllNetwork);
    router.put("/setting/update-network", apiController.handleUpdateNetwork);
    router.get("/setting/reboot", apiController.handleReboot);
    router.get("/setting/get-header", apiController.handleGetContentHeader);
    router.post('/setting/create-header', apiController.handleCreateContentHeader);
    router.put("/setting/update-header", apiController.handleUpdateContentHeader);

    return app.use("/api/v1/", router);
}

export default initApiRoutes;