const Leave = require('../models/leave');
const Employee = require('../models/Employee');

const addLeave = async (req, res) => {
    try {
        let { userId, leaveType, startDate, endDate, reason } = req.body;
        // prefer authenticated user id
        if (!userId && req.user) userId = req.user._id;

        // Basic validation
        if (!userId || !leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const newLeave = new Leave({
            userId,
            leaveType,
            startDate,
            endDate,
            reason
        });

        await newLeave.save();
        return res.status(201).json({ success: true, message: "Leave added successfully.", leave: newLeave });
    } catch (error) {
        console.error("Error adding leave:", error);
        return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
    }
};

// Get all leaves (optionally filter by userId using query ?userId=...)
const getLeaves = async (req, res) => {
    try {
        const { userId } = req.query;
        const filter = {};
        // Validate userId to avoid invalid ObjectId causing server errors
        if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) filter.userId = userId;

        // fetch leaves and populate the basic user info
        const leaves = await Leave.find(filter).populate('userId', '-password -__v').sort({ createdAt: -1 }).lean();

        // For each leave, attach employee metadata if available (employeeId, department)
        const leavesWithMeta = await Promise.all(leaves.map(async (lv) => {
            try {
                const emp = await Employee.findOne({ userId: lv.userId?._id }).populate('department');
                if (emp) {
                    lv.employeeMeta = {
                        employeeId: emp.employeeId,
                        department: emp.department ? (emp.department.dep_name || emp.department.name) : null,
                        employeeName: emp.name
                    };
                } else {
                    // fallback to populated user info
                    lv.employeeMeta = {
                        employeeId: lv.userId?._id,
                        department: null,
                        employeeName: lv.userId?.name || null
                    };
                }
            } catch (e) {
                // if anything fails, still return the leave with minimal info
                lv.employeeMeta = {
                    employeeId: lv.userId?._id,
                    department: null,
                    employeeName: lv.userId?.name || null
                };
            }
            return lv;
        }));

        return res.status(200).json({ success: true, leaves: leavesWithMeta });
    } catch (error) {
        console.error('Error fetching leaves:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
    }
};

// Update leave status (admin)
const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave not found.' });
        }

        leave.status = status;
        await leave.save();

        return res.status(200).json({ success: true, message: 'Leave status updated.', leave });
    } catch (error) {
        console.error('Error updating leave status:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
    }
};

module.exports = { addLeave, getLeaves, updateLeaveStatus };