const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/AuthModel");
require("dotenv").config({ path: "../.env" });

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/staff-management";

async function seed() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB:", dbUrl);

    const email = "admin@example.com";
    const existing = await User.findOne({ email });

    if (existing) {
      existing.role = "admin";
      existing.isVerified = true;
      existing.password = await bcrypt.hash("admin123", 10);
      existing.staffId = "STF0001";
      await existing.save();
      console.log("Existing user updated to Admin: admin@example.com / admin123");
    } else {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "System Admin",
        email,
        phoneNumber: "1234567890",
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        staffId: "STF0001",
      });
      console.log("New Admin account created: admin@example.com / admin123");
    }
  } catch (err) {
    console.error("Error seeding admin:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
