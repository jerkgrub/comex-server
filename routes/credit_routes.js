const express = require("express");
const router = express.Router();
const creditController = require("../controllers/credit_controller");

// 1. Create a new crediting form for an activity
router.post("/api/credit/new", creditController.newCredit);

// 2. Get all credits for a specific activity
router.get("/api/credit/activity/:activityId", creditController.findCreditsByActivity);

// 3. Get all credits for a specific user
router.get("/api/credit/user/:userId", creditController.findCreditsByUser);

// 4. Update credit by ID
router.put("/api/credit/update/:creditId", creditController.updateCredit);

// 5. Delete credit by ID
router.delete("/api/credit/delete/:creditId", creditController.deleteCredit);

// 6. Find One Credit
router.get('/api/credit/:creditId', creditController.findOneCredit);

module.exports = router;