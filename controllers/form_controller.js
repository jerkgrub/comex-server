//form_controller
const Form = require('../models/form_model');
const Response = require('../models/response_model');
const mongoose = require('mongoose');
const { put } = require('@vercel/blob');
const multer = require('multer');
const Credit = require('../models/credit_model');
const ProjectForm = require('../models/project_form_model');
const Project = require('../models/project_model');
const User = require('../models/user_model');
const { Parser } = require('json2csv');
const { format } = require('date-fns');
const { notifyAdminsAboutFormResponse } = require('./notification_controller');
const Registration = require('../models/registration_model');

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
    const {
      title,
      description,
      questions = [],
      isActivated = true,
      formType = 'ORIGINAL'
    } = req.body;

    // No need to generate IDs for questions as MongoDB will do it
    const form = new Form({
      title,
      description,
      questions,
      isActivated,
      formType
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
      .select('title description isPublished isActivated formType createdAt updatedAt')
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
    const { title, description, questions, settings, isPublished, credits, isActivated, formType } =
      req.body;

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
    if (isActivated !== undefined) form.isActivated = isActivated;
    if (formType) form.formType = formType;

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

// Submit a form response
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
          questionId,
          value: answer.value,
          fileUrl: answer.fileUrl
        };
      })
    );

    // Create the response
    const response = new Response({
      form: formId,
      respondent: {
        name: respondent?.name || 'Anonymous',
        email: respondent?.email || '',
        user: respondent?.userId // Link to user if provided
      },
      answers: processedAnswers,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        completionDate: new Date()
      },
      status: 'pending' // Default status
    });

    await response.save();
    console.log(`Form response saved: ${response._id}`);

    // Try to notify admins if this form has notifications enabled
    try {
      if (form.settings?.notifyAdmins) {
        await notifyAdminsAboutFormResponse(form, response);
      }
    } catch (notificationError) {
      console.error('Error sending admin notifications:', notificationError);
      // Don't fail the submission if notifications fail
    }

    // Return the full response object with _id for auto-approval
    return res.status(201).json({
      message: form.settings?.confirmationMessage || 'Form submitted successfully',
      response: {
        _id: response._id,
        formId: response.form,
        status: response.status
      }
    });
  } catch (error) {
    console.error('Error submitting form:', error);
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

// Form-Project Linking
const getFormProjects = async (req, res) => {
  try {
    const { formId } = req.params;

    const projectForms = await ProjectForm.find({ formId }).populate({
      path: 'projectId',
      select: 'title description engagementType'
    });

    if (!projectForms.length) {
      return res.status(404).json({ message: 'No projects linked to this form' });
    }

    res.status(200).json({ projectForms });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching linked projects', error: error.message });
  }
};

// Modified form submission with project context
const submitFormWithProjectContext = async (req, res) => {
  try {
    const { formId, projectFormId } = req.params;
    const { respondent, answers } = req.body;

    // Check if form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Check if project-form link exists
    const projectForm = await ProjectForm.findById(projectFormId);
    if (!projectForm) {
      return res.status(404).json({ message: 'Project-form link not found' });
    }

    // Get the project ID either from the form or from the projectForm
    const projectId = form.projectId || projectForm.projectId;

    // Create a new response
    const response = new Response({
      form: formId,
      projectForm: projectFormId,
      projectId: projectId, // Include projectId in the response
      respondent,
      answers,
      metadata: {
        ipAddress: req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        completionDate: new Date()
      },
      status: 'pending'
    });

    const savedResponse = await response.save();

    // Send notification to admins and coordinators
    try {
      let user = null;
      let projectTitle = null;

      // Try to get user info
      if (respondent && respondent.user) {
        user = await User.findById(respondent.user);
      } else if (respondent && respondent.email) {
        user = await User.findOne({ email: respondent.email });
      }

      // Try to get project info
      if (projectId) {
        const project = await Project.findById(projectId);
        if (project) {
          projectTitle = project.title;
        }
      }

      if (user) {
        await notifyAdminsAboutFormResponse(savedResponse, form, user, projectTitle);
      }
    } catch (notificationError) {
      console.error('Error sending form response notification:', notificationError);
      // Continue processing - don't fail because of notification issue
    }

    res.status(201).json({
      message: 'Form submitted successfully with project context',
      response: savedResponse
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Project-Form linking
const linkFormToProject = async (req, res) => {
  try {
    const { projectId, formId, formType } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Check if this link already exists
    const existingLink = await ProjectForm.findOne({
      projectId,
      formId,
      formType
    });

    if (existingLink) {
      return res
        .status(400)
        .json({ message: 'This form is already linked to the project with this type' });
    }

    // Update the form's projectId if it's not already set
    if (!form.projectId) {
      await Form.findByIdAndUpdate(formId, { projectId });
    }

    // Create the link
    const projectForm = new ProjectForm({
      projectId,
      formId,
      formType,
      status: 'approved' // Auto-approve the link for now
    });

    const savedLink = await projectForm.save();
    res.status(201).json(savedLink);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all forms linked to a project
const getProjectForms = async (req, res) => {
  try {
    const projectForms = await ProjectForm.find({ projectId: req.params.projectId })
      .populate('formId', 'title description')
      .sort({ createdAt: -1 });

    res.status(200).json(projectForms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unlink a form from a project
const unlinkForm = async (req, res) => {
  try {
    const result = await ProjectForm.findByIdAndDelete(req.params.projectFormId);

    if (!result) {
      return res.status(404).json({ message: 'Project-Form link not found' });
    }

    res.status(200).json({ message: 'Form unlinked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get responses for a linked form-project
const getLinkedFormResponses = async (req, res) => {
  try {
    const { projectFormId } = req.params;

    // Verify the project-form link exists
    const projectForm = await ProjectForm.findById(projectFormId);
    if (!projectForm) {
      return res.status(404).json({ message: 'Project-form link not found' });
    }

    // Get the responses that have this project form in context
    const responses = await Response.find({
      projectForm: projectFormId
    }).sort({ createdAt: -1 });

    res.status(200).json(responses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve a response (create credit)
const approveResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { hours, description } = req.body;

    console.log(`[DEBUG] approveResponse starting for responseId: ${responseId}`);
    console.log(`[DEBUG] Request body:`, req.body);

    // Find the response
    const response = await Response.findById(responseId);
    if (!response) {
      console.log(`[DEBUG] Response not found: ${responseId}`);
      return res.status(404).json({ message: 'Response not found' });
    }

    console.log(`[DEBUG] Response found:`, {
      id: response._id,
      form: response.form,
      projectForm: response.projectForm,
      status: response.status,
      respondent: response.respondent,
      projectId: response.projectId
    });

    // Make sure the response has a project context
    if (!response.projectForm) {
      console.log('[DEBUG] Response is not linked to a project, but proceeding anyway');
      // If no project form, we need to handle this case differently

      // Find user from response
      let userId;
      if (response.respondent && response.respondent.user) {
        userId = response.respondent.user;
        console.log(`[DEBUG] Found userId from response.respondent.user: ${userId}`);
      } else if (response.respondent && response.respondent.email) {
        console.log(`[DEBUG] Looking up user by email: ${response.respondent.email}`);
        const user = await User.findOne({ email: response.respondent.email });
        if (user) {
          userId = user._id;
          console.log(`[DEBUG] Found user by email: ${userId}`);
        } else {
          console.log(`[DEBUG] No user found with email: ${response.respondent.email}`);
          return res.status(404).json({ message: 'User not found for this response' });
        }
      } else {
        console.log('[DEBUG] Response has no user or email information');
        return res.status(400).json({ message: 'Response does not have user information' });
      }

      // If no project form, try to get the form and determine project from form's context
      const formId = response.form;
      if (!formId) {
        console.log('[DEBUG] Response has no form information');
        return res.status(400).json({ message: 'Response has no form information' });
      }
      console.log(`[DEBUG] Form ID found: ${formId}`);

      // Create credit without project context, but include projectId if the response has one
      console.log('[DEBUG] Creating credit without project context');
      const creditData = {
        user: userId,
        response: responseId,
        hours: hours || 1, // Default to 1 hour if not provided
        description: description || `Credit for form submission`,
        source: 'form'
      };

      // Add projectId to credit if the response has one
      if (response.projectId) {
        creditData.projectId = response.projectId;
        // Try to convert projectId string to ObjectId for the 'project' field
        try {
          creditData.project = new mongoose.Types.ObjectId(response.projectId);
          console.log(
            `[DEBUG] Added projectId as ObjectId to project field: ${response.projectId}`
          );
        } catch (err) {
          console.log(
            `[DEBUG] Could not convert projectId to ObjectId: ${response.projectId}`,
            err
          );
        }
        console.log(`[DEBUG] Adding projectId ${response.projectId} to credit`);
      }

      console.log('[DEBUG] About to save credit:', creditData);

      let credit; // Define credit variable outside try block
      try {
        credit = new Credit(creditData);
        await credit.save();
        console.log('[DEBUG] Credit saved successfully:', credit._id);
      } catch (creditError) {
        console.error('[DEBUG] Error saving credit:', creditError);
        return res.status(500).json({
          message: 'Error creating credit',
          error: creditError.message
        });
      }

      // Update response status
      try {
        await Response.findByIdAndUpdate(responseId, {
          status: 'approved',
          hours: hours || 1 // Store hours in the response too
        });
        console.log('[DEBUG] Response status updated to approved');
      } catch (updateError) {
        console.error('[DEBUG] Error updating response status:', updateError);
        // Continue anyway since credit was created
      }

      return res.status(200).json({
        message: 'Response approved and credit created successfully (no project context)',
        credit
      });
    }

    // Get the project-form link
    console.log(`[DEBUG] Response has projectForm: ${response.projectForm}, fetching details`);
    const projectForm = await ProjectForm.findById(response.projectForm);
    if (!projectForm) {
      console.log('[DEBUG] Project-form link not found, but proceeding anyway');

      // Similar handling as above for missing project form
      let userId;
      if (response.respondent && response.respondent.user) {
        userId = response.respondent.user;
        console.log(`[DEBUG] Found userId from response.respondent.user: ${userId}`);
      } else if (response.respondent && response.respondent.email) {
        console.log(`[DEBUG] Looking up user by email: ${response.respondent.email}`);
        const user = await User.findOne({ email: response.respondent.email });
        if (user) {
          userId = user._id;
          console.log(`[DEBUG] Found user by email: ${userId}`);
        } else {
          console.log(`[DEBUG] No user found with email: ${response.respondent.email}`);
          return res.status(404).json({ message: 'User not found for this response' });
        }
      } else {
        console.log('[DEBUG] Response has no user or email information');
        return res.status(400).json({ message: 'Response does not have user information' });
      }

      // Create credit without project context, but include projectId if response has one
      console.log('[DEBUG] Creating credit without project context (projectForm missing)');
      const creditData = {
        user: userId,
        response: responseId,
        hours: hours || 1,
        description: description || `Credit for form submission`,
        source: 'form'
      };

      // Add projectId to credit if the response has one
      if (response.projectId) {
        creditData.projectId = response.projectId;
        // Try to convert projectId string to ObjectId for the 'project' field
        try {
          creditData.project = new mongoose.Types.ObjectId(response.projectId);
          console.log(
            `[DEBUG] Added projectId as ObjectId to project field: ${response.projectId}`
          );
        } catch (err) {
          console.log(
            `[DEBUG] Could not convert projectId to ObjectId: ${response.projectId}`,
            err
          );
        }
        console.log(`[DEBUG] Adding projectId ${response.projectId} to credit`);
      }

      let credit; // Define credit variable outside try block
      try {
        credit = new Credit(creditData);
        await credit.save();
        console.log('[DEBUG] Credit saved successfully:', credit._id);
      } catch (creditError) {
        console.error('[DEBUG] Error saving credit:', creditError);
        return res.status(500).json({
          message: 'Error creating credit',
          error: creditError.message
        });
      }

      // Update response status
      try {
        await Response.findByIdAndUpdate(responseId, {
          status: 'approved',
          hours: hours || 1
        });
        console.log('[DEBUG] Response status updated to approved');
      } catch (updateError) {
        console.error('[DEBUG] Error updating response status:', updateError);
        // Continue anyway since credit was created
      }

      return res.status(200).json({
        message: 'Response approved and credit created successfully (project link missing)',
        credit
      });
    }

    console.log('[DEBUG] ProjectForm found:', {
      id: projectForm._id,
      projectId: projectForm.projectId,
      formId: projectForm.formId,
      formType: projectForm.formType
    });

    // If projectForm was found - regular flow
    // Find user from response
    let userId;
    if (response.respondent && response.respondent.user) {
      userId = response.respondent.user;
      console.log(`[DEBUG] Found userId from response.respondent.user: ${userId}`);
    } else if (response.respondent && response.respondent.email) {
      console.log(`[DEBUG] Looking up user by email: ${response.respondent.email}`);
      const user = await User.findOne({ email: response.respondent.email });
      if (user) {
        userId = user._id;
        console.log(`[DEBUG] Found user by email: ${userId}`);
      } else {
        console.log(`[DEBUG] No user found with email: ${response.respondent.email}`);
        return res.status(404).json({ message: 'User not found for this response' });
      }
    } else {
      console.log('[DEBUG] Response has no user or email information');
      return res.status(400).json({ message: 'Response does not have user information' });
    }

    // Create credit with project context
    console.log('[DEBUG] Creating credit with project context');

    // Get the project ID either from the response or from projectForm
    const projectId = response.projectId || projectForm.projectId;

    const creditData = {
      user: userId,
      response: responseId,
      hours: hours || 1, // Default to 1 hour if not provided
      description: description || `Credit for ${projectForm.formType} form submission`,
      source: 'form'
    };

    // Add project/projectId to the credit
    if (projectId) {
      // Add projectId as a string
      creditData.projectId = projectId;

      // Try to convert projectId string to ObjectId for 'project' field
      try {
        creditData.project = new mongoose.Types.ObjectId(projectId);
        console.log(`[DEBUG] Added projectId as ObjectId to project field: ${projectId}`);
      } catch (err) {
        console.log(`[DEBUG] Could not convert projectId to ObjectId: ${projectId}`, err);
      }

      console.log(`[DEBUG] Adding projectId ${projectId} to credit`);
    }

    // If we have the actual projectForm, use its projectId as a reference
    if (projectForm && projectForm.projectId) {
      try {
        creditData.project = new mongoose.Types.ObjectId(projectForm.projectId);
        console.log(
          `[DEBUG] Using projectForm.projectId for project field: ${projectForm.projectId}`
        );
      } catch (err) {
        console.log(
          `[DEBUG] Could not convert projectForm.projectId to ObjectId: ${projectForm.projectId}`,
          err
        );
      }
    }

    console.log('[DEBUG] About to save credit:', creditData);

    let credit; // Define credit variable outside try block
    try {
      credit = new Credit(creditData);
      await credit.save();
      console.log('[DEBUG] Credit saved successfully:', credit._id);
    } catch (creditError) {
      console.error('[DEBUG] Error saving credit:', creditError);
      return res.status(500).json({
        message: 'Error creating credit',
        error: creditError.message
      });
    }

    // Update response status
    try {
      await Response.findByIdAndUpdate(responseId, {
        status: 'approved',
        hours: hours || 1
      });
      console.log('[DEBUG] Response status updated to approved');
    } catch (updateError) {
      console.error('[DEBUG] Error updating response status:', updateError);
      // Continue anyway since credit was created
    }

    res.status(200).json({
      message: 'Response approved and credit created successfully',
      credit
    });
  } catch (error) {
    console.error('[DEBUG] Error in approveResponse:', error);
    res.status(500).json({ message: error.message });
  }
};

// Deny a response (without creating credit)
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
    await Response.findByIdAndUpdate(responseId, {
      status: 'denied',
      deniedReason: reason || 'No reason provided'
    });

    res.status(200).json({ message: 'Response denied successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Revoke a response (delete credit if exists)
const revokeResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { formType } = req.body; // Get the formType from the request body

    console.log(`Revoking response ${responseId}, formType provided: ${formType}`);

    // Find the response
    const response = await Response.findById(responseId);
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Log the response for debugging
    console.log('Response data:', {
      id: response._id,
      status: response.status,
      respondent: response.respondent,
      projectId: response.projectId
    });

    // If response was approved, handle cleanup based on form type
    if (response.status === 'approved') {
      const providedFormType = formType; // Save it for later

      if (providedFormType === 'evaluation') {
        // If frontend explicitly says it's an evaluation, delete credits
        console.log(`Deleting credits for evaluation response: ${responseId}`);
        const deleteResult = await Credit.deleteMany({ response: responseId });
        console.log(`Credit deletion result: ${deleteResult.deletedCount} deleted`);
      } else if (providedFormType === 'registration') {
        // PRIMARY APPROACH: Try to find the registration by response ID first (most direct)
        console.log(`Trying to delete registration by response ID: ${responseId}`);
        const responseObjectId = new mongoose.Types.ObjectId(responseId);
        const registrationsByResponse = await Registration.find({ response: responseObjectId });

        console.log(`Found ${registrationsByResponse.length} registrations by response ID`);

        if (registrationsByResponse.length > 0) {
          // Delete each found registration
          for (const reg of registrationsByResponse) {
            console.log(`Deleting registration with ID: ${reg._id}`);
            await Registration.findByIdAndDelete(reg._id);
          }
        } else if (response.respondent && response.projectId) {
          // FALLBACK APPROACH: Try by user & project
          let userId = response.respondent.user;
          const projectId = response.projectId;

          if (!userId && response.respondent.email) {
            // Try to find user by email if no direct ID
            console.log(`Looking up user by email: ${response.respondent.email}`);
            try {
              const user = await User.findOne({ email: response.respondent.email });
              if (user) {
                userId = user._id;
                console.log(`Found user ${userId} by email`);
              }
            } catch (err) {
              console.log(`Error finding user by email: ${err.message}`);
            }
          }

          if (userId && projectId) {
            console.log(`Deleting registration for user ${userId} and project ${projectId}`);

            try {
              // Ensure we're using ObjectIds
              const userObjectId = new mongoose.Types.ObjectId(userId.toString());
              const projectObjectId = new mongoose.Types.ObjectId(projectId.toString());

              // Find all registrations that match this user and project
              const registrations = await Registration.find({
                user: userObjectId,
                project: projectObjectId
              });

              console.log(`Found ${registrations.length} registration(s) by user/project`);

              // Delete each registration individually
              for (const reg of registrations) {
                console.log(`Deleting registration with ID: ${reg._id}`);
                await Registration.findByIdAndDelete(reg._id);
              }

              // Double-check deletion
              const remainingRegs = await Registration.find({
                user: userObjectId,
                project: projectObjectId
              });
              console.log(`After deletion, ${remainingRegs.length} registrations remain`);
            } catch (err) {
              console.error(`Error in registration deletion: ${err.message}`);
            }
          } else {
            console.log(
              `Cannot delete registration: missing user (${userId}) or project (${projectId}) information`
            );
          }
        }
      } else {
        // If no specific form type provided, try to determine from the form
        const form = await Form.findById(response.form);
        if (form) {
          if (form.formType === 'evaluation') {
            console.log(`Deleting credits for response based on form type: ${responseId}`);
            await Credit.deleteMany({ response: responseId });
          } else if (form.formType === 'registration') {
            // Try the same registration deletion logic as above
            console.log(`Using form-determined type 'registration' to delete registrations`);
            const responseObjectId = new mongoose.Types.ObjectId(responseId);
            const registrationsByResponse = await Registration.find({ response: responseObjectId });

            if (registrationsByResponse.length > 0) {
              for (const reg of registrationsByResponse) {
                console.log(`Deleting registration with ID: ${reg._id}`);
                await Registration.findByIdAndDelete(reg._id);
              }
            } else if (response.respondent && response.projectId) {
              // Try by user & project as fallback
              const userId = response.respondent.user;
              const projectId = response.projectId;

              if (userId && projectId) {
                const userObjectId = new mongoose.Types.ObjectId(userId);
                const projectObjectId = new mongoose.Types.ObjectId(projectId);

                const registrations = await Registration.find({
                  user: userObjectId,
                  project: projectObjectId
                });

                console.log(
                  `Found ${registrations.length} registration(s) to delete by user/project`
                );

                for (const reg of registrations) {
                  console.log(`Deleting registration with ID: ${reg._id}`);
                  await Registration.findByIdAndDelete(reg._id);
                }
              }
            }
          }
        }
      }
    }

    // Update response status to pending
    await Response.findByIdAndUpdate(responseId, {
      status: 'pending',
      deniedReason: null
    });

    res.status(200).json({ message: 'Response revoked successfully' });
  } catch (error) {
    console.error('Error in revokeResponse:', error);
    res.status(500).json({ message: error.message });
  }
};

// Clone a form specifically for a project (creating a new instance)
const cloneFormForProject = async (req, res) => {
  try {
    const { formId, projectId, projectTitle, formType = 'evaluation' } = req.body;

    if (!formId || !projectId) {
      return res.status(400).json({ message: 'Form ID and Project ID are required' });
    }

    // Fetch the original form to clone
    const originalForm = await Form.findById(formId);
    if (!originalForm) {
      return res.status(404).json({ message: 'Form template not found' });
    }

    // Create a new form based on the original, with changes
    const newForm = new Form({
      ...originalForm.toObject(),
      _id: undefined, // Let MongoDB create a new ID
      title: `${originalForm.title} - ${projectTitle || 'Project Form'}`,
      formType: 'CLONED',
      projectId: projectId, // Store the projectId in the form document
      isPublished: true, // Make it available immediately
      createdAt: undefined,
      updatedAt: undefined
    });

    const savedForm = await newForm.save();

    // Create a link between the new form and the project
    const projectForm = new ProjectForm({
      projectId,
      formId: savedForm._id,
      formType: formType, // Use the formType from the request body
      status: 'approved'
    });

    await projectForm.save();

    res.status(201).json({
      message: 'Form cloned and linked to project successfully',
      form: savedForm,
      projectForm
    });
  } catch (error) {
    console.error('Error cloning form for project:', error);
    res.status(500).json({ message: 'Error cloning form', error: error.message });
  }
};

// Get form project info
const getFormProjectInfo = async (req, res) => {
  try {
    const { formId } = req.params;
    console.log(`Getting project info for form: ${formId}`);

    // Find the form
    const form = await Form.findById(formId);
    if (!form) {
      console.log(`Form not found: ${formId}`);
      return res.status(404).json({ message: 'Form not found' });
    }

    console.log(`Found form: ${form.title}`);

    // Find project forms to get the project ID
    const projectForm = await ProjectForm.findOne({ formId });
    if (!projectForm) {
      console.log(`No project form found for form: ${formId}`);
      return res.json({
        formId,
        formType: form.formType || 'evaluation',
        projectId: null,
        projectType: null,
        isInstitutional: false
      });
    }

    console.log(
      `Found project form: ${projectForm._id}, projectId: ${projectForm.projectId}, formType: ${projectForm.formType}`
    );

    // Get the project
    const project = await Project.findById(projectForm.projectId);
    if (!project) {
      console.log(`Project not found for projectId: ${projectForm.projectId}`);
      return res.json({
        formId,
        formType: projectForm.formType || 'evaluation',
        projectId: projectForm.projectId,
        projectType: null,
        isInstitutional: false
      });
    }

    console.log(`Found project: ${project.title}, engagementType: ${project.engagementType}`);

    const isInstitutional = project.engagementType === 'Institutional';

    // Return the combined information
    const response = {
      formId,
      formType: projectForm.formType || 'evaluation',
      projectId: project._id,
      projectType: project.engagementType,
      isInstitutional
    };

    console.log(`Returning project info response:`, response);
    return res.json(response);
  } catch (error) {
    console.error('Error getting form project info:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Auto-approve form response
const autoApproveResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { formId, projectId, formType = 'evaluation' } = req.body;

    console.log(
      `Auto-approving response ${responseId} for project ${projectId}, formType: ${formType}`
    );

    // Find the response
    const response = await Response.findById(responseId);
    if (!response) {
      console.log(`Response not found: ${responseId}`);
      return res.status(404).json({ message: 'Response not found' });
    }

    console.log(`Found response from: ${response.respondent?.email || 'unknown'}`);

    // Get user information
    let userId = response.respondent?.user || response.respondent?.userId;
    console.log(`Initial userId from response: ${userId || 'none'}`);

    // If no user ID but we have an email, try to find the user
    if (!userId && response.respondent?.email) {
      console.log(`Looking up user by email: ${response.respondent.email}`);
      const user = await User.findOne({ email: response.respondent.email });
      if (user) {
        userId = user._id;
        console.log(`Found user by email: ${userId}`);
      } else {
        console.log(`User not found by email: ${response.respondent.email}`);
        return res.status(400).json({ message: 'Cannot auto-approve: User not found' });
      }
    }

    if (!userId) {
      console.log(`No user ID available for auto-approval`);
      return res.status(400).json({ message: 'Cannot auto-approve: No user ID available' });
    }

    // Update response status to approved
    console.log(`Updating response status to approved`);

    // Use the superuser account ID for reviewedBy
    const superuserId = '66fe9b3bfd0079f9f590327b';

    // Update the response using updateOne to avoid validation errors
    await Response.updateOne(
      { _id: responseId },
      {
        $set: {
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: new mongoose.Types.ObjectId(superuserId) // Use new keyword for ObjectId
        }
      }
    );

    console.log(`Response status updated to approved, reviewedBy superuser: ${superuserId}`);

    // Default hours for credit
    const defaultHours = 1;

    // If it's a registration form, create or update registration
    // but do NOT create a credit record
    if (formType === 'registration') {
      console.log(`Processing as registration form`);
      // Check if registration already exists
      const existingRegistration = await Registration.findOne({ user: userId, project: projectId });

      if (existingRegistration) {
        console.log(`Found existing registration: ${existingRegistration._id}`);
        // Update existing registration
        existingRegistration.status = 'active';
        existingRegistration.response = responseId;
        await existingRegistration.save();

        console.log(`Updated existing registration: ${existingRegistration._id}`);
      } else {
        console.log(`No existing registration found, creating new one`);
        // Create new registration
        const newRegistration = new Registration({
          user: userId,
          project: projectId,
          response: responseId,
          role: 'Participant',
          status: 'active'
        });
        await newRegistration.save();

        console.log(`Created new registration: ${newRegistration._id}`);
      }

      // Return success without creating a credit record
      return res.json({
        success: true,
        message: 'Registration form response auto-approved successfully',
        response: {
          _id: responseId,
          status: response.status || 'approved'
        }
      });
    }

    // Only create credit record for evaluation forms
    console.log(`Processing as evaluation form, creating credit record`);
    const newCredit = new Credit({
      type: 'Institutional',
      user: userId,
      project: projectId,
      response: responseId,
      hours: defaultHours,
      description: 'Auto-approved form submission',
      source: 'form'
    });
    await newCredit.save();

    console.log(`Created new credit record: ${newCredit._id} with ${defaultHours} hours`);

    // Get the updated response for returning the correct status
    const updatedResponse = await Response.findById(responseId);

    return res.json({
      success: true,
      message: 'Evaluation form response auto-approved successfully',
      response: {
        _id: responseId,
        status: updatedResponse ? updatedResponse.status : 'approved'
      },
      credit: {
        _id: newCredit._id,
        hours: newCredit.hours
      }
    });
  } catch (error) {
    console.error('Error auto-approving response:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Test auto-approval conditions for a form
const testAutoApprovalConditions = async (req, res) => {
  try {
    const { formId } = req.params;
    console.log(`Testing auto-approval conditions for form: ${formId}`);

    // Get the form
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found',
        formId
      });
    }

    // Check if there's a project form linking
    const projectForm = await ProjectForm.findOne({ formId });
    if (!projectForm) {
      return res.json({
        success: false,
        message: 'Form is not linked to any project',
        formId,
        formTitle: form.title
      });
    }

    // Check the project
    const project = await Project.findById(projectForm.projectId);
    if (!project) {
      return res.json({
        success: false,
        message: 'Linked project not found',
        formId,
        formTitle: form.title,
        projectFormId: projectForm._id,
        projectId: projectForm.projectId
      });
    }

    // Check if it's an institutional project
    const isInstitutional = project.engagementType === 'Institutional';

    return res.json({
      success: true,
      message: isInstitutional
        ? 'Form is linked to an institutional project and eligible for auto-approval'
        : 'Form is linked to a non-institutional project (not eligible for auto-approval)',
      formId,
      formTitle: form.title,
      projectId: project._id,
      projectTitle: project.title,
      projectEngagementType: project.engagementType,
      formType: projectForm.formType || 'evaluation',
      isInstitutional,
      autoApprovalEligible: isInstitutional
    });
  } catch (error) {
    console.error('Error testing auto-approval conditions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while testing auto-approval conditions',
      error: error.message
    });
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

  // Form categorization and project linking
  getFormsByCategory,
  getFormProjects,
  submitFormWithProjectContext,

  // Project-Form linking
  linkFormToProject,
  getProjectForms,
  unlinkForm,

  // Response approval workflow
  getLinkedFormResponses,
  approveResponse,
  denyResponse,
  revokeResponse,
  autoApproveResponse,

  // Clone a form specifically for a project
  cloneFormForProject,

  // Get form project info
  getFormProjectInfo,

  // Test auto-approval conditions for a form
  testAutoApprovalConditions
};
