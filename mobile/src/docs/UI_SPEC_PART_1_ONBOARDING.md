# SteadiDay - UI Specification Part 1: Onboarding Flow

## Overview
This document covers all root-level components and onboarding stack screens in the SteadiDay app.

---

## ROOT-LEVEL COMPONENTS

### 1. PinLockScreen
**File:** `src/components/PinLockScreen.tsx`
**Navigator:** App-level overlay (renders above all navigation)
**How User Reaches:** Automatically appears after app inactivity, on launch if PIN enabled, or after returning from background
**Main UI Sections:** Title and subtitle, 4-digit PIN input (secure, numeric), "Unlock" button, optional "Use Face ID/Touch ID" button, "Forgot PIN?" link
**Key Actions:** Enter PIN and unlock, use biometric authentication, reset PIN via "Forgot PIN"
**Data:** Reads stored PIN hash via verifyPin(), biometric settings; writes session unlock status via SessionManager
**Permissions:** Biometric authentication (optional)
**Navigation:** On unlock → dismisses modal and user proceeds to app; on forgot PIN → biometric auth → Settings/PIN reset

---

### 2. EmailVerificationHandler
**File:** `src/components/EmailVerificationHandler.tsx`
**Navigator:** Overlay component rendered in App.tsx
**How User Reaches:** Deep link when user clicks email verification link (steadiday://verify?token=<token>)
**Main UI Sections:** Verifying state (spinner, "Verifying Email..."), success state (green check, "Email Verified!"), error state (red X, "Verification Failed")
**Key Actions:** None (auto-dismisses after 3 seconds)
**Data:** Reads verification token from URL and user email; writes emailVerified status update to userProfile.auth
**Permissions:** None
**Navigation:** Auto-dismisses after verification attempt, returns to previous screen

---

## ONBOARDING STACK SCREENS

### 3. WelcomeScreen
**File:** `src/screens/WelcomeScreen.tsx`
**Navigator:** OnboardingStack.Screen name="Welcome"
**How User Reaches:** First app launch (hasCompletedOnboarding = false) or from Settings → "View Tutorial Again"
**Main UI Sections:** App title "Welcome to SteadiDay", tagline "Your Day, Made Easier", hero image, two buttons side-by-side, privacy reassurance text
**Key Actions:** Tap "Create account" or "Log in"
**Data:** Reads userAuth.isAuthenticated to check login status; no writes
**Permissions:** None
**Navigation:** "Create account" → Authentication (create mode); "Log in" → Authentication (login mode)

---

### 4. TutorialScreen
**File:** `src/screens/TutorialScreen.tsx`
**Navigator:** OnboardingStack.Screen name="Tutorial"
**How User Reaches:** After Welcome screen or from Settings tutorial option
**Main UI Sections:** 3-step carousel (Step 1: Welcome/heart icon, Step 2: Stay on Track/checkbox, Step 3: Everything in One App/apps icon), back button (visible steps 2-3), progress dots, "Next"/"Get Started" button, "Skip" button
**Key Actions:** Tap "Next" to advance, "Back" to go back, "Skip" to exit, "Get Started" on last step
**Data:** None
**Permissions:** None
**Navigation:** "Next" or "Skip" → LanguageSelection; "Back" on step 1 → Welcome

---

### 5. LanguageSelectionScreen
**File:** `src/screens/LanguageSelectionScreen.tsx`
**Navigator:** OnboardingStack.Screen name="LanguageSelection"
**How User Reaches:** After Tutorial screen or from Settings → Language
**Main UI Sections:** Globe icon, title "Select Your Language", language cards showing native name + English name with radio buttons (English, Spanish, French, German, etc.), "Continue" button
**Key Actions:** Tap language card to select, tap "Continue" to proceed
**Data:** Reads settings.language; writes updateSettings({ language })
**Permissions:** None
**Navigation:** "Continue" → Authentication (create mode)

---

### 6. AuthenticationScreen
**File:** `src/screens/AuthenticationScreen.tsx`
**Navigator:** OnboardingStack.Screen name="Authentication", params: { mode?: "login" | "create" }
**How User Reaches:** From Welcome screen or LanguageSelection; mode determines which child screen renders
**Main UI Sections:** Wrapper component that renders either CreateAccountScreen or LoginScreen based on mode param
**Key Actions:** N/A (delegates to child screen)
**Data:** N/A (delegates to child screen)
**Permissions:** N/A (delegates to child screen)
**Navigation:** Delegates to child screen (CreateAccountScreen or LoginScreen)

---

### 6a. CreateAccountScreen
**File:** `src/screens/CreateAccountScreen.tsx`
**Navigator:** Rendered by AuthenticationScreen when mode="create"
**How User Reaches:** From Welcome → "Create account" or LanguageSelection → "Continue"
**Main UI Sections:** Back button, title "Create Account", name input (required), email input (optional), PIN creation (4-digit, secure) + confirm PIN, biometric toggle (if available), "Continue" button
**Key Actions:** Enter name, email, PIN; toggle biometric; tap "Continue"
**Data:** Reads biometric availability; writes setUserName(), setPin() to secure storage, enableBiometric()/disableBiometric(), setUserAuth() with auth object
**Permissions:** Biometric (Face ID/Touch ID - optional)
**Navigation:** "Continue" → WelcomeEmailScreen; alerts on validation errors

---

### 6b. LoginScreen
**File:** `src/screens/LoginScreen.tsx`
**Navigator:** Rendered by AuthenticationScreen when mode="login"
**How User Reaches:** From Welcome → "Log in"
**Main UI Sections:** Back button, title "Welcome back", PIN input (4-digit, secure, auto-focus), "Open SteadiDay" button, optional "Use Face ID/Touch ID" button, "Forgot PIN?" link
**Key Actions:** Enter PIN and unlock, use biometric auth, reset PIN via "Forgot PIN?"
**Data:** Reads stored PIN for verification, biometric status; writes setUserAuth() on success, SessionManager.updateActivity()
**Permissions:** Biometric authentication (optional)
**Navigation:** Success → WelcomeEmailScreen; "Forgot PIN?" → biometric prompt → Authentication (create mode)

---

### 7. WelcomeEmailScreen
**File:** `src/screens/WelcomeEmailScreen.tsx`
**Navigator:** OnboardingStack.Screen name="WelcomeEmailScreen"
**How User Reaches:** After successful account creation or login
**Main UI Sections:** Mail icon, title "Welcome to SteadiDay!", greeting with user name, verification email info card showing email address, features list (6 bullet points), "Continue" button, "Resend Email" button, "Open Email Client" button, "verify later" link
**Key Actions:** Tap "Continue", resend verification email, open email client, skip verification
**Data:** Reads userProfile.name, userProfile.auth.email, userId; writes setUserAuth() to update welcomeEmailSent flag
**Permissions:** None
**Navigation:** "Continue" or "Verify later" → LegalConsent

---

### 8. LegalConsentScreen
**File:** `src/screens/LegalConsentScreen.tsx`
**Navigator:** OnboardingStack.Screen name="LegalConsent"
**How User Reaches:** After WelcomeEmailScreen, required before app access
**Main UI Sections:** Header "Privacy & Terms", Privacy Policy card with summary and "Read Full" link, Terms of Service card with summary and "Read Full" link, agreement checkbox with text, info box about accessing later, "Continue" button (disabled until checkbox checked)
**Key Actions:** Read summaries, tap links to view full documents, check agreement box, tap "Continue"
**Data:** Implicit consent tracking via onboarding completion; no direct writes
**Permissions:** None
**Navigation:** "Read Full Privacy Policy" → PrivacyPolicy screen (modal); "Read Full Terms" → TermsOfService screen (modal); "Continue" → ConnectAppsIntro

---

### 9. ConnectAppsIntroScreen
**File:** `src/screens/ConnectAppsIntroScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ConnectAppsIntro"
**How User Reaches:** After LegalConsent, optional step in onboarding
**Main UI Sections:** Back button, apps icon (large, blue circular bg), title "Connect Other Apps", description about syncing apps (optional), two bottom buttons
**Key Actions:** Tap "Connect other apps now" or "Skip for now"
**Data:** None
**Permissions:** None
**Navigation:** "Connect apps now" → ConnectAppsChoice; "Skip" → UserName; Back → LegalConsent

---

### 10. ConnectAppsChoiceScreen
**File:** `src/screens/ConnectAppsChoiceScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ConnectAppsChoice"
**How User Reaches:** From ConnectAppsIntro → "Connect apps now"
**Main UI Sections:** Back button, title "What Would You Like to Connect?", category cards (Health & Fitness, Medication Tracking, Calendar & Reminders, Other Apps) showing icon, name, count of compatible apps detected, "Auto-Detect All" button, "Skip" link
**Key Actions:** Tap category card to explore, tap "Auto-Detect" to scan all apps, tap "Skip"
**Data:** Reads installed apps via appDetection utility; tracks category interests
**Permissions:** None at this stage (requested per app later)
**Navigation:** Categories → respective screens (ConnectAppsHealth, ConnectAppsMedication, ConnectAppsCalendar, ConnectAppsAdd); "Auto-Detect" → ConnectAppsAutoDetect; "Skip" → UserName

---

### 11. ConnectAppsAutoDetectScreen
**File:** `src/screens/ConnectAppsAutoDetectScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ConnectAppsAutoDetect", params: { category?: string }
**How User Reaches:** From ConnectAppsChoice → "Auto-Detect" or from specific category
**Main UI Sections:** Loading state with spinner and "Scanning for Apps..." text, results state with "Found [X] Apps" title, grid/list of detected apps with icon, name, description, toggle switch, "Connect Selected" button showing count, "Skip" link
**Key Actions:** Toggle apps on/off, tap "Connect Selected", tap individual app for details, tap "Skip"
**Data:** Reads device's installed apps via detectInstalledApps utility, app compatibility database; writes selected apps to connectedApps array, sync preferences
**Permissions:** Varies per app (requested when enabled)
**Navigation:** "Connect Selected" → ConnectAppsConfirmation; app details → ConnectAppsDetail; "Skip" → UserName

---

### 12. ConnectAppsHealthScreen
**File:** `src/screens/ConnectAppsHealthScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ConnectAppsHealth"
**How User Reaches:** From ConnectAppsChoice → "Health & Fitness" category
**Main UI Sections:** Back button, heart icon, title "Health & Fitness Apps", Apple Health card (featured, "Recommended" badge) with data types list, fitness tracker options (Fitbit, Garmin, Strava, etc.) with toggle switches, "Connect Selected" button, "Skip" link
**Key Actions:** Toggle Apple Health, select data types to sync (steps, heart rate, sleep, exercise, weight, blood pressure), toggle other fitness apps, tap "Connect Selected"
**Data:** Reads Apple Health availability, installed fitness apps, current sync preferences; writes health sync settings, connected health apps, data type permissions
**Permissions:** Health data access (HealthKit) requested when enabling
**Navigation:** App detail → ConnectAppsDetail; "Connect Selected" → ConnectAppsConfirmation; "Skip" → ConnectAppsChoice

---

### 13. ConnectAppsMedicationScreen
**File:** `src/screens/ConnectAppsMedicationScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ConnectAppsMedication"
**How User Reaches:** From ConnectAppsChoice → "Medication Tracking" category
**Main UI Sections:** Back button, medical bag icon, title "Medication Apps", available medication apps (Medisafe, MyTherapy, Pill Reminder, etc.) each with icon, description, import capabilities list, connection button/toggle, "Connect Selected" button, "Enter Manually Instead" link, "Skip" link
**Key Actions:** Toggle medication app connections, select what data to import (names, dosages, schedules, reminders, history), tap "Connect Selected", tap "Enter Manually Instead"
**Data:** Reads installed medication apps, current medications; writes imports medications and schedules, connected app info, synced medication data
**Permissions:** App-specific (varies), notification permissions for reminders
**Navigation:** App detail → ConnectAppsDetail; "Connect Selected" → ConnectAppsConfirmation; "Enter Manually Instead" → MultipleMedications; "Skip" → ConnectAppsChoice

---

### 14. ConnectAppsCalendarScreen
**File:** `src/screens/ConnectAppsCalendarScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ConnectAppsCalendar"
**How User Reaches:** From ConnectAppsChoice → "Calendar & Reminders" category
**Main UI Sections:** Back button, calendar icon, title "Calendar & Reminders", Apple Calendar card (featured, "Two-way sync" badge) with sync options and calendar selection, Apple Reminders card with list selection, Google Calendar option requiring sign-in, "Connect Selected" button, "Don't Sync" link
**Key Actions:** Toggle Apple Calendar, select calendars to sync, toggle Apple Reminders, select lists to sync, configure sync direction (import/export/two-way), connect Google Calendar
**Data:** Reads calendar permissions, user's calendars and reminder lists, current tasks; writes calendar sync settings, connected calendars, two-way sync preferences, imports events/reminders as tasks
**Permissions:** Calendar access (required), Reminders access (if enabled)
**Navigation:** "Connect Selected" → sync process → ConnectAppsConfirmation; "Don't Sync" → ConnectAppsChoice; app detail → ConnectAppsDetail

---

### 15. ConnectAppsAddScreen
**File:** `src/screens/ConnectAppsAddScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ConnectAppsAdd"
**How User Reaches:** From ConnectAppsChoice → "Other Apps" or from Settings → Connected Apps → "Add"
**Main UI Sections:** Back button, plus icon, title "Add Custom App", search bar, categories (Productivity, Finance, Social, Utilities, Other), scrollable app grid with icon, name, description, "Add" button, custom connection form for unlisted apps with "Request Integration" button, "Done" button
**Key Actions:** Search for apps, browse categories, tap app to view details, add app to connections, submit custom app request
**Data:** Reads app directory database, user's connected apps; writes adds app to connectedApps, submits integration request to support system
**Permissions:** None until specific app connected
**Navigation:** App detail → ConnectAppsDetail; "Done" → ConnectAppsChoice or Settings (depending on entry point)

---

### 16. ConnectAppsDetailScreen
**File:** `src/screens/ConnectAppsDetailScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ConnectAppsDetail", params: { appId: string }
**How User Reaches:** Tap any app card from Connect Apps screens or from Settings → Connected Apps → tap app
**Main UI Sections:** Back and close buttons, app icon (large) with name and connection status badge, tabs for Overview (description, features, "What This Syncs", last sync), Data & Permissions (required permissions, data shared), Sync Settings (frequency, two-way toggle, data types checklist), About (version, developer, support/privacy/terms links), bottom actions ("Connect" or "Sync Now"/"Disconnect")
**Key Actions:** View details, configure sync settings, connect/disconnect app, trigger manual sync, access permissions info, view privacy policy
**Data:** Reads app info from database, connection status, sync settings, last sync data; writes updates sync settings, connects/disconnects app, triggers sync operation
**Permissions:** Requested when connecting (varies by app)
**Navigation:** Back/Close → previous screen; "Learn More" → external URL; Privacy Policy → external link

---

### 17. ConnectAppsConfirmationScreen
**File:** `src/screens/ConnectAppsConfirmationScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ConnectAppsConfirmation", params: { fromCategory?: string }
**How User Reaches:** After successfully connecting apps from any ConnectApps screen
**Main UI Sections:** Animated green checkmark icon, title "Apps Connected!", subtitle "Your data is now syncing", list of just-connected apps with icons and "Connected" status, sync information card explaining auto-sync and two-way sync, "Connect More Apps" button (if more categories available), "Continue" button
**Key Actions:** Review connected apps, tap "Connect More Apps", tap "Continue"
**Data:** Reads recently connected apps list, sync status; writes marks onboarding app connection as complete
**Permissions:** None (already granted)
**Navigation:** "Connect More Apps" → ConnectAppsChoice; "Continue" → UserName

---

### 18. UserNameScreen
**File:** `src/screens/UserNameScreen.tsx`
**Navigator:** OnboardingStack.Screen name="UserName"
**How User Reaches:** After app connections (or skip), part of onboarding flow
**Main UI Sections:** Back button, progress indicator, title "What's Your Name?", description about personalization, name input field (auto-focus, auto-capitalize), helper text "We'll use this for greetings and reminders", "Back" and "Next" buttons (Next disabled if empty)
**Key Actions:** Enter name, tap "Next", tap "Back"
**Data:** Reads userProfile.name if returning to edit; writes setUserName(name)
**Permissions:** None
**Navigation:** "Back" → previous screen (varies by flow); "Next" → EmergencyContact

---

### 19. EmergencyContactScreen
**File:** `src/screens/EmergencyContactScreen.tsx`
**Navigator:** OnboardingStack.Screen name="EmergencyContact"
**How User Reaches:** After UserName in onboarding, critical safety feature setup
**Main UI Sections:** Progress indicator, alert icon (red), title "Emergency Contacts", "Why This Matters" box explaining fall detection/emergency use, primary contact form (name, phone, relationship inputs with icons), "Import from Contacts" button, "Add Another Contact" button (up to 5 total), entered contacts list with "Primary" badge and remove buttons, "Skip for Now" link, "Continue" button
**Key Actions:** Enter contact details manually, import from device contacts, add multiple contacts, remove contacts, designate primary, skip (not recommended), continue
**Data:** Reads device contacts if importing, existing emergencyContacts if editing; writes addEmergencyContact() for each, marks first as isPrimary: true
**Permissions:** Contacts access (only if importing)
**Navigation:** "Skip" or "Continue" → FallDetectionSetup; alerts on invalid phone or skip confirmation

---

### 20. FallDetectionSetupScreen
**File:** `src/screens/FallDetectionSetupScreen.tsx`
**Navigator:** OnboardingStack.Screen name="FallDetectionSetup"
**How User Reaches:** After EmergencyContact setup, safety feature configuration
**Main UI Sections:** Back button, shield icon (sage green), title "Fall Detection", description of automatic fall detection, "How It Works" section with 4 steps (Detects, Confirms, Responds, Alerts), feature toggles (Enable Fall Detection master switch, Auto-Alert countdown 60s/90s/120s, Share Location toggle, Play Loud Alert Sound toggle), requirements list showing needed permissions with status, "Grant Permissions" button if any missing, "Enable Fall Detection" or "Skip for Now" button
**Key Actions:** Toggle fall detection, configure countdown, toggle location sharing, toggle alert sound, grant permissions, enable feature, skip setup
**Data:** Reads emergencyContacts (must exist), permission statuses; writes updateSettings({ fallDetectionEnabled, fallDetectionCountdown, fallDetectionLocation, fallDetectionSound })
**Permissions:** Motion & Fitness (required for feature), Location (required if sharing), Notifications (for alerts)
**Navigation:** "Enable" or "Skip" → NotificationSettings; alerts for permissions, confirmation, test suggestion

---

### 21. NotificationSettingsScreen
**File:** `src/screens/NotificationSettingsScreen.tsx`
**Navigator:** OnboardingStack.Screen name="NotificationSettings" OR RootStack modal (dual use)
**How User Reaches:** After FallDetectionSetup in onboarding OR from Settings → Notifications
**Main UI Sections:** Bell icon, title "Notification Settings", notification categories with toggles and sub-options (Medication Reminders, Task Reminders, Health & Wellness, Emergency Alerts always-on if fall detection enabled, App Updates & Tips), Quiet Hours section (enable toggle, start/end time pickers, "Always allow emergency alerts"), notification sound selection dropdown with preview button, system permission status warning if disabled
**Key Actions:** Toggle each category, configure sub-options per category, set quiet hours, choose notification sound, preview sounds, grant system permission
**Data:** Reads settings.notifications object, system notification permission status; writes updateSettings({ notifications: {...} })
**Permissions:** Push notifications (system level)
**Navigation:** In onboarding: "Continue" → MultipleMedications; In settings: Back → Settings; "Open Settings" → iOS Settings app

---

### 22. MultipleMedicationsScreen
**File:** `src/screens/MultipleMedicationsScreen.tsx`
**Navigator:** OnboardingStack.Screen name="MultipleMedications"
**How User Reaches:** After NotificationSettings in onboarding, medication setup phase
**Main UI Sections:** Progress indicator, medical bag icon, title "Add Your Medications", "Why This Matters" info box, search bar with autocomplete, common medications grid (quick-add chips), added medications list (each showing pill icon, name, dosage, frequency, edit/remove buttons), empty state, "+ Add Medication" button, "Skip for Now" link, "Continue" button
**Key Actions:** Search medication, tap common med to quick-add, manually add medication (opens modal), edit medication, remove medication, skip, continue
**Data:** Reads medications array, commonMedications database; writes addMedication() for each med
**Permissions:** None at this stage
**Navigation:** "+ Add Medication" → AddMedicationModal; Edit → AddMedicationModal in edit mode; "Skip" or "Continue" → MultipleTasksScreen

---

### 23. MultipleTasksScreen
**File:** `src/screens/MultipleTasksScreen.tsx`
**Navigator:** OnboardingStack.Screen name="MultipleTasksScreen"
**How User Reaches:** After MultipleMedications in onboarding, task/appointment setup
**Main UI Sections:** Progress indicator, checkbox icon, title "Add Your Tasks", "Why This Matters" info box, quick-add category buttons (Medical Appointment, Doctor Visit, Pharmacy Pickup, Exercise/Walk, Family Call, Errands, Other), added tasks list (each showing category icon/color, title, date/time, recurring indicator, edit/remove buttons), empty state, "+ Add Task" button, "Skip for Now" link, "Continue" button
**Key Actions:** Tap quick-add category, manually add task, edit task, remove task, skip, continue
**Data:** Reads tasks array; writes addTask() for each task
**Permissions:** None
**Navigation:** "+ Add Task" → AddTaskModal; Edit → AddTaskModal in edit mode; "Skip" or "Continue" → ExampleMedication

---

### 24. ExampleMedicationScreen
**File:** `src/screens/ExampleMedicationScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ExampleMedication"
**How User Reaches:** After MultipleTasksScreen, tutorial/demonstration screen
**Main UI Sections:** "Skip Tutorial" button, title "Here's How Medication Reminders Work", demo medication card (animated: Aspirin 81mg at 8:00 AM with "Take Now" and "Snooze" buttons), step-by-step tutorial (Step 1: Notification appears, Step 2: Take action, Step 3: Logged), interactive demo allowing button taps with animations, features highlight, "Got It" button, "Skip Tutorial" link
**Key Actions:** Watch animation, interact with demo buttons, tap "Got It", tap "Skip"
**Data:** None (demo only)
**Permissions:** None
**Navigation:** "Got It" or "Skip" → ExampleTask

---

### 25. ExampleTaskScreen
**File:** `src/screens/ExampleTaskScreen.tsx`
**Navigator:** OnboardingStack.Screen name="ExampleTask"
**How User Reaches:** After ExampleMedication, final tutorial screen
**Main UI Sections:** "Skip" button, title "Here's How Task Reminders Work", demo task card (animated: Doctor Appointment, Medical category, Today 2:30 PM with "Mark Complete" and "Reschedule" buttons), step-by-step tutorial (Step 1: Notification, Step 2: Actions, Step 3: History), interactive demo with button taps and animations, features highlight, onboarding complete card with celebration icon and "You're All Set!" message, "Start Using SteadiDay" button
**Key Actions:** Watch/interact with demo, tap "Start Using", tap "Skip"
**Data:** Writes setHasCompletedOnboarding(true)
**Permissions:** None
**Navigation:** "Start Using" → Completes onboarding → MainTabs (HomeScreen); app transitions to main interface

---

## End of Part 1
Next: Part 2 will cover Main Tab Screens and Tools Stack Screens.
