const express = require('express');
const verifyToken = require("../middlewares/authMidleware.js");
const { addLeave, getLeaves, updateLeaveStatus } = require('../controllers/leaveControler.js');
const roleMiddleware = require('../middlewares/roleMidleware');



const router = express.Router();


router.post("/add", verifyToken, addLeave );
router.get("/", verifyToken, getLeaves );
// Admin can update status
router.put('/:id/status', verifyToken, roleMiddleware('admin'), updateLeaveStatus);

module.exports = router;