# Backend API Specification for SteadiDay

## Overview

This document provides complete backend API specifications for the SteadiDay app. All endpoints must implement the security requirements outlined in `SECURITY_ENHANCEMENTS.md`.

**Version:** 1.0.0
**Last Updated:** 2025-12-01
**Base URL:** `https://api.dailycompanion.com`

---

## Table of Contents

1. [Authentication Endpoints](#1-authentication-endpoints)
2. [Privacy Endpoints (GDPR/CCPA)](#2-privacy-endpoints-gdprccpa)
3. [User Profile Endpoints](#3-user-profile-endpoints)
4. [Medication Endpoints](#4-medication-endpoints)
5. [Task & Reminder Endpoints](#5-task--reminder-endpoints)
6. [Health Metrics Endpoints](#6-health-metrics-endpoints)
7. [Emergency Contacts Endpoints](#7-emergency-contacts-endpoints)
8. [Insurance Card Endpoints](#8-insurance-card-endpoints)
9. [Notes Endpoints](#9-notes-endpoints)
10. [Caregiver Access (Optional)](#10-caregiver-access-optional)
11. [Security Requirements](#11-security-requirements)
12. [Database Schema](#12-database-schema)
13. [Integration Notes](#13-integration-notes)
14. [Backend To-Do List](#14-backend-to-do-list)

---

## 1. Authentication Endpoints

### Base Path: `/auth`

All authentication endpoints use generic error messages to prevent account enumeration attacks.

---

### POST `/auth/register`

Create a new user account.

**Rate Limiting:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "dateOfBirth": "1955-06-15",
  "timezone": "America/New_York"
}
```

**Validation Rules:**
- `email`: Valid email format, max 255 chars, case-insensitive, must be unique
- `password`: Min 6 chars (client enforces 6+, backend should enforce 8+ for production)
- `name`: 1-100 chars, alphanumeric and spaces only
- `dateOfBirth`: ISO 8601 date format, user must be 18+ years old
- `timezone`: Valid IANA timezone identifier

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123xyz",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpiry": "2025-12-01T12:30:00Z"
  }
}
```

**Error Responses:**

```json
// Generic error (400) - Don't reveal if email exists
{
  "success": false,
  "error": "Unable to create account. Please check your information and try again."
}

// Rate limit exceeded (429)
{
  "success": false,
  "error": "Too many registration attempts. Please try again in 15 minutes."
}

// Validation error (400)
{
  "success": false,
  "error": "Please provide valid information for all required fields."
}
```

**Backend Implementation:**
1. Validate all fields
2. Check if email already exists (but don't reveal this to user)
3. Hash password using bcrypt (cost factor 12+)
4. Create user record with `emailVerified: false`
5. Generate access token (15-30 min expiry)
6. Generate refresh token (7-30 day expiry)
7. Send welcome email with verification link (async, don't block response)
8. Log registration event (audit trail)
9. Return tokens

**Security Notes:**
- Never reveal if email already exists
- Use generic error messages for all failures
- Hash passwords before storage (never store plain text)
- Rate limit aggressively to prevent abuse
- Validate email format server-side (don't trust client)

---

### POST `/auth/login`

Authenticate existing user.

**Rate Limiting:** 10 requests per 15 minutes per IP + per email

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Validation Rules:**
- `email`: Valid email format, case-insensitive
- `password`: Required, any string

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123xyz",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpiry": "2025-12-01T12:30:00Z"
  }
}
```

**Error Responses:**

```json
// Generic auth error (401) - Same message for wrong email or password
{
  "success": false,
  "error": "Invalid email or password. Please try again."
}

// Account locked (429)
{
  "success": false,
  "error": "Too many login attempts. Your account has been temporarily locked. Please try again in 30 minutes or reset your password."
}

// Rate limit (429)
{
  "success": false,
  "error": "Too many login attempts. Please try again in 15 minutes."
}
```

**Backend Implementation:**
1. Find user by email (case-insensitive)
2. Check if account is locked due to failed attempts
3. Compare password hash using bcrypt.compare()
4. Increment failed login counter on failure
5. Lock account after 5 failed attempts (30 min lockout)
6. Reset failed login counter on success
7. Generate new access token (15-30 min expiry)
8. Generate new refresh token (7-30 day expiry)
9. Invalidate old refresh tokens (optional: keep 1-2 recent)
10. Log login event (audit trail)
11. Return tokens

**Security Notes:**
- Same error message for wrong email or wrong password
- Lock account after 5 failed attempts
- Rate limit by IP AND by email
- Log all login attempts (successful and failed)
- Invalidate old refresh tokens on new login
- Never reveal if email exists in system

---

### POST `/auth/refresh`

Refresh expired access token using refresh token.

**Rate Limiting:** 100 requests per hour per user

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Headers:**
```
Authorization: Bearer <expired-access-token> (optional)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpiry": "2025-12-01T12:30:00Z"
  }
}
```

**Error Responses:**

```json
// Invalid or expired refresh token (401)
{
  "success": false,
  "error": "Your session has expired. Please sign in again."
}

// Token revoked (401)
{
  "success": false,
  "error": "Your session has expired. Please sign in again."
}
```

**Backend Implementation:**
1. Validate refresh token signature and expiry
2. Check if refresh token is revoked/invalidated
3. Verify user still exists and is active
4. Generate new access token (15-30 min expiry)
5. Optionally rotate refresh token (recommended)
6. Invalidate old refresh token if rotated
7. Return new tokens

**Security Notes:**
- Validate token signature using secret key
- Check token hasn't been revoked
- Optionally rotate refresh tokens (recommended for high security)
- Log token refresh events
- Generic error message for all failures

---

### POST `/auth/logout`

Invalidate user session and tokens.

**Rate Limiting:** None (users can always log out)

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

**Error Responses:**

```json
// Invalid token (401) - Still return success for client simplicity
{
  "success": true,
  "message": "Successfully logged out"
}
```

**Backend Implementation:**
1. Extract userId from access token
2. Revoke/invalidate the provided refresh token
3. Optionally revoke all user's refresh tokens (logout all devices)
4. Log logout event
5. Always return success (even if token invalid)

**Security Notes:**
- Always return success to client (idempotent)
- Revoke refresh token in database
- Log logout for audit trail
- Consider offering "logout all devices" option

---

### GET `/auth/me`

Get current authenticated user's information.

**Rate Limiting:** 100 requests per hour per user

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123xyz",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "dateOfBirth": "1955-06-15",
    "timezone": "America/New_York",
    "createdAt": "2025-01-01T00:00:00Z",
    "lastLoginAt": "2025-12-01T10:00:00Z"
  }
}
```

**Error Responses:**

```json
// Invalid token (401)
{
  "success": false,
  "error": "Authentication required. Please sign in."
}

// Expired token (401)
{
  "success": false,
  "error": "Your session has expired. Please sign in again."
}
```

**Backend Implementation:**
1. Validate access token
2. Extract userId from token
3. Fetch user from database
4. Return user info (no sensitive data)

**Security Notes:**
- Never return password hash or internal IDs
- Validate token on every request
- Don't return other users' data

---

### POST `/auth/forgot-password`

Initiate password reset flow.

**Rate Limiting:** 3 requests per hour per IP + per email

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent. Please check your email."
}
```

**Error Responses:**

```json
// Rate limit (429)
{
  "success": false,
  "error": "Too many password reset requests. Please try again in 1 hour."
}
```

**Backend Implementation:**
1. Check if email exists (don't reveal to user)
2. If exists, generate password reset token (random, 32+ bytes)
3. Store token with 24-hour expiry
4. Send password reset email with link
5. Always return same success message
6. Log password reset request

**Security Notes:**
- Never reveal if email exists
- Same success message always
- Token expires in 24 hours
- One-time use token
- Rate limit aggressively

---

### POST `/auth/reset-password`

Complete password reset with token.

**Rate Limiting:** 10 requests per hour per IP

**Request Body:**
```json
{
  "token": "abc123xyz789...",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Your password has been reset successfully. You can now sign in with your new password."
}
```

**Error Responses:**

```json
// Invalid or expired token (400)
{
  "success": false,
  "error": "This password reset link is invalid or has expired. Please request a new one."
}

// Weak password (400)
{
  "success": false,
  "error": "Password must be at least 8 characters long."
}
```

**Backend Implementation:**
1. Validate reset token
2. Check token hasn't expired (24 hours)
3. Check token hasn't been used
4. Validate new password strength
5. Hash new password
6. Update user password
7. Mark token as used
8. Invalidate all user's refresh tokens (force re-login)
9. Send confirmation email
10. Log password reset completion

**Security Notes:**
- One-time use tokens
- Expire tokens after 24 hours
- Invalidate all sessions on password reset
- Log all password resets

---

## 2. Privacy Endpoints (GDPR/CCPA)

### Base Path: `/privacy`

All privacy endpoints require authentication and comprehensive logging for compliance.

---

### GET `/privacy/export-data`

Export all user data (GDPR Article 15 - Right to Access).

**Rate Limiting:** 5 requests per day per user

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "exportDate": "2025-12-01T10:00:00Z",
    "userId": "usr_abc123xyz",
    "profile": {
      "email": "user@example.com",
      "name": "John Doe",
      "dateOfBirth": "1955-06-15",
      "timezone": "America/New_York",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLoginAt": "2025-12-01T09:00:00Z"
    },
    "medications": [
      {
        "id": "med_123",
        "name": "Aspirin",
        "dosage": "81mg",
        "frequency": "daily",
        "times": ["08:00"],
        "reminderEnabled": true,
        "createdAt": "2025-01-15T00:00:00Z"
      }
    ],
    "tasks": [
      {
        "id": "task_456",
        "title": "Doctor Appointment",
        "date": "2025-12-05",
        "time": "14:00",
        "completed": false,
        "reminderEnabled": true,
        "createdAt": "2025-11-20T00:00:00Z"
      }
    ],
    "notes": [
      {
        "id": "note_789",
        "title": "Health Note",
        "content": "Feeling good today",
        "createdAt": "2025-12-01T08:00:00Z",
        "updatedAt": "2025-12-01T08:00:00Z"
      }
    ],
    "healthMetrics": [
      {
        "id": "metric_101",
        "type": "blood_pressure",
        "systolic": 120,
        "diastolic": 80,
        "recordedAt": "2025-12-01T07:00:00Z"
      }
    ],
    "emergencyContacts": [
      {
        "id": "contact_202",
        "name": "Jane Doe",
        "relationship": "Daughter",
        "phoneNumber": "(555) 123-4567",
        "isPrimary": true
      }
    ],
    "doctors": [
      {
        "id": "doctor_303",
        "name": "Dr. Smith",
        "specialty": "Family Medicine",
        "phoneNumber": "(555) 987-6543",
        "address": "123 Medical Center Dr"
      }
    ],
    "insuranceCards": [
      {
        "id": "insurance_404",
        "provider": "Blue Cross",
        "memberId": "ABC123456789",
        "groupNumber": "GRP999",
        "type": "Medical",
        "createdAt": "2025-01-10T00:00:00Z"
      }
    ]
  }
}
```

**Error Responses:**

```json
// Unauthorized (401)
{
  "success": false,
  "error": "Authentication required. Please sign in."
}

// Rate limit (429)
{
  "success": false,
  "error": "You have reached the daily limit for data exports. Please try again tomorrow."
}

// Server error (500)
{
  "success": false,
  "error": "Unable to export your data at this time. Please try again later."
}
```

**Backend Implementation:**
1. Authenticate user from token
2. Check rate limit (5 per day)
3. Query all user data from database:
   - User profile
   - Medications
   - Tasks and reminders
   - Notes
   - Health metrics
   - Emergency contacts
   - Doctors
   - Insurance cards
   - Any other user-specific data
4. Format as JSON
5. Log export request (compliance requirement)
6. Return complete data export

**Compliance Notes:**
- GDPR Article 15: Right to access personal data
- CCPA Section 1798.110: Right to know
- Must provide data in machine-readable format (JSON)
- Must include all personal data held
- Must respond within 30 days (automated = instant)
- Log all export requests for audit trail
- Rate limit to prevent abuse

**Data Retention:**
- No retention - export is generated on-demand
- Do not store exported data on server

---

### POST `/privacy/delete-account`

Delete user account and all associated data (GDPR Article 17 - Right to Erasure).

**Rate Limiting:** 3 requests per day per user (prevents accidental deletion)

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "confirmation": "DELETE",
  "password": "CurrentPassword123!"
}
```

**Validation Rules:**
- `confirmation`: Must exactly match "DELETE" (case-sensitive)
- `password`: Must match current password

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Your account has been scheduled for deletion. All data will be permanently deleted in 30 days. You have been logged out of all devices.",
  "deletionDate": "2025-12-31T00:00:00Z"
}
```

**Error Responses:**

```json
// Missing/incorrect confirmation (400)
{
  "success": false,
  "error": "Account deletion requires confirmation. Please type DELETE exactly to confirm."
}

// Wrong password (401)
{
  "success": false,
  "error": "Invalid password. Please verify your password to delete your account."
}

// Rate limit (429)
{
  "success": false,
  "error": "Too many deletion requests. Please try again tomorrow."
}
```

**Backend Implementation:**

**Phase 1: Soft Delete (Immediate)**
1. Authenticate user from token
2. Verify password
3. Verify confirmation matches "DELETE"
4. Check rate limit
5. Mark account as `deleted: true` with `deletionScheduledAt` timestamp
6. Set `permanentDeletionDate` = current date + 30 days
7. Invalidate all user's tokens/sessions
8. Log deletion request (compliance requirement)
9. Send confirmation email
10. Return success response

**Phase 2: Hard Delete (After 30 Days)**

Run daily batch job to permanently delete accounts where `permanentDeletionDate <= today`:

1. Find accounts scheduled for permanent deletion
2. For each account:
   - Delete all medications
   - Delete all tasks/reminders
   - Delete all notes
   - Delete all health metrics
   - Delete all emergency contacts
   - Delete all doctors
   - Delete all insurance cards
   - Delete all sessions/tokens
   - Delete user profile record
3. Log permanent deletion (compliance requirement)
4. Cannot be undone after this point

**Account Recovery Window (Optional but Recommended):**

Within 30-day grace period, users can:
- Log back in → Unmarks deletion flag
- Keeps all data intact
- Cancels scheduled deletion

**Compliance Notes:**
- GDPR Article 17: Right to erasure ("right to be forgotten")
- CCPA Section 1798.105: Right to delete
- 30-day grace period (standard practice, not required by law)
- Must delete ALL user data
- Log both soft delete and hard delete
- Send confirmation emails
- Cannot recover after hard delete

**Data Retention Exceptions (Optional):**

You MAY retain for legal compliance:
- Transaction records (if required by law)
- Audit logs (for security/compliance)
- Anonymized analytics (no PII)

**What Must Be Deleted:**
- ✅ Personal identifiable information (name, email, DOB)
- ✅ Health data (medications, metrics, notes)
- ✅ Contact information (emergency contacts, doctors)
- ✅ Insurance information
- ✅ All user-generated content
- ✅ Authentication credentials
- ✅ Session tokens

---

### GET `/privacy/policy`

Get current privacy policy (for in-app display).

**Rate Limiting:** 100 requests per hour per user

**Request Headers:**
```
Authorization: Bearer <access-token> (optional)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "effectiveDate": "2025-01-01",
    "policyUrl": "https://www.dailycompanion.com/privacy",
    "summary": {
      "dataCollected": [
        "Email address",
        "Name",
        "Date of birth",
        "Health information (medications, metrics)",
        "Emergency contact information",
        "Usage data (anonymized)"
      ],
      "dataUsage": [
        "Provide app functionality",
        "Send reminders",
        "Improve app experience",
        "Legal compliance"
      ],
      "dataSharing": [
        "Never sold to third parties",
        "Shared with service providers (AWS, email service)",
        "Only with your consent"
      ],
      "yourRights": [
        "Access your data (export)",
        "Delete your data",
        "Opt out of analytics",
        "Contact support with questions"
      ]
    }
  }
}
```

**Backend Implementation:**
1. Return current privacy policy
2. Include version and effective date
3. Provide summary for in-app display
4. Link to full policy on website

---

## 3. User Profile Endpoints

### Base Path: `/profile`

---

### GET `/profile`

Get user profile (alias for `/auth/me`).

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123xyz",
    "email": "user@example.com",
    "name": "John Doe",
    "dateOfBirth": "1955-06-15",
    "timezone": "America/New_York",
    "emailVerified": true,
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### PATCH `/profile`

Update user profile.

**Rate Limiting:** 20 requests per hour per user

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body (partial update):**
```json
{
  "name": "John Smith",
  "timezone": "America/Los_Angeles"
}
```

**Allowed Fields:**
- `name`: 1-100 chars
- `timezone`: Valid IANA timezone
- `dateOfBirth`: ISO 8601 date (cannot make younger, only older)

**Cannot Update:**
- `email` (use separate endpoint with verification)
- `userId`
- `createdAt`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123xyz",
    "name": "John Smith",
    "timezone": "America/Los_Angeles"
  }
}
```

**Backend Implementation:**
1. Validate token
2. Validate fields
3. Update only provided fields
4. Return updated profile

---

### POST `/profile/change-password`

Change user password (requires current password).

**Rate Limiting:** 5 requests per hour per user

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully. You have been logged out of all other devices."
}
```

**Error Responses:**

```json
// Wrong current password (401)
{
  "success": false,
  "error": "Current password is incorrect."
}

// Weak new password (400)
{
  "success": false,
  "error": "New password must be at least 8 characters long."
}
```

**Backend Implementation:**
1. Verify current password
2. Validate new password strength
3. Hash new password
4. Update password
5. Invalidate all refresh tokens except current
6. Log password change
7. Send confirmation email

---

## 4. Medication Endpoints

### Base Path: `/medications`

All medication endpoints require authentication and enforce row-level security (users can only access their own medications).

---

### GET `/medications`

List all medications for authenticated user.

**Rate Limiting:** 100 requests per hour per user

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `active`: boolean (optional) - Filter active/inactive medications
- `limit`: integer (optional, default 100, max 500)
- `offset`: integer (optional, default 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "med_abc123",
      "userId": "usr_abc123xyz",
      "name": "Aspirin",
      "dosage": "81mg",
      "frequency": "daily",
      "times": ["08:00", "20:00"],
      "instructions": "Take with food",
      "prescribedBy": "Dr. Smith",
      "startDate": "2025-01-01",
      "endDate": null,
      "reminderEnabled": true,
      "active": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 100,
    "offset": 0
  }
}
```

**Backend Implementation:**
1. Validate token and extract userId
2. Query medications WHERE userId = current user
3. Apply filters (active, pagination)
4. Return medications
5. NEVER return other users' medications

---

### POST `/medications`

Create a new medication.

**Rate Limiting:** 50 requests per hour per user

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "name": "Lisinopril",
  "dosage": "10mg",
  "frequency": "daily",
  "times": ["08:00"],
  "instructions": "Take in the morning",
  "prescribedBy": "Dr. Smith",
  "startDate": "2025-12-01",
  "endDate": null,
  "reminderEnabled": true
}
```

**Validation Rules:**
- `name`: Required, 1-100 chars
- `dosage`: Required, 1-50 chars
- `frequency`: Required, enum: "daily", "twice-daily", "three-times-daily", "weekly", "as-needed"
- `times`: Required if frequency != "as-needed", array of "HH:MM" strings
- `instructions`: Optional, max 500 chars
- `prescribedBy`: Optional, max 100 chars
- `startDate`: Optional, ISO date
- `endDate`: Optional, ISO date (must be >= startDate)
- `reminderEnabled`: Optional, boolean, default true

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "med_xyz789",
    "userId": "usr_abc123xyz",
    "name": "Lisinopril",
    "dosage": "10mg",
    "frequency": "daily",
    "times": ["08:00"],
    "instructions": "Take in the morning",
    "prescribedBy": "Dr. Smith",
    "startDate": "2025-12-01",
    "endDate": null,
    "reminderEnabled": true,
    "active": true,
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z"
  }
}
```

**Backend Implementation:**
1. Validate token and extract userId
2. Validate all fields
3. Create medication with userId from token
4. Return created medication

---

### GET `/medications/:id`

Get single medication by ID.

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "med_abc123",
    "userId": "usr_abc123xyz",
    "name": "Aspirin",
    "dosage": "81mg",
    "frequency": "daily",
    "times": ["08:00"],
    "reminderEnabled": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Error Responses:**

```json
// Not found or not owned by user (404)
{
  "success": false,
  "error": "Medication not found."
}
```

**Backend Implementation:**
1. Validate token and extract userId
2. Query medication WHERE id = :id AND userId = current user
3. Return 404 if not found or owned by different user
4. Never reveal if medication exists but belongs to different user

---

### PATCH `/medications/:id`

Update medication (partial update).

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body (partial):**
```json
{
  "dosage": "162mg",
  "times": ["08:00", "20:00"]
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "med_abc123",
    "dosage": "162mg",
    "times": ["08:00", "20:00"],
    "updatedAt": "2025-12-01T10:30:00Z"
  }
}
```

**Backend Implementation:**
1. Validate token and extract userId
2. Verify medication belongs to user
3. Validate updated fields
4. Update medication
5. Return updated medication

---

### DELETE `/medications/:id`

Delete (soft delete) medication.

**Request Headers:**
```
Authorization: Bearer <access-token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Medication deleted successfully."
}
```

**Backend Implementation:**
1. Validate token and extract userId
2. Verify medication belongs to user
3. Soft delete: Set `active: false` and `deletedAt: now()`
4. OR hard delete: Remove from database
5. Return success

---

## 5. Task & Reminder Endpoints

### Base Path: `/tasks`

Similar structure to medications. All endpoints enforce row-level security.

---

### GET `/tasks`

List all tasks for authenticated user.

**Query Parameters:**
- `completed`: boolean (optional) - Filter completed/incomplete
- `date`: ISO date (optional) - Filter tasks for specific date
- `limit`: integer (optional, default 100, max 500)
- `offset`: integer (optional, default 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_abc123",
      "userId": "usr_abc123xyz",
      "title": "Doctor Appointment",
      "description": "Annual checkup with Dr. Smith",
      "date": "2025-12-05",
      "time": "14:00",
      "completed": false,
      "completedAt": null,
      "reminderEnabled": true,
      "reminderTime": "13:30",
      "frequency": "one-time",
      "createdAt": "2025-11-20T00:00:00Z",
      "updatedAt": "2025-11-20T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 100,
    "offset": 0
  }
}
```

---

### POST `/tasks`

Create new task.

**Request Body:**
```json
{
  "title": "Pick up prescription",
  "description": "Get refill at pharmacy",
  "date": "2025-12-02",
  "time": "10:00",
  "reminderEnabled": true,
  "reminderTime": "09:30",
  "frequency": "one-time"
}
```

**Validation Rules:**
- `title`: Required, 1-200 chars
- `description`: Optional, max 1000 chars
- `date`: Required, ISO date (YYYY-MM-DD)
- `time`: Required, "HH:MM" format
- `reminderEnabled`: Optional, boolean
- `reminderTime`: Optional, "HH:MM" format (must be before task time)
- `frequency`: Required, enum: "one-time", "daily", "weekly", "monthly"

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "task_xyz789",
    "userId": "usr_abc123xyz",
    "title": "Pick up prescription",
    "date": "2025-12-02",
    "time": "10:00",
    "completed": false,
    "createdAt": "2025-12-01T10:00:00Z"
  }
}
```

---

### PATCH `/tasks/:id`

Update task.

**Request Body (partial):**
```json
{
  "completed": true
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "task_abc123",
    "completed": true,
    "completedAt": "2025-12-01T10:30:00Z",
    "updatedAt": "2025-12-01T10:30:00Z"
  }
}
```

---

### DELETE `/tasks/:id`

Delete task.

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully."
}
```

