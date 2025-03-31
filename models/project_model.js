const mongoose = require('mongoose');

// READ ME!
// projects mainly have 2 types, Institutional and College-Driven,
// projects that are engagementType "Institutional" are called as projects in the backend, but in the frontend they are called as activities
// projects that are engagementType "College-Driven" are called as projects in both frontend and backend

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
      byComexCoordinator: {
        // Comex Coordinator
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
    // these are now for projects that have engagementType "Institutional"
    // REMOVED: registrationStart, registrationEnd, it will just be common-sense that once the project has been created, it will be available for registration until startDate
    thumbnail: String,
    // wait muna natin yung wireframe ni ban
    
  },

  { timestamps: true }
);

ProjectSchema.methods.checkLayer1Approval = function () {
  if (this.workPlan.length === 0) return 'skip'; // Institutional projects
  return this.workPlan.every(entry => entry.signature) ? 'approved' : 'pending';
};

// Add a pre-update hook to handle preserving signatures in workPlan

// This method will be called before updating a project
ProjectSchema.statics.updateWithSignaturePreservation = async function (projectId, projectData) {
  try {
    // Check if we should preserve signatures
    const shouldPreserveSignatures = projectData._preserveSignatures;

    console.log('====== SIGNATURE PRESERVATION DEBUGGER ======');
    console.log('ProjectID:', projectId);
    console.log('Preserve signatures flag:', shouldPreserveSignatures);
    console.log('Incoming workPlan items:', projectData.workPlan?.length || 0);

    // Remove the flag from the update data
    if (shouldPreserveSignatures) {
      delete projectData._preserveSignatures;
      console.log('Removed _preserveSignatures flag from update data');
    }

    // First, get the current project to have access to all its data
    const currentProject = await this.findById(projectId);

    if (!currentProject) {
      console.log('WARNING: Project not found with ID:', projectId);
      throw new Error('Project not found');
    }

    // Log the original workplan before any changes
    console.log(
      'ORIGINAL PROJECT WORKPLAN:',
      currentProject.workPlan.map(item => ({
        espUserId: item.espUserId,
        espName: item.espName,
        activity: item.activity,
        hasSignature: !!item.signature,
        signedAt: item.signedAt
      }))
    );

    // If we need to preserve signatures and there's workPlan data
    if (
      shouldPreserveSignatures &&
      projectData.workPlan &&
      projectData.workPlan.length > 0 &&
      currentProject.workPlan
    ) {
      console.log('Preserving signatures during update...');

      // Create a map of workPlan items by espUserId for easy lookup
      const signatureMap = {};

      currentProject.workPlan.forEach(item => {
        if (item.espUserId && (item.signature || item.signedAt)) {
          signatureMap[item.espUserId] = {
            signature: item.signature,
            signedAt: item.signedAt
          };
          console.log(`Found existing signature for ESP ID ${item.espUserId} (${item.espName})`);
        }
      });

      console.log('Signature map keys:', Object.keys(signatureMap));

      // Update the incoming workPlan data to keep signatures
      projectData.workPlan = projectData.workPlan.map(item => {
        // If the ESP user already signed this workplan item, preserve the signature
        if (item.espUserId && signatureMap[item.espUserId]) {
          console.log(`Preserving signature for ESP ID ${item.espUserId} (${item.espName})`);
          return {
            ...item,
            signature: signatureMap[item.espUserId].signature,
            signedAt: signatureMap[item.espUserId].signedAt
          };
        }
        console.log(`No existing signature found for ESP ID ${item.espUserId} (${item.espName})`);
        return item;
      });

      console.log(
        'UPDATED WORKPLAN WITH PRESERVED SIGNATURES:',
        projectData.workPlan.map(item => ({
          espUserId: item.espUserId,
          espName: item.espName,
          hasSignature: !!item.signature,
          signedAt: item.signedAt
        }))
      );
    } else {
      console.log('Skipping signature preservation - condition not met');
      if (!shouldPreserveSignatures) console.log('Reason: preserveSignatures flag not set');
      if (!projectData.workPlan) console.log('Reason: workPlan is not defined');
      if (projectData.workPlan && projectData.workPlan.length === 0)
        console.log('Reason: workPlan is empty');
    }

    // Instead of using findByIdAndUpdate, we'll directly update the current project object
    // and save it to ensure all data is properly merged

    // Update all fields from projectData
    Object.keys(projectData).forEach(key => {
      currentProject[key] = projectData[key];
    });

    // Save the updated project
    console.log('Saving updated project with preserved signatures...');
    await currentProject.save();

    // Reload the project to verify the changes
    const finalProject = await this.findById(projectId);

    // Verify signatures were preserved
    if (finalProject.workPlan && finalProject.workPlan.length > 0) {
      const signedItems = finalProject.workPlan.filter(item => item.signature);
      console.log('VERIFICATION: Items with signatures after save:', signedItems.length);
      signedItems.forEach(item => {
        console.log(`Verified signature for ${item.espName} (${item.espUserId})`);
      });
    }

    console.log('Update complete. Workplan items in result:', finalProject.workPlan.length);
    console.log('====== END SIGNATURE PRESERVATION DEBUGGER ======');

    return finalProject;
  } catch (error) {
    console.error('ERROR in updateWithSignaturePreservation:', error);
    throw error;
  }
};

const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;
