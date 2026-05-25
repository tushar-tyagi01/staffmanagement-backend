const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/AuthModel");
require("dotenv").config({ path: "../.env" });

const dbUrl =
  process.env.DB_URL || "mongodb://localhost:27017/staff-management";

function generatePassword(len = 12) {
  return crypto
    .randomBytes(Math.ceil(len * 0.75))
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, len);
}

async function seed() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB:", dbUrl);

    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const staffId = process.env.ADMIN_STAFF_ID || "STF0001";
    let password = process.env.ADMIN_PASSWORD || generatePassword(12);

    const existing = await User.findOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      existing.role = "admin";
      existing.isVerified = true;
      existing.password = hashedPassword;
      existing.staffId = staffId;
      await existing.save();
      console.log(`Existing user updated to Admin: ${email} / ${password}`);
    } else {
      await User.create({
        name: "System Admin",
        email,
        phoneNumber: process.env.ADMIN_PHONE || "0000000000",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        staffId,
      });
      console.log(`New Admin account created: ${email} / ${password}`);
    }
  } catch (err) {
    console.error("Error seeding admin:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
