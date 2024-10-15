const express = require("express");
const router = express.Router();
const creditController = require("../controllers/credit_controller");

// Use Multer for file upload in routes
const upload = creditController.upload; // Multer middleware for handling file uploads

// 1. Create a new crediting form for an activity (with file upload support)
router.post("/new", upload.single('supportingDocument'), creditController.newCredit);

// 2. Get all credits for a specific activity
router.get("/activity/:activityId", creditController.findCreditsByActivity);

// 3. Get all credits for a specific user
router.get("/user/:userId", creditController.findCreditsByUser);

// 4. Update credit by ID (with file upload support)
router.put("/update/:creditId", upload.single('supportingDocument'), creditController.updateCredit);

// 5. Delete credit by ID
router.delete("/delete/:creditId", creditController.deleteCredit);

// 6. Find One Credit
router.get('/:creditId', creditController.findOneCredit);

module.exports = router;