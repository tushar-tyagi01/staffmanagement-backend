const express = require("express");
const router = express.Router();
const DepartmentController = require("./departmentController");
const verifyToken = require("../../middleware/authmiddleware");

router.use(verifyToken);

router.get("/", DepartmentController.getAll);
router.get("/:id", DepartmentController.getOne);
router.post("/", DepartmentController.create);
router.put("/:id", DepartmentController.update);
router.delete("/:id", DepartmentController.remove);

module.exports = router;
