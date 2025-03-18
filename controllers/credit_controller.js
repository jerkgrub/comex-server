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
    cb(null, true); // Accept any file type
  }
});

// Valid statuses and types for validation
const VALID_STATUSES = ['Pending', 'Approved', 'Rejected'];
const VALID_TYPES = ['Institutional', 'College Driven', 'Extension Services', 'Capacity Building'];

// Helper function to capitalize first letter of each word
const capitalizeWords = str => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

// Fetch approved credits of type "College Driven" or "Institutional" by User ID
const getApprovedCollegeInstitutionalCredits = async (req, res) => {
  const { id } = req.params;

  try {
    const approvedCredits = await Credit.find({
      userId: id,
      status: 'Approved',
      type: { $in: ['College Driven', 'Institutional'] }
    })
      .populate('activityId')
      .sort({ createdAt: -1 });

    if (!approvedCredits || approvedCredits.length === 0) {
      return res
        .status(404)
        .json({ message: 'No approved credits found for this user with the specified types' });
    }

    res.status(200).json({ approvedCredits });
  } catch (err) {
    console.error('Error fetching approved credits by user ID:', err);
    res.status(500).json({ message: 'Failed to retrieve approved credits', error: err.message });
  }
};

// Fetch credits by status and type
const getCreditsByStatusAndType = async (req, res) => {
  let { status, type } = req.params;

  status = capitalizeWords(status.toLowerCase());
  type = type
    .toLowerCase()
    .split('-')
    .map(word => capitalizeWords(word))
    .join(' ');

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status: ${status}.` });
  }

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: `Invalid type: ${type}.` });
  }

  try {
    const credits = await Credit.find({ status, type })
      .populate('userId', '-password')
      .populate('activityId')
      .sort({ createdAt: -1 });

    res.status(200).json({ credits });
  } catch (err) {
    console.error('Error fetching credits:', err);
    res.status(500).json({ message: 'Failed to retrieve credits', error: err.message });
  }
};

// Fetch count of credits by status and type
const getCreditsCountByStatusAndType = async (req, res) => {
  let { status, type } = req.params;

  status = capitalizeWords(status.toLowerCase());
  type = type
    .toLowerCase()
    .split('-')
    .map(word => capitalizeWords(word))
    .join(' ');

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status: ${status}.` });
  }

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: `Invalid type: ${type}.` });
  }

  try {
    const count = await Credit.countDocuments({ status, type });
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error counting credits:', err);
    res.status(500).json({ message: 'Failed to retrieve credits count', error: err.message });
  }
};

