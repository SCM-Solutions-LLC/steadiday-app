# SteadiDay - UI Specification Part 3: Modals & Miscellaneous

## Overview
This document covers all modal screens, screen-like modal components, orphaned/unused screens, and support components.

---

## MODAL SCREENS

### 45. InsuranceScreen
**File:** `src/screens/InsuranceScreen.tsx`
**Navigator:** RootStack.Screen name="Insurance" (modal), Header: "Insurance Cards", Large Title
**How User Reaches:** From MedicalScreen → "Insurance" card or from Settings → Medical Info, presented as modal
**Main UI Sections:** Header (title "Insurance Cards" large, close button X or "Done" top-left, "+ Add Card" button top-right), insurance cards list (scrollable, each card card-like design mimicking physical card: card type badge Primary blue/Secondary gray, insurance company logo + name "Blue Cross Blue Shield", cardholder info name + member ID + group number + copay optional, card image photo front/back swipe left/right toggle, actions Edit/Delete/Share buttons), card detail view on tap (full-screen, both sides visible, pinch to zoom, details overlaid: all member info + provider phone + claims address), empty state (insurance card icon, "No Insurance Cards", explanation, "+ Add Insurance Card" button)
**Key Actions:** View all cards, add new card (scan/manual/photo), edit card info, delete card, view details (zoom, flip), share card (send image), set primary/secondary
**Data:** Reads insuranceCards array from appStore; writes addInsuranceCard(card), updateInsuranceCard(id, updates), removeInsuranceCard(id)
**Permissions:** Camera (scanning), Photo library (selecting images)
**Navigation:** Close/Done → dismisses modal returns to previous; Camera scan → camera view → extracts OCR data → returns to form; Photo select → picker → returns to form; add/edit modal has options: "Scan Card" button opens camera with frame overlay OCR extracts, "Enter Manually" form (company name, member ID, group number, cardholder name, plan type dropdown, copay, phone numbers, effective date, Add Front/Back Photo buttons), "Choose from Photos" opens library OCR attempts, Cancel / Save buttons

---

### 46. DoctorsScreen
**File:** `src/screens/DoctorsScreen.tsx`
**Navigator:** RootStack.Screen name="Doctors" (modal), Header: "My Doctors", Large Title
**How User Reaches:** From MedicalScreen → "Doctors" card or Settings → Medical Info, modal presentation
**Main UI Sections:** Header (title "My Doctors" large, close button top-left, "+ Add Doctor" button top-right primary), doctors list (scrollable, sorted by specialty or last name, each card: profile section doctor icon/photo circular + name "Dr. Sarah Johnson" bold large + specialty "Primary Care Physician" + rating stars optional, contact info phone tap to call + address tap for map, quick actions Call icon/phone primary + Map icon/location + Edit icon/pencil, additional info expandable: office hours + last visit date + next appointment + notes, swipe actions: Edit blue / Delete red), empty state (stethoscope icon, "No Doctors Added", explanation, "+ Add Your First Doctor" button), search/filter if many (search bar top, filter by specialty)
**Key Actions:** View all doctors, add new doctor, edit doctor info, delete doctor, call doctor's office, view office location on map, view/add notes, search doctors, filter by specialty
**Data:** Reads doctors array from appStore; writes addDoctor(doctor), updateDoctor(id, updates), removeDoctor(id)
**Permissions:** Phone (calling), Maps (navigation)
**Navigation:** Close → dismisses modal; Call → confirmation → native phone; Map → native Maps with directions; add/edit modal has form: name (prefix dropdown Dr./MD/DO + first + last), specialty searchable dropdown (Primary Care, Cardiologist, Dentist, etc.), phone number formatted multiple numbers option, office address (street, city/state/ZIP, "Use Current Location"), office hours Mon-Fri + Sat/Sun options, email optional, website optional, notes multiline, Cancel / Save buttons

---

