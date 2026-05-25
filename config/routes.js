const express = require("express");
const authRouter = require("../modules/auth/routes");
const employeeRouter = require("../modules/users/routes");
const departmentRouter = require("../modules/departments/routes");
const attendanceRouter = require("../modules/attendance/routes");
const leaveRouter = require("../modules/leaves/routes");
const dashboardRouter = require("../modules/dashboard/routes");

const router = express.Router();

router.use("/auth", authRouter);
router.use("/employees", employeeRouter);
router.use("/departments", departmentRouter);
router.use("/attendance", attendanceRouter);
router.use("/leaves", leaveRouter);
router.use("/dashboard", dashboardRouter);

module.exports = router;