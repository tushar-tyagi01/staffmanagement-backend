const Attendance = require("../../models/Attendance");
const User = require("../../models/AuthModel");

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function calcDuration(inTime, outTime) {
  const diff = outTime - inTime;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

class AttendanceController {
  // GET /api/attendance  – own records for employee, all for admin/hr
  async getAll(req, res) {
    try {
      const { page = 1, limit = 30, userId, month } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const query = {};

      // Non-admin sees only their own records
      if (req.user.role !== "admin") {
        query.user = req.user._id;
      } else if (userId) {
        query.user = userId;
      }

      if (month) {
        // month = "YYYY-MM"
        query.date = { $regex: `^${month}` };
      }

      const [records, total] = await Promise.all([
        Attendance.find(query)
          .populate("user", "name email staffId department")
          .sort({ date: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Attendance.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data: records,
        pagination: { total, page: parseInt(page), limit: parseInt(limit) },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/attendance/check-in
  async checkIn(req, res) {
    try {
      const userId = req.user._id;
      const today = todayStr();
      const now = new Date();

      const existing = await Attendance.findOne({ user: userId, date: today });
      if (existing && existing.checkIn) {
        return res.status(400).json({ success: false, message: "Already checked in today" });
      }

      // Late if after 09:30
      const hour = now.getHours();
      const min = now.getMinutes();
      const isLate = hour > 9 || (hour === 9 && min > 30);

      const record = await Attendance.findOneAndUpdate(
        { user: userId, date: today },
        {
          user: userId,
          date: today,
          checkIn: formatTime(now),
          checkInTime: now,
          status: isLate ? "Late" : "Present",
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true, data: record, message: "Checked in successfully" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/attendance/check-out
  async checkOut(req, res) {
    try {
      const userId = req.user._id;
      const today = todayStr();
      const now = new Date();

      const record = await Attendance.findOne({ user: userId, date: today });
      if (!record || !record.checkIn) {
        return res.status(400).json({ success: false, message: "You have not checked in today" });
      }
      if (record.checkOut) {
        return res.status(400).json({ success: false, message: "Already checked out" });
      }

      const duration = calcDuration(record.checkInTime, now);
      record.checkOut = formatTime(now);
      record.checkOutTime = now;
      record.duration = duration;
      await record.save();

      return res.status(200).json({ success: true, data: record, message: "Checked out successfully" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/attendance/today-status  – own check-in status
  async todayStatus(req, res) {
    try {
      const today = todayStr();
      const record = await Attendance.findOne({ user: req.user._id, date: today });
      return res.status(200).json({ success: true, data: record || null });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AttendanceController();
