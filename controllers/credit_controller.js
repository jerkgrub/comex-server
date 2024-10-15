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

// 1. Create new crediting form
const newCredit = async (req, res) => {
  const {
    isRegisteredEvent,
    activityId,
    userId,
    type, // Added type field
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
      const { url } = await put(`supporting-documents/${userId}-${Date.now()}.${supportingDocumentFile.mimetype.split('/')[1]}`, supportingDocumentFile.buffer, { access: 'public' });
      supportingDocumentUrl = url;
    }

    // Create the credit document in MongoDB
    const newCredit = await Credit.create({
      isRegisteredEvent,
      activityId: isRegisteredEvent ? activityId : undefined, // Only include if event is registered
      userId,
      type, // Store type
      title: isRegisteredEvent ? undefined : title, // Title is required only for non-registered events
      isVoluntary: isRegisteredEvent ? undefined : isVoluntary,
      beneficiaries: isRegisteredEvent ? undefined : beneficiaries,
      startDate: isRegisteredEvent ? undefined : startDate,
      endDate: isRegisteredEvent ? undefined : endDate,
      totalHoursRendered,
      supportingDocuments: supportingDocumentUrl,
      facultyReflection,
    });

    res.status(201).json({ credit: newCredit, status: "Successfully submitted the crediting form" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create the credit form", error: err.message });
  }
};

// 2. Update credit by ID
const updateCredit = async (req, res) => {
  const { creditId } = req.params;
  const {
    type, // Added type field
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
      const { url } = await put(`supporting-documents/${req.userId}-${Date.now()}.${supportingDocumentFile.mimetype.split('/')[1]}`, supportingDocumentFile.buffer, { access: 'public' });
      supportingDocumentUrl = url;
    }

    const updatedCredit = await Credit.findByIdAndUpdate(
      creditId,
      {
        type, // Store type
        totalHoursRendered,
        supportingDocuments: supportingDocumentUrl || req.body.supportingDocuments, // Keep the old URL if no new file uploaded
        facultyReflection,
      },
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
  upload, // Multer middleware for file uploads
};