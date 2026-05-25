const User = require("../models/AuthModel");
const Mail = require("./MailService");

class OTPService {
 static async sendOtp(email) {

  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  const otp = String(
    Math.floor(100000 + Math.random() * 900000)
  );

  const expiresAt = new Date(
    Date.now() + 2 * 60 * 1000
  );

  // Update OTP in database
  const updatedUser = await User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      otp,
      otpExpiry: expiresAt,
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  try {

    const mailService = new Mail();

    console.log(
      `[OTPService] Sending OTP to: ${normalizedEmail}`
    );

    await mailService.sendMail({
      to: normalizedEmail,
      subject: "Your OTP Verification Code",

      html: `
        <div style="font-family: Arial">

          <h2>Verify Your Account</h2>

          <p>Your verification OTP is:</p>

          <h1 style="
            color:#007bff;
            font-size:48px;
            letter-spacing:5px;
          ">
            ${otp}
          </h1>

          <p>
            This OTP will expire in 2 minutes.
          </p>

        </div>
      `,
    });

    console.log(
      `[OTPService] ✓ OTP sent successfully`
    );

  } catch (error) {

    console.error(
      `[OTPService] ✗ Failed to send OTP email`,
      error.message
    );

  }

  console.log(
    `OTP generated for ${normalizedEmail}: ${otp}`
  );

  return otp;
}
}

module.exports = OTPService;
