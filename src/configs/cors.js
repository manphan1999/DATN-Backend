require("dotenv").config();
import cors from "cors";

const configCors = (app) => {
    const corsOptions = {
        origin: process.env.REACT_URL || "http://localhost:3000", // URL frontend
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true, // Cho phép cookie/session nếu có
    };

    app.use(cors(corsOptions));

    // Xử lý preflight cho mọi route
    app.options("*", cors(corsOptions));
};

export default configCors;
