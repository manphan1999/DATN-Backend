import express from "express";
import apiController from "../controller/apiControllers"

const router = express.Router();

const initApiRoutes = (app) => {
    // path, handle
    // rest api
    // GET -R, POST -C, PUT -U, DELETE -D

    router.get("/protocol/get-protocol", apiController.handleGetAllProtocol);
    /* API Devices */
    router.get("/devices/get-device", apiController.handleGetAllDevice);
    router.post('/devices/create-device', apiController.handleCreateNewDevice);
    router.put("/devices/update-device", apiController.handleUpdateDevice);
    router.delete("/devices/delete-device", apiController.handleDeleteDevice);
    /* API Coms */
    router.get("/coms/get-coms", apiController.handleGetAllComs);
    router.put("/coms/update-com", apiController.handleUpdateCom);
    /* API Channels */
    router.get("/channels/get-channels", apiController.handleGetAllChannels);
    router.post('/channels/create-channel', apiController.handleCreateNewTag);
    router.put("/channels/update-channel", apiController.handleUpdateChannel);
    router.delete("/channels/delete-channel", apiController.handleDeleteChannel);
    router.get("/channels/get-channels/data-format", apiController.handleGetDataFormat);
    router.get("/channels/get-channels/data-type", apiController.handleGetDataType);
    router.get("/channels/get-channels/function-code", apiController.handleGetFunctionCodeModbus);
    /* API Historical */
    router.get("/historical/get-historical", apiController.handleGetAllHistorical);
    router.post('/historical/create-historical', apiController.handleCreateTagHistorical);
    router.delete("/historical/delete-historical", apiController.handleDeleteHistorical);
    router.get("/historical/get-config", apiController.handleGetAllConfig);
    router.put("/historical/update-config", apiController.handleUpdateConfig);



    return app.use("/api/v1/", router);
}

export default initApiRoutes;