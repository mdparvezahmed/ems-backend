const mongoose = require('mongoose');

const qrTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    date: { type: String, required: true }, // YYYY-MM-DD
}, { timestamps: true });

module.exports = mongoose.model('QRToken', qrTokenSchema);
