# ComEx Project Registration Testing Guide

This guide will help you test the project registration flow in the ComEx system.

## Prerequisites

1. Node.js and npm installed
2. MongoDB running locally or a connection to a MongoDB instance
3. Postman installed for API testing
4. ComEx server running (default: http://localhost:0369)

## Postman Collection

Import the Postman collection found in `postman-collection/project-registration-testing.json` to test the full flow.

## Testing Flow

### 1. Project Creation

The first step is to create a project. There are two types of projects:

- **Institutional Projects**: Created within the ComEx office, no approval needed
- **College-Driven Projects**: Created by college administration, requires approval

Use the "Create Project" or "Create College-Driven Project" endpoints to create a new project.

After creating a project, set the returned project ID in the Postman collection variables:

1. Click the "eye" icon in the top-right of Postman
2. Set the `projectId` variable to the ID of the created project

### 2. Project Approval

College-Driven projects require approval before they can be used. The approval process has two layers:

#### First Layer: Work Plan Signatures

College-Driven projects with people in the workPlan need signatures from all workPlan participants.
Use the "Sign Work Plan Item" endpoint to add signatures to the workPlan items.

#### Second Layer: Hierarchy Approval

The project needs approval from the following roles (in order):

1. Department Representative
2. Dean
3. Executive Director

Use the corresponding approval endpoints to approve the project at each level.

### 3. Form Linking

Once a project is approved, forms can be linked to it. A project typically has two types of linked forms:

- **Registration Form**: For participants to register for the project
- **Evaluation Form**: For participants to evaluate the project after completion

Use the "Link Form to Project" endpoints to link forms to your project.

### 4. Registration Process

When a user completes a registration form:

1. The response is saved (this happens automatically when a form is submitted)
2. An admin approves the registration with the "Process Registration from Response" endpoint
3. A registration record is created linking the user to the project

### 5. Crediting Process

When a project is complete and a user submits an evaluation form:

1. The response is saved
2. An admin awards credit based on the response using the "Award Credit from Response" endpoint
3. A credit record is created with the user's participation hours

## Sample IDs for Testing

- User ID: 66fe9b3bfd0079f9f590327b
- Form ID: 67c2de5b23f4977a0c96c920
- Response ID: 67dbc909a8a27717e00d053b

## Troubleshooting

- Make sure your MongoDB connection is working
- Check that all required fields are provided in your requests
- Verify that the IDs used in your requests exist in the database
- Ensure that projects are fully approved before attempting to register users

## Full Testing Workflow Example

1. Create a College-Driven project
2. Sign all work plan items
3. Get approval from Representative
4. Get approval from Dean
5. Get approval from Executive Director
6. Link a registration form to the project
7. Process a registration from a form response
8. Link an evaluation form to the project
9. Award credit from an evaluation form response
10. View the user's credits for the project

Following this workflow will test the entire project registration and crediting process.

## Note About System Structure

The system has been redesigned to use projects directly instead of activities. All functionality previously handled by activities is now integrated into the project model for a more streamlined experience.
