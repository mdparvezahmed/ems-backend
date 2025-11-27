const mongoose = require('mongoose');


const departmentSchema = new mongoose.Schema({
    dep_name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Department = mongoose.model("Department", departmentSchema);
module.exports = Department;