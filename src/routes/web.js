import express from "express";
import homeController from "../controller/homeController";

const router = express.Router();

// Function define all route using this project
const initWebRoutes = (app) => {
    router.get("/", homeController.handleHelloWord);
    return app.use("/", router);
}


export default initWebRoutes;