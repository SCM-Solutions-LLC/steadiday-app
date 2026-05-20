import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LabResultItem, MedicationItem, MedicationSourceType } from "../../types/app";

// ============================================================================
// HEALTH RECORDS STORE (Premium-only)
// Manages lab results and medications from Apple Health Records
// ============================================================================

// Auto-sync cooldown in milliseconds (6 hours)
const AUTO_SYNC_COOLDOWN_MS = 6 * 60 * 60 * 1000;

interface HealthRecordsState {
  _hasHydrated: boolean;

  // Lab Results (Apple Health Records only)
  labResults: LabResultItem[];
  labResultsLastSync: string | null;
  isLoadingLabResults: boolean;

  // Medication Items (combines manual + Apple Health)
  medicationItems: MedicationItem[];
  medicationItemsLastSync: string | null;
  isLoadingMedications: boolean;

  // Unified sync state
  isSyncing: boolean;
  lastAutoSyncAt: string | null;
  lastManualSyncAt: string | null;
  lastSyncError: string | null;
}

interface HealthRecordsActions {
  // Lab Results
  setLabResults: (results: LabResultItem[]) => void;
  addLabResults: (results: LabResultItem[]) => void;
  clearLabResults: () => void;
  setLabResultsLastSync: (timestamp: string | null) => void;
  setIsLoadingLabResults: (loading: boolean) => void;

  // Medication Items
  setMedicationItems: (items: MedicationItem[]) => void;
  addMedicationItem: (item: MedicationItem) => void;
  upsertManyMedicationItems: (items: MedicationItem[]) => void;
  updateMedicationItem: (id: string, updates: Partial<MedicationItem>) => void;
  deleteMedicationItem: (id: string) => void;
  clearAppleHealthMedications: () => void;
  setMedicationItemsLastSync: (timestamp: string | null) => void;
  setIsLoadingMedications: (loading: boolean) => void;

  // Unified Sync
  setIsSyncing: (syncing: boolean) => void;
  setLastAutoSyncAt: (timestamp: string | null) => void;
  setLastManualSyncAt: (timestamp: string | null) => void;
  setLastSyncError: (error: string | null) => void;
  shouldAutoSync: (now?: number) => boolean;
  getLastSyncTime: () => string | null;

  // Downgrade handling
  clearAllHealthRecordsData: () => void;
  clearAppleHealthData: () => void;

  // Helpers
  getLabResultsBySource: (sourceName: string) => LabResultItem[];
  getMedicationsBySource: (sourceType: MedicationSourceType) => MedicationItem[];
  getManualMedications: () => MedicationItem[];
  getAppleHealthMedications: () => MedicationItem[];
}

type HealthRecordsStore = HealthRecordsState & HealthRecordsActions;

