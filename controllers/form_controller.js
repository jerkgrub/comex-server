//form_controller
const Form = require('../models/form_model');
const Response = require('../models/response_model');
const mongoose = require('mongoose');
const { put } = require('@vercel/blob');
const multer = require('multer');
const Activity = require('../models/activity_model');
const Credit = require('../models/credit_model');
const ActivityForm = require('../models/activity_form_model');

// Set up Multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept all file types for form uploads
    cb(null, true);
  }
});

// Form CRUD operations
const createForm = async (req, res) => {
  try {
    const { title, description, questions = [] } = req.body;

    // No need to generate IDs for questions as MongoDB will do it
    const form = new Form({
      title,
      description,
      questions
      // Removed author field since there's only one admin
    });

    await form.save();
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Error creating form', error: error.message });
  }
};

const getAllForms = async (req, res) => {
  try {
    const forms = await Form.find()
      .select('title description isPublished createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.status(200).json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms', error: error.message });
  }
};

const getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed
    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form', error: error.message });
  }
};

const updateForm = async (req, res) => {
  try {
    const { title, description, questions, settings, isPublished, credits } = req.body;

    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    // Update only the fields that were provided
    if (title) form.title = title;
    if (description !== undefined) form.description = description;
    if (questions) form.questions = questions;
    if (settings) form.settings = { ...form.settings, ...settings };
    if (isPublished !== undefined) form.isPublished = isPublished;
    if (credits !== undefined) form.credits = credits;

    await form.save();
    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Error updating form', error: error.message });
  }
};

const deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    // Option 1: Hard delete
    await Form.findByIdAndDelete(req.params.formId);

    // Also delete all responses for this form
    await Response.deleteMany({ form: req.params.formId });

    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting form', error: error.message });
  }
};

// Helper function to upload file to Vercel Blob
const uploadFileToBlob = async (fileBuffer, fileName, fileType) => {
  try {
    // Generate a unique file name with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const uniqueFileName = `form-uploads/${timestamp}-${fileName.replace(/\s+/g, '_')}`;

    console.log('Uploading to Vercel Blob:', {
      path: uniqueFileName,
      contentType: fileType,
      bufferSize: fileBuffer.length
    });

    // Upload the file to Vercel Blob
    const { url } = await put(uniqueFileName, fileBuffer, {
      access: 'public',
      contentType: fileType
    });

    console.log('Successfully uploaded to Vercel Blob, URL:', url);
    return url;
  } catch (error) {
    console.error('Error uploading file to Vercel Blob:', error);
    throw error;
  }
};

// Middleware to handle file uploads
const handleFileUpload = upload.single('file');

