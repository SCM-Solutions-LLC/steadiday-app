import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ConnectedApp, FamilyMessage, TabName } from "../../types/app";
import {
  getMockTasksForApp,
  getMockMedicationsForApp,
  getMockMessagesForApp,
} from "../../utils/mockSyncData";

// ============================================================================
// UI STORE
// Manages UI state: navigation, connected apps, etc.
// NOTE: Tooltips and info cards are now managed by tipStore.ts
// ============================================================================

interface UIState {
  // Hydration
  _hasHydrated: boolean;

  // Navigation Guidance
  visitedTabs: TabName[];
  hasSeenTabScrollHint: boolean;

  // Connected Apps
  connectedApps: ConnectedApp[];

  // Favorite Tools
  favoriteToolIds: string[];

  // Family Messages (mock data for connected apps)
  familyMessages: FamilyMessage[];

  // Task Templates
  enabledTemplateIds: string[];
}

interface UIActions {
  // Navigation
  markTabAsVisited: (tabName: TabName) => void;
  hasVisitedTab: (tabName: TabName) => boolean;
  markTabScrollHintSeen: () => void;
  resetTabScrollHint: () => void;

  // Connected Apps
  initializeConnectedApps: () => void;
  toggleAppConnection: (appId: string) => { newTasks: any[]; newMeds: any[]; newMessages: any[] } | null;
  updateAppSyncPreference: (appId: string, syncPreference: string) => void;
  disconnectAllApps: () => { removedTaskIds: string[]; removedMedIds: string[]; removedMessageIds: string[] };
  removeConnectedApp: (appId: string) => { removedTaskIds: string[]; removedMedIds: string[]; removedMessageIds: string[] };
  addConnectedApp: (app: ConnectedApp) => void;

  // Favorite Tools
  toggleFavoriteTool: (toolId: string) => void;

  // Family Messages
  addFamilyMessage: (message: FamilyMessage) => void;
  removeFamilyMessagesFromApp: (appId: string) => void;

  // Task Templates
  toggleTemplateEnabled: (templateId: string) => void;
}

type UIStore = UIState & UIActions;

const getDefaultConnectedApps = (): ConnectedApp[] => {
  return [
    // Health apps
    {
      id: "apple-health",
      name: "Apple Health",
      category: "health",
      isConnected: false,
      icon: "fitness",
      description: "Apple Health shares your activity and health data so you can track everything in one place.",
    },
    {
      id: "apple-fitness",
      name: "Apple Fitness",
      category: "health",
      isConnected: false,
      icon: "body",
      description: "Apple Fitness shares your workout data and activity rings.",
    },
    {
      id: "mychart",
      name: "MyChart",
      category: "health",
      isConnected: false,
      icon: "medical",
      description: "MyChart shares your medical records and test results.",
    },
    // Calendar apps
    {
      id: "apple-calendar",
      name: "Apple Calendar",
      category: "calendar",
      isConnected: false,
      icon: "calendar",
      description: "Apple Calendar syncs your events and appointments.",
    },
    {
      id: "apple-reminders",
      name: "Apple Reminders",
      category: "calendar",
      isConnected: false,
      icon: "checkbox",
      description: "Apple Reminders syncs your to-do list and reminder notifications.",
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      category: "calendar",
      isConnected: false,
      icon: "calendar",
      description: "Google Calendar syncs your events and appointments.",
    },
    // Medication apps
    {
      id: "carezone",
      name: "CareZone",
      category: "medication",
      isConnected: false,
      icon: "heart",
      description: "CareZone shares your medication list and reminders.",
    },
  ];
};

