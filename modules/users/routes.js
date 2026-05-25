const express = require("express");
const router = express.Router();
const EmployeeController = require("./employeeController");
const verifyToken = require("../../middleware/authmiddleware");

router.use(verifyToken);

router.get("/", EmployeeController.getAll);
router.get("/:id", EmployeeController.getOne);
router.post("/", EmployeeController.create);
router.put("/:id", EmployeeController.update);
router.delete("/:id", EmployeeController.remove);
router.post("/:id/resend-otp", EmployeeController.resendOtp);
router.post("/send-setup-link", EmployeeController.sendSetupLink);

module.exports = router;
