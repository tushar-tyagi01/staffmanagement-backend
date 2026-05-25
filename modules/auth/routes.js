const express = require("express");
const AuthController = require("../auth/authcontroller");
const Responder = require("../../services/ResponderService");
const BodyValidations = require("../../validators/BodyValidator");
const User = require("../../models/AuthModel");
const {
  authApiLimiter,
  otpApiLimiter,
  defaultApiLimiter,
} = require("../../validators/RateLimiter");

const router = express.Router();

router.post(
  "/login",
  authApiLimiter,
  [
    BodyValidations.requiredEmail("email"),
    BodyValidations.requiredString("password"),
  ],
  Responder.validate.bind(Responder),
  AuthController.login.bind(AuthController),
);
router.post(
  "/sendotp",
  authApiLimiter,
  [
    BodyValidations.requiredEmail("email"),
  ],
  Responder.validate.bind(Responder),
  AuthController.sendOtp.bind(AuthController),
);
router.post(
  "/verify-otp",
  otpApiLimiter,
  [
    BodyValidations.requiredEmail("email"),
    BodyValidations.requiredString("otp"),
  ],
  Responder.validate.bind(Responder),
  AuthController.verifyOtp.bind(AuthController),
);
router.post(
  "/create-password",
  defaultApiLimiter,
  [
    BodyValidations.requiredEmail("email"),
    BodyValidations.requiredString("password"),
  ],
  Responder.validate.bind(Responder),
  AuthController.createPassword.bind(AuthController),
);

console.log("authroutes loaded");
router.post(
  "/register",
  // authApiLimiter,
  // [
  //   BodyValidations.requiredString("name"),
  //   BodyValidations.requiredEmail("email"),
  //   BodyValidations.requiredPhoneNumber("phoneNumber"),
  // ],
  // Responder.validate.bind(Responder),
  AuthController.userRegister.bind(AuthController),
);

module.exports=router;