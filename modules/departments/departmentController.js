const Department = require("../../models/Department");
const User = require("../../models/AuthModel");
const Leave = require("../../models/Leave");

class DepartmentController {
  // GET /api/departments
  async getAll(req, res) {
    try {
      const departments = await Department.find().sort({ name: 1 });

      // Enrich with employee count and pending leaves
      const enriched = await Promise.all(
        departments.map(async (dept) => {
          const employeeCount = await User.countDocuments({ department: dept.name });
          const pendingLeaves = await Leave.countDocuments({
            status: "Pending",
          });
          return {
            ...dept.toObject(),
            employees: employeeCount,
            pendingLeaves,
          };
        })
      );

      return res.status(200).json({ success: true, data: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/departments/:id
  async getOne(req, res) {
    try {
      const dept = await Department.findById(req.params.id);
      if (!dept) return res.status(404).json({ success: false, message: "Department not found" });
      return res.status(200).json({ success: true, data: dept });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/departments
  async create(req, res) {
    try {
      const { name, description, managerName } = req.body;
      const existing = await Department.findOne({ name });
      if (existing) return res.status(400).json({ success: false, message: "Department already exists" });

      const dept = await Department.create({ name, description, managerName });
      return res.status(201).json({ success: true, data: dept });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // PUT /api/departments/:id
  async update(req, res) {
    try {
      const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!dept) return res.status(404).json({ success: false, message: "Department not found" });
      return res.status(200).json({ success: true, data: dept });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // DELETE /api/departments/:id
  async remove(req, res) {
    try {
      const dept = await Department.findByIdAndDelete(req.params.id);
      if (!dept) return res.status(404).json({ success: false, message: "Department not found" });
      return res.status(200).json({ success: true, message: "Department deleted" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new DepartmentController();