---

## 6. Health Metrics Endpoints

### Base Path: `/health-metrics`

For tracking blood pressure, weight, glucose, etc.

---

### GET `/health-metrics`

List health metrics.

**Query Parameters:**
- `type`: string (optional) - Filter by type: "blood_pressure", "weight", "glucose", "heart_rate"
- `startDate`: ISO date (optional) - Filter metrics after date
- `endDate`: ISO date (optional) - Filter metrics before date
- `limit`: integer (optional, default 100, max 500)
- `offset`: integer (optional, default 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "metric_abc123",
      "userId": "usr_abc123xyz",
      "type": "blood_pressure",
      "systolic": 120,
      "diastolic": 80,
      "unit": "mmHg",
      "notes": "Feeling good",
      "recordedAt": "2025-12-01T07:00:00Z",
      "createdAt": "2025-12-01T07:05:00Z"
    },
    {
      "id": "metric_def456",
      "userId": "usr_abc123xyz",
      "type": "weight",
      "value": 180,
      "unit": "lbs",
      "recordedAt": "2025-12-01T07:00:00Z",
      "createdAt": "2025-12-01T07:05:00Z"
    }
  ]
}
```

---

### POST `/health-metrics`

Record new health metric.

**Request Body:**
```json
{
  "type": "blood_pressure",
  "systolic": 118,
  "diastolic": 78,
  "notes": "Morning reading",
  "recordedAt": "2025-12-01T07:00:00Z"
}
```

**Validation Rules:**
- `type`: Required, enum: "blood_pressure", "weight", "glucose", "heart_rate", "temperature"
- Type-specific fields:
  - Blood Pressure: `systolic` (int, 60-300), `diastolic` (int, 40-200)
  - Weight: `value` (float, 50-500), `unit` ("lbs" or "kg")
  - Glucose: `value` (int, 20-600), `unit` ("mg/dL" or "mmol/L")
  - Heart Rate: `value` (int, 40-300), `unit` ("bpm")
- `notes`: Optional, max 500 chars
- `recordedAt`: Optional, ISO timestamp (defaults to now)

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "metric_xyz789",
    "type": "blood_pressure",
    "systolic": 118,
    "diastolic": 78,
    "notes": "Morning reading",
    "recordedAt": "2025-12-01T07:00:00Z",
    "createdAt": "2025-12-01T07:05:00Z"
  }
}
```

