const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Annual Leave", "Sick Leave", "Casual Leave", "Unpaid"],
      required: true,
    },
    from: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    appliedOn: {
      type: String, // "YYYY-MM-DD"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
