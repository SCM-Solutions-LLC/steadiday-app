/**
 * useMedicationLinkSync - Detects changes between linked provider medications
 * and user medications, prompting for updates when changes are found.
 */

import { useCallback, useMemo } from "react";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useHealthRecordsStore } from "../state/stores/healthRecordsStore";
import type { Medication, MedicationItem } from "../types/app";

export interface MedicationChange {
  type: "removed" | "dosage_changed" | "name_changed";
  userMedication: Medication;
  providerMedication?: MedicationItem; // undefined if removed
  oldValue?: string;
  newValue?: string;
}

export function useMedicationLinkSync() {
  const medications = useMedicationStore((s) => s.medications);
  const getAppleHealthMedications = useHealthRecordsStore((s) => s.getAppleHealthMedications);

  // Get all linked medications
  const linkedMedications = useMemo(() => {
    return medications.filter((med) => med.linkedProviderId);
  }, [medications]);

  // Check if a provider medication is already linked
  const isProviderMedicationLinked = useCallback(
    (providerId: string): boolean => {
      return medications.some((med) => med.linkedProviderId === providerId);
    },
    [medications]
  );

  // Get the user medication linked to a provider medication
  const getLinkedUserMedication = useCallback(
    (providerId: string): Medication | undefined => {
      return medications.find((med) => med.linkedProviderId === providerId);
    },
    [medications]
  );

  // Detect changes between linked medications and provider records
  const detectChanges = useCallback((): MedicationChange[] => {
    const changes: MedicationChange[] = [];
    const providerMeds = getAppleHealthMedications();

    for (const userMed of linkedMedications) {
      if (!userMed.linkedProviderId) continue;

      // Find the corresponding provider medication
      const providerMed = providerMeds.find(
        (pm) => pm.id === userMed.linkedProviderId
      );

      if (!providerMed) {
        // Provider medication was removed
        changes.push({
          type: "removed",
          userMedication: userMed,
        });
      } else {
        // Check for dosage changes
        if (
          userMed.linkedProviderDosage &&
          providerMed.doseText &&
          userMed.linkedProviderDosage !== providerMed.doseText
        ) {
          changes.push({
            type: "dosage_changed",
            userMedication: userMed,
            providerMedication: providerMed,
            oldValue: userMed.linkedProviderDosage,
            newValue: providerMed.doseText,
          });
        }

        // Check for name changes
        if (
          userMed.linkedProviderName &&
          providerMed.medicationName &&
          userMed.linkedProviderName !== providerMed.medicationName
        ) {
          changes.push({
            type: "name_changed",
            userMedication: userMed,
            providerMedication: providerMed,
            oldValue: userMed.linkedProviderName,
            newValue: providerMed.medicationName,
          });
        }
      }
    }

    return changes;
  }, [linkedMedications, getAppleHealthMedications]);

  return {
    linkedMedications,
    isProviderMedicationLinked,
    getLinkedUserMedication,
    detectChanges,
  };
}