---

## 7. Emergency Contacts Endpoints

### Base Path: `/emergency-contacts`

---

### GET `/emergency-contacts`

List emergency contacts.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "contact_abc123",
      "userId": "usr_abc123xyz",
      "name": "Jane Doe",
      "relationship": "Daughter",
      "phoneNumber": "+15551234567",
      "isPrimary": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST `/emergency-contacts`

Create emergency contact.

**Request Body:**
```json
{
  "name": "John Smith",
  "relationship": "Son",
  "phoneNumber": "+15559876543",
  "isPrimary": false
}
```

**Validation Rules:**
- `name`: Required, 1-100 chars
- `relationship`: Required, 1-50 chars
- `phoneNumber`: Required, valid E.164 format (e.g., +15551234567)
- `isPrimary`: Optional, boolean (auto-set true if first contact)

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "contact_xyz789",
    "name": "John Smith",
    "relationship": "Son",
    "phoneNumber": "+15559876543",
    "isPrimary": false
  }
}
```

**Backend Implementation:**
- If user sets new contact as primary, un-set existing primary
- First contact is automatically primary
- Validate phone number format

---

### PATCH `/emergency-contacts/:id`

Update emergency contact.

---

### DELETE `/emergency-contacts/:id`

Delete emergency contact.

---

## 8. Insurance Card Endpoints

### Base Path: `/insurance-cards`

---

### GET `/insurance-cards`

List insurance cards.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "insurance_abc123",
      "userId": "usr_abc123xyz",
      "provider": "Blue Cross Blue Shield",
      "type": "Medical",
      "memberId": "ABC123456789",
      "groupNumber": "GRP999",
      "rxBin": "610014",
      "rxPcn": "MEDDADV",
      "frontImageUrl": "https://cdn.dailycompanion.com/insurance/abc123_front.jpg",
      "backImageUrl": "https://cdn.dailycompanion.com/insurance/abc123_back.jpg",
      "createdAt": "2025-01-10T00:00:00Z"
    }
  ]
}
```

