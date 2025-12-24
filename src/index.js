require("dotenv").config();
import express from "express";
import initApiRoutes from "./routes/api.js";
import initWebRoutes from "./routes/web.js";
import bodyParser from "body-parser";
import configCors from "./configs/cors.js";
import helmet from "helmet";
import { Server } from "socket.io";
import connect from "./socket/socketHandler.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import configViewEngine from "./configs/viewEngine.js";

const app = express();
const PORT = process.env.PORT || 8000;

configViewEngine(app);

const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

app.use(helmet());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
configCors(app);
//app.use(authMiddleware.authentication);

// SOCKET
global._io = io;
global._io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    connect(socket);
});

// ROUTES
initWebRoutes(app);
initApiRoutes(app);

app.use((err, req, res, next) => {
    return res.status(err.status || 500).json(err);
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
