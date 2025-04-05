const ExternalCrediting = require('../models/external_crediting_model');
const Form = require('../models/form_model');
const FormResponse = require('../models/response_model');
const mongoose = require('mongoose');

// Link a form to a category
exports.linkForm = async (req, res) => {
  try {
    const { category, formId } = req.body;

    // Log the request for debugging
    console.log('Form link request:', {
      category,
      formId,
      user: req.user
        ? {
            id: req.user.id || req.user._id,
            role: req.user.role,
            usertype: req.user.usertype
          }
        : 'No user in request'
    });

    // Additional permission check
    const userRole = req.user?.role || req.user?.usertype;
    const allowedRoles = ['Admin', 'ComEx Coordinator'];

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log(`Access denied for user with role ${userRole}`);
      return res.status(403).json({
        message: 'Access denied. You do not have permission to perform this action.'
      });
    }

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

    console.log('Form linked successfully', {
      category,
      formId,
      externalCreditingId: externalCrediting._id
    });

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
    const responses = await FormResponse.find({ form: linkedForm.formId })
      .populate('respondent.user', 'firstName lastName email department')
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

    // If the response is approved, create a credit for the user
    if (status === 'approved' && credits > 0) {
      try {
        // Find the linked form to determine credit type (category)
        const form = await Form.findById(response.form);
        if (!form) {
          console.error('Form not found for response:', responseId);
          return res.status(404).json({
            message: 'Form not found for this response'
          });
        }

        // Find the external crediting record to determine the category
        const externalCreditingRecord = await ExternalCrediting.findOne({
          formId: form._id,
          isActive: true
        });

        if (!externalCreditingRecord) {
          console.error('External crediting record not found for form:', form._id);
          return res.status(404).json({
            message: 'External crediting record not found for this form'
          });
        }

        // Map category to credit type
        let creditType;
        if (externalCreditingRecord.category === 'extension-services') {
          creditType = 'Extension Services';
        } else if (externalCreditingRecord.category === 'capacity-building') {
          creditType = 'Capacity Building';
        } else {
          console.error('Unknown external crediting category:', externalCreditingRecord.category);
          return res.status(400).json({
            message: 'Unknown external crediting category'
          });
        }

        // Get the user ID from the response
        const userId = response.respondent?.user || response.userId;
        if (!userId) {
          console.error('User ID not found in response:', responseId);
          return res.status(400).json({
            message: 'User ID not found in the response'
          });
        }

        // Extract or create title for the credit
        let title = 'External Crediting Activity';
        // Look for a title or description in the answers
        if (response.answers && response.answers.length > 0) {
          // Try to find a title-like question answer (common question titles to look for)
          const titleKeywords = ['title', 'activity', 'program', 'event', 'name', 'project'];
          const descriptionKeywords = ['describe', 'description', 'details', 'about'];

          // First try to find a title-like field
          for (const keyword of titleKeywords) {
            const titleAnswer = response.answers.find(a =>
              form.questions.find(
                q =>
                  q._id.toString() === a.questionId.toString() &&
                  q.title.toLowerCase().includes(keyword)
              )
            );

            if (titleAnswer && typeof titleAnswer.value === 'string' && titleAnswer.value.trim()) {
              title = titleAnswer.value.trim();
              break;
            }
          }

          // If no title found, try to find a description-like field
          if (title === 'External Crediting Activity') {
            for (const keyword of descriptionKeywords) {
              const descAnswer = response.answers.find(a =>
                form.questions.find(
                  q =>
                    q._id.toString() === a.questionId.toString() &&
                    q.title.toLowerCase().includes(keyword)
                )
              );

              if (descAnswer && typeof descAnswer.value === 'string' && descAnswer.value.trim()) {
                title = descAnswer.value.trim();
                break;
              }
            }
          }
        }

        // Create the credit
        const Credit = require('../models/credit_model');
        const credit = new Credit({
          type: creditType,
          user: userId,
          response: responseId,
          hours: credits,
          description: title,
          source: 'form'
        });

        await credit.save();
        console.log('Credit created successfully for approved response:', {
          responseId,
          userId,
          creditId: credit._id,
          type: creditType,
          hours: credits
        });
      } catch (creditError) {
        console.error('Error creating credit for approved response:', creditError);
        // Continue with the response but log the error
      }
    }

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
