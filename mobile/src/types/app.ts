export type TextSize = "normal" | "large" | "extra-large";

export type ColorTheme = "blue" | "sage" | "purple" | "orange" | "pink" | "teal";

export type AppearanceMode = "light" | "dark" | "system";

export type AccessibilityMode = "default" | "high-contrast" | "color-blind-friendly";

export type ReminderSound = "default" | "gentle" | "chime" | "bell";

// Data source labels for privacy transparency
export type DataSource =
  | "steadiday"
  | "apple_health"
  | "apple_calendar"
  | "google_calendar"
  | "ios_reminders"
  | "multiple"
  | "other";

// Helper to get human-readable source label
export function getDataSourceLabel(source: DataSource): string {
  switch (source) {
    case "steadiday":
      return "SteadiDay";
    case "apple_health":
      return "Apple Health";
    case "apple_calendar":
      return "Apple Calendar";
    case "google_calendar":
      return "Google Calendar";
    case "ios_reminders":
      return "iOS Reminders";
    case "multiple":
      return "Multiple sources";
    case "other":
      return "Other";
  }
}

export interface SoundSettings {
  appSoundsEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  medicationReminderSound: ReminderSound;
  taskReminderSound: ReminderSound;
  loudEmergencySounds: boolean;
}

export type Language = "en" | "es" | "zh" | "fr" | "de" | "it" | "pt" | "ja" | "ko" | "hi";

export type AuthProvider = "google" | "email" | "apple" | "local";

export interface AuthInfo {
  provider: AuthProvider;
  email?: string; // Email is optional for local auth
  userId: string;
  isAuthenticated: boolean;
  emailVerified?: boolean; // Set to true when user verifies their email
  welcomeEmailSent?: boolean; // Set to true after welcome email is sent
  accountCreatedAt?: string; // ISO timestamp of when account was created
}

export type FavoriteContact = {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  imageUri?: string; // Profile picture from phone contacts
};

// MedicalID type and BloodType removed - Medical ID feature removed from app
// Users should use Apple Health Medical ID for emergency medical information

export interface UserProfile {
  name: string;
  birthday?: string; // Format: YYYY-MM-DD
  location?: string; // User's city/location for weather
  emergencyContacts: TrustedContact[]; // Now uses TrustedContact type (renamed concept, kept field name for compatibility)
  favoriteContacts: FavoriteContact[];
  auth?: AuthInfo; // Authentication information
  // medicalID removed - Medical ID feature removed from app
}

// Trusted Contact - the new name for emergency contacts
// Field kept as "emergencyContacts" in UserProfile for migration compatibility
export interface TrustedContact {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean; // Primary contact shown on home widget
  isEmergencyContact: boolean; // Will be contacted during SOS/fall detection
  imageUri?: string; // Profile picture from phone contacts
}

// Keep for backward compatibility during migration
export type EmergencyContact = TrustedContact;

