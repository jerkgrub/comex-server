// controllers/credit_controller.js

const { put } = require('@vercel/blob');
const Credit = require('../models/credit_model');
const multer = require('multer');

// Set up Multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept any file type by not checking the extension
    cb(null, true);
  }
});

// Generic function to fetch credits by type
const getCreditsByType = async (req, res, type) => {
  const validTypes = ["Institutional", "College Driven", "Extension Services", "Capacity Building"];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid credit type" });
  }
  
  try {
    const credits = await Credit.find({ type })
      .populate('userId', '-password') // Populate user details excluding password
      .populate('activityId') // Populate activity details if applicable
      .sort({ createdAt: -1 }); // Sort by most recent
    res.status(200).json({ credits });
  } catch (err) {
    console.error("Error fetching credits:", err);
    res.status(500).json({ message: "Failed to retrieve credits", error: err.message });
  }
};

// Specific functions for each credit type
const getInstitutionalCredits = async (req, res) => {
  const type = "Institutional";
  return getCreditsByType(req, res, type);
};

const getCollegeDrivenCredits = async (req, res) => {
  const type = "College Driven";
  return getCreditsByType(req, res, type);
};

const getExtensionServicesCredits = async (req, res) => {
  const type = "Extension Services";
  return getCreditsByType(req, res, type);
};

const getCapacityBuildingCredits = async (req, res) => {
  const type = "Capacity Building";
  return getCreditsByType(req, res, type);
};

// Create new crediting form
const newCredit = async (req, res) => {
  // Convert string booleans to actual booleans
  const isRegisteredEvent = req.body.isRegisteredEvent === 'true';
  const isVoluntary = req.body.isVoluntary === 'true';

  const {
    activityId,
    userId,
    type,
    title,
    beneficiaries,
    startDate,
    endDate,
    totalHoursRendered,
    facultyReflection,
  } = req.body;
  const supportingDocumentFile = req.file;

  // Basic validation
  if (!userId || !totalHoursRendered || !facultyReflection || !type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let supportingDocumentUrl = '';

    if (supportingDocumentFile) {
      // Upload the file to Vercel Blob
      const { url } = await put(
        `supporting-documents/${userId}-${Date.now()}.${supportingDocumentFile.mimetype.split('/')[1]}`,
        supportingDocumentFile.buffer,
        { access: 'public' }
      );
      supportingDocumentUrl = url;
    }

    // Build the object conditionally
    const creditData = {
      isRegisteredEvent,
      userId,
      type,
      totalHoursRendered,
      supportingDocuments: supportingDocumentUrl,
      facultyReflection,
    };

    // Conditionally add fields only if the event is not registered
    if (!isRegisteredEvent) {
      creditData.title = title;
      creditData.isVoluntary = isVoluntary;
      creditData.beneficiaries = beneficiaries;
      creditData.startDate = startDate;
      creditData.endDate = endDate;
    } else {
      creditData.activityId = activityId; // Only include activityId for registered events
    }

    // Create the credit document in MongoDB
    const newCreditEntry = await Credit.create(creditData);

    res.status(201).json({ credit: newCreditEntry, status: "Successfully submitted the crediting form" });
  } catch (err) {
    console.error("Error creating credit form:", err);
    res.status(500).json({ message: "Failed to create the credit form", error: err.message });
  }
};

// Update credit by ID
const updateCredit = async (req, res) => {
  const { creditId } = req.params;
  const {
    isRegisteredEvent,
    activityId,
    type,
    title,
    isVoluntary,
    beneficiaries,
    startDate,
    endDate,
    totalHoursRendered,
    facultyReflection,
  } = req.body;
  const supportingDocumentFile = req.file;

  if (!creditId) {
    return res.status(400).json({ message: "Credit ID is required" });
  }

  try {
    let supportingDocumentUrl = '';

    if (supportingDocumentFile) {
      // Upload the updated file to Vercel Blob
      const { url } = await put(
        `supporting-documents/${req.userId}-${Date.now()}.${supportingDocumentFile.mimetype.split('/')[1]}`,
        supportingDocumentFile.buffer,
        { access: 'public' }
      );
      supportingDocumentUrl = url;
    }

    // Build the object conditionally
    const creditData = {
      type,
      totalHoursRendered,
      supportingDocuments: supportingDocumentUrl || req.body.supportingDocuments, // Keep the old URL if no new file is uploaded
      facultyReflection,
    };

    // Conditionally add fields only if the event is not registered
    if (!isRegisteredEvent) {
      creditData.title = title;
      creditData.isVoluntary = isVoluntary;
      creditData.beneficiaries = beneficiaries;
      creditData.startDate = startDate;
      creditData.endDate = endDate;
    } else {
      creditData.activityId = activityId; // Only include activityId for registered events
    }

    const updatedCredit = await Credit.findByIdAndUpdate(
      creditId,
      creditData,
      { new: true, runValidators: true }
    ).populate('userId', '-password').populate('activityId');

    if (!updatedCredit) {
      return res.status(404).json({ message: "Credit form not found" });
    }

    res.json({ updatedCredit, status: "Successfully updated the crediting form" });
  } catch (err) {
    console.error("Error updating credit form:", err);
    res.status(500).json({ message: "Failed to update the credit form", error: err.message });
  }
};

module.exports = {
  newCredit,
  updateCredit,
  upload, // Export Multer middleware for file uploads
  getInstitutionalCredits,
  getCollegeDrivenCredits,
  getExtensionServicesCredits,
  getCapacityBuildingCredits
};
