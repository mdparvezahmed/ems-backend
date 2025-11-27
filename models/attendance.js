const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: String },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: Date, default: Date.now },
  method: { type: String, default: 'qr' },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
