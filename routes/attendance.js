const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMidleware');
const role = require('../middlewares/roleMidleware');
const { generateToken, verifyAndMark, getAttendance } = require('../controllers/attendanceController');

// Admin: generate today's QR token (or return existing)
router.post('/generate', verifyToken, role('admin'), generateToken);

// Employee: verify scanned QR and mark attendance
router.post('/scan', verifyToken, verifyAndMark);

// Get attendance records - Admin can see all, Employee can see their own
router.get('/', verifyToken, getAttendance);

module.exports = router;
