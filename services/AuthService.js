const jwt = require("jsonwebtoken");
const User = require("../models/AuthModel");
const Counter = require("../models/Counter");

class AuthService {
  static async tokenGenerator(user, expiresIn = "10m") {
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn },
    );
    user.password = undefined;

    return { token, user };
  }

 static async checkUserRegistrationState({ email }) {

  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    return { type: "NEW_USER" };
  }

  // User fully registered
  if (user.isVerified && user.password) {
    return { type: "ALREADY_REGISTERED" };
  }

  // OTP verification pending
  if (!user.isVerified) {
    return { type: "OTP_PENDING", user };
  }

  // Password creation pending
  if (user.isVerified && !user.password) {
    return { type: "PASSWORD_PENDING", user };
  }

  return { type: "UNKNOWN", user };
}

  static async createStaffId() {
    const counter = await Counter.findOneAndUpdate(
      { _id: "staffId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    return `STF${String(counter.seq).padStart(4, "0")}`;
  }
}

module.exports = AuthService;
