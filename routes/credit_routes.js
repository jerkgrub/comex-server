// routes/credit_routes.js

const express = require("express");
const router = express.Router();
const creditController = require("../controllers/credit_controller");

// Use Multer for file upload in routes
const upload = creditController.upload; // Multer middleware for handling file uploads
// **New Route: Fetch a single credit by ID**

// **New Routes: Approve and Reject Credits**
router.get('/approved-credits/cert/:id', creditController.getApprovedCollegeInstitutionalCredits);
router.get('/approved-credits/:id', creditController.getApprovedCreditsByUserId);
router.put("/approve/:id", creditController.approveCredit);
router.put("/reject/:id", creditController.rejectCredit);

router.get("/id/:id", creditController.getCreditById);
// Create a new crediting form (with file upload support)
router.post("/new", upload.single('supportingDocument'), creditController.newCredit);

// Update credit by ID (with file upload support)
router.put("/update/:creditId", upload.single('supportingDocument'), creditController.updateCredit);

// Read operations - Fetch credits by status and type
router.get("/:status/:type", creditController.getCreditsByStatusAndType);

// Read operations - Fetch count of credits by status and type
router.get("/:status/:type/count", creditController.getCreditsCountByStatusAndType);

// Read operations - Fetch approved credits by user

module.exports = router;
