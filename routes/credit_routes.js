// routes/credit_routes.js

const express = require("express");
const router = express.Router();
const creditController = require("../controllers/credit_controller");

// Use Multer for file upload in routes
const upload = creditController.upload; // Multer middleware for handling file uploads

// Create a new crediting form (with file upload support)
router.post("/new", upload.single('supportingDocument'), creditController.newCredit);

// Update credit by ID (with file upload support)
router.put("/update/:creditId", upload.single('supportingDocument'), creditController.updateCredit);

// Read operations - Fetch credits by type
router.get("/institutional", creditController.getInstitutionalCredits);
router.get("/collegedriven", creditController.getCollegeDrivenCredits);
router.get("/extensionservices", creditController.getExtensionServicesCredits);
router.get("/capacitybuilding", creditController.getCapacityBuildingCredits);

module.exports = router;
