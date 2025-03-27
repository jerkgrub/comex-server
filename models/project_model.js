const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    isActivated: Boolean, //for soft-deletion
    proposedBy: String, // signed in user's id
    programId: String, // Foreign key reference to Program
    department: String, //must be same department as the program
    approvalStatus: {
      type: String,
      enum: ['draft', 'layer1_pending', 'layer1_approved', 'layer2_pending', 'approved'],
      default: 'draft'
    },
    //This model mirrors the ComEx Project Proposal Form which is a microsoft document.

    // A. ComEx Engagement
    engagementType: String, //Instituional, College-Driven, Extension Service, Capacity-Building

    // B. Project Description
    title: String,
    startDate: String, // implementation timeframe
    endDate: String,
    startTime: String,
    endTime: String,
    venue: String,
    description: String, //long paragraph
    objectives: [String], //ex. To improve the quality of life of the community, To promote sustainable development, To enhance the skills of the community, To promote peace and security, To promote good health and well-being, To ensure inclusive and equitable quality education and promote lifelong learning opportunities for all
    methodology: [String], //ex. Action Research, Action Learning, Action Research and Action Learning, Action Research and Action Learning and Action Research, Action Research and Action Learning and Action Research and Action Learning
    sdg: [String], //SDG 17, SDG 18

    // C. Project Proponents Information
    implementingOffice: String, // NU-MOA School of Information Technology
    academicProgram: String, //ex. BSIT
    collaboratingOffice: String, //ex. NU-MOA School COMEX office
    cooperatingAgency: String,
    fundingAgency: String,

    // D. Partner Community Profile
    partnerCommunity: String, //ex. Barangay 123
    sector: String,
    address: String,
    contactName: String, //ex. Juanito dela Cruz
    contactDesignation: String, //ex. Barangay Kagawad
    contactDetails: String, //ex. 09123456789 or email@example.com
    beneficiaries: String,
    expectedParticipants: String, //ex. 15 students (ITCS, JPCS and Hydroid Officers) & 12 Faculty Members

    // E. Project Work Plan
    workPlan: [
      {
        activity: String, // e.g., "Volunteer"
        espName: String, // Name of Extension Service Provider (e.g., "Marilou Jamis")
        espUserId: String, // User ID of the person signing the work plan
        role: String, // Role (e.g., "Project Leader")
        hoursReceived: Number, // Number of Hours (e.g., 8)
        signature: String, // Track signatures (e.g., image URL or hash)
        signedAt: Date
      }
    ],

    // F. Student Involvement
    studentInvolvement: [
      {
        organization: String, // e.g., "ITCS", "JPCS", "HYOROID"
        studentName: String, // Name of student (e.g., "Karanha Bernice A. Aguilar")
        role: String, // Role (e.g., "Organizer")
        hoursToRender: Number, // Number of Hours (e.g., 8)
        notedBy: String // Signature of the person noting the entry (e.g., "Cheryl Lou R. Tinaan")
      }
    ],

    // G. Risk Management
    riskManagement: [
      {
        riskIdentification: String, // e.g., "Spread of illnesses..."
        riskMitigation: String // e.g., "Adhere to health and safety protocols..."
      }
    ],

    // H. Budgetary Requirements
    budgetaryRequirements: [
      {
        particulars: String, // e.g., "Snack for the Elders & Facility staffs"
        quantity: Number, // QTY (e.g., 65). Use `null` if empty.
        amountPerQty: Number, // Amount per QTY (e.g., 150). Use `null` if empty.
        totalAmount: Number, // Total Amount (e.g., 9750 for "9,750")
        sourceOfFund: String // e.g., "Students & Teachers Donation"
      }
    ],
    // ----------------------------------------------------------------------------------------------------------------------------
    // Approval System
    isApproved: {
      // the 2 below are department-specific
      byRepresentative: {
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String, //userId
        signature: String
      },
      byDean: {
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String, //userId
        signature: String
      },
      byGeneralAccountingSupervisor: {
        // General Accounting Supervisor
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String, //userId
        signature: String
      },
      byComexCoordinator: {
        // Comex Coordinator
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String, //userId
        signature: String
      },
      byAcademicServicesDirector: {
        // Academic Services Director
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String, //userId
        signature: String
      },
      byAcademicDirector: {
        // Academic Director
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String, //userId
        signature: String
      },
      byExecutiveDirector: {
        // Executive Director
        approved: { type: Boolean, default: false },
        approvedOn: String,
        approvedBy: String, //userId
        signature: String
      }
    },
    // ----------------------------------------------------------------------------------------------------------------------------
    // Registration
    registrationStart: String,
    registrationEnd: String
  },

  { timestamps: true }
);

ProjectSchema.methods.checkLayer1Approval = function () {
  if (this.workPlan.length === 0) return 'skip'; // Institutional projects
  return this.workPlan.every(entry => entry.signature) ? 'approved' : 'pending';
};

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
