const User = require('../models/usermodel');
const Employee = require('../models/Employee');
const Department = require('../models/department');
const Attendance = require('../models/attendance');
const Leave = require('../models/leave');

// Helper: today's date string YYYY-MM-DD in local timezone
const todayString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// GET /api/admin/stats
// Returns summary metrics for the admin dashboard
// - users: total users
// - employees: total employees
// - departments: total departments
// - monthlySalary: sum of employee salaries
// - attendanceToday: count of attendance records for today
// - leaves: { total, pending, approved, rejected }
const getStats = async (req, res) => {
  try {
    const today = todayString();

    const [
      users,
      employees,
      departments,
      attendanceToday,
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      salaryAgg
    ] = await Promise.all([
      User.countDocuments({}),
      Employee.countDocuments({}),
      Department.countDocuments({}),
      Attendance.countDocuments({ date: today }),
      Leave.countDocuments({}),
      Leave.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'approved' }),
      Leave.countDocuments({ status: 'rejected' }),
      Employee.aggregate([{ $group: { _id: null, total: { $sum: '$salary' } } }])
    ]);

    const monthlySalary = salaryAgg && salaryAgg[0] ? salaryAgg[0].total : 0;

    return res.status(200).json({
      success: true,
      stats: {
        users,
        employees,
        departments,
        monthlySalary,
        attendanceToday,
        leaves: {
          total: totalLeaves,
          pending: pendingLeaves,
          approved: approvedLeaves,
          rejected: rejectedLeaves
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

module.exports = { getStats };
