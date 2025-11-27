const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMidleware');
const role = require('../middlewares/roleMidleware');
const { getStats } = require('../controllers/adminController');

// Admin-only stats endpoint
router.get('/stats', verifyToken, role('admin'), getStats);

module.exports = router;
