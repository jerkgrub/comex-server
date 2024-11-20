const express = require("express");
const router = express.Router();
const programController = require("../controllers/program_controller");
const Program = require("../models/program_model");

// 1. Create a new program
router.post("/new", programController.createProgram);

// 2. Fetch all approved programs
router.get("/approved/all", programController.getApprovedPrograms);

// 3. Fetch all unapproved programs
router.get("/unapproved/all", programController.getUnapprovedPrograms);

// 4. Fetch all programs
router.get("/all", programController.getAllPrograms);

// 5. Approve a program
router.put("/approve/:id", programController.approveProgram);

// 6. Fetch a single program by ID
router.get("/:id", programController.getProgramById);

// 7. Update a program
router.put("/:id", programController.updateProgram);

// 8. Soft-delete a program
router.delete("/:id", programController.deleteProgram);

// 9. Count pending programs
router.get("/pending/count", async (req, res) => {
  try {
    const count = await Program.countDocuments({
      isApproved: false,
      isDeleted: false,
    });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching pending programs count:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
