import { Ionicons } from "@expo/vector-icons";

export interface UsageTipConfig {
  tipId: string;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  position?: "top" | "bottom";
  delay?: number;
}

/**
 * Usage tips shown once per screen after onboarding
 * These help users discover features and learn how to use the app
 */
export const USAGE_TIPS: Record<string, UsageTipConfig> = {
  // Home Screen
  home: {
    tipId: "tip-home-welcome",
    title: "Welcome to Your Home",
    message: "This is your home screen. Tap the Edit button to choose what you see here.",
    icon: "home",
    iconColor: "#2F80ED",
    position: "bottom",
    delay: 800,
  },

  // Tasks Screen
  tasks: {
    tipId: "tip-tasks-intro",
    title: "Manage Your Tasks",
    message: "Tap + to add tasks. Swipe left on any task to edit or delete. Tap the checkbox to mark complete.",
    icon: "checkbox",
    iconColor: "#10B981",
    position: "bottom",
    delay: 500,
  },

  // Medications Screen
  meds: {
    tipId: "tip-meds-intro",
    title: "Track Your Medications",
    message: "Add medications with the + button. Set reminders so you never miss a dose. Tap a medication to log it.",
    icon: "medical",
    iconColor: "#8B5CF6",
    position: "bottom",
    delay: 500,
  },

  // Medical Screen
  medical: {
    tipId: "tip-medical-intro",
    title: "Your Medical Info",
    message: "Store insurance cards, doctors, and important medical information all in one secure place.",
    icon: "document-text",
    iconColor: "#DC2626",
    position: "bottom",
    delay: 500,
  },

  // Health Screen
  health: {
    tipId: "tip-health-intro",
    title: "Track Your Health",
    message: "Log daily health metrics like steps, sleep, and heart rate. View trends over time to stay healthy.",
    icon: "heart",
    iconColor: "#EF4444",
    position: "bottom",
    delay: 500,
  },

  // Tools Screen
  tools: {
    tipId: "tip-tools-intro",
    title: "Helpful Tools",
    message: "Access magnifier, flashlight, notes, and more. Star your favorites for quick access on the home screen.",
    icon: "build",
    iconColor: "#F59E0B",
    position: "bottom",
    delay: 500,
  },

  // Connect (Contacts) Screen
  connect: {
    tipId: "tip-connect-intro",
    title: "Manage Contacts",
    message: "Add trusted and favorite contacts here. Swipe left on a contact to edit or remove them.",
    icon: "people",
    iconColor: "#6DB193",
    position: "bottom",
    delay: 500,
  },

  // Settings Screen
  settings: {
    tipId: "tip-settings-intro",
    title: "Customize Your Experience",
    message: "Adjust text size, colors, sounds, and accessibility options to make the app work best for you.",
    icon: "settings",
    iconColor: "#6B7280",
    position: "bottom",
    delay: 500,
  },
};

/**
 * Get the usage tip configuration for a specific screen
 */
export const getUsageTipForScreen = (screenName: string): UsageTipConfig | null => {
  const normalizedName = screenName.toLowerCase().replace("screen", "");
  return USAGE_TIPS[normalizedName] || null;
};