### 47. FeedbackScreen
**File:** `src/screens/FeedbackScreen.tsx`
**Navigator:** RootStack.Screen name="Feedback" (modal), Header: "Feedback", Large Title
**How User Reaches:** From Settings → "Send Feedback", modal presentation
**Main UI Sections:** Header (title "Feedback" large, close button), intro text ("We'd love to hear from you!" and explanation), feedback type section (radio buttons: Bug Report, Feature Request, General Feedback, Compliment), feedback form (subject input field, message text area multiline large, optional screenshot checkbox "Include screenshot", optional contact info checkbox "I'd like a response" with email input if checked), submit button (primary blue "Send Feedback"), privacy note (small text about data handling)
**Key Actions:** Select feedback type, enter subject, write message, optionally include screenshot, optionally provide contact info, submit feedback
**Data:** Reads userProfile for pre-fill contact; writes submits feedback to support system (email or API)
**Permissions:** None (screenshot capture is manual)
**Navigation:** Close → dismisses modal; Submit → sends data → "Thank you!" confirmation → auto-closes

---

### 48. EmergencyContactsScreen
**File:** `src/screens/EmergencyContactsScreen.tsx`
**Navigator:** RootStack.Screen name="EmergencyContacts" (modal), Header: "Emergency Contacts", Large Title
**How User Reaches:** From ConnectScreen, Settings → Emergency Contacts, or MedicalScreen, modal
**Main UI Sections:** Similar to EmergencyContact onboarding screen but in modal format; header (title "Emergency Contacts" large, close button, "+ Add Contact" button), contacts list (each card: profile pic/initials red circular, name bold + "PRIMARY" badge first, relationship, phone formatted, Call/Text action buttons red, swipe Edit/Delete), empty state, add/edit modal with import option
**Key Actions:** View emergency contacts, add contact, edit contact, delete contact, call/text, import from device, set primary
**Data:** Reads/writes emergencyContacts array via addEmergencyContact(), updateEmergencyContact(), removeEmergencyContact()
**Permissions:** Contacts (if importing)
**Navigation:** Close → dismisses modal; identical functionality to onboarding version but in modal context

---

### 49. FavoriteContactsScreen
**File:** `src/screens/FavoriteContactsScreen.tsx`
**Navigator:** RootStack.Screen name="FavoriteContacts" (modal), Header: Hidden (custom)
**How User Reaches:** From ConnectScreen or Settings → Favorite Contacts, modal
**Main UI Sections:** Custom header (back/close button, title "Favorite Contacts", "+ Add" button), contacts list (each card: profile pic/initials colored circular, name bold, relationship, phone formatted, Call/Video/Text action buttons, swipe Edit/Delete), empty state, add/edit modal, import option
**Key Actions:** View favorites, add contact, edit, delete, call/video/text, import from device
**Data:** Reads/writes favoriteContacts array via addFavoriteContact(), updateFavoriteContact(), removeFavoriteContact()
**Permissions:** Contacts (if importing)
**Navigation:** Close → dismisses modal; similar to emergency contacts but different color scheme (blue/green vs red)

---

### 50. ConnectedAppsScreen
**File:** `src/screens/ConnectedAppsScreen.tsx`
**Navigator:** RootStack.Screen name="ConnectedApps" (modal), Header: "Connected Apps", Large Title
**How User Reaches:** From Settings → Connected Apps, modal
**Main UI Sections:** Header (title "Connected Apps" large, close button, "+ Add App" button), connected apps list (each card: app icon/logo, app name, category badge, connection status "Active" green / "Disconnected" gray, last synced time, sync status indicator, quick actions: Sync Now button / Configure button / Disconnect button, tap card for details), empty state (apps icon, "No Connected Apps", "Connect apps to sync your data", "+ Connect Apps" button), sync all button at bottom if multiple apps
**Key Actions:** View connected apps, add new app connection, configure app settings, trigger manual sync, disconnect app, view sync history, sync all
**Data:** Reads connectedApps array, sync history; writes connects/disconnects apps, triggers sync operations, updates sync preferences
**Permissions:** Varies by app
**Navigation:** Close → dismisses modal; "+ Add App" → ConnectAppsChoice or ConnectAppsAdd; Configure → ConnectAppsDetail; Disconnect → confirmation → updates status

