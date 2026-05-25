const Leave = require("../../models/Leave");
const User = require("../../models/AuthModel");
const mongoose = require("mongoose");

class LeaveController {
  // GET /api/leaves
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, status = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const query = {};

      // Non-admin sees only their own leaves
      if (req.user.role !== "admin" && req.user.role !== "staff-hr") {
        query.user = req.user._id;
      }
      if (status) query.status = status;

      const [leaves, total] = await Promise.all([
        Leave.find(query)
          .populate("user", "name email staffId department")
          .populate("approvedBy", "name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Leave.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data: leaves,
        pagination: { total, page: parseInt(page), limit: parseInt(limit) },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/leaves – apply for leave
  async create(req, res) {
    try {
      const { type, from, to, reason } = req.body;
      const userId = req.user._id;

      const fromDate = new Date(from);
      const toDate = new Date(to);
      const days =
        Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

      const today = new Date();
      const appliedOn = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const leave = await Leave.create({
        user: userId,
        type,
        from,
        to,
        days,
        reason,
        appliedOn,
        status: "Pending",
      });

      await leave.populate("user", "name email staffId department");
      return res.status(201).json({ success: true, data: leave });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // PUT /api/leaves/:id/status – approve or reject
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      const leave = await Leave.findByIdAndUpdate(
        req.params.id,
        { status, approvedBy: req.user._id },
        { new: true }
      )
        .populate("user", "name email staffId department")
        .populate("approvedBy", "name");

      if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });

      return res.status(200).json({ success: true, data: leave });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // DELETE /api/leaves/:id  – cancel own pending leave
  async remove(req, res) {
    try {
      const leave = await Leave.findOne({ _id: req.params.id, user: req.user._id, status: "Pending" });
      if (!leave) return res.status(404).json({ success: false, message: "Leave not found or cannot be cancelled" });

      await leave.deleteOne();
      return res.status(200).json({ success: true, message: "Leave cancelled" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/leaves/balance – remaining leave balance for logged-in user
  async balance(req, res) {
    try {
      const userId = req.user._id;
      const year = new Date().getFullYear().toString();

      const taken = await Leave.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            status: "Approved",
            from: { $regex: `^${year}` },
          },
        },
        { $group: { _id: "$type", total: { $sum: "$days" } } },
      ]);

      const allowances = {
        "Annual Leave": 20,
        "Sick Leave": 10,
        "Casual Leave": 5,
        Unpaid: 999,
      };

      const balance = Object.entries(allowances).map(([type, allowed]) => {
        const used = taken.find((t) => t._id === type)?.total || 0;
        return { type, allowed, used, remaining: allowed - used };
      });

      return res.status(200).json({ success: true, data: balance });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new LeaveController();
