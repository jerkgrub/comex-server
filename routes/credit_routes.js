const express = require("express");
const router = express.Router();
const creditController = require("../controllers/credit_controller");

// 1. Create a new crediting form for an activity
router.post("/new", creditController.newCredit);  // Removed "/api/credit" prefix

// 2. Get all credits for a specific activity
router.get("/activity/:activityId", creditController.findCreditsByActivity);  // Removed "/api/credit" prefix

// 3. Get all credits for a specific user
router.get("/user/:userId", creditController.findCreditsByUser);  // Removed "/api/credit" prefix

// 4. Update credit by ID
router.put("/update/:creditId", creditController.updateCredit);  // Removed "/api/credit" prefix

// 5. Delete credit by ID
router.delete("/delete/:creditId", creditController.deleteCredit);  // Removed "/api/credit" prefix

// 6. Find One Credit
router.get('/:creditId', creditController.findOneCredit);  // Removed "/api/credit" prefix

module.exports = router;
