import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserProfile,
  EmergencyContact,
  TrustedContact,
  FavoriteContact,
  AuthInfo,
} from "../../types/app";
import { useSubscriptionStore } from "./subscriptionStore";
import { ESSENTIALS_LIMITS } from "../../config/featureAccess";

// ============================================================================
// USER STORE
// Manages user profile, auth, emergency contacts, and favorite contacts
// ============================================================================

interface UserState {
  // Hydration
  _hasHydrated: boolean;

  // Profile
  userProfile: UserProfile;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
}

interface UserActions {
  // Onboarding
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Profile
  setUserName: (name: string) => void;
  setUserLocation: (location: string) => void;
  setUserBirthday: (birthday: string) => void;

  // Trusted Contacts (stored in emergencyContacts field for migration compatibility)
  addEmergencyContact: (contact: TrustedContact) => void;
  updateEmergencyContact: (id: string, updates: Partial<TrustedContact>) => void;
  removeEmergencyContact: (id: string) => void;
  setPrimaryContact: (id: string) => void;
  setEmergencyContactStatus: (id: string, isEmergency: boolean) => void;
  clearEmergencyContacts: () => void;

  // Favorite Contacts
  addFavoriteContact: (contact: FavoriteContact) => void;
  updateFavoriteContact: (id: string, updates: Partial<FavoriteContact>) => void;
  removeFavoriteContact: (id: string) => void;
  clearFavoriteContacts: () => void;

  // Auth
  setUserAuth: (auth: AuthInfo) => void;
  clearUserAuth: () => void;
}

type UserStore = UserState & UserActions;

const DEFAULT_USER_PROFILE: UserProfile = {
  name: "",
  birthday: undefined,
  location: undefined,
  emergencyContacts: [],
  favoriteContacts: [],
  auth: undefined,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      userProfile: DEFAULT_USER_PROFILE,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      _hasHydrated: false,

      // Onboarding
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),

      // Profile
      setUserName: (name) =>
        set((state) => ({
          userProfile: { ...state.userProfile, name },
        })),

      setUserLocation: (location) =>
        set((state) => ({
          userProfile: { ...state.userProfile, location },
        })),

      setUserBirthday: (birthday) =>
        set((state) => ({
          userProfile: { ...state.userProfile, birthday },
        })),

      // Emergency Contacts
      addEmergencyContact: (contact) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            emergencyContacts: [...state.userProfile.emergencyContacts, contact],
          },
        })),

      updateEmergencyContact: (id, updates) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            emergencyContacts: state.userProfile.emergencyContacts.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          },
        })),

      removeEmergencyContact: (id) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            emergencyContacts: state.userProfile.emergencyContacts.filter(
              (c) => c.id !== id
            ),
          },
        })),

      setPrimaryContact: (id) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            emergencyContacts: state.userProfile.emergencyContacts.map((c) => ({
              ...c,
              isPrimary: c.id === id,
            })),
          },
        })),

      setEmergencyContactStatus: (id, isEmergency) =>
        set((state) => {
          const isPremium = useSubscriptionStore.getState().isPremiumUnlocked;
          const currentEmergencyCount = state.userProfile.emergencyContacts.filter(
            (c) => c.isEmergencyContact
          ).length;

          // Free users can only have 1 emergency contact
          if (!isPremium && isEmergency && currentEmergencyCount >= ESSENTIALS_LIMITS.maxEmergencyContacts) {
            // Find and unmark the existing emergency contact, mark the new one
            return {
              userProfile: {
                ...state.userProfile,
                emergencyContacts: state.userProfile.emergencyContacts.map((c) => ({
                  ...c,
                  isEmergencyContact: c.id === id ? true : false,
                })),
              },
            };
          }

          return {
            userProfile: {
              ...state.userProfile,
              emergencyContacts: state.userProfile.emergencyContacts.map((c) =>
                c.id === id ? { ...c, isEmergencyContact: isEmergency } : c
              ),
            },
          };
        }),

      clearEmergencyContacts: () =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            emergencyContacts: [],
          },
        })),

      // Favorite Contacts
      addFavoriteContact: (contact) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            favoriteContacts: [...state.userProfile.favoriteContacts, contact],
          },
        })),

      updateFavoriteContact: (id, updates) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            favoriteContacts: state.userProfile.favoriteContacts.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          },
        })),

      removeFavoriteContact: (id) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            favoriteContacts: state.userProfile.favoriteContacts.filter(
              (c) => c.id !== id
            ),
          },
        })),

      clearFavoriteContacts: () =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            favoriteContacts: [],
          },
        })),

      // Auth
      setUserAuth: (auth) =>
        set((state) => ({
          userProfile: { ...state.userProfile, auth },
          isAuthenticated: auth.isAuthenticated,
        })),

      clearUserAuth: () =>
        set((state) => ({
          userProfile: { ...state.userProfile, auth: undefined },
          isAuthenticated: false,
        })),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
