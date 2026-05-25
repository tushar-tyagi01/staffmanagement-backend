const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    managerName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