// Process file upload and return URL
const uploadFormFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Received file upload request:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    const url = await uploadFileToBlob(file.buffer, file.originalname, file.mimetype);

    console.log('Returning file URL to client:', url);
    res.status(200).json({ fileUrl: url });
  } catch (error) {
    console.error('Error uploading form file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
};

// Form submission handling
const submitForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers, respondent } = req.body;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    if (!form.isPublished || !form.settings?.acceptingResponses) {
      return res.status(403).json({ message: 'This form is not accepting responses' });
    }

    // Check if maximum responses limit has been reached
    if (form.settings?.maxResponses > 0) {
      const responseCount = await Response.countDocuments({ form: formId });
      if (responseCount >= form.settings.maxResponses) {
        return res
          .status(403)
          .json({ message: 'This form has reached its maximum response limit' });
      }
    }

    // Validate required questions
    const requiredQuestions = form.questions.filter(q => q.isRequired).map(q => q._id.toString());

    // Convert string questionIds to ObjectIds for validation
    const answeredQuestions = answers.map(a => a.questionId);

    const missingRequiredQuestions = requiredQuestions.filter(
      qId => !answeredQuestions.includes(qId)
    );

    if (missingRequiredQuestions.length > 0) {
      return res.status(400).json({
        message: 'Please answer all required questions',
        missingQuestions: missingRequiredQuestions
      });
    }

    // Process answers - handle file uploads if present
    const processedAnswers = await Promise.all(
      answers.map(async answer => {
        const questionId = new mongoose.Types.ObjectId(answer.questionId);
        const question = form.questions.find(q => q._id.equals(questionId));

        // If this is a file upload question and we have a file value
        if (question?.type === 'File Upload') {
          // Check if fileUrl is directly provided in the answer
          if (answer.fileUrl) {
            console.log('File URL found directly in answer:', answer.fileUrl);
            return {
              questionId,
              value: answer.value || 'Uploaded file',
              fileUrl: answer.fileUrl
            };
          }

          // If not, try to parse it from the value if it's a JSON string
          if (typeof answer.value === 'string' && answer.value.includes('fileUrl')) {
            try {
              // The value should be a JSON string containing file info
              const fileInfo = JSON.parse(answer.value);
              console.log('Parsed file info from value:', fileInfo);

              if (fileInfo.fileUrl) {
                return {
                  questionId,
                  value: fileInfo.name || 'Uploaded file',
                  fileUrl: fileInfo.fileUrl
                };
              }
            } catch (error) {
              console.error('Error parsing file upload answer:', error);
            }
          }

          // Fallback if no fileUrl was found
          return {
            questionId,
            value: answer.value || 'Uploaded file',
            fileUrl: null
          };
        }

        // For non-file questions, just return the answer
        return {
          ...answer,
          questionId
        };
      })
    );

    // Create response
    const response = new Response({
      form: formId,
      answers: processedAnswers,
      respondent,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    await response.save();

    res.status(201).json({
      message: form.settings?.confirmationMessage || 'Your response has been recorded.',
      responseId: response._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting form', error: error.message });
  }
};

const getFormResponses = async (req, res) => {
  try {
    const { formId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    const total = await Response.countDocuments({ form: formId });

    const responses = await Response.find({ form: formId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-__v');

    res.status(200).json({
      responses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching responses', error: error.message });
  }
};

const getResponseById = async (req, res) => {
  try {
    const { responseId } = req.params;

    const response = await Response.findById(responseId).populate('form');

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // No authorization check needed

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching response', error: error.message });
  }
};

// Form utilities
const duplicateForm = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    // Create a new form with the same details
    const newForm = new Form({
      ...form.toObject(),
      _id: undefined, // Let MongoDB create a new ID
      title: `Copy of ${form.title}`,
      isPublished: false,
      createdAt: undefined,
      updatedAt: undefined
    });

    await newForm.save();

    res.status(201).json(newForm);
  } catch (error) {
    res.status(500).json({ message: 'Error duplicating form', error: error.message });
  }
};

// Publish form
const publishForm = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Check if form is already published
    if (form.isPublished) {
      return res.status(400).json({ message: 'Form is already published' });
    }

    // Update the form to be published
    form.isPublished = true;

    // Make sure form is accepting responses when published
    if (form.settings) {
      form.settings.acceptingResponses = true;
    } else {
      form.settings = {
        acceptingResponses: true,
        confirmationMessage: 'Your response has been recorded.',
        signInRequired: false,
        allowMultipleResponses: false,
        maxResponses: 0
      };
    }

    await form.save();

    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Error publishing form', error: error.message });
  }
};

// Analytics
const getFormAnalytics = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    const totalResponses = await Response.countDocuments({ form: formId });

    // Calculate analytics for each question
    const questionAnalytics = [];

    for (const question of form.questions) {
      if (['Multiple Choice', 'Checkbox', 'Dropdown'].includes(question.type)) {
        // Aggregate answers for choice-based questions
        const aggregation = await Response.aggregate([
          { $match: { form: mongoose.Types.ObjectId(formId) } },
          { $unwind: '$answers' },
          { $match: { 'answers.questionId': question._id } },
          {
            $group: {
              _id: '$answers.value',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]);

        questionAnalytics.push({
          questionId: question._id.toString(),
          questionTitle: question.title,
          type: question.type,
          totalAnswers: aggregation.reduce((sum, item) => sum + item.count, 0),
          distribution: aggregation
        });
      }
    }

    res.status(200).json({
      formId,
      totalResponses,
      responseRate: totalResponses, // You could calculate completion rate if you track form views
      questionAnalytics
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Export data
const exportFormData = async (req, res) => {
  try {
    const { formId } = req.params;
    const { format = 'json' } = req.query;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    const responses = await Response.find({ form: formId }).sort({ createdAt: -1 });

    if (format === 'csv') {
      // Process and format data for CSV export
      const headers = ['Response ID', 'Response Date', 'Respondent Email'];

      // Add question headers
      form.questions.forEach(q => {
        headers.push(q.title);
      });

      const rows = responses.map(resp => {
        const row = [
          resp._id.toString(),
          resp.createdAt.toISOString(),
          resp.respondent?.email || ''
        ];

        // Add question answers
        form.questions.forEach(q => {
          const answer = resp.answers.find(a => a.questionId.equals(q._id));
          row.push(answer ? answer.value : '');
        });

        return row;
      });

      // Very basic CSV formatting
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="form-${formId}-export.csv"`);
      return res.send(csv);
    }

    // Default: JSON format
    res.status(200).json({
      form: {
        _id: form._id,
        title: form.title,
        description: form.description,
        questions: form.questions.map(q => ({
          _id: q._id,
          title: q.title,
          type: q.type
        }))
      },
      responses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error exporting form data', error: error.message });
  }
};

// Form Categorization
const getFormsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const forms = await Form.find({ category }).sort({ updatedAt: -1 });

    if (!forms.length) {
      return res.status(404).json({ message: `No forms found in category: ${category}` });
    }

    res.status(200).json({ forms });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms by category', error: error.message });
  }
};

// Form-Activity Linking
const getFormActivities = async (req, res) => {
  try {
    const { formId } = req.params;
    const activities = await Activity.find({ 'linkedForms.formId': formId }).populate(
      'linkedForms.formId'
    );

    if (!activities.length) {
      return res.status(404).json({ message: 'No activities linked to this form' });
    }

    res.status(200).json({ activities });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form activities', error: error.message });
  }
};

// Modified form submission with activity context
const submitFormWithContext = async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers, respondent } = req.body;

    console.log(`Submitting form: formId=${formId}`);

    const form = await Form.findById(formId);
    if (!form) {
      console.log(`Form not found: ${formId}`);
      return res.status(404).json({ message: 'Form not found' });
    }

    // Create response with just the form reference
    const response = new Response({
      form: formId,
      answers,
      respondent,
      status: 'pending'
    });

    console.log('Saving response');
    await response.save();

    console.log(`Response created: ${response._id}`);
    res.status(201).json({
      message: 'Response submitted successfully',
      response: {
        id: response._id,
        formId: response.form,
        status: response.status
      }
    });
  } catch (error) {
    console.error('Error submitting form response:', error);
    res.status(500).json({ message: 'Error submitting form response', error: error.message });
  }
};

// Approve a form response
const approveResponse = async (req, res) => {
  try {
    console.log('=== RESPONSE APPROVAL PROCESS STARTED ===');
    const { responseId } = req.params;
    const { userId, hours } = req.body; // Get userId and hours from request body if provided

    console.log(
      `Processing approval for responseId: ${responseId}, userId from request: ${
        userId || 'not provided'
      }, hours from request: ${hours || 'not provided'}`
    );

    // Validate MongoDB ObjectId
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`ERROR: Invalid userId format: ${userId}`);
      return res.status(400).json({
        message: 'Invalid userId format. Must be a valid MongoDB ObjectId.',
        providedId: userId
      });
    }

    // Validate hours if provided
    const creditHours = hours !== undefined ? parseFloat(hours) : null;
    if (hours !== undefined && (isNaN(creditHours) || creditHours < 0)) {
      console.log(`ERROR: Invalid hours value: ${hours}`);
      return res.status(400).json({
        message: 'Invalid hours value. Must be a positive number.',
        providedValue: hours
      });
    }

    // Find the response
    const response = await Response.findById(responseId);
    if (!response) {
      console.log(`ERROR: Response with ID ${responseId} not found`);
      return res.status(404).json({ message: 'Response not found' });
    }
    console.log(`Found response: ${response._id}, form: ${response.form}`);

    // Find the form to get credit value
    const form = await Form.findById(response.form);
    if (!form) {
      console.log(`ERROR: Form with ID ${response.form} not found`);
      return res.status(404).json({ message: 'Form not found' });
    }
    console.log(`Found form: ${form._id}, title: ${form.title}, credits: ${form.credits || 0}`);

    // Check if response has user association
    let userIdToAward = null;

    if (response.respondent && response.respondent.user) {
      // Use existing user association if available
      userIdToAward = response.respondent.user;
      console.log(`Using existing user association from response: ${userIdToAward}`);
    } else if (userId) {
      // Use the user ID from request body if provided
      userIdToAward = userId;
      console.log(`Using userId from request body: ${userIdToAward}`);

      // Update the response with the user association
      if (!response.respondent) {
        response.respondent = { user: userId };
        console.log(`Created new respondent object with userId: ${userId}`);
      } else {
        response.respondent.user = userId;
        console.log(`Updated existing respondent object with userId: ${userId}`);
      }

      await response.save();
      console.log('Response updated with user association');
    } else {
      console.log('WARNING: No user ID available to award credits to');
    }

    let creditCreated = false;
    let credit = null;

    // If we have a user to award credits to and either the form has credits or admin provided hours
    const formHasCredits = form.credits && form.credits > 0;
    const adminProvidedHours = creditHours !== null && creditHours > 0;

    if (userIdToAward && (formHasCredits || adminProvidedHours)) {
      // Use admin-provided hours if available, otherwise fall back to form.credits
      const hoursToAward = adminProvidedHours ? creditHours : form.credits || 0;

      console.log(
        `Attempting to create credit: user=${userIdToAward}, credits=${hoursToAward} (${
          adminProvidedHours ? 'admin-provided' : 'from form'
        })`
      );
      try {
        // NEW APPROACH: Look up any ActivityForm documents that link to this form
        console.log(`Looking up ActivityForm links for formId: ${form._id}`);
        const activityFormLink = await ActivityForm.findOne({
          formId: form._id,
          status: 'approved'
        });

        let activityId = null;
        let activityFormId = null;

        if (activityFormLink) {
          activityId = activityFormLink.activityId;
          activityFormId = activityFormLink._id;
          console.log(
            `Found approved ActivityForm link: activityId=${activityId}, activityFormId=${activityFormId}`
          );

          // Create a credit with activity association
          credit = new Credit({
            user: userIdToAward,
            activity: activityId,
            activityForm: activityFormId,
            response: response._id,
            hours: hoursToAward,
            description: `Credit awarded for completing ${form.title}`,
            awardedAt: new Date(),
            source: 'activity'
          });
        } else {
          console.log(`No approved ActivityForm link found for form: ${form._id}`);

          // Create a standalone credit without activity association
          credit = new Credit({
            user: userIdToAward,
            response: response._id,
            hours: hoursToAward,
            description: `Credit awarded for passing verification for ${form.title}`,
            awardedAt: new Date(),
            source: 'form'
          });
        }

        console.log('Credit object created, about to save:', JSON.stringify(credit, null, 2));
        await credit.save();
        creditCreated = true;
        console.log(`SUCCESS: Credit created with ID: ${credit._id}`);
      } catch (creditError) {
        console.error('ERROR creating credit:', creditError);
        console.error('Credit error stack:', creditError.stack);
        // Continue with response approval even if credit creation fails
      }
    } else {
      console.log(`Skipping credit creation - conditions not met:
        - userIdToAward exists: ${!!userIdToAward}
        - form.credits exists: ${!!form.credits}
        - form.credits > 0: ${form.credits > 0}
        - adminProvidedHours: ${adminProvidedHours}`);
    }

    // Update response status
    response.status = 'approved';
    await response.save();
    console.log(`Response status updated to 'approved'`);
    console.log('=== RESPONSE APPROVAL PROCESS COMPLETED ===');

    res.status(200).json({
      message:
        'Response approved' + (creditCreated ? ' and credit awarded' : ' (no credits awarded)'),
      hasUser: !!userIdToAward,
      creditCreated,
      creditDetails: credit
        ? {
            creditId: credit._id,
            hours: credit.hours,
            user: credit.user,
            activity: credit.activity,
            source: credit.source
          }
        : null
    });
  } catch (error) {
    console.error('Error approving response:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error approving response', error: error.message });
  }
};

// Deny a form response
const denyResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { reason } = req.body;

    // Find the response
    const response = await Response.findById(responseId);
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Update response status
    response.status = 'denied';
    response.denialReason = reason || 'Response was denied';
    await response.save();

    res.status(200).json({
      message: 'Response denied',
      response
    });
  } catch (error) {
    console.error('Error denying response:', error);
    res.status(500).json({ message: 'Error denying response', error: error.message });
  }
};

// Revoke an approved response
const revokeResponse = async (req, res) => {
  try {
    console.log('=== RESPONSE REVOCATION PROCESS STARTED ===');
    const { responseId } = req.params;

    console.log(`Processing revocation for responseId: ${responseId}`);

    // Find the response
    const response = await Response.findById(responseId);
    if (!response) {
      console.log(`ERROR: Response with ID ${responseId} not found`);
      return res.status(404).json({ message: 'Response not found' });
    }

    if (response.status !== 'approved' && response.status !== 'denied') {
      console.log(`ERROR: Cannot revoke response with status: ${response.status}`);
      return res.status(400).json({
        message: 'Only approved or denied responses can be revoked',
        currentStatus: response.status
      });
    }

    console.log(`Found approved response: ${response._id}`);

    // Find and delete any associated credits
    let deletedCredits = [];
    try {
      const credits = await Credit.find({ response: responseId });
      console.log(`Found ${credits.length} credits associated with this response`);

      if (credits.length > 0) {
        for (const credit of credits) {
          console.log(`Deleting credit: ${credit._id}`);
          await Credit.findByIdAndDelete(credit._id);
          deletedCredits.push(credit._id);
        }
        console.log(`Successfully deleted ${deletedCredits.length} credits`);
      }
    } catch (creditError) {
      console.error('ERROR deleting associated credits:', creditError);
      // Continue with response revocation even if credit deletion fails
    }

    // Update response status back to pending
    response.status = 'pending';
    await response.save();
    console.log(`Response status updated to 'pending'`);
    console.log('=== RESPONSE REVOCATION PROCESS COMPLETED ===');

    res.status(200).json({
      message: 'Response approval revoked and returned to pending status',
      deletedCredits,
      response: {
        responseId: response._id,
        status: response.status
      }
    });
  } catch (error) {
    console.error('Error revoking response:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error revoking response', error: error.message });
  }
};

module.exports = {
  // Form CRUD operations
  createForm,
  getAllForms,
  getFormById,
  updateForm,
  deleteForm,

  // Form response handling
  submitForm,
  getFormResponses,
  getResponseById,

  // Form utilities
  duplicateForm,
  publishForm,

  // Analytics & Reporting
  getFormAnalytics,
  exportFormData,

  // File handling
  handleFileUpload,
  uploadFormFile,
  upload,

  // Form categorization and activity linking
  getFormsByCategory,
  getFormActivities,
  submitFormWithContext,

  // Response approval
  approveResponse,
  denyResponse,
  revokeResponse
};
