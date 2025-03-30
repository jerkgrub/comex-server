const ExternalCrediting = require('../models/external_crediting_model');
const Form = require('../models/form_model');
const FormResponse = require('../models/form_response_model');
const mongoose = require('mongoose');

// Link a form to a category
exports.linkForm = async (req, res) => {
  try {
    const { category, formId } = req.body;

    // Validate inputs
    if (!category || !formId) {
      return res.status(400).json({
        message: 'Category and formId are required'
      });
    }

    // Check if the form exists
    const formExists = await Form.findById(formId);
    if (!formExists) {
      return res.status(404).json({
        message: 'Form not found'
      });
    }

    // Deactivate any existing linked form for this category
    await ExternalCrediting.updateMany({ category, isActive: true }, { isActive: false });

    // Create new link
    const externalCrediting = new ExternalCrediting({
      category,
      formId,
      isActive: true
    });

    await externalCrediting.save();

    res.status(201).json({
      message: 'Form linked successfully',
      externalCrediting
    });
  } catch (error) {
    console.error('Error linking form:', error);
    res.status(500).json({
      message: 'Error linking form',
      error: error.message
    });
  }
};

// Unlink a form from a category
exports.unlinkForm = async (req, res) => {
  try {
    const { category } = req.params;

    // Validate input
    if (!category) {
      return res.status(400).json({
        message: 'Category is required'
      });
    }

    // Deactivate the linked form for this category
    const result = await ExternalCrediting.updateMany(
      { category, isActive: true },
      { isActive: false }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        message: 'No active form found for this category'
      });
    }

    res.status(200).json({
      message: 'Form unlinked successfully'
    });
  } catch (error) {
    console.error('Error unlinking form:', error);
    res.status(500).json({
      message: 'Error unlinking form',
      error: error.message
    });
  }
};

// Get all linked forms
exports.getLinkedForms = async (req, res) => {
  try {
    const linkedForms = await ExternalCrediting.find({ isActive: true }).populate('formId').lean();

    // Format the response
    const formattedResponse = linkedForms.reduce((acc, item) => {
      acc[item.category] = {
        _id: item._id,
        formId: item.formId
      };
      return acc;
    }, {});

    res.status(200).json({
      linkedForms: formattedResponse
    });
  } catch (error) {
    console.error('Error getting linked forms:', error);
    res.status(500).json({
      message: 'Error getting linked forms',
      error: error.message
    });
  }
};

// Get linked form for a specific category
exports.getLinkedFormByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Validate input
    if (!category) {
      return res.status(400).json({
        message: 'Category is required'
      });
    }

    const linkedForm = await ExternalCrediting.findOne({ category, isActive: true })
      .populate('formId')
      .lean();

    if (!linkedForm) {
      return res.status(404).json({
        message: 'No form linked to this category'
      });
    }

    res.status(200).json({
      linkedForm
    });
  } catch (error) {
    console.error('Error getting linked form:', error);
    res.status(500).json({
      message: 'Error getting linked form',
      error: error.message
    });
  }
};

// Get all form responses for a category
exports.getFormResponsesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Get the linked form for this category
    const linkedForm = await ExternalCrediting.findOne({ category, isActive: true });

    if (!linkedForm) {
      return res.status(404).json({
        message: 'No form linked to this category'
      });
    }

    // Get all responses for this form
    const responses = await FormResponse.find({ formId: linkedForm.formId })
      .populate('userId', 'firstName lastName email department')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      responses
    });
  } catch (error) {
    console.error('Error getting form responses:', error);
    res.status(500).json({
      message: 'Error getting form responses',
      error: error.message
    });
  }
};

// Approve or reject a form response for crediting
exports.reviewFormResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { status, credits, comments } = req.body;

    // Validate inputs
    if (!responseId || !status) {
      return res.status(400).json({
        message: 'Response ID and status are required'
      });
    }

    // Check if the response exists
    const response = await FormResponse.findById(responseId);
    if (!response) {
      return res.status(404).json({
        message: 'Form response not found'
      });
    }

    // Update the response with credit information
    response.creditStatus = status;
    response.creditsAwarded = credits || 0;
    response.creditComments = comments || '';
    response.reviewedAt = new Date();
    response.reviewedBy = req.user._id;

    await response.save();

    res.status(200).json({
      message: 'Form response reviewed successfully',
      response
    });
  } catch (error) {
    console.error('Error reviewing form response:', error);
    res.status(500).json({
      message: 'Error reviewing form response',
      error: error.message
    });
  }
};
