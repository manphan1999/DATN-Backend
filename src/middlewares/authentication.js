require("dotenv").config();
import jwt from "jsonwebtoken";
const createJWT = () => {
    let payload = { foo: 'bar' };
    let key = process.env.JWT_SECRET;
    let token = null;
    try {
        token = jwt.sign(payload, key);
        console.log(token);
    } catch (error) {
        console.log(error);
    }
    return token;
}

const verifyToken = (token) => {
    let key = process.env.JWT_SECRET;
    let data = null;
    try {
        let decoded = jwt.verify(token, key);
        data = decoded;
    } catch (error) {
        console.log(error);
    }
    return data;
}

// Middleware kiểm tra token
const authMiddleware = (req, res, next) => {
    const token = req.cookies.access_token; // đọc từ cookie

    if (!token) {
        return res.status(401).json({ EM: 'Bạn cần đăng nhập', EC: 1 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // lưu thông tin user vào req
        next();
    } catch (error) {
        return res.status(401).json({ EM: 'Token không hợp lệ hoặc đã hết hạn', EC: 1 });
    }
};

module.exports = { createJWT, verifyToken, authMiddleware };