---

### 51. SecuritySettingsScreen
**File:** `src/screens/SecuritySettingsScreen.tsx`
**Navigator:** RootStack.Screen name="SecuritySettings" (modal), Header: Hidden (custom)
**How User Reaches:** From Settings → Security & Privacy, modal
**Main UI Sections:** Custom header (back button, title "Security & Privacy"), PIN settings section (current status "PIN Enabled" or "PIN Disabled", "Change PIN" button, "Disable PIN" button if enabled / "Set Up PIN" if disabled), biometric settings section (Face ID/Touch ID toggle with status, only if device supports, requires PIN to be enabled first), app lock settings (auto-lock timeout dropdown: Never, 1 min, 5 min, 15 min, 30 min, "Lock on App Background" toggle), privacy settings ("Show on Lock Screen" toggles for: Notifications, Today's Tasks, Medication Reminders, "Hide Sensitive Info" toggle blurs amounts/names), data security section ("Encrypted Storage" badge always on, "Secure Deletion" info), session settings ("Stay Logged In" toggle, "Require PIN on Important Actions" toggle)
**Key Actions:** Set up/change/disable PIN, enable/disable biometric, configure auto-lock timeout, toggle lock on background, configure lock screen privacy, manage session settings
**Data:** Reads PIN setup status, biometric availability/status, settings.security object; writes updates PIN via pinStorage, updates security settings
**Permissions:** Biometric (Face ID/Touch ID)
**Navigation:** Close → dismisses modal; "Change PIN" → PIN entry flow → new PIN setup; "Set Up PIN" → PIN creation flow with confirm

---

### 52. NotificationSettingsScreen (Dual-Use)
**File:** `src/screens/NotificationSettingsScreen.tsx`
**Navigator:** OnboardingStack (documented in Part 1) AND RootStack modal (dual use)
**How User Reaches:** From onboarding OR from Settings → Notifications as modal
**Main UI Sections:** (Same as Part 1 documentation - bell icon, notification categories with toggles/sub-options, quiet hours, sound selection, system permission status)
**Key Actions:** (Same as Part 1 - toggle categories, configure sub-options, set quiet hours, choose sound, grant permission)
**Data:** (Same as Part 1 - reads/writes settings.notifications)
**Permissions:** Push notifications (system level)
**Navigation:** In modal context: Close → Settings; otherwise same as Part 1

---

### 53. LegalPrivacyScreen
**File:** `src/screens/LegalPrivacyScreen.tsx`
**Navigator:** RootStack.Screen name="LegalPrivacy" (modal), Header: Hidden (custom)
**How User Reaches:** From Settings → Legal & Privacy, modal
**Main UI Sections:** Custom header (back/close button, title "Legal & Privacy"), documents list (each card: icon, document title, brief description, chevron): Privacy Policy card, Terms of Service card, Liability Waiver card, Security Statement card, Data Retention Policy card, Data Breach Response card, contact section (email support link, phone number if available), app version at bottom
**Key Actions:** View each legal document, contact support
**Data:** None
**Permissions:** None
**Navigation:** Each card → respective document screen (modal): PrivacyPolicy, TermsOfService, LiabilityWaiver, SecurityStatement, DataRetentionPolicy, DataBreachResponse; Close → Settings

---

### 54. PrivacyPolicyScreen
**File:** `src/screens/PrivacyPolicyScreen.tsx`
**Navigator:** RootStack.Screen name="PrivacyPolicy" (modal), Header: Hidden (custom)
**How User Reaches:** From LegalPrivacyScreen or LegalConsentScreen during onboarding, modal
**Main UI Sections:** Custom header (back/close button, title "Privacy Policy"), scrollable full text content (sections: Introduction, Information We Collect, How We Use Your Data, Data Storage & Security, Your Rights, Third-Party Services, Changes to Policy, Contact Us, effective date at top), accept/close button at bottom if during onboarding
**Key Actions:** Read privacy policy, scroll through sections, close/accept
**Data:** None
**Permissions:** None
**Navigation:** Close → previous screen (LegalPrivacy or LegalConsent); scrollable text with section headers, markdown-style formatting

---

### 55. TermsOfServiceScreen
**File:** `src/screens/TermsOfServiceScreen.tsx`
**Navigator:** RootStack.Screen name="TermsOfService" (modal), Header: Hidden (custom)
**How User Reaches:** From LegalPrivacyScreen or LegalConsentScreen during onboarding, modal
**Main UI Sections:** Custom header (back/close, title "Terms of Service"), scrollable full text (sections: Acceptance of Terms, Description of Service, User Responsibilities, Medical Disclaimer, Limitation of Liability, Termination, Changes to Terms, Governing Law, Contact, effective date), close button
**Key Actions:** Read terms, scroll, close
**Data:** None
**Permissions:** None
**Navigation:** Close → previous screen; similar format to PrivacyPolicy

---

### 56. LiabilityWaiverScreen
**File:** `src/screens/LiabilityWaiverScreen.tsx`
**Navigator:** RootStack.Screen name="LiabilityWaiver" (modal), Header: Hidden
**How User Reaches:** From LegalPrivacyScreen, modal
**Main UI Sections:** Header (back/close, title "Liability Waiver"), scrollable text (important notices, user acknowledgments, limitations, emergency services disclaimer, no medical advice, user responsibility, indemnification), close button
**Key Actions:** Read waiver, close
**Data:** None
**Permissions:** None
**Navigation:** Close → LegalPrivacy

---

### 57. SecurityStatementScreen
**File:** `src/screens/SecurityStatementScreen.tsx`
**Navigator:** RootStack.Screen name="SecurityStatement" (modal), Header: Hidden
**How User Reaches:** From LegalPrivacyScreen, modal
**Main UI Sections:** Header (back/close, title "Security Statement"), scrollable text (data encryption practices, secure storage methods, authentication measures, privacy safeguards, incident response, compliance standards), close button
**Key Actions:** Read statement, close
**Data:** None
**Permissions:** None
**Navigation:** Close → LegalPrivacy

---

### 58. DataRetentionPolicyScreen
**File:** `src/screens/DataRetentionPolicyScreen.tsx`
**Navigator:** RootStack.Screen name="DataRetentionPolicy" (modal), Header: Hidden
**How User Reaches:** From LegalPrivacyScreen, modal
**Main UI Sections:** Header (back/close, title "Data Retention Policy"), scrollable text (how long data is kept, types of data retained, deletion procedures, user rights to delete, export options, legal requirements), close button
**Key Actions:** Read policy, close
**Data:** None
**Permissions:** None
**Navigation:** Close → LegalPrivacy

---

### 59. DataBreachResponseScreen
**File:** `src/screens/DataBreachResponseScreen.tsx`
**Navigator:** RootStack.Screen name="DataBreachResponse" (modal), Header: Hidden
**How User Reaches:** From LegalPrivacyScreen, modal
**Main UI Sections:** Header (back/close, title "Data Breach Response"), scrollable text (incident response procedures, notification timeline, user actions in case of breach, contact information, mitigation steps, monitoring), close button
**Key Actions:** Read response plan, close
**Data:** None
**Permissions:** None
**Navigation:** Close → LegalPrivacy

---

### 60. PrivacySecurityScreen
**File:** `src/screens/PrivacySecurityScreen.tsx`
**Navigator:** RootStack.Screen name="PrivacySecurity" (modal), Header: Hidden
**How User Reaches:** From Settings or LegalPrivacyScreen, modal
**Main UI Sections:** Header (back/close, title "Privacy & Security"), combined overview of privacy and security practices, sections: data protection, encryption, authentication, user controls, third-party sharing (none), transparency, compliance, close button
**Key Actions:** Read overview, close
**Data:** None
**Permissions:** None
**Navigation:** Close → previous screen

---

## SCREEN-LIKE MODAL COMPONENTS

### 61. AddDoctorModal
**File:** `src/components/AddDoctorModal.tsx`
**Type:** Modal component (not screen)
**How User Reaches:** From DoctorsScreen → "+ Add Doctor" button or Edit action
**Main UI Sections:** Modal overlay with centered card, title "Add Doctor" or "Edit Doctor", form documented in DoctorsScreen (#46), Cancel / Save buttons
**Key Actions:** Enter doctor details, save, cancel
**Data:** Receives doctor prop if editing; onSave callback with doctor object; onCancel callback
**Navigation:** Modal dismisses on Cancel or Save

---

### 62. AddInsuranceModal
**File:** `src/components/AddInsuranceModal.tsx`
**Type:** Modal component (not screen)
**How User Reaches:** From InsuranceScreen → "+ Add Card" or Edit action
**Main UI Sections:** Modal with title "Add Insurance Card" or "Edit Card", options for Scan/Manual/Photo documented in InsuranceScreen (#45), form fields, Cancel / Save
**Key Actions:** Scan card, enter manually, select photos, save, cancel
**Data:** Receives card prop if editing; onSave callback with card object; onCancel callback; handles OCR extraction
**Navigation:** Modal dismisses on Cancel or Save; may open camera/photo picker sub-modals

---

### 63. AddMedicationModal
**File:** `src/components/AddMedicationModal.tsx`
**Type:** Modal component (not screen)
**How User Reaches:** From MedsScreen or MultipleMedicationsScreen → "+ Add Medication" or Edit
**Main UI Sections:** Modal title "Add Medication" or "Edit Medication", form fields: medication name (searchable autocomplete from commonMedications), dosage text input, frequency dropdown (Daily, As Needed, Custom), times (time pickers, multiple allowed), start date picker, reminders toggle, notes multiline optional, Cancel / Save buttons (Save disabled if name empty)
**Key Actions:** Search medication name, enter dosage, select frequency, set times, toggle reminders, add notes, save, cancel
**Data:** Receives medication prop if editing; onSave callback with medication object { id, name, dosage, times[], frequency, reminderEnabled, scheduleType, daysOfWeek, startDate, notes }; onCancel callback
**Navigation:** Modal dismisses on Cancel or Save; integrates with keyboard avoiding view

---

### 64. AddTaskModal
**File:** `src/components/AddTaskModal.tsx`
**Type:** Modal component (not screen)
**How User Reaches:** From TasksScreen or MultipleTasksScreen → "+ Add Task" or Edit
**Main UI Sections:** Modal title "Add Task" or "Edit Task", form fields: task title text input, category dropdown (Medical, Errand, Personal, Other), date picker, time picker optional, recurring toggle with options (Daily, Weekly, Monthly, Custom), reminder toggle with options (At time, 15 min before, 1 hour before, Custom), notes multiline optional, Cancel / Save buttons (Save disabled if title empty)
**Key Actions:** Enter title, select category, set date/time, configure recurring, set reminder, add notes, save, cancel
**Data:** Receives task prop if editing; onSave callback with task object { id, title, category, date, time, frequency, reminderEnabled, soundReminderEnabled, notes }; onCancel callback
**Navigation:** Modal dismisses on Cancel or Save

---

### 65. ContactImportModal
**File:** `src/components/ContactImportModal.tsx`
**Type:** Modal component (not screen)
**How User Reaches:** From ConnectScreen → "+ Add" button (emergency or favorite contacts) or EmergencyContactScreen
**Main UI Sections:** Modal title "Import Contacts", mode selection (visible if mode prop is "both"): "Emergency Contact" or "Favorite Contact" radio buttons, contacts list from device (scrollable, searchable, each shows: profile pic/initials, name, phone numbers if multiple, checkbox to select, relationship input if emergency mode), search bar "Search contacts...", bottom actions: "Cancel" / "Import Selected" showing count, relationship labels for selected emergency contacts
**Key Actions:** Search device contacts, select contacts (multiple), choose mode (emergency vs favorite), set relationship for emergency contacts, import selected, cancel
**Data:** Reads device contacts via expo-contacts; onImportContacts callback receives array of { contact: PhoneContact, type: "favorite" | "emergency", relationship?: string }; onClose callback
**Permissions:** Contacts access (required)
**Navigation:** Modal dismisses on Cancel or Import; requests contacts permission if not granted; handles duplicate detection on import (skips duplicates, shows alert)

---

## ORPHANED / UNUSED SCREENS

### 66. CalendarSyncScreen
**File:** `src/screens/CalendarSyncScreen.tsx`
**Navigator:** NOT REGISTERED (orphaned)
**Status:** Screen exists but not in navigation; likely replaced by ConnectAppsCalendarScreen
**Main UI Sections:** Would show calendar sync setup with Apple Calendar connection, permissions request, sync configuration
**Notes:** Functionality absorbed into ConnectAppsCalendarScreen (#14) during onboarding or ConnectedAppsScreen in settings

---

### 67. LockScreen
**File:** `src/screens/LockScreen.tsx`
**Navigator:** NOT REGISTERED (orphaned)
**Status:** Screen exists but not in navigation; functionality replaced by PinLockScreen component (#1)
**Notes:** PinLockScreen component handles app locking functionality

---

### 68. LoginScreen (Standalone)
**File:** `src/screens/LoginScreen.tsx`
**Navigator:** NOT REGISTERED as standalone (used via AuthenticationScreen)
**Status:** Rendered by AuthenticationScreen (#6b) when mode="login", not directly registered
**Notes:** Documented in Part 1 as #6b, accessed via AuthenticationScreen wrapper

---

### 69. CreateAccountScreen (Standalone)
**File:** `src/screens/CreateAccountScreen.tsx`
**Navigator:** NOT REGISTERED as standalone (used via AuthenticationScreen)
**Status:** Rendered by AuthenticationScreen (#6a) when mode="create", not directly registered
**Notes:** Documented in Part 1 as #6a, accessed via AuthenticationScreen wrapper

---

### 70. SocialSignInScreen
**File:** `src/screens/SocialSignInScreen.tsx`
**Navigator:** NOT REGISTERED (orphaned)
**Status:** Screen exists but not in navigation, imported but not used in RootNavigator
**Main UI Sections:** Would show social sign-in options (Google, Facebook) with OAuth flows, "Continue with Google" button, "Continue with Facebook" button, "Manual Entry" option, configuration warnings if OAuth not set up
**Notes:** Social sign-in functionality deprecated or moved to AuthenticationScreen/CreateAccountScreen; Google OAuth may not be fully configured

---

### 71. FontSizeSelectionScreen
**File:** `src/screens/FontSizeSelectionScreen.tsx`
**Navigator:** NOT REGISTERED (orphaned)
**Status:** Screen exists but not in navigation; font size selection likely moved to Settings
**Main UI Sections:** Would show font size options (Normal, Large, Extra Large) with live preview text, radio selection, "Continue" button
**Notes:** Font size configuration now in SettingsScreen → Text Size option

---

### 72. MedsScreenOld
**File:** `src/screens/MedsScreenOld.tsx`
**Navigator:** NOT REGISTERED (orphaned)
**Status:** Old version of MedsScreen, kept for reference but not used
**Notes:** Replaced by current MedsScreen (#28); can be deleted if no longer needed

---

## SUPPORT COMPONENTS

### 73. SwipeTooltip
**File:** `src/components/SwipeTooltip.tsx`
**Type:** Overlay tooltip component
**Usage:** Displays tutorial tooltips explaining swipe gestures on list items (e.g., "Swipe left to edit or delete")
**UI:** Semi-transparent overlay with arrow pointing to relevant UI, text explanation, "Got It" button, appears once per feature via hasSeenTooltip tracking
**Props:** visible boolean, title string, message string, onClose callback, position "top" | "bottom" | "left" | "right"
**Notes:** Used in various list screens to guide first-time users on swipe actions

---

### 74. TutorialTooltip
**File:** `src/components/TutorialTooltip.tsx`
**Type:** Overlay tooltip component
**Usage:** Displays general tutorial tooltips for app features (e.g., "Tap 'Edit' to reorder tools or star favorites")
**UI:** Positioned overlay with arrow, title, message, "Dismiss" or "Got It" button, appears based on hasSeenTooltip flags
**Props:** visible boolean, title string, message string, onClose callback, position string, optional arrow direction
**Notes:** Similar to SwipeTooltip but for general feature education; used in ToolsScreen, HomeScreen, etc.

---

### 75. SwipeableRow
**File:** `src/components/SwipeableRow.tsx`
**Type:** Wrapper component for swipeable list items
**Usage:** Wraps list item content to add swipe gesture with Edit/Delete actions
**UI:** Renders children with swipe gesture handlers, reveals colored action buttons (Edit blue, Delete red) on swipe left, haptic feedback on action
**Props:** children ReactNode, onEdit callback, onDelete callback, optional onArchive callback
**Notes:** Uses react-native-gesture-handler Swipeable; provides consistent swipe behavior across app lists (tasks, medications, contacts, notes, etc.)

---

### 76. MaskedText
**File:** `src/components/MaskedText.tsx`
**Type:** Privacy-aware text component
**Usage:** Displays sensitive text with optional masking/blurring for privacy (e.g., medication names, amounts on lock screen)
**UI:** Renders text normally or with blur effect based on settings.hideInsensitiveInfo flag and context (lock screen vs unlocked app)
**Props:** text string, masked boolean, style object, maskChar string default "•", maskLength optional for partial masking
**Notes:** Used when displaying sensitive information; respects user's privacy settings for lock screen notifications and sensitive data display

---

## SUMMARY STATISTICS

**Total Files Documented:** 76

**Breakdown:**
- Part 1 (Onboarding): 27 screens (2 root components + 25 onboarding screens)
- Part 2 (Main Tabs & Tools): 19 screens (8 main tabs + 11 tools stack)
- Part 3 (Modals & Misc): 30 files (15 modal screens + 5 screen-like modals + 7 orphaned + 4 support components + 1 duplicate from Part 1 NotificationSettingsScreen dual-use)

**Navigation Structure:**
- Root Level: 2 overlays (PinLockScreen, EmailVerificationHandler)
- OnboardingStack: 23 unique screens (AuthenticationScreen + 2 child screens + 22 others)
- MainTabs: 8 tabs
- ToolsStack (nested): 11 screens
- RootStack Modals: 15 screens
- Screen-like Modals: 5 components
- Orphaned/Unused: 7 screens
- Support Components: 4 components

**Key Patterns:**
- Modal presentation used for secondary flows (insurance, doctors, feedback, legal)
- Swipeable rows with Edit/Delete actions consistent across lists
- "Add" modals follow similar patterns (Cancel/Save, form validation)
- Tutorial tooltips track via hasSeenTooltip flags
- Onboarding flow is linear with skip options
- Settings as central hub for configuration and secondary flows
- Bottom tab navigation with 8 tabs
- Nested navigators (ToolsStack within Tools tab)

---

## End of Part 3 - Documentation Complete

All 76 screen-related files in the SteadiDay app have been documented across three markdown files in compact format.
