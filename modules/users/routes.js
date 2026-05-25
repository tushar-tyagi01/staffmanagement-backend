const express = require("express");
const router = express.Router();
const EmployeeController = require("./employeeController");
const verifyToken = require("../../middleware/authmiddleware");

router.use(verifyToken);

router.get("/", EmployeeController.getAll);

router.post("/", EmployeeController.create);

router.post("/send-setup-link", EmployeeController.sendSetupLink);

router.post("/:id/resend-otp", EmployeeController.resendOtp);

router.get("/:id", EmployeeController.getOne);

router.put("/:id", EmployeeController.update);

router.delete("/:id", EmployeeController.remove);

module.exports = router;