export interface InsuranceCard {
  id: string;
  type: "health" | "dental" | "vision";
  providerName: string;
  memberId: string;
  groupNumber?: string;
  policyHolder: string;
  phoneNumber?: string; // Customer service phone number
  // photoUri is not saved for privacy/security - photos are only used temporarily for AI recognition
  photoUri?: string;
  notes?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phoneNumber: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export type MedicationFrequency =
  | "daily"
  | "twice-daily"
  | "three-times-daily"
  | "four-times-daily"
  | "every-other-day"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "one-time"
  | "as-needed";

// Alert timing options for reminders
export type AlertTiming = "at_time" | "5_min" | "15_min" | "30_min";
export type SecondAlertTiming = "none" | AlertTiming;

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "specific";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  timeOfDay: TimeOfDay;
  specificTime?: string; // "09:00" format, used when timeOfDay is "specific"
  reminderEnabled: boolean;
  firstAlert?: AlertTiming; // When to send first reminder
  secondAlert?: SecondAlertTiming; // Optional second reminder
  notes?: string; // Instructions like "take with food"
  scheduleType: "daily" | "specific-days" | "multiple-times";
  times: string[]; // Array of time strings like "09:00"
  daysOfWeek?: number[]; // 0-6, Sunday to Saturday, for specific-days type
  startDate?: string; // ISO date string, for every-other-day and weekly schedules
  pharmacy?: {
    name: string;
    phoneNumber?: string;
    address?: string;
  };
  // photoUri is not saved for privacy/security - photos are only used temporarily for AI recognition
  photoUri?: string;
  createdAt: string;
  notificationIds?: string[]; // IDs of scheduled notifications
  calendarEventIds?: string[]; // Calendar event IDs for syncing
  syncSource?: string; // Legacy: Source app ID (e.g., "apple-health", "carezone") or "steadiday"
  dataSource?: DataSource; // Data origin for privacy transparency
  // NEW: Linking to provider medications
  linkedProviderId?: string; // ID of the linked Apple Health medication record
  linkedProviderDosage?: string; // Dosage when linked (to detect changes)
  linkedProviderName?: string; // Name when linked (to detect changes)
  // Discontinued status for Essentials limits
  discontinuedAt?: string; // ISO timestamp when medication was discontinued
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: string; // ISO string
  status: "taken" | "missed" | "skipped" | "snoozed";
  actualTime?: string; // ISO string when actually taken
}

export type TaskCategory = "medical" | "errand" | "personal" | "other";

export type TaskFrequency =
  | "once"
  | "daily"
  | "twice-daily"
  | "three-times-daily"
  | "weekly"
  | "every-other-day"
  | "monthly"
  | "yearly"
  | "custom";

export type TaskRepeatEnding = "never" | "on-date" | "after-count";

// Source system for external imports - supports future Google Calendar
export type TaskSourceSystem = "manual" | "apple_calendar" | "apple_reminders" | "google_calendar";

// Sync status for imported tasks
export type TaskSyncStatus = "linked" | "unlinked" | "archived";

export interface Task {
  id: string;
  title: string;
  date: string; // ISO date string (start date/time)
  dueDateLocal?: string; // Local date-only string "YYYY-MM-DD" for all-day events (prevents timezone shift)
  endDate?: string; // ISO date string (end date/time) - for all-day or multi-day events
  time?: string; // Time string like "14:00"
  endTime?: string; // End time string like "16:00"
  times?: string[]; // Multiple times for multi-daily tasks like "09:00", "14:00", "21:00"
  timeOfDay?: "morning" | "afternoon" | "evening" | "night" | "specific"; // Time of day preference
  isAllDay?: boolean; // If true, this is an all-day event
  location?: string; // Location address or name
  latitude?: number; // Latitude for GPS navigation
  longitude?: number; // Longitude for GPS navigation
  category?: TaskCategory;
  frequency?: TaskFrequency;
  repeatEnding?: TaskRepeatEnding; // How the repeat ends
  repeatEndDate?: string; // When repeating ends (if repeatEnding is "on-date")
  repeatCount?: number; // How many occurrences (if repeatEnding is "after-count")
  reminderEnabled: boolean;
  reminderMinutes?: number; // Minutes before event to remind (e.g., 15, 30, 60, 1440 for 1 day)
  secondReminderMinutes?: number; // Optional second reminder
  soundReminderEnabled?: boolean; // Optional audio alert for task reminders
  notes?: string;
  url?: string; // URL or video conference link
  attendees?: string[]; // Email addresses of attendees
  color?: string; // Color tag for the event (hex color)
  completed: boolean;
  completedAt?: string;
  notificationIds?: string[]; // IDs of scheduled notifications (first and optional second alert)
  calendarEventId?: string; // Calendar event ID for syncing
  syncSource?: "calendar" | "reminders" | "steadiday"; // Legacy field for sync
  dataSource?: DataSource; // Data origin for privacy transparency

