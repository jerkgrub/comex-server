# COMEX Server Testing Guide

This guide will help you test the COMEX server backend using the provided Postman collections.

## Prerequisites

1. Make sure you have [Postman](https://www.postman.com/downloads/) installed
2. Ensure your MongoDB database is running
3. Start the COMEX server locally

## Starting the Server

1. Clone the repository (if you haven't already)
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=0369
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```
   npm start
   ```

## Importing Postman Collections

1. Open Postman
2. Click on "Import" in the top left corner
3. Select the JSON files from the `postman-collection` folder:
   - `activities-collection.json`
   - `programs-collection.json`
   - `projects-collection.json`
   - `forms-collection.json`
   - `credits-collection.json`

## Testing Flow

For a complete test of the system, follow this recommended testing flow:

### 1. User Authentication

1. Register a new user
2. Login with the user credentials
3. Save the JWT token for subsequent requests

### 2. Programs and Projects

1. Create a new program
2. Get the program ID and create a project under it
3. Verify the project was created successfully

### 3. Activities

1. Create a new activity linked to a project
2. Get all activities to verify it was created
3. Test the various activity filters (approved, pending, etc.)

### 4. Forms

1. Create a new form
2. Link the form to an activity
3. Submit responses to the form
4. View form analytics

### 5. Credits

1. Check user credits
2. View activity credits
3. View form credits

## Environment Variables

Set up the following environment variables in Postman:

- `baseUrl`: http://localhost:0369
- `userId`: (after creating a user)
- `programId`: (after creating a program)
- `projectId`: (after creating a project)
- `activityId`: (after creating an activity)
- `formId`: (after creating a form)
- `activityFormId`: (after linking a form to an activity)
- `creditId`: (after credits are awarded)

## Testing New Features

### Activity-Form Integration

1. Create a form using the Forms API
2. Create an activity using the Activities API
3. Link the form to the activity using the "Link Form to Activity" endpoint
4. Submit a form response with the activity context
5. Verify credits are awarded based on the form submission

### Credit Management

1. View user credits using the "Get user credits" endpoint
2. View activity credits using the "Get activity credits" endpoint
3. View form credits using the "Get form credits" endpoint
4. Test revoking a credit using the "Revoke credit" endpoint

## Troubleshooting

- If you encounter connection issues, ensure MongoDB is running
- Check that the server is running on port 0369
- Verify your JWT token is valid and included in the Authorization header
- Check the server logs for any error messages

## Complete API Documentation

For a complete list of all available endpoints and their parameters, refer to the Postman collections or the route files in the `routes` directory.