// Create new crediting form
const newCredit = async (req, res) => {
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
    location,
    organizer
  } = req.body;
  const supportingDocumentFile = req.file;

  if (!userId || !totalHoursRendered || !facultyReflection || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const normalizedType = type
    .toLowerCase()
    .split(' ')
    .map(word => capitalizeWords(word))
    .join(' ');

  if (!VALID_TYPES.includes(normalizedType)) {
    return res.status(400).json({ message: `Invalid type: ${type}.` });
  }

  try {
    let supportingDocumentUrl = '';

    if (supportingDocumentFile) {
      const { url } = await put(
        `supporting-documents/${userId}-${Date.now()}.${
          supportingDocumentFile.mimetype.split('/')[1]
        }`,
        supportingDocumentFile.buffer,
        { access: 'public' }
      );
      supportingDocumentUrl = url;
    }

    const creditData = {
      isRegisteredEvent,
      userId,
      type: normalizedType,
      totalHoursRendered,
      supportingDocuments: supportingDocumentUrl,
      facultyReflection,
      location,
      organizer
    };

    if (!isRegisteredEvent) {
      creditData.title = title;
      creditData.isVoluntary = isVoluntary;
      creditData.beneficiaries = beneficiaries;
      creditData.startDate = startDate;
      creditData.endDate = endDate;
    } else {
      creditData.activityId = activityId;
    }

    const newCreditEntry = await Credit.create(creditData);

    res
      .status(201)
      .json({ credit: newCreditEntry, status: 'Successfully submitted the crediting form' });
  } catch (err) {
    console.error('Error creating credit form:', err);
    res.status(500).json({ message: 'Failed to create the credit form', error: err.message });
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
    location,
    organizer
  } = req.body;
  const supportingDocumentFile = req.file;

  if (!creditId) {
    return res.status(400).json({ message: 'Credit ID is required' });
  }

  const isRegisteredEventBool = isRegisteredEvent === 'true';
  const isVoluntaryBool = isVoluntary === 'true';

  const normalizedType = type
    .toLowerCase()
    .split(' ')
    .map(word => capitalizeWords(word))
    .join(' ');

  if (normalizedType && !VALID_TYPES.includes(normalizedType)) {
    return res.status(400).json({ message: `Invalid type: ${type}.` });
  }

  try {
    let supportingDocumentUrl = '';

    if (supportingDocumentFile) {
      const { url } = await put(
        `supporting-documents/${req.userId}-${Date.now()}.${
          supportingDocumentFile.mimetype.split('/')[1]
        }`,
        supportingDocumentFile.buffer,
        { access: 'public' }
      );
      supportingDocumentUrl = url;
    }

    const creditData = {
      location,
      organizer
    };

    if (normalizedType) creditData.type = normalizedType;
    if (totalHoursRendered !== undefined) creditData.totalHoursRendered = totalHoursRendered;
    if (facultyReflection !== undefined) creditData.facultyReflection = facultyReflection;
    if (supportingDocumentUrl) {
      creditData.supportingDocuments = supportingDocumentUrl;
    } else if (req.body.supportingDocuments) {
      creditData.supportingDocuments = req.body.supportingDocuments;
    }

    if (!isRegisteredEventBool) {
      if (title !== undefined) creditData.title = title;
      if (isVoluntaryBool !== undefined) creditData.isVoluntary = isVoluntaryBool;
      if (beneficiaries !== undefined) creditData.beneficiaries = beneficiaries;
      if (startDate !== undefined) creditData.startDate = startDate;
      if (endDate !== undefined) creditData.endDate = endDate;
    } else {
      if (activityId !== undefined) creditData.activityId = activityId;
    }

    const updatedCredit = await Credit.findByIdAndUpdate(creditId, creditData, {
      new: true,
      runValidators: true
    })
      .populate('userId', '-password')
      .populate('activityId');

    if (!updatedCredit) {
      return res.status(404).json({ message: 'Credit form not found' });
    }

    res.json({ updatedCredit, status: 'Successfully updated the crediting form' });
  } catch (err) {
    console.error('Error updating credit form:', err);
    res.status(500).json({ message: 'Failed to update the credit form', error: err.message });
  }
};

// Fetch credit by ID
const getCreditById = async (req, res) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid credit ID format' });
  }

  try {
    const credit = await Credit.findById(id).populate('userId', '-password').populate('activityId');

    if (!credit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ credit });
  } catch (err) {
    console.error('Error fetching credit by ID:', err);
    res.status(500).json({ message: 'Failed to retrieve credit', error: err.message });
  }
};

// Approve credit
const approveCredit = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedCredit = await Credit.findByIdAndUpdate(id, { status: 'Approved' }, { new: true });

    if (!updatedCredit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ message: 'Credit approved successfully', credit: updatedCredit });
  } catch (err) {
    console.error('Error approving credit:', err);
    res.status(500).json({ message: 'Failed to approve credit', error: err.message });
  }
};

// Reject credit
const rejectCredit = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedCredit = await Credit.findByIdAndUpdate(id, { status: 'Rejected' }, { new: true });

    if (!updatedCredit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ message: 'Credit rejected successfully', credit: updatedCredit });
  } catch (err) {
    console.error('Error rejecting credit:', err);
    res.status(500).json({ message: 'Failed to reject credit', error: err.message });
  }
};

