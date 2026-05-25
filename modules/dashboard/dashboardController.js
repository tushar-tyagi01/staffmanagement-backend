const User = require("../../models/AuthModel");
const Attendance = require("../../models/Attendance");
const Leave = require("../../models/Leave");
const Department = require("../../models/Department");

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

class DashboardController {
  async getStats(req, res) {
    try {
      const today = todayStr();
      const currentMonth = monthStr();

      // This month start
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalEmployees,
        presentToday,
        pendingLeaves,
        newHires,
        departmentStats,
        recentAttendance,
        leaveDistribution,
      ] = await Promise.all([
        User.countDocuments({ status: "active" }),
        Attendance.countDocuments({ date: today, status: { $in: ["Present", "Late"] } }),
        Leave.countDocuments({ status: "Pending" }),
        User.countDocuments({ createdAt: { $gte: monthStart } }),

        // Employees by department
        User.aggregate([
          { $match: { status: "active", department: { $exists: true, $ne: null } } },
          { $group: { _id: "$department", count: { $sum: 1 } } },
          { $project: { _id: 0, name: "$_id", count: 1 } },
          { $sort: { count: -1 } },
        ]),

        // Last 30 days attendance trend
        Attendance.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0],
              },
            },
          },
          {
            $group: {
              _id: "$date",
              present: {
                $sum: { $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0] },
              },
              absent: {
                $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, day: "$_id", present: 1, absent: 1 } },
        ]),

        // Leave type distribution (approved this year)
        Leave.aggregate([
          {
            $match: {
              status: "Approved",
              from: { $regex: `^${now.getFullYear()}` },
            },
          },
          { $group: { _id: "$type", value: { $sum: "$days" } } },
          { $project: { _id: 0, name: "$_id", value: 1 } },
        ]),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          totalEmployees,
          presentToday,
          pendingLeaves,
          newHires,
          departmentStats,
          attendanceTrend: recentAttendance,
          leaveDistribution,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new DashboardController();
