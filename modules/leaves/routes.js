const express = require("express");
const router = express.Router();
const LeaveController = require("./leaveController");
const verifyToken = require("../../middleware/authmiddleware");

router.use(verifyToken);

router.get("/", LeaveController.getAll);
router.get("/balance", LeaveController.balance);
router.post("/", LeaveController.create);
router.put("/:id/status", LeaveController.updateStatus);
router.delete("/:id", LeaveController.remove);

module.exports = router;
