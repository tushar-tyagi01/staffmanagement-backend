const User = require("../../models/AuthModel");
const bcrypt = require("bcrypt");
const OTPService = require("../../services/OtpService");

class EmployeeController {
  // GET /api/employees
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        department = "",
        status = "",
      } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { staffId: { $regex: search, $options: "i" } },
        ];
      }
      if (department) query.department = department;
      if (status) query.status = status;

      const [employees, total] = await Promise.all([
        User.find(query)
          .select("-password -otp -otpExpiry")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        data: employees,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/employees/:id
  async getOne(req, res) {
    try {
      const employee = await User.findById(req.params.id).select(
        "-password -otp -otpExpiry",
      );
      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: "Employee not found" });
      }
      return res.status(200).json({ success: true, data: employee });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/employees
  async create(req, res) {
    try {
      const {
        name,
        email,
        phoneNumber,
        department,
        designation,
        salary,
        joiningDate,
        role = "staff",
      } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      }

      // Normalize phone number for consistency
      const normalizedPhone = String(phoneNumber || "0000000000").trim();

      // Auto-generate staffId
      const count = await User.countDocuments();
      const staffId = `EMP-${1000 + count + 1}`;

      // Create employee without password
      const employee = await User.create({
        name,
        email,
        phoneNumber: normalizedPhone,
        department,
        designation,
        salary,
        joiningDate,
        role,
        staffId,
        isVerified: false,
      });

      // Send OTP to employee's email
      let otpSent = false;
      try {
        await OTPService.sendOtp(email);
        otpSent = true;
      } catch (error) {
        console.error("OTP sending failed:", error.message);
      }

      const result = employee.toObject();
      delete result.password;
      delete result.otp;
      delete result.otpExpiry;

      return res.status(201).json({
        success: true,
        status: otpSent ? "OTP_SENT" : "EMPLOYEE_CREATED",
        message: otpSent
          ? "Employee added successfully. OTP has been sent to their email."
          : "Employee added successfully. OTP sending failed - please resend manually.",
        data: result,
      });
    } catch (err) {
      console.error("Employee creation error:", err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // PUT /api/employees/:id
  async update(req, res) {
    try {
      const { password, otp, otpExpiry, ...updates } = req.body;

      const employee = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true },
      ).select("-password -otp -otpExpiry");

      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: "Employee not found" });
      }

      return res.status(200).json({ success: true, data: employee });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async sendSetupLink(req, res) {
  try {

    const {
      email,
      setupLink,
      employeeName,
    } = req.body;

    // validation
    if (!email || !setupLink) {
      return res.status(400).json({
        success: false,
        message:
          "Email and setup link are required",
      });
    }

    // create mail service
    const Mail = require("../../services/MailService");

    const mailService = new Mail();

    // email template
    const html = `
      <div style="
        font-family: Arial;
        max-width: 600px;
        margin: auto;
      ">

        <h2>
          Welcome ${employeeName || ""}
        </h2>

        <p>
          Your employee account has been created.
        </p>

        <p>
          Complete your account setup using
          the link below:
        </p>

        <a
          href="${setupLink}"
          style="
            background:#4F46E5;
            color:white;
            padding:12px 20px;
            border-radius:6px;
            text-decoration:none;
            display:inline-block;
            margin-top:10px;
          "
        >
          Complete Setup
        </a>

        <p style="margin-top:20px;">
          Or copy this link:
        </p>

        <p>
          ${setupLink}
        </p>

        <hr />

        <p style="
          color:#777;
          font-size:12px;
        ">
          This link is for your account setup.
        </p>

      </div>
    `;

    // send mail
    await mailService.sendMail({
      to: email,
      subject:
        "Complete Your Employee Account Setup",
      html,
    });

    return res.status(200).json({
      success: true,
      message:
        "Setup link sent successfully",
    });

  } catch (error) {

    console.error(
      "Setup link email error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to send setup link",
    });
  }
}

  // DELETE /api/employees/:id
  async remove(req, res) {
    try {
      const employee = await User.findByIdAndDelete(req.params.id);
      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: "Employee not found" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Employee deleted" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/employees/:id/resend-otp
  async resendOtp(req, res) {
    try {
      const employee = await User.findById(req.params.id);

      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: "Employee not found" });
      }

      try {
        await OTPService.sendOtp(
  employee.email
);
        return res.status(200).json({
          success: true,
          message: `OTP resent to ${employee.email}`,
        });
      } catch (error) {
        console.error("OTP resend failed:", error.message);
        return res.status(500).json({
          success: false,
          message: `Failed to resend OTP: ${error.message}`,
        });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new EmployeeController();