---

### POST `/insurance-cards`

Create insurance card.

**Request Body (multipart/form-data):**
```
provider: Blue Cross Blue Shield
type: Medical
memberId: ABC123456789
groupNumber: GRP999
rxBin: 610014
rxPcn: MEDDADV
frontImage: [file]
backImage: [file]
```

**Validation Rules:**
- `provider`: Required, 1-100 chars
- `type`: Required, enum: "Medical", "Dental", "Vision", "Prescription"
- `memberId`: Required, 1-50 chars
- `groupNumber`: Optional, 1-50 chars
- `rxBin`: Optional, 1-20 chars
- `rxPcn`: Optional, 1-20 chars
- `frontImage`: Optional, image file (max 5MB, JPEG/PNG)
- `backImage`: Optional, image file (max 5MB, JPEG/PNG)

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "insurance_xyz789",
    "provider": "Blue Cross Blue Shield",
    "memberId": "ABC123456789",
    "frontImageUrl": "https://cdn.dailycompanion.com/insurance/xyz789_front.jpg"
  }
}
```

**Backend Implementation:**
1. Validate token and userId
2. Validate text fields
3. Upload images to secure storage (S3, Cloudinary, etc.)
4. Generate secure URLs (signed URLs, expiring links)
5. Store insurance card record with image URLs
6. Encrypt sensitive fields (memberId, groupNumber) at rest

**Security Notes:**
- Encrypt insurance data at rest
- Use signed URLs for images
- Limit image access to owner only
- Scan uploaded images for malware

---

## 9. Notes Endpoints

### Base Path: `/notes`

Simple note-taking functionality.

---

### GET `/notes`

List notes.

**Query Parameters:**
- `limit`: integer (optional, default 100, max 500)
- `offset`: integer (optional, default 0)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "note_abc123",
      "userId": "usr_abc123xyz",
      "title": "Symptoms Today",
      "content": "Feeling slight headache in the morning",
      "createdAt": "2025-12-01T08:00:00Z",
      "updatedAt": "2025-12-01T08:00:00Z"
    }
  ]
}
```