const DEFAULT_FAMILY_MESSAGES: FamilyMessage[] = [
  {
    id: "1",
    type: "photo",
    content: "https://picsum.photos/400/300",
    caption: "Had a great day at the park!",
    fromName: "Alice",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    type: "text",
    content: "Hope you are having a wonderful day! Love you!",
    fromName: "Bob",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      visitedTabs: [],
      hasSeenTabScrollHint: false,
      connectedApps: [],
      favoriteToolIds: [],
      familyMessages: DEFAULT_FAMILY_MESSAGES,
      enabledTemplateIds: [],
      _hasHydrated: false,

      // Navigation
      markTabAsVisited: (tabName) =>
        set((state) => ({
          visitedTabs: state.visitedTabs.includes(tabName)
            ? state.visitedTabs
            : [...state.visitedTabs, tabName],
        })),

      hasVisitedTab: (tabName) => {
        return get().visitedTabs.includes(tabName);
      },

      markTabScrollHintSeen: () => set({ hasSeenTabScrollHint: true }),

      resetTabScrollHint: () => set({ hasSeenTabScrollHint: false }),

      // Connected Apps
      initializeConnectedApps: () => {
        const apps = get().connectedApps;
        if (apps.length === 0) {
          set({ connectedApps: getDefaultConnectedApps() });
        }
      },

      toggleAppConnection: (appId) => {
        const state = get();
        const app = state.connectedApps.find((a) => a.id === appId);
        if (!app) return null;

        const wasConnected = app.isConnected;
        const willBeConnected = !wasConnected;

        // Update connection state
        set((state) => ({
          connectedApps: state.connectedApps.map((a) =>
            a.id === appId ? { ...a, isConnected: !a.isConnected } : a
          ),
        }));

        // If connecting, return mock data to be added by the caller
        if (willBeConnected) {
          const mockTasks = getMockTasksForApp(appId);
          const mockMeds = getMockMedicationsForApp(appId);
          const mockMessages = getMockMessagesForApp(appId);

          // Add messages to this store
          if (mockMessages.length > 0) {
            set((state) => ({
              familyMessages: [...state.familyMessages, ...mockMessages],
            }));
          }

          return {
            newTasks: mockTasks,
            newMeds: mockMeds,
            newMessages: mockMessages,
          };
        } else {
          // If disconnecting, remove messages from this app
          set((state) => ({
            familyMessages: state.familyMessages.filter(
              (msg) => !msg.id.startsWith(`synced-${appId}-`)
            ),
          }));

          // Return IDs to be removed by caller
          return {
            newTasks: [],
            newMeds: [],
            newMessages: [],
          };
        }
      },

      updateAppSyncPreference: (appId, syncPreference) =>
        set((state) => ({
          connectedApps: state.connectedApps.map((app) =>
            app.id === appId ? { ...app, syncPreference: syncPreference as any } : app
          ),
        })),

      disconnectAllApps: () => {
        const state = get();
        const removedMessageIds = state.familyMessages
          .filter((msg) => msg.id.startsWith("synced-"))
          .map((msg) => msg.id);

        set((state) => ({
          connectedApps: state.connectedApps.map((app) => ({
            ...app,
            isConnected: false,
          })),
          familyMessages: state.familyMessages.filter(
            (msg) => !msg.id.startsWith("synced-")
          ),
        }));

        return {
          removedTaskIds: [], // Caller should handle task removal
          removedMedIds: [], // Caller should handle medication removal
          removedMessageIds,
        };
      },

      removeConnectedApp: (appId) => {
        const state = get();
        const removedMessageIds = state.familyMessages
          .filter((msg) => msg.id.startsWith(`synced-${appId}-`))
          .map((msg) => msg.id);

        set((state) => ({
          connectedApps: state.connectedApps.filter((app) => app.id !== appId),
          familyMessages: state.familyMessages.filter(
            (msg) => !msg.id.startsWith(`synced-${appId}-`)
          ),
        }));

        return {
          removedTaskIds: [], // Caller should handle
          removedMedIds: [], // Caller should handle
          removedMessageIds,
        };
      },

      addConnectedApp: (app) =>
        set((state) => ({
          connectedApps: [...state.connectedApps, app],
        })),

      // Favorite Tools
      toggleFavoriteTool: (toolId) =>
        set((state) => ({
          favoriteToolIds: state.favoriteToolIds.includes(toolId)
            ? state.favoriteToolIds.filter((id) => id !== toolId)
            : [...state.favoriteToolIds, toolId],
        })),

      // Family Messages
      addFamilyMessage: (message) =>
        set((state) => ({
          familyMessages: [...state.familyMessages, message],
        })),

      removeFamilyMessagesFromApp: (appId) =>
        set((state) => ({
          familyMessages: state.familyMessages.filter(
            (msg) => !msg.id.startsWith(`synced-${appId}-`)
          ),
        })),

      // Task Templates
      toggleTemplateEnabled: (templateId) =>
        set((state) => ({
          enabledTemplateIds: (state.enabledTemplateIds || []).includes(templateId)
            ? state.enabledTemplateIds.filter((id) => id !== templateId)
            : [...(state.enabledTemplateIds || []), templateId],
        })),
    }),
    {
      name: "ui-store",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;

          // Ensure navigation guidance fields exist
          if (!state.visitedTabs) {
            state.visitedTabs = [];
          }

          // Ensure enabledTemplateIds exists
          if (!state.enabledTemplateIds) {
            state.enabledTemplateIds = [];
          }
        }
      },
    }
  )
);
