const Form = require('../models/form_model'); // Adjust path to your model

// Generic function to approve a role
const approveRole = async (req, res, role) => {
  try {
    // define inputs
    const { formId } = req.params; // Assuming form ID is passed in URL params
    const { approvedBy } = req.body.isApproved[0]; // Extract approvedBy from request body

    // Validate input
    if (!formId) return res.status(400).json({ message: "Form ID is required" });
    if (!approvedBy) return res.status(400).json({ message: "approvedBy is required" });

    // Find the form
    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ message: "Form not found" });

    // Check if the role already exists in isApproved
    const approvalIndex = form.isApproved.findIndex(a => a.role === role);
    
    if (approvalIndex === -1) {
      // Role not found, add a new approval entry
      form.isApproved.push({
        role,
        approved: true,
        approvedBy
      });
    } else {
      // Role exists, update it
      form.isApproved[approvalIndex].approved = true;
      form.isApproved[approvalIndex].approvedBy = approvedBy;
    }

    // Save the form (middleware will set approvedAt)
    await form.save();

    res.status(200).json({ message: `${role} approval updated`, form });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Specific route handlers
exports.approveRepresentative = (req, res) => approveRole(req, res, "Representative");
exports.approveDean = (req, res) => approveRole(req, res, "Dean");