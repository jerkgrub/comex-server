const Credit = require("../models/credit_model");

// 1. Create new crediting form
const newCredit = (req, res) => {
  const { activityId, userId, totalHoursRendered, supportingDocuments, facultyReflection } = req.body;

  if (!activityId || !userId || !totalHoursRendered || !facultyReflection) {
    return res.status(400).json({ message: "All fields are required except supporting documents" });
  }

  Credit.create({
    activityId,
    userId,
    totalHoursRendered,
    supportingDocuments: supportingDocuments || '', // Set supportingDocuments as optional
    facultyReflection,
  })
    .then((newCredit) => {
      res.status(201).json({ credit: newCredit, status: "Successfully submitted the crediting form" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Failed to create the credit form", error: err.message });
    });
};

// 2. Fetch all credits for a specific activity
const findCreditsByActivity = (req, res) => {
  const { activityId } = req.params;

  if (!activityId) {
    return res.status(400).json({ message: "Activity ID is required" });
  }

  Credit.find({ activityId })
    .then((credits) => {
      if (credits.length === 0) {
        return res.status(404).json({ message: "No credits found for this activity" });
      }
      res.json({ credits });
    })
    .catch((err) => {
      res.status(500).json({ message: "Failed to fetch credits for activity", error: err.message });
    });
};

// 3. Fetch all credits for a specific user
const findCreditsByUser = (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  Credit.find({ userId })
    .then((credits) => {
      if (credits.length === 0) {
        return res.status(404).json({ message: "No credits found for this user" });
      }
      res.json({ credits });
    })
    .catch((err) => {
      res.status(500).json({ message: "Failed to fetch credits for user", error: err.message });
    });
};

// 4. Update credit by ID
const updateCredit = (req, res) => {
  const { creditId } = req.params;
  const { totalHoursRendered, supportingDocuments, facultyReflection } = req.body;

  if (!creditId) {
    return res.status(400).json({ message: "Credit ID is required" });
  }

  Credit.findByIdAndUpdate(
    creditId,
    {
      totalHoursRendered,
      supportingDocuments: supportingDocuments || '', // Ensure empty string if no file
      facultyReflection,
    },
    { new: true, runValidators: true }
  )
    .then((updatedCredit) => {
      if (!updatedCredit) {
        return res.status(404).json({ message: "Credit form not found" });
      }
      res.json({ updatedCredit, status: "Successfully updated the crediting form" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Failed to update the credit form", error: err.message });
    });
};

// 5. Delete credit by ID
const deleteCredit = (req, res) => {
  const { creditId } = req.params;

  if (!creditId) {
    return res.status(400).json({ message: "Credit ID is required" });
  }

  Credit.findByIdAndDelete(creditId)
    .then((deletedCredit) => {
      if (!deletedCredit) {
        return res.status(404).json({ message: "Credit form not found" });
      }
      res.json({ message: "Successfully deleted the credit form", deletedCredit });
    })
    .catch((err) => {
      res.status(500).json({ message: "Failed to delete the credit form", error: err.message });
    });
};

const findOneCredit = (req, res) => {
  const { creditId } = req.params;

  Credit.findById(creditId)
    .then((credit) => {
      if (!credit) {
        return res.status(404).json({ message: 'Credit not found' });
      }
      res.json({ credit });
    })
    .catch((err) => {
      res.status(500).json({ message: 'Error fetching credit', error: err.message });
    });
};

module.exports = {
  newCredit,
  findCreditsByActivity,
  findCreditsByUser,
  updateCredit,
  deleteCredit,
  findOneCredit
};