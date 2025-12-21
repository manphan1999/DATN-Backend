import jwt from "jsonwebtoken";

const whitelist = [
    '/historical' // API không cần token
];

const authentication = (req, res, next) => {
    try {
        const url = req.originalUrl.split("?")[0];
        const cleanUrl = url.replace(process.env.BASE_URL || "", "");

        if (whitelist.includes(cleanUrl)) {
            return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "Missing Authorization header!" });

        const accessToken = authHeader.split(" ")[1];
        if (!accessToken) return res.status(401).json({ message: "Token format invalid! Must be: Bearer <token>" });

        jwt.verify(
            accessToken,
            process.env.JWT_ACCESS_TOKEN_PRIVATE_KEY,
            (error, decoded) => {
                if (error) {
                    if (error.name === "TokenExpiredError") {
                        return res.status(401).json({ message: "Token expired!" });
                    }
                    return res.status(403).json({ message: error.message });
                }

                req.user = decoded.user;
                return next();
            }
        );
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export default {
    authentication
};
