const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    checkIn: {
      type: String, // "HH:MM AM/PM"
    },
    checkOut: {
      type: String,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    duration: {
      type: String, // e.g. "8h 30m"
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Leave"],
      default: "Present",
    },
  },
  { timestamps: true }
);

// One record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
