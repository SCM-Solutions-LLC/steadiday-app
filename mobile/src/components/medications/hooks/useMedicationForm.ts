import { useState, useCallback, useEffect, useRef } from "react";
import { Medication, MedicationFrequency, AlertTiming, SecondAlertTiming } from "../../../types/app";
import {
  MedicationFormState,
  UseMedicationFormReturn,
  createDefaultTime,
  formatTimeFromDate,
  parseTimeToDate,
} from "../types";

interface UseMedicationFormOptions {
  editingMedication?: Medication | null;
}

export function useMedicationForm(
  options: UseMedicationFormOptions = {}
): UseMedicationFormReturn {
  const { editingMedication } = options;

  // Track the medication ID to detect when we're editing a different medication
  const lastMedicationIdRef = useRef<string | null>(null);

  // Initialize time from editing medication or default to 9:00 AM
  const initializeTime = useCallback((med?: Medication | null): Date => {
    if (med?.specificTime) {
      return parseTimeToDate(med.specificTime);
    }
    return createDefaultTime(9, 0);
  }, []);

  // Initialize multiple times for medications taken multiple times per day
  const initializeTimes = useCallback((med?: Medication | null): Date[] => {
    if (med?.times && med.times.length > 0) {
      return med.times.map(parseTimeToDate);
    }
    return [initializeTime(med)];
  }, [initializeTime]);

  // Form state
  const [name, setName] = useState(editingMedication?.name || "");
  const [dosage, setDosage] = useState(editingMedication?.dosage || "");
  const [frequency, setFrequency] = useState<MedicationFrequency>(
    editingMedication?.frequency || "daily"
  );
  const [specificTime, setSpecificTime] = useState(() => initializeTime(editingMedication));
  const [multipleTimes, setMultipleTimes] = useState<Date[]>(() => initializeTimes(editingMedication));
  const [startDate, setStartDate] = useState<Date>(
    editingMedication?.startDate
      ? new Date(editingMedication.startDate)
      : new Date()
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    editingMedication?.reminderEnabled ?? true
  );
  const [soundReminderEnabled, setSoundReminderEnabled] = useState(false);
  const [firstAlert, setFirstAlert] = useState<AlertTiming>(
    editingMedication?.firstAlert || "at_time"
  );
  const [secondAlert, setSecondAlert] = useState<SecondAlertTiming>(
    editingMedication?.secondAlert || "none"
  );
  const [notes, setNotes] = useState(editingMedication?.notes || "");

  // Pharmacy state
  const [pharmacyName, setPharmacyName] = useState(
    editingMedication?.pharmacy?.name || ""
  );
  const [pharmacyPhone, setPharmacyPhone] = useState(
    editingMedication?.pharmacy?.phoneNumber || ""
  );
  const [pharmacyAddress, setPharmacyAddress] = useState(
    editingMedication?.pharmacy?.address || ""
  );

  // CRITICAL FIX: Re-populate form when editingMedication changes
  // This ensures the form is pre-filled when editing a medication
  useEffect(() => {
    const currentMedId = editingMedication?.id || null;

    // Only update if we're switching to a different medication (or from null to a medication)
    if (currentMedId !== lastMedicationIdRef.current) {
      lastMedicationIdRef.current = currentMedId;

      if (editingMedication) {
        // Pre-populate all form fields from the editing medication
        setName(editingMedication.name || "");
        setDosage(editingMedication.dosage || "");
        setFrequency(editingMedication.frequency || "daily");
        setSpecificTime(initializeTime(editingMedication));
        setMultipleTimes(initializeTimes(editingMedication));
        setStartDate(
          editingMedication.startDate
            ? new Date(editingMedication.startDate)
            : new Date()
        );
        setReminderEnabled(editingMedication.reminderEnabled ?? true);
        setSoundReminderEnabled(false);
        setFirstAlert(editingMedication.firstAlert || "at_time");
        setSecondAlert(editingMedication.secondAlert || "none");
        setNotes(editingMedication.notes || "");
        setPharmacyName(editingMedication.pharmacy?.name || "");
        setPharmacyPhone(editingMedication.pharmacy?.phoneNumber || "");
        setPharmacyAddress(editingMedication.pharmacy?.address || "");
        // Reset UI state
        setShowNameSuggestions(false);
        setShowDosageSuggestions(false);
        setShowPharmacySuggestions(false);
        setShowDatePicker(false);
        setIsAnalyzingPhoto(false);
      } else {
        // Reset form when editingMedication becomes null (adding new medication)
        setName("");
        setDosage("");
        setFrequency("daily");
        const defaultTime = createDefaultTime(9, 0);
        setSpecificTime(defaultTime);
        setMultipleTimes([defaultTime]);
        setStartDate(new Date());
        setReminderEnabled(true);
        setSoundReminderEnabled(false);
        setFirstAlert("at_time");
        setSecondAlert("none");
        setNotes("");
        setPharmacyName("");
        setPharmacyPhone("");
        setPharmacyAddress("");
        setShowNameSuggestions(false);
        setShowDosageSuggestions(false);
        setShowPharmacySuggestions(false);
        setShowDatePicker(false);
        setIsAnalyzingPhoto(false);
      }
    }
  }, [editingMedication, initializeTime, initializeTimes]);

  // UI state
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showDosageSuggestions, setShowDosageSuggestions] = useState(false);
  const [showPharmacySuggestions, setShowPharmacySuggestions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  // Build form state object
  const formState: MedicationFormState = {
    name,
    dosage,
    frequency,
    specificTime,
    multipleTimes,
    startDate,
    reminderEnabled,
    soundReminderEnabled,
    firstAlert,
    secondAlert,
    notes,
    pharmacyName,
    pharmacyPhone,
    pharmacyAddress,
    showNameSuggestions,
    showDosageSuggestions,
    showPharmacySuggestions,
    showDatePicker,
    isAnalyzingPhoto,
  };

  // Generic update field function
  const updateField = useCallback(
    <K extends keyof MedicationFormState>(
      field: K,
      value: MedicationFormState[K]
    ) => {
      switch (field) {
        case "name":
          setName(value as string);
          break;
        case "dosage":
          setDosage(value as string);
          break;
        case "frequency":
          setFrequency(value as MedicationFrequency);
          break;
        case "specificTime":
          setSpecificTime(value as Date);
          break;
        case "multipleTimes":
          setMultipleTimes(value as Date[]);
          break;
        case "startDate":
          setStartDate(value as Date);
          break;
        case "reminderEnabled":
          setReminderEnabled(value as boolean);
          break;
        case "soundReminderEnabled":
          setSoundReminderEnabled(value as boolean);
          break;
        case "firstAlert":
          setFirstAlert(value as AlertTiming);
          break;
        case "secondAlert":
          setSecondAlert(value as SecondAlertTiming);
          break;
        case "notes":
          setNotes(value as string);
          break;
        case "pharmacyName":
          setPharmacyName(value as string);
          break;
        case "pharmacyPhone":
          setPharmacyPhone(value as string);
          break;
        case "pharmacyAddress":
          setPharmacyAddress(value as string);
          break;
        case "showNameSuggestions":
          setShowNameSuggestions(value as boolean);
          break;
        case "showDosageSuggestions":
          setShowDosageSuggestions(value as boolean);
          break;
        case "showPharmacySuggestions":
          setShowPharmacySuggestions(value as boolean);
          break;
        case "showDatePicker":
          setShowDatePicker(value as boolean);
          break;
        case "isAnalyzingPhoto":
          setIsAnalyzingPhoto(value as boolean);
          break;
      }
    },
    []
  );

  // Reset form to defaults
  const resetForm = useCallback(() => {
    setName("");
    setDosage("");
    setFrequency("daily");
    const defaultTime = createDefaultTime(9, 0);
    setSpecificTime(defaultTime);
    setMultipleTimes([defaultTime]);
    setStartDate(new Date());
    setShowDatePicker(false);
    setReminderEnabled(true);
    setSoundReminderEnabled(false);
    setFirstAlert("at_time");
    setSecondAlert("none");
    setNotes("");
    setShowNameSuggestions(false);
    setShowDosageSuggestions(false);
    setPharmacyName("");
    setPharmacyPhone("");
    setPharmacyAddress("");
    setShowPharmacySuggestions(false);
  }, []);

  // Handle frequency change and update multipleTimes accordingly
  const handleFrequencyChange = useCallback(
    (newFrequency: MedicationFrequency) => {
      setFrequency(newFrequency);

      if (newFrequency === "twice-daily" && multipleTimes.length !== 2) {
        setMultipleTimes([createDefaultTime(9, 0), createDefaultTime(21, 0)]);
      } else if (
        newFrequency === "three-times-daily" &&
        multipleTimes.length !== 3
      ) {
        setMultipleTimes([
          createDefaultTime(9, 0),
          createDefaultTime(14, 0),
          createDefaultTime(21, 0),
        ]);
      } else if (
        newFrequency === "four-times-daily" &&
        multipleTimes.length !== 4
      ) {
        setMultipleTimes([
          createDefaultTime(8, 0),
          createDefaultTime(12, 0),
          createDefaultTime(17, 0),
          createDefaultTime(21, 0),
        ]);
      } else if (
        newFrequency !== "twice-daily" &&
        newFrequency !== "three-times-daily" &&
        newFrequency !== "four-times-daily"
      ) {
        setMultipleTimes([specificTime]);
      }
    },
    [multipleTimes.length, specificTime]
  );

  // Update time at specific index for multiple times
  const updateTimeAtIndex = useCallback((index: number, newTime: Date) => {
    setMultipleTimes((prev) => {
      const updated = [...prev];
      updated[index] = newTime;
      return updated;
    });
  }, []);

  // Build medication object for saving
  const buildMedication = useCallback(
    (existingMedication?: Medication | null): Medication => {
      const needsMultipleTimes =
        frequency === "twice-daily" ||
        frequency === "three-times-daily" ||
        frequency === "four-times-daily";
      const needsStartDate =
        frequency === "every-other-day" ||
        frequency === "weekly" ||
        frequency === "biweekly" ||
        frequency === "monthly" ||
        frequency === "quarterly" ||
        frequency === "yearly" ||
        frequency === "one-time";

      let finalTimes: string[];

      if (needsMultipleTimes) {
        finalTimes = multipleTimes.map(formatTimeFromDate);
      } else {
        finalTimes = [formatTimeFromDate(specificTime)];
      }

      return {
        id: existingMedication?.id || Date.now().toString(),
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        timeOfDay: "specific",
        specificTime: finalTimes[0],
        reminderEnabled,
        firstAlert: reminderEnabled ? firstAlert : undefined,
        secondAlert: reminderEnabled ? secondAlert : undefined,
        notes: notes.trim() || undefined,
        scheduleType: "daily",
        times: finalTimes,
        startDate: needsStartDate ? startDate.toISOString() : undefined,
        pharmacy: pharmacyName.trim()
          ? {
              name: pharmacyName.trim(),
              phoneNumber: pharmacyPhone.trim() || undefined,
              address: pharmacyAddress.trim() || undefined,
            }
          : undefined,
        createdAt: existingMedication?.createdAt || new Date().toISOString(),
      };
    },
    [
      name,
      dosage,
      frequency,
      specificTime,
      multipleTimes,
      startDate,
      reminderEnabled,
      firstAlert,
      secondAlert,
      notes,
      pharmacyName,
      pharmacyPhone,
      pharmacyAddress,
    ]
  );

  // Validation
  const isValid = name.trim().length > 0 && dosage.trim().length > 0;

  return {
    formState,
    updateField,
    resetForm,
    handleFrequencyChange,
    updateTimeAtIndex,
    buildMedication,
    isValid,
  };
}
