import { Medication, MedicationFrequency, AlertTiming, SecondAlertTiming } from "../../types/app";

// Form state interface - all fields managed by useMedicationForm
export interface MedicationFormState {
  // Basic info
  name: string;
  dosage: string;
  frequency: MedicationFrequency;

  // Schedule
  specificTime: Date;
  multipleTimes: Date[];
  startDate: Date;

  // Reminders
  reminderEnabled: boolean;
  soundReminderEnabled: boolean;
  firstAlert: AlertTiming;
  secondAlert: SecondAlertTiming;

  // Notes/Instructions
  notes: string;

  // Pharmacy
  pharmacyName: string;
  pharmacyPhone: string;
  pharmacyAddress: string;

  // UI state
  showNameSuggestions: boolean;
  showDosageSuggestions: boolean;
  showPharmacySuggestions: boolean;
  showDatePicker: boolean;
  isAnalyzingPhoto: boolean;
}

// Update field function type
export type UpdateFieldFn = <K extends keyof MedicationFormState>(
  field: K,
  value: MedicationFormState[K]
) => void;

// Props shared by all form section components
export interface FormSectionProps {
  formState: MedicationFormState;
  updateField: UpdateFieldFn;
  textClasses: {
    body: string;
    small: string;
    subtitle: string;
    button: string;
  };
  colors: {
    background: string;
    cardBackground: string;
    textPrimary: string;
    textSecondary: string;
    divider: string;
    border: string;
    primaryLight: string;
    success: string;
    onPrimary: string;
  };
  primary: string;
  primaryLight: string;
}

// Photo import section specific props
// Section captures the photo URI; the parent extracts via OpenAI Vision then
// deletes the temp file. The section itself never persists any photo data.
export interface PhotoImportSectionProps extends FormSectionProps {
  onAnalyzePhoto: (photoUri: string) => Promise<void>;
}

// Frequency section specific props
export interface FrequencySectionProps extends FormSectionProps {
  onFrequencyChange: (frequency: MedicationFrequency) => void;
}

// Time selection section specific props
export interface TimeSelectionSectionProps extends FormSectionProps {
  onUpdateTimeAtIndex: (index: number, time: Date) => void;
}

// Hook return type
export interface UseMedicationFormReturn {
  formState: MedicationFormState;
  updateField: UpdateFieldFn;
  resetForm: () => void;
  handleFrequencyChange: (frequency: MedicationFrequency) => void;
  updateTimeAtIndex: (index: number, time: Date) => void;
  buildMedication: (editingMedication?: Medication | null) => Medication;
  isValid: boolean;
}

// Helper to create default time
export function createDefaultTime(hours: number = 9, minutes: number = 0): Date {
  const t = new Date();
  t.setHours(hours, minutes, 0, 0);
  return t;
}

// Helper to format time string from Date
export function formatTimeFromDate(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// Helper to parse time string to Date
export function parseTimeToDate(timeStr: string): Date {
  const t = new Date();
  const [hours, minutes] = timeStr.split(":").map(Number);
  t.setHours(hours, minutes, 0, 0);
  return t;
}
