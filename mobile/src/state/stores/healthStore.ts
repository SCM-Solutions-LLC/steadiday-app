import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  HealthMetric,
  HealthGoals,
  FoodEntry,
  WaterLog,
  DailyLog,
  InsuranceCard,
  Doctor,
  MealSchedule,
} from "../../types/app";

// ============================================================================
// HEALTH STORE
// Manages health metrics, goals, food/water tracking, insurance, and doctors
// ============================================================================

interface HealthState {
  // Hydration
  _hasHydrated: boolean;

  // Health Metrics
  healthMetrics: HealthMetric[];
  healthGoals: HealthGoals;

  // Apple Health Sync
  hasInitialHealthSync: boolean; // True if 90-day historical sync has been done

  // Food & Water Tracking
  foodEntries: FoodEntry[];
  waterLogs: WaterLog[];
  mealSchedule: MealSchedule;

  // Medical Information
  insuranceCards: InsuranceCard[];
  doctors: Doctor[];

  // Brain Games
  lastBrainGame?: string;
}

interface HealthActions {
  // Health Metrics
  addHealthMetric: (metric: HealthMetric) => void;
  updateHealthMetric: (id: string, updates: Partial<HealthMetric>) => void;
  removeHealthMetric: (id: string) => void;
  getHealthMetricForDate: (date: string) => HealthMetric | undefined;
  updateHealthGoals: (goals: Partial<HealthGoals>) => void;

  // Apple Health Sync
  setHasInitialHealthSync: (value: boolean) => void;

  // Food Tracking
  addFoodEntry: (entry: FoodEntry) => void;
  updateFoodEntry: (id: string, updates: Partial<FoodEntry>) => void;
  removeFoodEntry: (id: string) => void;
  getTodaysFoodEntries: () => FoodEntry[];
  getTodaysCalories: () => number;

  // Water Tracking
  addWaterGlass: () => void;
  removeWaterGlass: () => void;
  resetWaterForToday: () => void;
  getTodaysWater: () => number;

  // Daily Logs
  getDailyLogs: () => DailyLog[];

  // Insurance Cards
  addInsuranceCard: (card: InsuranceCard) => void;
  updateInsuranceCard: (id: string, updates: Partial<InsuranceCard>) => void;
  removeInsuranceCard: (id: string) => void;

  // Doctors
  addDoctor: (doctor: Doctor) => void;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  removeDoctor: (id: string) => void;

  // Brain Games
  updateLastBrainGame: (date: string) => void;

  // Meal Schedule
  updateMealSchedule: (schedule: Partial<MealSchedule>) => void;
}

type HealthStore = HealthState & HealthActions;

const DEFAULT_HEALTH_GOALS: HealthGoals = {
  stepsGoal: 10000,
  sleepGoal: 8,
  exerciseGoal: 30,
};

const DEFAULT_MEAL_SCHEDULE: MealSchedule = {
  breakfast: "08:00",
  breakfastReminder: false,
  lunch: "12:00",
  lunchReminder: false,
  dinner: "18:00",
  dinnerReminder: false,
};

