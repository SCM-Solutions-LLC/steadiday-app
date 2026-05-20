# Data Storage Overview - SteadiDay App

**Last Updated:** December 1, 2025
**For:** Non-Technical Founders

---

## Quick Answer

**Right now, ALL user data is stored ONLY on the user's phone.**

The app is currently safe to use as a local-only app where data never leaves the device.

---

## Current Data Storage

### Where Data Lives Today

**✅ All data is stored on the phone using AsyncStorage**

This means:
- Tasks and reminders
- Medications and schedules
- Health metrics and goals
- Notes and daily logs
- Emergency contacts
- Doctor information
- Insurance card details
- Profile information
- App settings

**Everything stays on the user's device.** Nothing is sent to any server.

---

## What About Those API URLs in the Code?

You'll see references to these URLs in the code:
- `http://localhost:3000` (for development)
- `https://staging-api.dailycompanion.com` (for future testing)
- `https://api.dailycompanion.com` (for future production)

**Important:** These are placeholder URLs for future backend development. Right now:
- ❌ No backend server exists
- ❌ No API calls are actually made
- ❌ No data is sent to these URLs
- ❌ These domains are not registered or active

The code is **prepared** for a backend, but it's not connected yet.

---

## What Features Are "Backend-Ready"?

These features have API calls written in the code, but they do nothing right now because there's no backend:

1. **Authentication** (`src/auth/authManager.ts`)
   - Login/Register/Logout functions exist
   - Would call: `/auth/login`, `/auth/register`, `/auth/logout`
   - Currently: Not used, no actual API calls made

2. **Privacy Features** (`src/screens/SecuritySettingsScreen.tsx`)
   - "Download My Data" button exists
   - "Delete My Account" button exists
   - Would call: `/privacy/export-data`, `/privacy/delete-account`
   - Currently: Buttons are there but won't work without backend

3. **Session Management** (`src/utils/sessionManager.ts`)
   - Works entirely on the device
   - No server communication needed
   - Fully functional locally

---

## Data Storage by Type

| Data Type | Where Stored | Sent to Server? |
|-----------|--------------|-----------------|
| Tasks & Reminders | Phone (AsyncStorage) | ❌ No |
| Medications | Phone (AsyncStorage) | ❌ No |
| Health Metrics | Phone (AsyncStorage) | ❌ No |
| Notes | Phone (AsyncStorage) | ❌ No |
| Emergency Contacts | Phone (AsyncStorage) | ❌ No |
| Doctor Information | Phone (AsyncStorage) | ❌ No |
| Insurance Cards (text) | Phone (AsyncStorage) | ❌ No |
| Insurance Card Photos | **NOT STORED** - Deleted after OCR | ❌ No |
| Prescription Photos | **NOT STORED** - Deleted after OCR | ❌ No |
| Profile Info | Phone (AsyncStorage) | ❌ No |
| App Settings | Phone (AsyncStorage) | ❌ No |
| Photos (temporary) | **NOT STORED** - Memory only | ❌ No |
| Authentication Tokens | Phone (Secure Keychain) | ❌ No (none exist yet) |

---

## External Services & Data Sharing

### What the App DOES Connect To:

1. **Apple Services (Built into iOS)**
   - Apple Health (if user enables)
   - Apple Calendar (if user enables)
   - Apple Reminders (if user enables)
   - Apple Contacts (for emergency contacts)

   **Data Flow:** Only when user explicitly connects these apps. Data stays on phone, synced through Apple's ecosystem.

2. **Notification Service (Apple Push Notifications)**
   - Only generic reminders ("You have a medication to take")
   - No sensitive data in notifications
   - No personal health information transmitted

### What the App Does NOT Connect To:

- ❌ No SteadiDay servers
- ❌ No third-party analytics (no Sentry, Mixpanel, etc.)
- ❌ No advertising networks
- ❌ No social media APIs
- ❌ No cloud storage services

---

## Is It Safe to Use Locally Right Now?

**YES - 100% Safe for Local Use**

Here's why:
1. All data stays on the device
2. No server connections are made
3. No third-party services collect data
4. Data is encrypted using iOS security features
5. No internet connection required (except for app download)

### What Happens If User Loses Phone?