  // External source fields for imports (supports Apple and Google)
  sourceSystem: TaskSourceSystem; // Which system this task came from
  sourceContainerId?: string; // Calendar ID or Reminders list ID
  sourceContainerName?: string; // Name of calendar/list at time of import
  sourceItemId?: string; // Event ID or Reminder ID from source
  sourceUrl?: string; // Optional deep link to source app
  isImported: boolean; // True if imported from external source
  isReadOnly: boolean; // True for imported items (edits create a copy)
  isLocallyEdited?: boolean; // True if user has edited an imported task locally
  syncStatus: TaskSyncStatus; // Current sync state
  lastSyncedAt?: string; // Last time this task was synced
  archivedAt?: string; // When task was archived (ISO timestamp)
  archivedReason?: string; // Why task was archived (e.g., "Removed from Apple Calendar")

  // Repeating item info (Option B - informational only)
  isRepeating?: boolean; // True if this item repeats in source app
  sourceRecurrenceRule?: string; // Original recurrence rule from source (e.g., "FREQ=DAILY")
  seriesId?: string; // Unique ID for the recurring series (for key generation)
}

// ============================================================================
// TASK SERIES & INSTANCE MODEL (Daily Planner)
// ============================================================================

/**
 * Source type for task series - where this task definition came from
 */
export type TaskSeriesSourceType = "manual" | "apple_calendar" | "apple_reminders";

/**
 * TaskSeries - Defines a task or imported Apple item
 * This is the "definition" that gets expanded into instances for display
 */
export interface TaskSeries {
  id: string;
  title: string;
  notes?: string;
  sourceType: TaskSeriesSourceType;
  sourceId?: string; // Apple Calendar event ID or Reminders ID
  sourceContainerId?: string; // Calendar ID or Reminders list ID
  isActive: boolean; // Active series generate instances

  // Scheduling
  startDate: string; // ISO date string - when this series starts
  time?: string; // Time string like "14:00" (optional for all-day items)
  endTime?: string; // End time string like "16:00"
  isAllDay?: boolean; // All-day event flag

  // Recurrence - using frequency enum for manual tasks
  frequency: TaskFrequency;
  repeatEndDate?: string; // When repeating ends (ISO date)
  repeatCount?: number; // How many occurrences total

  // For Apple imports with RRULE - store original rule
  rruleString?: string; // e.g., "FREQ=DAILY;INTERVAL=1"

  // Display
  category?: TaskCategory;
  location?: string;

  // Reminders
  reminderEnabled: boolean;
  reminderMinutes?: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * TaskInstance - A single occurrence of a task for rendering
 * Generated from TaskSeries for a date range, not persisted
 */
export interface TaskInstance {
  instanceId: string; // Format: "{seriesId}:{occurrenceStartISO}"
  seriesId: string; // Reference to parent TaskSeries
  title: string;
  notes?: string;
  category?: TaskCategory;

  // Instance timing
  occurrenceStart: string; // ISO datetime for this occurrence
  occurrenceEnd?: string; // ISO datetime for end
  time?: string; // Time string "HH:MM"
  endTime?: string;
  isAllDay?: boolean;

  // Display info
  location?: string;
  sourceType: TaskSeriesSourceType;