---

### POST `/notes`

Create note.

**Request Body:**
```json
{
  "title": "Doctor Visit",
  "content": "Dr. Smith recommended increasing exercise to 30 min daily"
}
```

**Validation Rules:**
- `title`: Required, 1-200 chars
- `content`: Required, 1-10000 chars

---

### PATCH `/notes/:id`

Update note.

---

### DELETE `/notes/:id`

Delete note.

---

## 10. Caregiver Access (Optional)

### Base Path: `/caregiver`

Optional feature for granting read-only or limited access to family members.

---

### POST `/caregiver/invite`

Invite caregiver (send email invitation).

**Request Body:**
```json
{
  "email": "daughter@example.com",
  "name": "Jane Doe",
  "accessLevel": "view-only"
}
```

**Access Levels:**
- `view-only`: Can view medications, tasks, health metrics
- `can-edit`: Can add/edit tasks and reminders
- `full`: Can manage everything except delete account

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "inviteId": "invite_abc123",
    "email": "daughter@example.com",
    "status": "pending",
    "expiresAt": "2025-12-08T00:00:00Z"
  }
}
```

---

### GET `/caregiver/access`

List who has access to your account.

---

### DELETE `/caregiver/:caregiverId`

Revoke caregiver access.

---

## 11. Security Requirements

### Token Format

**Access Token (JWT):**
```json
{
  "sub": "usr_abc123xyz",
  "email": "user@example.com",
  "iat": 1733054400,
  "exp": 1733056200,
  "type": "access"
}
```

**Token Requirements:**
- Signed with HS256 or RS256
- Secret key minimum 256 bits
- Include `userId` in `sub` claim
- Include `type: "access"` or `type: "refresh"`
- Short expiry for access tokens (15-30 min)
- Longer expiry for refresh tokens (7-30 days)

---

### Rate Limiting Policies

| Endpoint Pattern | Limit |
|------------------|-------|
| POST /auth/register | 5 per 15 min per IP |
| POST /auth/login | 10 per 15 min per IP + email |
| POST /auth/forgot-password | 3 per hour per IP + email |
| GET /privacy/export-data | 5 per day per user |
| POST /privacy/delete-account | 3 per day per user |
| All other authenticated endpoints | 100 per hour per user |
| All other unauthenticated endpoints | 60 per hour per IP |

**Rate Limit Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1733058000
```

