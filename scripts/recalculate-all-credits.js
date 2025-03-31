/**
 * This script will find all projects that have been approved by the Executive Director
 * and create credits for all users in their workplans who don't already have credits.
 *
 * Usage:
 * 1. Run from the server root directory:
 *    node scripts/recalculate-all-credits.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/project_model');
const Credit = require('../models/credit_model');

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
}

async function disconnectFromDatabase() {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
}

async function recalculateAllProjectCredits() {
  try {
    console.log('Starting credit recalculation for all approved projects...');

    // Find all projects that have been approved by the Executive Director
    const approvedProjects = await Project.find({
      'isApproved.byExecutiveDirector.approved': true,
      isActivated: true
    });

    console.log(`Found ${approvedProjects.length} approved projects`);

    let totalCreditsCreated = 0;

    // Process each project
    for (const project of approvedProjects) {
      console.log(`Processing project: ${project.title} (${project._id})`);

      let projectCreditsCreated = 0;

      // Process each workplan entry
      if (project.workPlan && project.workPlan.length > 0) {
        for (const workPlanItem of project.workPlan) {
          // Skip if no user ID
          if (!workPlanItem.espUserId) {
            console.log('- Skipping workplan item with no espUserId');
            continue;
          }

          try {
            // Check if credit already exists
            const existingCredit = await Credit.findOne({
              user: workPlanItem.espUserId,
              project: project._id,
              source: 'project'
            });

            // Skip if credit already exists
            if (existingCredit) {
              console.log(
                `- Credit already exists for user ${workPlanItem.espUserId} (${workPlanItem.espName})`
              );
              continue;
            }

            // Create new credit
            const credit = new Credit({
              type: project.engagementType || 'College-Driven',
              user: workPlanItem.espUserId,
              project: project._id,
              projectId: project._id.toString(),
              hours: workPlanItem.hoursReceived || 0,
              description: `Credit for ${project.title} - Role: ${
                workPlanItem.role || 'Participant'
              }`,
              source: 'project'
            });

            await credit.save();
            projectCreditsCreated++;
            totalCreditsCreated++;
            console.log(
              `- Created credit for user ${workPlanItem.espUserId} (${workPlanItem.espName})`
            );
          } catch (err) {
            console.error(
              `- Error creating credit for user ${workPlanItem.espUserId}:`,
              err.message
            );
          }
        }
      } else {
        console.log('- No workplan items found');
      }

      console.log(`- Created ${projectCreditsCreated} credits for project ${project.title}`);
    }

    console.log(
      `\nRecalculation complete. Created ${totalCreditsCreated} new credits across ${approvedProjects.length} projects.`
    );
  } catch (error) {
    console.error('Error in recalculation process:', error.message);
  }
}

// Run the script
(async () => {
  try {
    await connectToDatabase();
    await recalculateAllProjectCredits();
  } catch (error) {
    console.error('Script error:', error.message);
  } finally {
    await disconnectFromDatabase();
  }
})();
