# Institutional Form Auto-Approval System

This document outlines the changes made to implement automatic approval of form responses for institutional projects.

## Overview

Two new endpoints have been added to support auto-approval of form responses:

1. **`GET /form/:formId/project-info`** - Gets information about a form and its linked project
2. **`POST /form/responses/:responseId/auto-approve`** - Auto-approves a response and creates associated records

## Implementation Details

### 1. Get Form Project Info

This endpoint determines if a form is linked to an institutional project.

**Request:**

```http
GET /form/:formId/project-info
```

**Response:**

```json
{
  "formId": "form-id-here",
  "formType": "registration",
  "projectId": "project-id-here",
  "projectType": "Institutional",
  "isInstitutional": true
}
```

### 2. Auto-Approve Response

This endpoint automatically approves form responses and creates registration/credit records.

**Request:**

```http
POST /form/responses/:responseId/auto-approve
```

**Request Body:**

```json
{
  "formId": "form-id-here",
  "projectId": "project-id-here",
  "formType": "registration"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Response auto-approved successfully",
  "response": {
    "_id": "response-id-here",
    "status": "approved"
  },
  "credit": {
    "_id": "credit-id-here",
    "hours": 1
  }
}
```

## Testing Instructions

### Testing Form Project Info

1. Find a form ID that is linked to an institutional project
2. Make a GET request to `/form/:formId/project-info`
3. Verify that the response includes `isInstitutional: true` if linked to an institutional project

### Testing Auto-Approval

1. Submit a form that's linked to an institutional project
2. Get the response ID from the form submission response
3. Make a POST request to `/form/responses/:responseId/auto-approve` with the following body:
   ```json
   {
     "formId": "your-form-id",
     "projectId": "your-project-id",
     "formType": "registration" // or "evaluation"
   }
   ```
4. Verify that:
   - The response status changes to "approved"
   - A credit record is created with 1 hour
   - For registration forms, a registration record is created

## Postman Testing Examples

### Example 1: Get Form Project Info

```
GET {{apiUrl}}/form/65f43219ab123456789012/project-info
```

### Example 2: Auto-Approve Response

```
POST {{apiUrl}}/form/responses/65f43219ab123456789013/auto-approve
Content-Type: application/json

{
  "formId": "65f43219ab123456789012",
  "projectId": "65f43219ab123456789014",
  "formType": "registration"
}
```

## Integration with Frontend

The frontend has been updated to:

1. Check if a form is linked to an institutional project using `useGetProjectFormInfo`
2. Automatically approve form responses for institutional projects using `useAutoApproveInstitutionalResponse`
3. Show appropriate UI status for auto-approved responses

The auto-approval happens right after form submission, creating all necessary registration and credit records automatically.
