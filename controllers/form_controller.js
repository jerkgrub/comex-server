const Form = require('../models/form_model');
const Submission = require('../models/submission_model');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // For generating unique question IDs

// Form CRUD operations
exports.createForm = async (req, res) => {
  try {
    const { title, description, questions = [] } = req.body;

    // Generate unique IDs for questions if not provided
    const processedQuestions = questions.map(q => ({
      ...q,
      id: q.id || uuidv4()
    }));

    const form = new Form({
      title,
      description,
      questions: processedQuestions,
      // Removed author field since there's only one admin
    });

    await form.save();
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Error creating form', error: error.message });
  }
};

exports.getAllForms = async (req, res) => {
  try {
    const forms = await Form.find()
      .select('title description isPublished createdAt updatedAt')
      .sort({ updatedAt: -1 });

    res.status(200).json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms', error: error.message });
  }
};

exports.getFormById = async (req, res) => {
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

exports.updateForm = async (req, res) => {
  try {
    const { title, description, questions, settings, isPublished } = req.body;

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

    await form.save();
    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Error updating form', error: error.message });
  }
};

exports.deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    // Option 1: Hard delete
    await Form.findByIdAndDelete(req.params.formId);

    // Also delete all submissions for this form
    await Submission.deleteMany({ form: req.params.formId });

    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting form', error: error.message });
  }
};

// Form submission handling
exports.submitForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers, respondent } = req.body;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    if (!form.isPublished) {
      return res.status(403).json({ message: 'This form is not accepting responses' });
    }

    // Validate required questions
    const requiredQuestions = form.questions.filter(q => q.isRequired).map(q => q.id);

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

    // Create submission
    const submission = new Submission({
      form: formId,
      answers,
      respondent,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    await submission.save();

    res.status(201).json({
      message: form.settings?.confirmationMessage || 'Your response has been recorded.',
      submissionId: submission._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting form', error: error.message });
  }
};

exports.getFormSubmissions = async (req, res) => {
  try {
    const { formId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    const total = await Submission.countDocuments({ form: formId });

    const submissions = await Submission.find({ form: formId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-__v');

    res.status(200).json({
      submissions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId).populate('form');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // No authorization check needed

    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submission', error: error.message });
  }
};

// Form utilities
exports.duplicateForm = async (req, res) => {
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

// Analytics
exports.getFormAnalytics = async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    const totalSubmissions = await Submission.countDocuments({ form: formId });

    // Calculate analytics for each question
    const questionAnalytics = [];

    for (const question of form.questions) {
      if (['single_choice', 'multiple_choice', 'dropdown'].includes(question.type)) {
        // Aggregate answers for choice-based questions
        const aggregation = await Submission.aggregate([
          { $match: { form: mongoose.Types.ObjectId(formId) } },
          { $unwind: '$answers' },
          { $match: { 'answers.questionId': question.id } },
          {
            $group: {
              _id: '$answers.value',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]);

        questionAnalytics.push({
          questionId: question.id,
          questionText: question.text,
          type: question.type,
          totalAnswers: aggregation.reduce((sum, item) => sum + item.count, 0),
          distribution: aggregation
        });
      }
    }

    res.status(200).json({
      formId,
      totalSubmissions,
      submissionRate: totalSubmissions, // You could calculate completion rate if you track form views
      questionAnalytics
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Export data
exports.exportFormData = async (req, res) => {
  try {
    const { formId } = req.params;
    const { format = 'json' } = req.query;

    const form = await Form.findById(formId);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // No authorization check needed

    const submissions = await Submission.find({ form: formId }).sort({ createdAt: -1 });

    if (format === 'csv') {
      // Process and format data for CSV export
      const headers = ['Submission ID', 'Submission Date', 'Respondent Email'];

      // Add question headers
      form.questions.forEach(q => {
        headers.push(q.text);
      });

      const rows = submissions.map(sub => {
        const row = [sub._id.toString(), sub.createdAt.toISOString(), sub.respondent?.email || ''];

        // Add question answers
        form.questions.forEach(q => {
          const answer = sub.answers.find(a => a.questionId === q.id);
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
          id: q.id,
          text: q.text,
          type: q.type
        }))
      },
      submissions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error exporting form data', error: error.message });
  }
};