export const useHealthStore = create<HealthStore>()(
  persist(
    (set, get) => ({
      healthMetrics: [],
      healthGoals: DEFAULT_HEALTH_GOALS,
      hasInitialHealthSync: false,
      foodEntries: [],
      waterLogs: [],
      mealSchedule: DEFAULT_MEAL_SCHEDULE,
      insuranceCards: [],
      doctors: [],
      lastBrainGame: undefined,
      _hasHydrated: false,

      // Health Metrics
      addHealthMetric: (metric) =>
        set((state) => ({
          healthMetrics: [...state.healthMetrics, metric],
        })),

      updateHealthMetric: (id, updates) =>
        set((state) => ({
          healthMetrics: state.healthMetrics.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      removeHealthMetric: (id) =>
        set((state) => ({
          healthMetrics: state.healthMetrics.filter((m) => m.id !== id),
        })),

      getHealthMetricForDate: (date) => {
        return get().healthMetrics.find((m) => m.date === date);
      },

      updateHealthGoals: (goals) =>
        set((state) => ({
          healthGoals: { ...state.healthGoals, ...goals },
        })),

      // Apple Health Sync
      setHasInitialHealthSync: (value) =>
        set({ hasInitialHealthSync: value }),

      // Food Tracking
      addFoodEntry: (entry) =>
        set((state) => ({
          foodEntries: [...state.foodEntries, entry],
        })),

      updateFoodEntry: (id, updates) =>
        set((state) => ({
          foodEntries: state.foodEntries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        })),

      removeFoodEntry: (id) =>
        set((state) => ({
          foodEntries: state.foodEntries.filter((entry) => entry.id !== id),
        })),

      getTodaysFoodEntries: () => {
        const today = new Date().toISOString().split("T")[0];
        return get().foodEntries.filter((entry) => entry.date.startsWith(today));
      },

      getTodaysCalories: () => {
        const today = new Date().toISOString().split("T")[0];
        const todaysEntries = get().foodEntries.filter((entry) =>
          entry.date.startsWith(today)
        );
        return todaysEntries.reduce((total, entry) => total + entry.calories, 0);
      },

      // Water Tracking
      addWaterGlass: () =>
        set((state) => {
          const today = new Date().toISOString().split("T")[0];
          const existingLog = state.waterLogs.find((log) => log.date === today);

          if (existingLog) {
            // Update existing log (max 8 glasses)
            return {
              waterLogs: state.waterLogs.map((log) =>
                log.date === today
                  ? { ...log, glassesCount: Math.min(log.glassesCount + 1, 8) }
                  : log
              ),
            };
          } else {
            // Create new log for today
            return {
              waterLogs: [
                ...state.waterLogs,
                {
                  id: `water-${Date.now()}`,
                  glassesCount: 1,
                  date: today,
                },
              ],
            };
          }
        }),

      removeWaterGlass: () =>
        set((state) => {
          const today = new Date().toISOString().split("T")[0];
          const existingLog = state.waterLogs.find((log) => log.date === today);

          if (existingLog && existingLog.glassesCount > 0) {
            return {
              waterLogs: state.waterLogs.map((log) =>
                log.date === today
                  ? { ...log, glassesCount: log.glassesCount - 1 }
                  : log
              ),
            };
          }
          return state;
        }),

      resetWaterForToday: () =>
        set((state) => {
          const today = new Date().toISOString().split("T")[0];
          return {
            waterLogs: state.waterLogs.map((log) =>
              log.date === today ? { ...log, glassesCount: 0 } : log
            ),
          };
        }),

      getTodaysWater: () => {
        const today = new Date().toISOString().split("T")[0];
        const todaysLog = get().waterLogs.find((log) => log.date === today);
        return todaysLog?.glassesCount || 0;
      },

      // Daily Logs
      getDailyLogs: () => {
        const state = get();
        const logsByDate: { [date: string]: DailyLog } = {};

        // Group food entries by date
        state.foodEntries.forEach((entry) => {
          const date = entry.date.split("T")[0];
          if (!logsByDate[date]) {
            logsByDate[date] = {
              id: `log-${date}`,
              date,
              totalCalories: 0,
              waterGlasses: 0,
              mealsLogged: 0,
            };
          }
          logsByDate[date].totalCalories += entry.calories;
          logsByDate[date].mealsLogged += 1;
        });

        // Add water data
        state.waterLogs.forEach((log) => {
          if (!logsByDate[log.date]) {
            logsByDate[log.date] = {
              id: `log-${log.date}`,
              date: log.date,
              totalCalories: 0,
              waterGlasses: 0,
              mealsLogged: 0,
            };
          }
          logsByDate[log.date].waterGlasses = log.glassesCount;
        });

        // Convert to array and sort by date (newest first)
        return Object.values(logsByDate).sort((a, b) =>
          b.date.localeCompare(a.date)
        );
      },

      // Insurance Cards
      addInsuranceCard: (card) =>
        set((state) => ({
          insuranceCards: [...state.insuranceCards, card],
        })),

      updateInsuranceCard: (id, updates) =>
        set((state) => ({
          insuranceCards: state.insuranceCards.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      removeInsuranceCard: (id) =>
        set((state) => ({
          insuranceCards: state.insuranceCards.filter((c) => c.id !== id),
        })),

      // Doctors
      addDoctor: (doctor) =>
        set((state) => ({
          doctors: [...state.doctors, doctor],
        })),

      updateDoctor: (id, updates) =>
        set((state) => ({
          doctors: state.doctors.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),

      removeDoctor: (id) =>
        set((state) => ({
          doctors: state.doctors.filter((d) => d.id !== id),
        })),

      // Brain Games
      updateLastBrainGame: (date) => set({ lastBrainGame: date }),

      // Meal Schedule
      updateMealSchedule: (schedule) =>
        set((state) => ({
          mealSchedule: { ...state.mealSchedule, ...schedule },
        })),
    }),
    {
      name: "health-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
