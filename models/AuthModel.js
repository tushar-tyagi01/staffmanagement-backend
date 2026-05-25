const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },

    department: {
      type: String,
      enum: ["Engineering", "Sales", "Marketing", "", "management"],
    },
    designation: {
      type: String,
      trim: true,
    },
    salary: {
      type: Number,
    },
    joiningDate: {
      type: Date,
    },
    staffId: {
      type: String,
      unique: true,
      sparse: true,
    },

    otp: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    profilePhoto: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
