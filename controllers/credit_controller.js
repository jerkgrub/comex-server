const { put } = require('@vercel/blob');
const Credit = require('../models/credit_model');
const multer = require('multer');

// Set up Multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/)) {
      return cb(new Error('Only PDF and image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Create new crediting form
const newCredit = async (req, res) => {
  const {
    isRegisteredEvent,
    activityId,
    userId,
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
    const newCredit = await Credit.create(creditData);

    res.status(201).json({ credit: newCredit, status: "Successfully submitted the crediting form" });
  } catch (err) {
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
    );

    if (!updatedCredit) {
      return res.status(404).json({ message: "Credit form not found" });
    }

    res.json({ updatedCredit, status: "Successfully updated the crediting form" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update the credit form", error: err.message });
  }
};

module.exports = {
  newCredit,
  updateCredit,
  upload, // Export Multer middleware for file uploads
};