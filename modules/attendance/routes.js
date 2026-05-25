const express = require("express");
const router = express.Router();
const AttendanceController = require("./attendanceController");
const verifyToken = require("../../middleware/authmiddleware");

router.use(verifyToken);

router.get("/", AttendanceController.getAll);
router.get("/today-status", AttendanceController.todayStatus);
router.post("/check-in", AttendanceController.checkIn);
router.post("/check-out", AttendanceController.checkOut);

module.exports = router;
