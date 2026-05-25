const User = require("../../models/AuthModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Responder = require("../../services/ResponderService");
const AuthService = require("../../services/AuthService");
const OTPService = require("../../services/OtpService");

class AuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return Responder.respondWithUnauthorized(req, res, "User not found");
      }

      if (!user.isVerified) {
        return Responder.respondWithForbidden(
          req,
          res,
          "Please verify account first",
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return Responder.respondWithUnauthorized(
          req,
          res,
          "Invalid credentials",
        );
      }

      const result = await AuthService.tokenGenerator(user, "1d");

      const token = result.token;
      const loggedInUser = result.user;

      return Responder.respondWithSuccess(
        req,
        res,
        {
          token,
          user: loggedInUser,
        },
        "Login Successfully",
      );
    } catch (err) {
      return Responder.respondWithError(req, res, err);
    }
  }

  static async userRegister(req, res) {
    console.log(req.body);

    console.log("REGISTER CONTROLLER HIT");
    try {
      const { name, email, phoneNumber } = req.body;

      // check registration status
      const registrationstatus = await AuthService.checkUserRegistrationState({
        email,
        phoneNumber,
      });

      //  NEW USER
      if (registrationstatus.type === "NEW_USER") {
        const user = await User.create({
          name,
          email,
          phoneNumber,
          isVerified: false,
        });

        // send otp
        try {
          await OTPService.sendOtp(phoneNumber, email);
        } catch (error) {
          console.error("OTP sending failed:", error.message);
        }

        return Responder.respondWithSuccess(req, res, {
          status: "OTP_SENT",
          message: "OTP sent successfully",
          user,
        });
      }

      //  OTP PENDING
      if (registrationstatus.type === "OTP_PENDING") {
        try {
          await OTPService.sendOtp(phoneNumber, email);
        } catch (error) {
          console.error("OTP sending failed:", error.message);
        }

        return Responder.respondWithSuccess(req, res, {
          status: "OTP_PENDING",
          message: "OTP sent to email",
        });
      }

      // PASSWORD PENDING
      if (registrationstatus.type === "PASSWORD_PENDING") {
        return Responder.respondWithSuccess(req, res, {
          status: "PASSWORD_PENDING",
          message: "Create password to continue",
        });
      }

      // ALREADY REGISTERED
      if (registrationstatus.type === "ALREADY_REGISTERED") {
        return Responder.respondWithError(req, res, "User already registered");
      }

      // FALLBACK
      return Responder.respondWithError(req, res, "Unknown registration state");
    } catch (err) {
      console.log("REGISTER ERROR:", err);

      return Responder.respondWithError(
        req,
        res,
        err.message || "Something went wrong",
      );
    }
  }

  static async sendOtp(req, res) {
    try {
      const { name, email, phoneNumber } = req.body;

      const result = await AuthService.checkUserRegistrationState({
        email,
        phoneNumber,
      });

      if (result.type === "ALREADY_REGISTERED") {
        return Responder.respondWithConflict(
          req,
          res,
          "User already registered",
        );
      }

      if (result.type === "OTP_PENDING") {
        try {
         await OTPService.sendOtp(email);
        } catch (error) {
          console.error("OTP sending failed:", error.message);
        }

        return Responder.respondWithSuccess(req, res, {
          message: "OTP sent to email",
          step: "otp",
        });
      }

      if (result.type === "PASSWORD_PENDING") {
        return Responder.respondWithSuccess(req, res, {
          message: "Please create password",
          step: "create-password",
        });
      }

      if (result.type === "NEW_USER") {
       const user = await User.create({
  name,
  email
});

        try {
          await OTPService.sendOtp(phoneNumber, email);
        } catch (error) {
          console.error("OTP sending failed:", error.message);
        }

        return Responder.respondWithSuccess(req, res, {
          message: "OTP sent successfully",
          step: "otp",
        });
      }
    } catch (err) {
      return Responder.respondWithError(req, res, err);
    }
  }

 static async verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedOtp = String(otp).trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return Responder.respondWithUnauthorized(
        req,
        res,
        "User not found"
      );
    }

    if (String(user.otp) !== normalizedOtp) {
      return Responder.respondWithBadRequest(
        req,
        res,
        "Invalid OTP"
      );
    }

    if (user.otpExpiry < Date.now()) {
      return Responder.respondWithBadRequest(
        req,
        res,
        "OTP has expired"
      );
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return Responder.respondWithSuccess(
      req,
      res,
      "OTP Verified Successfully"
    );

  } catch (err) {
    return Responder.respondWithError(req, res, err);
  }
}

  static async createPassword(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return Responder.respondWithNotFound(req, res, "User not found");
      }

      if (!user.isVerified) {
        return Responder.respondWithForbidden(
          req,
          res,
          "Please Verify Otp first",
        );
      }

      if (user.password) {
        return Responder.respondWithBadRequest(
          req,
          res,
          "Password is already set",
        );
      }

      const hashPassword = await bcrypt.hash(password, 10);

      const staffId = await AuthService.createStaffId();
      user.staffId = staffId;

      user.password = hashPassword;
      await user.save();

      return Responder.respondWithSuccess(
        req,
        res,
        "Password created Successfully",
      );
    } catch (err) {
      return Responder.respondWithError(req, res, err);
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email, phoneNumber } = req.body;
      const payload = { email, phoneNumber };

      let query = {};

      if (email) {
        query.email = email.toLowerCase().trim();
      } else if (phoneNumber) {
        query.phoneNumber = phoneNumber;
      } else {
        return Responder.respondWithBadRequest(
          req,
          res,
          "Email or phone number is required",
        );
      }

      const user = await User.findOne(query);

      if (!user) {
        return Responder.respondWithUnauthorized(req, res, "User not found");
      }

      try {
        await OTPService.sendOtp(phoneNumber, user.email);
      } catch (error) {
        console.error("OTP sending failed:", error.message);
      }

      return Responder.respondWithSuccess(req, res, "OTP sent successfully");
    } catch (err) {
      return Responder.respondWithError(req, res, err);
    }
  }

  static async getUserData(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId);

      if (!user) {
        return Responder.respondWithNotFound(req, res, "No User data found");
      }

      return Responder.respondWithSuccess(
        req,
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            role: user.role,
            email: user.email,
          },
        },
        "User fetched successfully",
      );
    } catch (err) {
      return Responder.respondWithError(req, res, err);
    }
  }

  static async completeProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { department, profilePhoto } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return Responder.respondWithNotFound(req, res, "No User data found");
      }

      if (!user.isVerified) {
        return Responder.respondWithForbidden(
          req,
          res,
          "Please Verify Otp first",
        );
      }

      user.department = department;
    } catch (err) {}
  }
}

module.exports = AuthController;
