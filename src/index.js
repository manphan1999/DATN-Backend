require("dotenv").config();
import express from "express";
import initApiRoutes from "./routes/api";
import initWebRoutes from "./routes/web";
import bodyParser from "body-parser";
import configCors from './configs/cors'
import { Server } from 'socket.io'
import connect from './socket/socketHandler'
import cookieParser from 'cookie-parser';
import { createServer } from 'http'
import configViewEngine from './configs/viewEngine';
import { createJWT, verifyToken } from '../src/middlewares/authentication'

const app = express();
const PORT = process.env.PORT || 8000;

configViewEngine(app);

const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
    },
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

global._io = io
global._io.on('connection', connect)

// Cấu hình CORS
configCors(app);

initWebRoutes(app);
// Khởi tạo routes
initApiRoutes(app);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
