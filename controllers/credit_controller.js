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

// Valid statuses and types for validation
const VALID_STATUSES = ["Pending", "Approved", "Rejected", "pending", "approved", "rejected"];
const VALID_TYPES = ["Institutional", "College Driven", "Extension Services", "Capacity Building"];

// Helper function to capitalize first letter of each word
const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

// Generic function to fetch credits by status and type
const getCreditsByStatusAndType = async (req, res) => {
  let { status, type } = req.params;

  // Normalize and capitalize the status and type
  status = capitalizeWords(status.toLowerCase());
  type = type
    .toLowerCase()
    .split('-')
    .map(word => capitalizeWords(word))
    .join(' ');

  // Validate status and type
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status: ${status}. Valid statuses are ${VALID_STATUSES.join(', ')}` });
  }

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: `Invalid type: ${type}. Valid types are ${VALID_TYPES.join(', ')}` });
  }

  try {
    const credits = await Credit.find({ status, type })
      .populate('userId', '-password') // Populate user details excluding password
      .populate('activityId') // Populate activity details if applicable
      .sort({ createdAt: -1 }); // Sort by most recent

    res.status(200).json({ credits });
  } catch (err) {
    console.error("Error fetching credits:", err);
    res.status(500).json({ message: "Failed to retrieve credits", error: err.message });
  }
};

// Generic function to fetch count of credits by status and type
const getCreditsCountByStatusAndType = async (req, res) => {
  let { status, type } = req.params;

  // Normalize and capitalize the status and type
  status = capitalizeWords(status.toLowerCase());
  type = type
    .toLowerCase()
    .split('-')
    .map(word => capitalizeWords(word))
    .join(' ');

  // Validate status and type
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status: ${status}. Valid statuses are ${VALID_STATUSES.join(', ')}` });
  }

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: `Invalid type: ${type}. Valid types are ${VALID_TYPES.join(', ')}` });
  }

  try {
    const count = await Credit.countDocuments({ status, type });
    res.status(200).json({ count });
  } catch (err) {
    console.error("Error counting credits:", err);
    res.status(500).json({ message: "Failed to retrieve credits count", error: err.message });
  }
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

  // Normalize and capitalize the type
  const normalizedType = type
    .toLowerCase()
    .split(' ')
    .map(word => capitalizeWords(word))
    .join(' ');

  if (!VALID_TYPES.includes(normalizedType)) {
    return res.status(400).json({ message: `Invalid type: ${type}. Valid types are ${VALID_TYPES.join(', ')}` });
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
      type: normalizedType,
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

  // Convert string booleans to actual booleans
  const isRegisteredEventBool = isRegisteredEvent === 'true';
  const isVoluntaryBool = isVoluntary === 'true';

  // Normalize and capitalize the type
  const normalizedType = type
    .toLowerCase()
    .split(' ')
    .map(word => capitalizeWords(word))
    .join(' ');

  if (normalizedType && !VALID_TYPES.includes(normalizedType)) {
    return res.status(400).json({ message: `Invalid type: ${type}. Valid types are ${VALID_TYPES.join(', ')}` });
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
    const creditData = {};

    if (normalizedType) creditData.type = normalizedType;
    if (totalHoursRendered !== undefined) creditData.totalHoursRendered = totalHoursRendered;
    if (facultyReflection !== undefined) creditData.facultyReflection = facultyReflection;

    if (supportingDocumentUrl) {
      creditData.supportingDocuments = supportingDocumentUrl;
    } else if (req.body.supportingDocuments) {
      creditData.supportingDocuments = req.body.supportingDocuments; // Keep the old URL if no new file is uploaded
    }

    // Conditionally add fields only if the event is not registered
    if (!isRegisteredEventBool) {
      if (title !== undefined) creditData.title = title;
      if (isVoluntaryBool !== undefined) creditData.isVoluntary = isVoluntaryBool;
      if (beneficiaries !== undefined) creditData.beneficiaries = beneficiaries;
      if (startDate !== undefined) creditData.startDate = startDate;
      if (endDate !== undefined) creditData.endDate = endDate;
    } else {
      if (activityId !== undefined) creditData.activityId = activityId; // Only include activityId for registered events
    }

    const updatedCredit = await Credit.findByIdAndUpdate(
      creditId,
      creditData,
      { new: true, runValidators: true }
    )
      .populate('userId', '-password')
      .populate('activityId');

    if (!updatedCredit) {
      return res.status(404).json({ message: "Credit form not found" });
    }

    res.json({ updatedCredit, status: "Successfully updated the crediting form" });
  } catch (err) {
    console.error("Error updating credit form:", err);
    res.status(500).json({ message: "Failed to update the credit form", error: err.message });
  }
};

const getCreditById = async (req, res) => {
  const { id } = req.params; // Extract the credit ID from the route parameters

  // Validate the ID format (optional but recommended)
  if (!id.match(/^[0-9a-fA-F]{24}$/)) { // Assuming MongoDB ObjectId
    return res.status(400).json({ message: "Invalid credit ID format" });
  }

  try {
    const credit = await Credit.findById(id)
      .populate('userId', '-password') // Populate user details excluding password
      .populate('activityId'); // Populate activity details if applicable

    if (!credit) {
      return res.status(404).json({ message: "Credit not found" });
    }

    res.status(200).json({ credit });
  } catch (err) {
    console.error("Error fetching credit by ID:", err);
    res.status(500).json({ message: "Failed to retrieve credit", error: err.message });
  }
};

const approveCredit = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedCredit = await Credit.findByIdAndUpdate(
      id,
      { status: 'Approved' },
      { new: true }
    );

    if (!updatedCredit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ message: 'Credit approved successfully', credit: updatedCredit });
  } catch (err) {
    console.error("Error approving credit:", err);
    res.status(500).json({ message: "Failed to approve credit", error: err.message });
  }
};

// Reject Credit
const rejectCredit = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedCredit = await Credit.findByIdAndUpdate(
      id,
      { status: 'Rejected' },
      { new: true }
    );

    if (!updatedCredit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ message: 'Credit rejected successfully', credit: updatedCredit });
  } catch (err) {
    console.error("Error rejecting credit:", err);
    res.status(500).json({ message: "Failed to reject credit", error: err.message });
  }
};

// Export Multer middleware for file uploads
module.exports = {
  newCredit,
  updateCredit,
  upload, // Export Multer middleware for file uploads
  getCreditsByStatusAndType,
  getCreditsCountByStatusAndType,
  getCreditById,
  approveCredit,
  rejectCredit,
};
