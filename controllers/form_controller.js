//form_controller
const Form = require('../models/form_model');
const Response = require('../models/response_model');
const mongoose = require('mongoose');
const { put } = require('@vercel/blob');
const multer = require('multer');
const Credit = require('../models/credit_model');
const ProjectForm = require('../models/project_form_model');
const Project = require('../models/project_model');

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
    const { answers, respondentInfo } = req.body;

    // Validate form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Validate project form link exists
    let projectForm = null;
    let projectId = null;

    if (projectFormId) {
      projectForm = await ProjectForm.findById(projectFormId);
      if (!projectForm) {
        return res.status(404).json({ message: 'Project-Form link not found' });
      }

      if (projectForm.formId.toString() !== formId) {
        return res.status(400).json({ message: 'Form ID does not match the Project-Form link' });
      }

      projectId = projectForm.projectId;
    }

    // Create new response
    const response = new Response({
      form: formId,
      projectForm: projectFormId,
      respondent: respondentInfo,
      answers,
      metadata: {
        completionDate: new Date()
      }
    });

    const savedResponse = await response.save();

    res.status(201).json({
      message: 'Form submitted successfully',
      response: savedResponse
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error submitting form with project context', error: error.message });
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
  unlinkForm
};