**Without a backend:**
- All data is lost if phone is lost/broken
- No way to recover data
- No cloud backup (unless user backs up phone to iCloud)

**With a backend (future):**
- Data would be backed up to your servers
- User could log in on new device and restore everything
- But data would then live on your servers

---

## Future Backend Plans

Based on the code, here's what the backend would enable:

### Required Backend Features:
1. **User Authentication**
   - Register new accounts
   - Login/Logout
   - Password reset
   - Token management

2. **Data Sync & Backup**
   - Save user data to cloud
   - Restore data on new device
   - Real-time sync across devices

3. **Privacy Compliance**
   - Export user data (GDPR/CCPA)
   - Delete user account
   - Data retention policies

### Backend Requirements Documentation:
- `BACKEND_API_SPEC.md` - Complete API specification (23 endpoints)
- All endpoints documented with request/response formats
- Security requirements specified
- Database schema designed

---

## Business Implications

### Current State (Local Only):
**Pros:**
- Zero infrastructure costs
- No server maintenance
- Maximum privacy (data never leaves device)
- No liability for data breaches
- No GDPR/CCPA server compliance needed
- Works offline

**Cons:**
- No data backup if phone lost
- Can't sync across multiple devices
- Can't share data with caregivers
- Limited scalability
- No usage analytics
- Can't offer cloud features

### With Backend (Future):
**Pros:**
- Data backup and recovery
- Multi-device sync
- Caregiver access features
- Usage analytics
- Cloud-based features
- Better user retention

**Cons:**
- Server hosting costs (~$50-500/month)
- Database costs
- Maintenance and monitoring
- Security liability
- GDPR/CCPA compliance requirements
- Need backend developers
- Potential data breach risks

---

## Recommendations

### For MVP Launch:
**Start with local-only version:**
- Zero infrastructure costs to test market
- Maximum privacy as selling point
- Easier to get user trust
- Faster to launch
- No regulatory compliance initially

### For Growth Phase:
**Add optional backend:**
- Let users choose: local-only OR cloud sync
- Some users want privacy (local)
- Some users want convenience (cloud)
- Charge for cloud features (premium tier)

### Hybrid Approach:
1. Launch local-only (what you have now)
2. Add optional cloud backup (Phase 2)
3. Add multi-device sync (Phase 3)
4. Add caregiver sharing (Phase 4)

This lets you:
- Start fast with zero costs
- Validate market fit
- Add backend when revenue justifies cost
- Offer choice to users

---

## Technical Notes

### Current Technology Stack:
- **Frontend:** React Native + Expo
- **Local Storage:** AsyncStorage (encrypted by iOS)
- **Secure Storage:** Expo SecureStore (iOS Keychain)
- **Backend:** None (code ready for future implementation)

### Security Features Already Implemented:
- ✅ Secure local storage
- ✅ No sensitive data in logs
- ✅ Generic notifications (privacy)
- ✅ Session timeouts (15 min idle)
- ✅ App lock with PIN
- ✅ Encrypted token storage (for future use)

### Ready for Backend When Needed:
- API client configured
- Authentication flow written
- Environment configuration ready
- Security best practices implemented
- All 23 endpoints specified in docs

---

## Summary for Founders

**Can we launch without a backend?**
✅ Yes - The app works 100% locally right now

**Is user data safe?**
✅ Yes - All data stays on device, encrypted by iOS

**Do we need servers immediately?**
❌ No - You can launch and validate the market first

**When should we add a backend?**
💡 When users ask for:
- Multi-device sync
- Data backup
- Caregiver sharing
- OR when you want to monetize cloud features

**How much does it cost right now?**
✅ $0 in infrastructure (just Apple Developer account: $99/year)

**Are we missing features without backend?**
Only cloud features - all core functionality works locally

---

## Questions?

If you need clarification on any of this, ask:
- What data do we collect? (All stays on device)
- Where does data go? (Nowhere - stays on phone)
- Can users recover data if phone breaks? (No, not without backend)
- Do we have any server costs? (No)
- Are there privacy concerns? (Minimal - data never leaves device)
- Can we scale this? (Yes, add backend later when needed)

The app is designed to work beautifully as a local-only app while being ready to add cloud features when the time is right.