export const useHealthRecordsStore = create<HealthRecordsStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,

      // Initial state
      labResults: [],
      labResultsLastSync: null,
      isLoadingLabResults: false,
      medicationItems: [],
      medicationItemsLastSync: null,
      isLoadingMedications: false,
      isSyncing: false,
      lastAutoSyncAt: null,
      lastManualSyncAt: null,
      lastSyncError: null,

      // Lab Results actions
      setLabResults: (results) => set({ labResults: results }),

      addLabResults: (results) =>
        set((state) => {
          // Merge new results, avoiding duplicates by sourceId
          const existingIds = new Set(state.labResults.map((r) => r.sourceId));
          const newResults = results.filter((r) => !existingIds.has(r.sourceId));
          return { labResults: [...state.labResults, ...newResults] };
        }),

      clearLabResults: () => set({ labResults: [], labResultsLastSync: null }),

      setLabResultsLastSync: (timestamp) => set({ labResultsLastSync: timestamp }),

      setIsLoadingLabResults: (loading) => set({ isLoadingLabResults: loading }),

      // Medication Items actions
      setMedicationItems: (items) => set({ medicationItems: items }),

      addMedicationItem: (item) =>
        set((state) => ({
          medicationItems: [...state.medicationItems, item],
        })),

      // Batch upsert - prevents multiple state updates when importing many medications
      upsertManyMedicationItems: (items) =>
        set((state) => {
          const now = new Date().toISOString();
          const existingById = new Map(state.medicationItems.map((m) => [m.id, m]));

          // Process incoming items - update existing or add new
          for (const item of items) {
            if (existingById.has(item.id)) {
              // Update existing
              existingById.set(item.id, { ...existingById.get(item.id)!, ...item, updatedAt: now });
            } else {
              // Add new
              existingById.set(item.id, { ...item, createdAt: item.createdAt || now, updatedAt: now });
            }
          }

          return { medicationItems: Array.from(existingById.values()) };
        }),

      updateMedicationItem: (id, updates) =>
        set((state) => ({
          medicationItems: state.medicationItems.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          ),
        })),

      deleteMedicationItem: (id) =>
        set((state) => ({
          medicationItems: state.medicationItems.filter((item) => item.id !== id),
        })),

      clearAppleHealthMedications: () =>
        set((state) => ({
          medicationItems: state.medicationItems.filter(
            (item) => item.sourceType !== "apple_health"
          ),
          medicationItemsLastSync: null,
        })),

      setMedicationItemsLastSync: (timestamp) =>
        set({ medicationItemsLastSync: timestamp }),

      setIsLoadingMedications: (loading) => set({ isLoadingMedications: loading }),

      // Unified Sync actions
      setIsSyncing: (syncing) => set({ isSyncing: syncing }),

      setLastAutoSyncAt: (timestamp) => set({ lastAutoSyncAt: timestamp }),

      setLastManualSyncAt: (timestamp) => set({ lastManualSyncAt: timestamp }),

      setLastSyncError: (error) => set({ lastSyncError: error }),

      shouldAutoSync: (now = Date.now()) => {
        const state = get();
        // Don't sync if already syncing
        if (state.isSyncing) return false;
        // If never synced, should sync
        if (!state.lastAutoSyncAt) return true;
        // Check if cooldown has passed (6 hours)
        const lastSync = new Date(state.lastAutoSyncAt).getTime();
        return now - lastSync > AUTO_SYNC_COOLDOWN_MS;
      },

      getLastSyncTime: () => {
        const state = get();
        const autoSync = state.lastAutoSyncAt ? new Date(state.lastAutoSyncAt).getTime() : 0;
        const manualSync = state.lastManualSyncAt ? new Date(state.lastManualSyncAt).getTime() : 0;
        if (autoSync === 0 && manualSync === 0) return null;
        return autoSync > manualSync ? state.lastAutoSyncAt : state.lastManualSyncAt;
      },

      // Downgrade handling - clear ALL health records data
      clearAllHealthRecordsData: () =>
        set({
          labResults: [],
          labResultsLastSync: null,
          medicationItems: [],
          medicationItemsLastSync: null,
          isSyncing: false,
          lastAutoSyncAt: null,
          lastManualSyncAt: null,
          lastSyncError: null,
        }),

      // Clear only Apple Health data (keep manual medications)
      clearAppleHealthData: () =>
        set((state) => ({
          labResults: [],
          labResultsLastSync: null,
          medicationItems: state.medicationItems.filter(
            (item) => item.sourceType !== "apple_health"
          ),
          medicationItemsLastSync: null,
          isSyncing: false,
          lastAutoSyncAt: null,
          lastManualSyncAt: null,
          lastSyncError: null,
        })),

      // Helpers
      getLabResultsBySource: (sourceName) => {
        return get().labResults.filter((r) => r.sourceName === sourceName);
      },

      getMedicationsBySource: (sourceType) => {
        return get().medicationItems.filter((m) => m.sourceType === sourceType);
      },

      getManualMedications: () => {
        return get().medicationItems.filter((m) => m.sourceType === "manual");
      },

      getAppleHealthMedications: () => {
        return get().medicationItems.filter((m) => m.sourceType === "apple_health");
      },
    }),
    {
      name: "health-records-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
      // Only persist the data, not loading states
      partialize: (state) => ({
        labResults: state.labResults,
        labResultsLastSync: state.labResultsLastSync,
        medicationItems: state.medicationItems,
        medicationItemsLastSync: state.medicationItemsLastSync,
        lastAutoSyncAt: state.lastAutoSyncAt,
        lastManualSyncAt: state.lastManualSyncAt,
      }),
    }
  )
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new manual medication item
 */
export function createManualMedication(
  name: string,
  dose?: string,
  schedule?: string,
  notes?: string
): MedicationItem {
  const now = new Date().toISOString();
  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    displayName: name,
    sourceType: "manual",
    medicationName: name,
    doseText: dose,
    scheduleText: schedule,
    status: "active",
    notes,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Sort lab results by date (newest first)
 */
export function sortLabResultsByDate(results: LabResultItem[]): LabResultItem[] {
  return [...results].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get unique source names from lab results
 */
export function getUniqueLabSources(results: LabResultItem[]): string[] {
  const sources = new Set(results.map((r) => r.sourceName));
  return Array.from(sources).sort();
}

/**
 * Filter lab results by date range
 */
export function filterLabResultsByDateRange(
  results: LabResultItem[],
  startDate: Date,
  endDate: Date
): LabResultItem[] {
  return results.filter((r) => {
    const date = new Date(r.date);
    return date >= startDate && date <= endDate;
  });
}
