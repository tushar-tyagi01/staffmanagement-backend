const express = require("express");
const router = express.Router();
const DashboardController = require("./dashboardController");
const verifyToken = require("../../middleware/authmiddleware");

router.use(verifyToken);

router.get("/stats", DashboardController.getStats);

module.exports = router;