**Rate Limit Error (429):**
```json
{
  "success": false,
  "error": "Too many requests. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

---

### Password Hashing

**Algorithm:** bcrypt
**Cost Factor:** 12 or higher
**Salt:** Automatically included in bcrypt

**Example (Node.js):**
```javascript
const bcrypt = require('bcrypt');

// Hash password
const hash = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

---

### Brute Force Protection

**Login Attempts:**
- Track failed login attempts per email
- Lock account after 5 failed attempts
- Lockout duration: 30 minutes
- Reset counter on successful login
- Log all failed attempts

**Password Reset:**
- Track password reset requests per email
- Limit 3 requests per hour
- Tokens expire in 24 hours
- One-time use tokens

---

### CORS Rules

**Allowed Origins:**
```
Production: https://www.dailycompanion.com
Staging: https://staging.dailycompanion.com
Development: http://localhost:3000
```

**CORS Headers:**
```
Access-Control-Allow-Origin: <allowed-origin>
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**Forbidden:**
- Wildcard origin (`*`) in production
- Credentials with wildcard origin

---

### HTTPS Enforcement

**Requirements:**
- TLS 1.2 or higher
- Valid SSL certificate (Let's Encrypt, AWS ACM, etc.)
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- Redirect all HTTP to HTTPS (301 redirect)

**Security Headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

### Audit Logging

**Log All Security Events:**
- User registrations
- Successful logins
- Failed login attempts
- Password changes
- Password reset requests
- Account lockouts
- Token refreshes
- Account deletions (soft and hard)
- Data exports
- Permission changes
- Caregiver access grants/revokes

**Log Format:**
```json
{
  "timestamp": "2025-12-01T10:00:00Z",
  "userId": "usr_abc123xyz",
  "action": "login_success",
  "ipAddress": "192.168.1.1",
  "userAgent": "DailyCompanion/1.0.0 iOS/17.0",
  "metadata": {
    "loginMethod": "email"
  }
}
```

**Log Retention:**
- Security logs: 90 days minimum
- Compliance logs: 7 years (varies by jurisdiction)
- Rotate logs daily
- Store in immutable storage (S3, CloudWatch Logs)

---

### Monitoring & Alerts

**Alert Triggers:**
- Failed login rate spike (>10% of requests)
- Account lockout spike
- Unusual data export volume
- Multiple account deletions in short period
- Rate limit abuse
- Token validation failures
- Database errors
- API response time > 2 seconds

**Monitoring Metrics:**
- Request rate per endpoint
- Error rate per endpoint
- Response time (p50, p95, p99)
- Authentication success/failure ratio
- Active user sessions
- Database connection pool usage
- Token generation rate

---

## 12. Database Schema

### Users Table

```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,  -- usr_abc123xyz
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  email_verified BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  deletion_scheduled_at TIMESTAMP NULL,
  permanent_deletion_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP NULL,
  failed_login_attempts INT DEFAULT 0,
  account_locked_until TIMESTAMP NULL,

  INDEX idx_email (email),
  INDEX idx_deleted (deleted),
  INDEX idx_permanent_deletion_date (permanent_deletion_date)
);
```

**Row-Level Security:**
```sql
-- Users can only access their own data
CREATE POLICY user_isolation ON users
  FOR ALL
  USING (id = current_user_id());
```

---

### Sessions Table

```sql
CREATE TABLE sessions (
  id VARCHAR(50) PRIMARY KEY,  -- session_abc123
  user_id VARCHAR(50) NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,  -- Hash of refresh token
  access_token_jti VARCHAR(50),  -- JWT ID from access token
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_refresh_token_hash (refresh_token_hash),
  INDEX idx_expires_at (expires_at),
  INDEX idx_revoked (revoked)
);
```

---

### Medications Table

```sql
CREATE TABLE medications (
  id VARCHAR(50) PRIMARY KEY,  -- med_abc123
  user_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  dosage VARCHAR(50) NOT NULL,
  frequency VARCHAR(20) NOT NULL,  -- daily, twice-daily, etc.
  times JSON,  -- ["08:00", "20:00"]
  instructions TEXT,
  prescribed_by VARCHAR(100),
  start_date DATE,
  end_date DATE NULL,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_active (active),
  INDEX idx_deleted_at (deleted_at)
);
```

**Row-Level Security:**
```sql
CREATE POLICY medication_isolation ON medications
  FOR ALL
  USING (user_id = current_user_id());
