const express = require('express');
const {register, login, verify, changePassword, getAllUsers } = require('../controllers/authcontroler.js');
const authMiddleware = require('../middlewares/authMidleware.js');

const router = express.Router();


router.post("/register", register);
router.post("/login",login);
router.get("/verify",authMiddleware, verify);
router.put("/change-password", authMiddleware, changePassword);
router.get("/users", authMiddleware, getAllUsers);


module.exports = router;