  // Completion status - pulled from completions store
  isCompleted: boolean;
  completedAt?: string;
}

/**
 * TaskInstanceCompletion - Persisted completion record
 * Stores which specific instances have been completed
 */
export interface TaskInstanceCompletion {
  instanceId: string; // "{seriesId}:{occurrenceStartISO}"
  seriesId: string;
  completedAt: string; // ISO timestamp when completed
  occurrenceDate: string; // The date this completion was for (YYYY-MM-DD)
}

/**
 * Calendar exception from Apple Calendar
 * Represents a deleted or modified occurrence of a recurring event
 */
export interface CalendarException {
  seriesId: string; // The recurring event ID
  exceptionDate: string; // YYYY-MM-DD of the exception
  type: "deleted" | "modified";
  modifiedData?: Partial<TaskSeries>; // If modified, the changed fields
}

export interface ParkingSpot {
  latitude: number;
  longitude: number;
  timestamp: string;
  note?: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthMetric {
  id: string;
  date: string; // ISO date string
  steps?: number;
  heartRate?: number;
  sleepHours?: number;
  exerciseMinutes?: number;
  weight?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  createdAt: string;
}

export interface HealthGoals {
  stepsGoal: number;
  sleepGoal: number;
  exerciseGoal: number;
}

// ============================================================================
// APPLE HEALTH RECORDS TYPES (Premium-only)
// ============================================================================

/**
 * Interpretation of lab result values
 */
export type LabResultInterpretation = "normal" | "high" | "low" | "abnormal" | "unknown";

/**
 * Lab result item from Apple Health Records
 * Imported via HealthKit LabResultRecord
 */
export interface LabResultItem {
  id: string;
  displayName: string;
  date: string; // ISO date string
  sourceName: string; // Provider/facility name (e.g., "Quest Diagnostics")
  sourceId: string; // Unique identifier from source
  valueText: string; // Value as text (e.g., "5.2", "Positive")
  unitText?: string; // Unit (e.g., "mg/dL", "mmol/L")
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  interpretation: LabResultInterpretation;
  rawFhir?: string; // Raw FHIR JSON for advanced usage
  importedAt: string; // When this was imported to the app
}

/**
 * Source type for medications
 */
export type MedicationSourceType = "manual" | "apple_health";

/**
 * Status of a medication
 */
export type MedicationStatus = "active" | "completed" | "on-hold" | "stopped" | "unknown";

/**
 * Medication item that can be from manual entry or Apple Health Records
 * Apple Health medications come from HealthKit MedicationRecord (provider-sourced)
 */
export interface MedicationItem {
  id: string;
  displayName: string;
  sourceType: MedicationSourceType;
  medicationName: string;
  doseText?: string; // e.g., "10mg", "1 tablet"
  routeText?: string; // e.g., "oral", "topical"
  scheduleText?: string; // e.g., "twice daily", "as needed"
  status: MedicationStatus;
  date?: string; // ISO date string - when prescribed or started
  sourceName?: string; // Provider name (only for apple_health)
  rawFhir?: string; // Raw FHIR JSON (only for apple_health)
  // Manual entry specific fields
  notes?: string;
  pharmacy?: {
    name: string;
    phoneNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Clinical status for conditions/diagnoses
 */
export type ClinicalStatus = "active" | "resolved" | "inactive" | "unknown";

/**
 * Severity level for conditions/allergies
 */
export type SeverityLevel = "mild" | "moderate" | "severe" | "unknown";

/**
 * Diagnosis/Condition item from Apple Health Records (Premium-only)
 * Imported via HealthKit ClinicalRecord (Condition resource)
 */
export interface DiagnosisItem {
  id: string;
  displayName: string;
  date: string; // ISO date string - when diagnosed
  sourceName: string; // Provider/facility name
  sourceId: string; // Unique identifier from source
  clinicalStatus: ClinicalStatus;
  severity?: SeverityLevel;
  notes?: string; // Clinical notes if available
  icdCode?: string; // ICD-10 code if available
  rawFhir?: string; // Raw FHIR JSON for advanced usage
  importedAt: string; // When this was imported to the app
}

/**
 * Procedure item from Apple Health Records (Premium-only)
 * Imported via HealthKit ClinicalRecord (Procedure resource)
 */
export interface ProcedureItem {
  id: string;
  displayName: string;
  date: string; // ISO date string - when performed
  sourceName: string; // Provider/facility name
  sourceId: string; // Unique identifier from source
  status: "completed" | "in-progress" | "cancelled" | "unknown";
  location?: string; // Where procedure was performed
  notes?: string; // Clinical notes if available
  cptCode?: string; // CPT code if available
  rawFhir?: string; // Raw FHIR JSON for advanced usage
  importedAt: string; // When this was imported to the app
}

/**
 * Allergy reaction type
 */
export type AllergyReactionType = "allergy" | "intolerance" | "unknown";

/**
 * Allergy category
 */
export type AllergyCategory = "food" | "medication" | "environment" | "other";

/**
 * Allergy item from Apple Health Records (Premium-only)
 * Imported via HealthKit ClinicalRecord (AllergyIntolerance resource)
 */
export interface AllergyItem {
  id: string;
  displayName: string;
  date: string; // ISO date string - when recorded
  sourceName: string; // Provider/facility name
  sourceId: string; // Unique identifier from source
  type: AllergyReactionType;
  category: AllergyCategory;
  clinicalStatus: ClinicalStatus;
  severity?: SeverityLevel;
  reaction?: string; // Description of reaction (e.g., "hives", "anaphylaxis")
  notes?: string; // Additional notes
  rawFhir?: string; // Raw FHIR JSON for advanced usage
  importedAt: string; // When this was imported to the app
}

/**
 * Care team member role
 */
export type CareTeamRole =
  | "primary_care"
  | "specialist"
  | "surgeon"
  | "nurse"
  | "pharmacist"
  | "therapist"
  | "caregiver"
  | "other";

/**
 * Care team member from Apple Health Records or manual entry (Premium-only)
 * Imported via HealthKit ClinicalRecord (CareTeam/Practitioner resource)
 */
export interface CareTeamMember {
  id: string;
  displayName: string; // Full name
  role: CareTeamRole;
  specialty?: string; // e.g., "Cardiology", "Orthopedics"
  organization?: string; // Hospital/clinic name
  phoneNumber?: string;
  email?: string;
  address?: string;
  notes?: string;
  // Source information
  sourceType: MedicationSourceType; // Reuse: "manual" | "apple_health"
  sourceName?: string; // Provider source (for apple_health)
  sourceId?: string; // Unique identifier from source
  rawFhir?: string; // Raw FHIR JSON (only for apple_health)
  createdAt: string;
  updatedAt: string;
}

/**
 * Aggregated medical records for Premium users
 * Data is pulled on-demand from Apple Health, never persisted locally
 */
export interface MedicalRecords {
  labResults: LabResultItem[];
  medications: MedicationItem[];
  diagnoses: DiagnosisItem[];
  procedures: ProcedureItem[];
  allergies: AllergyItem[];
  careTeam: CareTeamMember[];
  lastFetchedAt?: string; // ISO timestamp of last fetch
}

export interface FamilyMessage {
  id: string;
  type: "photo" | "text";
  content: string; // Text content or photo URI
  caption?: string;
  fromName: string;
  timestamp: string;
  fromImageUri?: string; // Profile picture of the sender
}

export type AppConnectionCategory = "health" | "medication" | "calendar";

export type SyncPreference = "two-way" | "unified-reminders" | "all-sync" | "none";

export interface ConnectedApp {
  id: string;
  name: string;
  category: AppConnectionCategory;
  isConnected: boolean;
  icon: string; // ionicon name
  description: string;
  isInstalled?: boolean; // Whether the app is detected on the device
  syncPreference?: SyncPreference; // How data should be synced with this app
  canConnect?: boolean; // Whether the app can actually connect to our app (default: true)
  packageName?: string; // iOS bundle ID or Android package name for opening the app
}

export type NotificationSource = "steadiday" | "connected-apps" | "both";

export type HomeScreenWidget =
  | "weather"
  | "tasks"
  | "medications"
  | "sos"
  | "emergency-contacts"
  | "favorite-contacts"
  | "health-metrics"
  | "insurance-cards"
  | "my-doctors"
  | "magnifier"
  | "flashlight"
  | "notes"
  | "find-my-car"
  | "food-water"
  | "care-summary"
  | "safety-session"
  | "daily-check-in";

export interface AppSettings {
  textSize: TextSize;
  colorTheme: ColorTheme;
  appearanceMode: AppearanceMode; // Light, Dark, or System
  highContrastEnabled: boolean; // High contrast mode for accessibility
  colorBlindModeEnabled: boolean; // Color-blind friendly mode
  reduceMotionEnabled: boolean; // Reduce animations for accessibility
  soundSettings: SoundSettings; // Sound and haptic preferences
  language: Language;
  voiceGuidanceEnabled: boolean;
  dailyCheckInEnabled: boolean;
  dailyCheckInTime: string; // Time string like "20:00"
  medicationRemindersEnabled: boolean;
  taskRemindersEnabled: boolean;
  dailyCheckInAlertsEnabled: boolean;
  missedMedicationAlertEnabled: boolean;
  callAfterSOS: boolean;
  fallDetectionEnabled: boolean;
  sosCallNumber?: string; // "911" or contact phone number
  lastCheckIn?: string; // ISO date string
  calendarSyncEnabled: boolean;
  calendarId?: string; // Device calendar ID for syncing
  useDeviceLocation: boolean; // Auto-track device location for weather
  lastSyncTime?: string; // ISO date string of last two-way sync
  appPin?: string; // 4-digit PIN for app security
  biometricEnabled: boolean; // Whether biometric authentication is enabled
  securityEnabled: boolean; // Whether app lock is enabled
  rememberMe: boolean; // Whether to remember login session
  lastUnlockTime?: string; // ISO date string of last successful unlock
  developerMode: boolean; // Developer mode for testing features
  notificationSource: NotificationSource; // Which apps should send notifications
  homeScreenWidgets: HomeScreenWidget[]; // Widgets visible on home screen
  foodTrackingEnabled: boolean; // Whether food tracking is enabled
  waterTrackingEnabled: boolean; // Whether water tracking is enabled
  foodNotificationsEnabled: boolean; // Whether to show food reminders
  waterNotificationsEnabled: boolean; // Whether to show water reminders
  intakeIntroSeen: boolean; // Whether user has seen the intake tracking intro
  adsEnabled: boolean; // Whether to show support ads
  enableAppleWriteBack: boolean; // Whether to write changes back to Apple Calendar/Reminders (default: false)
}

export type PortionSize = "small" | "medium" | "large";
export type HealthLabel = "healthy" | "neutral" | "treat";
export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface FoodEntry {
  id: string;
  name: string;
  portionSize: PortionSize;
  healthLabel: HealthLabel;
  mealType: MealType;
  calories: number;
  isCalorieOverride?: boolean; // True if user manually changed the calorie value
  date: string; // ISO date string
  createdAt: string;
}

// Meal schedule for reminders and auto-detection
export interface MealSchedule {
  breakfast: string; // Time string "HH:MM"
  breakfastReminder: boolean;
  lunch: string;
  lunchReminder: boolean;
  dinner: string;
  dinnerReminder: boolean;
}

export interface WaterLog {
  id: string;
  glassesCount: number; // 0-8
  date: string; // ISO date string (YYYY-MM-DD)
}

export interface DailyLog {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  totalCalories: number;
  waterGlasses: number;
  mealsLogged: number;
}

// Tab names that can be visited
export type TabName = "Home" | "Tasks" | "Meds" | "Medical" | "Health" | "Tools" | "Connect" | "Settings";

export interface AppState {
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean; // Top-level flag for reliable navigation state changes
  userProfile: UserProfile;
  medications: Medication[];
  medicationLogs: MedicationLog[];
  tasks: Task[];
  parkingSpot?: ParkingSpot;
  notes: Note[];
  healthMetrics: HealthMetric[];
  healthGoals: HealthGoals;
  familyMessages: FamilyMessage[];
  insuranceCards: InsuranceCard[];
  doctors: Doctor[];
  settings: AppSettings;
  lastBrainGame?: string; // ISO date string of last completed brain game
  connectedApps: ConnectedApp[];
  favoriteToolIds: string[]; // IDs of tools marked as favorites
  shownTooltips: string[]; // IDs of tooltips that have been shown and dismissed
  dismissedInfoCards: string[]; // IDs of info cards that have been dismissed
  foodEntries: FoodEntry[];
  waterLogs: WaterLog[];
  // Navigation guidance
  visitedTabs: TabName[]; // Tabs the user has visited at least once
  hasSeenTabScrollHint: boolean; // Whether user has seen the horizontal scroll hint
}