```

---

### Tasks Table

```sql
CREATE TABLE tasks (
  id VARCHAR(50) PRIMARY KEY,  -- task_abc123
  user_id VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_time TIME,
  frequency VARCHAR(20) DEFAULT 'one-time',  -- one-time, daily, weekly, monthly
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_date (date),
  INDEX idx_completed (completed)
);
```

---

### Health Metrics Table

```sql
CREATE TABLE health_metrics (
  id VARCHAR(50) PRIMARY KEY,  -- metric_abc123
  user_id VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- blood_pressure, weight, glucose, heart_rate

  -- Type-specific fields (NULL if not applicable)
  systolic INT,
  diastolic INT,
  value DECIMAL(10,2),
  unit VARCHAR(20),

  notes TEXT,
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_recorded_at (recorded_at)
);
```

---

### Emergency Contacts Table

```sql
CREATE TABLE emergency_contacts (
  id VARCHAR(50) PRIMARY KEY,  -- contact_abc123
  user_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,  -- E.164 format
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_primary (is_primary)
);
```

---

### Insurance Cards Table

```sql
CREATE TABLE insurance_cards (
  id VARCHAR(50) PRIMARY KEY,  -- insurance_abc123
  user_id VARCHAR(50) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- Medical, Dental, Vision, Prescription

  -- Encrypted fields
  member_id_encrypted TEXT NOT NULL,
  group_number_encrypted TEXT,
  rx_bin_encrypted TEXT,
  rx_pcn_encrypted TEXT,

  front_image_url TEXT,
  back_image_url TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type)
);
```

**Encryption:**
- Encrypt `member_id`, `group_number`, `rx_bin`, `rx_pcn` at rest
- Use AES-256-GCM or similar
- Store encryption keys separately (AWS KMS, HashiCorp Vault)

---

### Notes Table

```sql
CREATE TABLE notes (
  id VARCHAR(50) PRIMARY KEY,  -- note_abc123
  user_id VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

---

### Password Reset Tokens Table

```sql
CREATE TABLE password_reset_tokens (
  id VARCHAR(50) PRIMARY KEY,  -- reset_abc123
  user_id VARCHAR(50) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,  -- Hash of actual token
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at),
  INDEX idx_used (used)
);
```

---

### Privacy Requests Table (GDPR/CCPA Compliance)

```sql
CREATE TABLE privacy_requests (
  id VARCHAR(50) PRIMARY KEY,  -- privacy_abc123
  user_id VARCHAR(50) NOT NULL,
  request_type VARCHAR(20) NOT NULL,  -- export, delete
  status VARCHAR(20) NOT NULL,  -- pending, completed, failed
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP NULL,

  -- For exports
  export_url TEXT NULL,
  export_expires_at TIMESTAMP NULL,

  -- For deletions
  scheduled_deletion_date TIMESTAMP NULL,
  permanent_deletion_date TIMESTAMP NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_request_type (request_type),
  INDEX idx_status (status),
  INDEX idx_scheduled_deletion_date (scheduled_deletion_date)
);
```

---

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id VARCHAR(50) PRIMARY KEY,  -- log_abc123
  user_id VARCHAR(50),  -- NULL for anonymous events
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_success (success)
);
```

---

### Caregiver Access Table (Optional)

```sql
CREATE TABLE caregiver_access (
  id VARCHAR(50) PRIMARY KEY,  -- caregiver_abc123
  patient_user_id VARCHAR(50) NOT NULL,  -- Person being cared for
  caregiver_user_id VARCHAR(50) NOT NULL,  -- Caregiver
  access_level VARCHAR(20) NOT NULL,  -- view-only, can-edit, full
  granted_at TIMESTAMP DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP NULL,

  FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (caregiver_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_patient_user_id (patient_user_id),
  INDEX idx_caregiver_user_id (caregiver_user_id),
  INDEX idx_revoked (revoked),

  UNIQUE (patient_user_id, caregiver_user_id)
);
```

---

## 13. Integration Notes

### Request Format

**All authenticated requests must include:**

```
Authorization: Bearer <access-token>
Content-Type: application/json
User-Agent: DailyCompanion/1.0.0 iOS/17.0
```

**Example Request:**
```http
GET /medications HTTP/1.1
Host: api.dailycompanion.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
User-Agent: DailyCompanion/1.0.0 iOS/17.0
```

---

### Response Format

**All responses follow this structure:**

```json
{
  "success": true | false,
  "data": { ... },  // On success
  "error": "Error message",  // On failure
  "message": "Success message"  // Optional
}
```

**Success Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "med_abc123",
    "name": "Aspirin"
  }
}
```

**Error Response Example:**
```json
{
  "success": false,
  "error": "Unable to process request. Please try again."
}
```

---

### Error Response Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Invalid/expired token, auth required |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist or not owned by user |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (generic) |
| 503 | Service Unavailable | Maintenance, database down |

---

### Timeout Expectations

**Client Timeouts:**
- Connection timeout: 10 seconds
- Read timeout: 30 seconds
- Total request timeout: 60 seconds

**Server Response Times:**
- Target: p95 < 500ms
- Max acceptable: 2 seconds
- Database queries: < 100ms
- Token generation: < 50ms

**Slow Operations:**
- Data export: May take 5-30 seconds
- Image upload: May take 2-10 seconds
- Return `202 Accepted` for async operations

---

### Session Timeout Integration

**How Client and Backend Interact:**

1. **Client Session Timeout (15 min idle, 5 min background):**
   - Client tracks session timeout independently
   - Client locks app locally when timeout occurs
   - Client does NOT make API call on timeout

2. **Backend Session Expiry (Access token expiry):**
   - Backend sets access token expiry (15-30 min)
   - Backend validates token on every request
   - Backend returns 401 if token expired

3. **Flow Example:**

```
Time 0:00 - User logs in
  ↓ Client stores tokens
  ↓ Backend creates session

Time 10:00 - User inactive (no actions)
  ↓ Client: Session still valid (< 15 min)
  ↓ Backend: Token still valid (< 30 min)

Time 15:01 - User returns to app
  ↓ Client: Session expired (> 15 min idle)
  ↓ Client: Shows lock screen (PIN required)
  ↓ User enters correct PIN
  ↓ Client: Unlocks session locally
  ↓ Client: Makes API request with access token
  ↓ Backend: Validates token (still valid < 30 min)
  ↓ Backend: Returns data

Time 31:00 - User makes request
  ↓ Client: Session valid (recently unlocked)
  ↓ Client: Makes API request with access token
  ↓ Backend: Token expired (> 30 min)
  ↓ Backend: Returns 401
  ↓ Client: Attempts token refresh
  ↓ Client: Sends refresh token
  ↓ Backend: Validates refresh token
  ↓ Backend: Returns new access token
  ↓ Client: Retries original request
```

4. **Key Points:**
   - Client timeout is INDEPENDENT of backend token expiry
   - Client timeout is for local security (device stolen)
   - Backend token expiry is for API security
   - Client handles token refresh automatically
   - Backend never receives "session timeout" events from client

---

### Privacy Safeguard Expectations

**Client Responsibilities:**
1. Mask sensitive data in UI by default
2. Generic notification content
3. Handle session timeouts
4. Clear data on account deletion
5. Provide export/delete UI

**Backend Responsibilities:**
1. Complete data export on request
2. Soft delete → hard delete flow
3. Log all privacy requests
4. Respond within legal timeframes (30 days)
5. Secure data at rest and in transit

**Integration Points:**

**Data Export:**
```
Client → GET /privacy/export-data
Backend → Collects all user data
Backend → Returns JSON export
Client → Saves to file
Client → Shows share dialog
```

**Account Deletion:**
```
Client → POST /privacy/delete-account
Backend → Soft deletes (marks deleted)
Backend → Schedules hard delete (30 days)
Backend → Invalidates all tokens
Client → Clears local data
Client → Returns to welcome screen

...30 days later...

Backend cron job → Finds expired deletions
Backend → Hard deletes all user data
Backend → Logs permanent deletion
```

---

## 14. Backend To-Do List

### Required Before Production

#### Authentication & Authorization (Estimated: 20-30 hours)
- [ ] Implement user registration endpoint with email validation
- [ ] Implement login endpoint with bcrypt password hashing
- [ ] Implement token refresh endpoint with token rotation
- [ ] Implement logout endpoint with token revocation
- [ ] Implement forgot password endpoint with email service
- [ ] Implement reset password endpoint
- [ ] Set up JWT token generation (HS256/RS256)
- [ ] Implement brute force protection (5 attempts, 30 min lockout)
- [ ] Add rate limiting middleware (per IP and per user)
- [ ] Configure CORS for production domains

#### Privacy Endpoints (Estimated: 10-15 hours)
- [ ] Implement data export endpoint
  - [ ] Collect all user data from all tables
  - [ ] Format as JSON
  - [ ] Log export request
- [ ] Implement account deletion endpoint
  - [ ] Soft delete with 30-day grace period
  - [ ] Hard delete cron job (runs daily)
  - [ ] Token invalidation on deletion
  - [ ] Deletion confirmation email
- [ ] Set up privacy request logging
- [ ] Add GDPR/CCPA compliance documentation

#### User Data Endpoints (Estimated: 30-40 hours)
- [ ] Implement CRUD endpoints for medications
- [ ] Implement CRUD endpoints for tasks
- [ ] Implement CRUD endpoints for health metrics
- [ ] Implement CRUD endpoints for emergency contacts
- [ ] Implement CRUD endpoints for insurance cards
  - [ ] Image upload to S3/CDN
  - [ ] Encryption for sensitive fields
- [ ] Implement CRUD endpoints for notes
- [ ] Add pagination to all list endpoints
- [ ] Implement row-level security on all tables
- [ ] Add input validation for all endpoints

#### Security Infrastructure (Estimated: 15-20 hours)
- [ ] Set up HTTPS with TLS 1.2+ (Let's Encrypt, AWS ACM)
- [ ] Configure security headers (HSTS, CSP, X-Frame-Options)
- [ ] Set up rate limiting (Redis-based recommended)
- [ ] Implement audit logging for all security events
- [ ] Set up monitoring and alerting (failed logins, rate limits)
- [ ] Configure database connection pooling
- [ ] Implement database backups (daily, 30-day retention)
- [ ] Set up error tracking (Sentry, Rollbar)

#### Database (Estimated: 10-15 hours)
- [ ] Create all database tables with proper indexes
- [ ] Implement row-level security policies
- [ ] Set up database encryption at rest
- [ ] Configure automated backups
- [ ] Set up database connection pooling
- [ ] Create migration scripts
- [ ] Seed dev/staging databases with test data

#### Testing (Estimated: 15-20 hours)
- [ ] Write unit tests for authentication logic
- [ ] Write integration tests for all endpoints
- [ ] Test rate limiting behavior
- [ ] Test token expiry and refresh flow
- [ ] Test account deletion flow (soft + hard delete)
- [ ] Test privacy data export completeness
- [ ] Load test API endpoints (target: 100 req/sec)
- [ ] Security audit (penetration testing recommended)

#### DevOps & Deployment (Estimated: 10-15 hours)
- [ ] Set up CI/CD pipeline
- [ ] Configure staging environment
- [ ] Configure production environment
- [ ] Set up environment-specific secrets management
- [ ] Configure logging aggregation (CloudWatch, Datadog)
- [ ] Set up uptime monitoring (Pingdom, StatusCake)
- [ ] Create runbook for common issues
- [ ] Document deployment process

**Total Estimated Time: 110-165 hours (3-4 weeks full-time)**

---

### Optional Enhancements

#### Nice-to-Have Features (Post-Launch)
- [ ] Caregiver access system (20-30 hours)
- [ ] Email verification flow (5-10 hours)
- [ ] Two-factor authentication (10-15 hours)
- [ ] Social login (Google, Apple) (15-20 hours)
- [ ] Push notification system (10-15 hours)
- [ ] Export to PDF format (5-10 hours)
- [ ] Data import from other apps (20-30 hours)
- [ ] API webhooks for integrations (10-15 hours)
- [ ] Admin dashboard (40-60 hours)

#### Performance Optimizations
- [ ] Add Redis caching layer (10-15 hours)
- [ ] Implement database query optimization (ongoing)
- [ ] Set up CDN for static assets (5-10 hours)
- [ ] Add database read replicas (10-15 hours)
- [ ] Implement GraphQL API (optional alternative) (40-60 hours)

#### Advanced Security
- [ ] Implement certificate pinning (client + server) (10-15 hours)
- [ ] Add anomaly detection for suspicious activity (20-30 hours)
- [ ] Implement IP whitelisting for admin endpoints (5 hours)
- [ ] Add database query logging and analysis (10 hours)
- [ ] Set up bug bounty program (ongoing)

---

## Summary

This specification provides everything needed to build a production-ready backend for the SteadiDay app. The backend must implement:

✅ **Complete authentication system** with token rotation and brute force protection
✅ **Full GDPR/CCPA compliance** with data export and deletion
✅ **Row-level security** ensuring users only access their own data
✅ **Comprehensive rate limiting** to prevent abuse
✅ **Audit logging** for all security events
✅ **HTTPS enforcement** with security headers
✅ **Generic error messages** preventing information disclosure

The estimated implementation time is **110-165 hours** for required features, with optional enhancements available post-launch.

**Next Steps:**
1. Review this spec with backend team
2. Set up development environment
3. Create database schema
4. Implement authentication endpoints first
5. Add privacy endpoints
6. Build user data endpoints
7. Implement security infrastructure
8. Comprehensive testing
9. Deploy to staging
10. Security audit
11. Deploy to production

All client-side security is complete and ready for backend integration. 🚀
