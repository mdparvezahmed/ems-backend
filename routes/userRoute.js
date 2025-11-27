const express = require('express');
const verifyToken = require("../middlewares/authMidleware.js");
const requiredRoles = require("../middlewares/roleMidleware.js");

const router = express.Router();

//only admin

router.get("/admin", verifyToken, requiredRoles("admin"), (req, res) => {
    res.json({
        message: "admin sections"
    });
});

//manager and admin
router.get("/manager", verifyToken, requiredRoles("admin", "manager"), (req, res) => {
    res.json({
        message: "manager sections"
    });
});

//all user
router.get("/user", verifyToken, requiredRoles("admin", "manager", "user"), (req, res) => {
    res.json({
        message: "all user "
    });
});



module.exports = router;