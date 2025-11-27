const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const QRToken = require('../models/qrToken');
const Attendance = require('../models/attendance');
const Employee = require('../models/Employee');

// Helper: today's date string YYYY-MM-DD in local timezone
const todayString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate a secure random token, save and return signed JWT for QR encoding
const generateToken = async (req, res) => {
  try {
    const date = todayString();
    const forceNew = req.query.force === 'true';
    
    // If token exists for today and not forcing regeneration, return it
    let existing = await QRToken.findOne({ date });
    if (existing && !forceNew) {
      const signed = jwt.sign({ t: existing.token, d: date }, process.env.JWT_SECRET);
      return res.status(200).json({ success: true, token: signed, date });
    }

    // Generate new token
    const raw = crypto.randomBytes(32).toString('hex');
    
    // If forcing regeneration, delete old token first
    if (forceNew && existing) {
      await QRToken.deleteOne({ date });
    }
    
    const qr = new QRToken({ token: raw, date });
    await qr.save();
    const signed = jwt.sign({ t: raw, d: date }, process.env.JWT_SECRET);
    return res.status(201).json({ success: true, token: signed, date, regenerated: forceNew });
  } catch (error) {
    console.error('Error generating QR token', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Verify scanned QR (signed JWT) and mark attendance for authenticated user
const verifyAndMark = async (req, res) => {
  try {
    const { qr } = req.body;
    if (!qr) return res.status(400).json({ success: false, message: 'No QR provided' });

    let payload;
    try {
      payload = jwt.verify(qr, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired QR' });
    }

    const { t: tokenString, d: date } = payload;
    if (!tokenString || !date) return res.status(400).json({ success: false, message: 'Invalid QR payload' });

    // Ensure token exists in DB for that date
    const tokenRecord = await QRToken.findOne({ token: tokenString, date });
    if (!tokenRecord) return res.status(400).json({ success: false, message: 'QR token not recognized' });

    const today = todayString();
    if (date !== today) return res.status(400).json({ success: false, message: 'QR is not valid for today' });

    // Prevent multiple check-ins per day
    const already = await Attendance.findOne({ userId: req.user._id, date });
    if (already) return res.status(409).json({ success: false, message: 'Attendance already recorded for today' });

    // Try to attach employeeId from Employee record
    let emp = await Employee.findOne({ userId: req.user._id });
    const attendance = new Attendance({
      userId: req.user._id,
      employeeId: emp ? emp.employeeId : undefined,
      date,
      time: new Date(),
      method: 'qr'
    });
    await attendance.save();

    return res.status(201).json({ success: true, message: 'Attendance recorded', attendance });
  } catch (error) {
    console.error('Error verifying QR', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get attendance - Admin sees all, Employee sees only their own
const getAttendance = async (req, res) => {
  try {
    const { date, userId } = req.query;
    const filter = {};
    
    // If employee (not admin), restrict to their own records
    if (req.user.role !== 'admin') {
      filter.userId = req.user._id;
    } else {
      // Admin can filter by date or userId
      if (date) filter.date = date;
      if (userId) filter.userId = userId;
    }
    
    const list = await Attendance.find(filter).populate('userId', '-password -__v').sort({ time: -1 });
    return res.status(200).json({ success: true, attendance: list });
  } catch (error) {
    console.error('Error fetching attendance', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { generateToken, verifyAndMark, getAttendance };
