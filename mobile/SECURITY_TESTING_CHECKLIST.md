# Security Testing Checklist

## Overview

This document provides a comprehensive security testing checklist for the SteadiDay app. Use this to verify all security features are working correctly before releasing to production.

**Last Updated:** 2025-12-01

---

## Table of Contents

1. [Session Management](#1-session-management)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Data Privacy & GDPR](#3-data-privacy--gdpr)
4. [Sensitive Data Protection](#4-sensitive-data-protection)
5. [Network Security](#5-network-security)
6. [Environment Separation](#6-environment-separation)
7. [Error Handling](#7-error-handling)
8. [SDK & Third-Party Privacy](#8-sdk--third-party-privacy)
9. [Attack Story Verification](#9-attack-story-verification)
10. [Senior User Experience](#10-senior-user-experience)

---

## 1. Session Management

### Inactivity Timeout (15 minutes)
- [ ] App locks after 15 minutes of no user interaction
- [ ] Timeout counter resets on any user action (tap, scroll, type)
- [ ] Lock screen shows friendly timeout message
- [ ] User can unlock with correct PIN
- [ ] Wrong PIN shows appropriate error message
- [ ] Session data is preserved after timeout (user returns to same screen)

### Background Timeout (5 minutes)
- [ ] App locks after 5 minutes in background
- [ ] Timer starts when app moves to background
- [ ] Timer resets when app returns to foreground (within 5 min)
- [ ] Lock screen shows "backgrounded too long" message
- [ ] Background time is tracked accurately

### Session Cleanup
- [ ] Logout clears all session data
- [ ] Logout clears SessionManager state
- [ ] Cannot navigate back after logout
- [ ] Auth tokens cleared on logout
- [ ] Cannot bypass lock screen with back gesture
- [ ] Session state persists across app restarts (until timeout)

**Test Location:** `src/utils/sessionManager.ts`, `App.tsx`, `src/screens/LockScreen.tsx`

---

## 2. Authentication & Authorization

### Login/Registration
- [ ] Cannot access app without authentication
- [ ] Email validation works correctly
- [ ] Password must be at least 6 characters
- [ ] Password confirmation matches on registration
- [ ] Anti-phishing warning visible on auth screens
- [ ] Security reminder shows on main sign-in screen
- [ ] Security warning shows on email sign-in screen

### Password Reset
- [ ] "Forgot Password" link visible when logging in
- [ ] Forgotten password flow validates email address
- [ ] Generic success message shown (doesn't reveal if email exists)
- [ ] Reset email sent message includes 24-hour expiry info
- [ ] Modal can be dismissed

### Social Auth (if configured)
- [ ] Google sign-in works correctly
- [ ] Facebook sign-in works correctly
- [ ] User info fetched correctly
- [ ] Welcome email sent after social auth
- [ ] Auth tokens stored securely
- [ ] Graceful error if OAuth not configured

**Test Location:** `src/screens/AuthenticationScreen.tsx`, `src/auth/authManager.ts`

---

## 3. Data Privacy & GDPR

### Download My Data
- [ ] Button visible in Security Settings
- [ ] Shows loading indicator during export
- [ ] Exports complete user data as JSON
- [ ] File includes all data types (profile, meds, tasks, contacts, etc.)
- [ ] File is formatted and readable
- [ ] Share dialog appears after export
- [ ] User can save or share exported data
- [ ] Friendly error if export fails

### Delete My Account
- [ ] Button visible in Security Settings (destructive style)
- [ ] First confirmation dialog explains consequences
- [ ] Second confirmation dialog asks for explicit confirmation
- [ ] Shows loading indicator during deletion
- [ ] All local data cleared after deletion
- [ ] Auth tokens cleared
- [ ] Session cleared
- [ ] User returns to welcome/onboarding screen
- [ ] Cannot use app after deletion (requires re-registration)
- [ ] Success message explains 30-day retention
- [ ] Friendly error if deletion fails

### Privacy UI
- [ ] Privacy section clearly labeled in settings
- [ ] Download button has appropriate icon and color
- [ ] Delete button has warning color (red)
- [ ] Explanatory text is senior-friendly
- [ ] No technical jargon

**Test Location:** `src/screens/SecuritySettingsScreen.tsx`

---

## 4. Sensitive Data Protection

### Data Masking Component
- [ ] MaskedText component renders correctly
- [ ] Data masked by default (shows dots: •••••)
- [ ] Eye icon visible and functional
- [ ] Tap eye icon reveals actual value
- [ ] Tap again re-masks the value
- [ ] Large tap targets (48px minimum)
- [ ] Helper text clear: "Tap to show/hide"
- [ ] Works in card layout
- [ ] Works in standalone layout
- [ ] Text size respects prop

### Insurance Screen Masking
- [ ] Member ID masked by default
- [ ] Group Number masked by default
- [ ] User can reveal Member ID
- [ ] User can reveal Group Number
- [ ] Multiple insurance cards all masked
- [ ] Masking works for front and back of card

### Emergency Contacts Masking
- [ ] Phone numbers masked by default
- [ ] User can reveal phone numbers
- [ ] Masking works for all contacts
- [ ] Tap-to-call still works (must reveal first or handle masked)

### Notification Privacy
- [ ] Medication reminders use generic text
- [ ] No medication names in notifications
- [ ] No dosages in notifications
- [ ] Task reminders use generic text
- [ ] No task titles in notifications
- [ ] Snoozed notifications also generic
- [ ] Lock screen shows generic text only
- [ ] Notification center shows generic text only

**Test Location:** `src/components/MaskedText.tsx`, `src/screens/InsuranceScreen.tsx`, `src/screens/EmergencyContactsScreen.tsx`, `src/utils/notifications.ts`

---

## 5. Network Security

### HTTPS Enforcement
- [ ] All API calls use HTTPS in production
- [ ] HTTP requests rejected with user-friendly error
- [ ] `ensureHttps()` function validates URLs
- [ ] Dev environment allows localhost HTTP
- [ ] Production never uses HTTP
- [ ] Friendly error message: "Unable to connect securely"

### API Client
- [ ] Authorization header includes Bearer token
- [ ] Tokens fetched from SecureStore
- [ ] Network errors show generic messages to user
- [ ] API errors don't expose sensitive info
- [ ] Rate limiting handled gracefully (if backend implements it)

**Test Location:** `src/api/client.ts`, `src/config/env.ts`

---

## 6. Environment Separation

### Configuration
- [ ] Dev environment uses localhost or dev URL
- [ ] Staging environment uses staging URL
- [ ] Production environment uses production URL
- [ ] No hardcoded secrets in env.ts
- [ ] Current environment readable in dev mode only
- [ ] Invalid environment throws clear error

### Build Verification
- [ ] Dev build shows debug tools (if applicable)
- [ ] Production build hides debug tools
- [ ] Production build uses production API URL
- [ ] Staging build uses staging API URL
- [ ] Logging disabled in production
- [ ] Logging enabled in dev/staging

**Test Location:** `src/config/env.ts`, `app.json`

---

## 7. Error Handling

### User-Facing Errors
- [ ] Network errors show generic message
- [ ] Auth errors show generic message
- [ ] API errors show generic message
- [ ] No stack traces visible to users
- [ ] No internal error codes exposed
- [ ] No "Cannot read property of undefined" messages
- [ ] All errors are senior-friendly language

### Error Logging
- [ ] Errors logged securely in development
- [ ] PII redacted from error logs
- [ ] Tokens never logged
- [ ] Passwords never logged
- [ ] Phone numbers redacted
- [ ] Email addresses redacted

**Test Location:** `src/utils/secureLogger.ts`, `src/api/client.ts`

---

## 8. SDK & Third-Party Privacy

### SDK Configuration
- [ ] All SDKs documented in `sdkSetup.ts`
- [ ] Data collection documented for each SDK
- [ ] Privacy policy URLs provided
- [ ] No PII sent to analytics
- [ ] No health data sent to analytics
- [ ] No insurance info sent to analytics
- [ ] Error tracking scrubs sensitive data
- [ ] User can opt-out of tracking (if applicable)

### Crash Reporting
- [ ] Crash reports don't include sensitive data
- [ ] PII filtered from crash breadcrumbs
- [ ] API tokens filtered from network errors
- [ ] User input scrubbed from errors

**Test Location:** `src/config/sdkSetup.ts`

---

## 9. Attack Story Verification

### Attack Story 1: Token Interception on Public WiFi
- [ ] Tokens stored in SecureStore only
- [ ] Tokens never logged to console
- [ ] Tokens never appear in error messages
- [ ] Authorization header uses Bearer format
- [ ] HTTPS enforced for all API calls

### Attack Story 2: Stolen Device Session Hijack
- [ ] App locks after 15 minutes idle
- [ ] App locks after 5 minutes background
- [ ] Cannot bypass lock with back gesture
- [ ] Session cleared on logout
- [ ] Lock screen requires PIN

### Attack Story 3: Reverse Engineering API Keys
- [ ] No API keys hardcoded in client
- [ ] Environment URLs properly separated
- [ ] Secrets in environment variables only
- [ ] No sensitive logic in client code

### Attack Story 4: Fake Login Screen (Phishing)
- [ ] Anti-phishing warning on auth screen
- [ ] Clear message about official app
- [ ] Warning about suspicious emails/links
- [ ] Security reminder prominently displayed

### Attack Story 5: API Abuse Without Rate Limiting
- [ ] Client validates all inputs
- [ ] Email validation before API calls
- [ ] Password validation before API calls
- [ ] Generic error messages
- [ ] Backend rate limiting documented

### Attack Story 6: Rogue SDK Stealing Health Data
- [ ] All SDKs centralized in `sdkSetup.ts`
- [ ] SDK data collection documented
- [ ] No PII sent to SDKs
- [ ] No health data sent to SDKs
- [ ] Sensitive data filtered before tracking

### Attack Story 7: Man-in-the-Middle on Compromised WiFi
- [ ] All requests use HTTPS
- [ ] HTTP requests rejected
- [ ] Certificate pinning (if implemented)
- [ ] User-friendly connection errors

### Attack Story 8: Device Backup Exposes Auth Tokens
- [ ] SecureStore used for tokens
- [ ] SecureStore excluded from device backups
- [ ] No sensitive data in AsyncStorage
- [ ] Backup exclusion verified on iOS/Android

### Attack Story 9: Screen Sharing Exposes Medical Info
- [ ] Insurance data masked by default
- [ ] Emergency contact phone masked by default
- [ ] Notifications use generic text
- [ ] No medication names visible on lock screen
- [ ] No task titles visible on lock screen
- [ ] User can reveal masked data when safe

### Attack Story 10: Social Engineering via Error Messages
- [ ] All errors generic
- [ ] No "user not found" vs "wrong password"
- [ ] No account enumeration via errors
- [ ] No sensitive data in error messages
- [ ] Friendly language for seniors

**Test Location:** See SECURITY_ENHANCEMENTS.md for file locations

---

## 10. Senior User Experience

### Language & Clarity
- [ ] All security messages use plain language
- [ ] No technical jargon
- [ ] Timeout messages friendly and clear
- [ ] Error messages helpful not scary
- [ ] Privacy explanations simple
- [ ] No intimidating security warnings

### Touch Targets
- [ ] All buttons minimum 48px
- [ ] MaskedText eye icon large enough
- [ ] PIN entry buttons easy to tap
- [ ] Settings toggles easy to use

### Visual Feedback
- [ ] Loading indicators visible during actions
- [ ] Success messages confirm actions
- [ ] Error messages clearly visible
- [ ] Masked data clearly indicated
- [ ] Security warnings stand out

---

## Testing Workflow

### Manual Testing

1. **Session Management**
   - Open app and let it sit idle for 15+ minutes
   - Open app, minimize, wait 5+ minutes, return
   - Test logout and verify cannot go back

2. **Data Privacy**
   - Download your data and verify contents
   - Delete account and verify complete wipe

3. **Data Masking**
   - Add insurance card, verify masked
   - Add emergency contact, verify phone masked
   - Create medication reminder, check notification text

4. **Authentication**
   - Try login with wrong credentials
   - Test forgot password flow
   - Verify anti-phishing warnings visible

5. **Error Handling**
   - Turn off internet, try to use app
   - Force API errors (wrong endpoints)
   - Verify user-friendly messages

### Automated Testing (Future)

Once security is stable, create automated tests for:
- [ ] Session timeout logic
- [ ] Data masking component
- [ ] Auth flow
- [ ] Error message sanitization
- [ ] Environment configuration

---

## Acceptance Criteria

Before production release, verify:

✅ **All 10 Attack Stories Defended**
✅ **All Manual Tests Pass**
✅ **No Sensitive Data in Logs**
✅ **No Secrets in Code**
✅ **HTTPS Enforced**
✅ **GDPR/CCPA Compliant**
✅ **Senior-Friendly UX**
✅ **Backend Requirements Documented**

---

## Test Results Template

Use this template to record test results:

```
Test Date: ___________
Tester: ___________
App Version: ___________
Environment: Dev / Staging / Production

Attack Story 1: PASS / FAIL - Notes: ___________
Attack Story 2: PASS / FAIL - Notes: ___________
Attack Story 3: PASS / FAIL - Notes: ___________
Attack Story 4: PASS / FAIL - Notes: ___________
Attack Story 5: PASS / FAIL - Notes: ___________
Attack Story 6: PASS / FAIL - Notes: ___________
Attack Story 7: PASS / FAIL - Notes: ___________
Attack Story 8: PASS / FAIL - Notes: ___________
Attack Story 9: PASS / FAIL - Notes: ___________
Attack Story 10: PASS / FAIL - Notes: ___________

Session Timeout (15 min): PASS / FAIL - Notes: ___________
Background Lock (5 min): PASS / FAIL - Notes: ___________
Data Masking: PASS / FAIL - Notes: ___________
Notification Privacy: PASS / FAIL - Notes: ___________
Download Data: PASS / FAIL - Notes: ___________
Delete Account: PASS / FAIL - Notes: ___________
HTTPS Enforcement: PASS / FAIL - Notes: ___________
Anti-Phishing Warnings: PASS / FAIL - Notes: ___________

Overall Result: PASS / FAIL
Production Ready: YES / NO

Issues Found:
1. ___________
2. ___________
3. ___________
```

---

## References

- `SECURITY_ENHANCEMENTS.md` - Full security requirements
- `FINAL_SECURITY_SUMMARY.md` - Implementation summary
- `IMPLEMENTATION_GUIDE.md` - Step-by-step implementation guide
- `BIOMETRIC_AUTHENTICATION_GUIDE.md` - Optional biometric feature

---

## Notes for QA Team

1. **Test on multiple devices**: iOS and Android, different versions
2. **Test with real network conditions**: WiFi, cellular, offline
3. **Test with seniors**: Get feedback on clarity of messages
4. **Document all findings**: Use template above
5. **Regression test after changes**: Security features are interconnected

---

**Status:** Ready for comprehensive security testing
**Next Step:** Execute manual testing checklist before production release