// Fetch approved credits by user ID
const getApprovedCreditsByUserId = async (req, res) => {
  const { id } = req.params;

  try {
    const approvedCredits = await Credit.find({ userId: id, status: 'Approved' })
      .populate('activityId')
      .sort({ createdAt: -1 });

    if (!approvedCredits || approvedCredits.length === 0) {
      return res.status(404).json({ message: 'No approved credits found for this user' });
    }

    res.status(200).json({ approvedCredits });
  } catch (err) {
    console.error('Error fetching approved credits by user ID:', err);
    res.status(500).json({ message: 'Failed to retrieve approved credits', error: err.message });
  }
};

// User Credit Management
const getUserCredits = async (req, res) => {
  try {
    const { userId } = req.params;
    const credits = await Credit.find({ userId }).populate('activityId').sort({ createdAt: -1 });

    if (!credits.length) {
      return res.status(404).json({ message: 'No credits found for this user' });
    }

    res.status(200).json({ credits });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user credits', error: error.message });
  }
};

const getCreditDetails = async (req, res) => {
  try {
    const { creditId } = req.params;
    const credit = await Credit.findById(creditId)
      .populate('userId', '-password')
      .populate('activityId');

    if (!credit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ credit });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching credit details', error: error.message });
  }
};

const revokeCredit = async (req, res) => {
  try {
    const { creditId } = req.params;
    const credit = await Credit.findByIdAndDelete(creditId);

    if (!credit) {
      return res.status(404).json({ message: 'Credit not found' });
    }

    res.status(200).json({ message: 'Credit successfully revoked', credit });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking credit', error: error.message });
  }
};

// Admin Credit Management
const getActivityCredits = async (req, res) => {
  try {
    const { activityId } = req.params;
    const credits = await Credit.find({ activityId })
      .populate('userId', '-password')
      .sort({ createdAt: -1 });

    if (!credits.length) {
      return res.status(404).json({ message: 'No credits found for this activity' });
    }

    res.status(200).json({ credits });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity credits', error: error.message });
  }
};

const getFormCredits = async (req, res) => {
  try {
    const { formId } = req.params;
    const credits = await Credit.find({ formId })
      .populate('userId', '-password')
      .populate('activityId')
      .sort({ createdAt: -1 });

    if (!credits.length) {
      return res.status(404).json({ message: 'No credits found for this form' });
    }

    res.status(200).json({ credits });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form credits', error: error.message });
  }
};

// Get credits associated with a specific form response
const getResponseCredits = async (req, res) => {
  try {
    const { responseId } = req.params;
    console.log(`Looking up credits for response: ${responseId}`);

    const credits = await Credit.find({ response: responseId })
      .populate('user', 'name email')
      .populate('activity', 'title')
      .populate('activityForm');

    console.log(`Found ${credits.length} credits for response ${responseId}`);

    res.status(200).json({ credits });
  } catch (error) {
    console.error('Error fetching response credits:', error);
    res.status(500).json({ message: 'Error fetching response credits', error: error.message });
  }
};

// Manually create a credit (for testing)
const createCreditManually = async (req, res) => {
  try {
    const {
      user,
      activity,
      activityForm,
      response,
      hours,
      description,
      source = 'manual'
    } = req.body;

    console.log('Creating credit manually with data:', req.body);

    if (!user) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['user']
      });
    }

    const credit = new Credit({
      user,
      activity, // Optional now
      activityForm, // Optional now
      response,
      hours: hours || 1,
      description: description || 'Manually created credit',
      awardedAt: new Date(),
      source
    });

    await credit.save();
    console.log(`Manual credit created with ID: ${credit._id}`);

    res.status(201).json({
      message: 'Credit created successfully',
      credit
    });
  } catch (error) {
    console.error('Error creating credit manually:', error);
    res.status(500).json({ message: 'Error creating credit', error: error.message });
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
  getApprovedCreditsByUserId,
  getApprovedCollegeInstitutionalCredits,
  getUserCredits,
  getCreditDetails,
  revokeCredit,
  getActivityCredits,
  getFormCredits,
  getResponseCredits,
  createCreditManually
};
