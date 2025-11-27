const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const userModel = require("../models/usermodel.js");

const verifyToken = async (req, res, next) => {
    try {
        console.log('Auth middleware called');
        console.log('Authorization header:', req.headers.authorization);
        
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                error: "Access denied. No authorization header provided."
            });
        }
        
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Access denied. No token provided."
            });
        }
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: "Access denied. token not valid."
            });
        }
        const user = await userModel.findById({ _id: decoded.id }).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Access denied. user not found."
            });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: "Invalid token."
        });
    }
}


module.exports = verifyToken ;