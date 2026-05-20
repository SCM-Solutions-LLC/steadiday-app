// ============================================================================
// TIP CONFIGURATIONS
// Senior-friendly guidance tips with animations
// ============================================================================

export interface TipConfig {
  id: string;
  title: string;
  message: string;
  screens: string[]; // Which screens this tip can appear on
  triggerCondition:
    | "empty_state"
    | "first_visit"
    | "feature_discovery"
    | "limit_reached";
  premium?: boolean; // Only show for premium users
}

export const TIPS: TipConfig[] = [
  // ========== ESSENTIALS TIPS ==========
  {
    id: "add_first_medication",
    title: "Add Your First Medication",
    message:
      "Tap the + button below to add a medication. We'll remind you when it's time to take it.",
    screens: ["MedsScreen"],
    triggerCondition: "empty_state",
  },
  {
    id: "add_first_task",
    title: "Add Your First Task",
    message:
      "Tap the + button to add a task or appointment. We'll remind you so you don't forget.",
    screens: ["TasksScreen"],
    triggerCondition: "empty_state",
  },
  {
    id: "emergency_sos",
    title: "Emergency Button",
    message:
      "In an emergency, tap this red button to quickly call for help or alert your trusted contacts.",
    screens: ["HomeScreen"],
    triggerCondition: "first_visit",
  },
  {
    id: "navigation_tabs",
    title: "Switch Sections",
    message:
      "Tap these buttons at the bottom to switch between different parts of the app.",
    screens: ["HomeScreen"],
    triggerCondition: "first_visit",
  },

  // ========== LIMIT TIPS ==========
  {
    id: "medication_limit",
    title: "Medication Limit Reached",
    message:
      "You've added 5 medications. Upgrade to Premium for unlimited medications.",
    screens: ["MedsScreen"],
    triggerCondition: "limit_reached",
  },
  {
    id: "task_limit",
    title: "Task Limit Reached",
    message:
      "You've added 10 tasks. Upgrade to Premium for unlimited tasks.",
    screens: ["TasksScreen"],
    triggerCondition: "limit_reached",
  },

  // ========== PREMIUM TIPS ==========
  {
    id: "browse_templates",
    title: "Ready-Made Task Ideas",
    message:
      "Browse templates for common tasks like health appointments, home safety checks, and more.",
    screens: ["TasksScreen"],
    triggerCondition: "feature_discovery",
    premium: true,
  },
  {
    id: "health_tracking",
    title: "Track Your Health",
    message:
      "See your steps, heart rate, and other health information from your phone.",
    screens: ["HealthScreen"],
    triggerCondition: "first_visit",
    premium: true,
  },
  {
    id: "customize_app",
    title: "Make It Yours",
    message: "Go to Settings → Customize Your App to show or hide features.",
    screens: ["SettingsScreen"],
    triggerCondition: "feature_discovery",
    premium: true,
  },
  {
    id: "tools",
    title: "Helpful Tools",
    message:
      "Use the magnifier to read small text, the flashlight in dark places, and more.",
    screens: ["ToolsScreen"],
    triggerCondition: "first_visit",
    premium: true,
  },
];

export function getTipsForScreen(
  screenName: string,
  isPremium: boolean
): TipConfig[] {
  return TIPS.filter((tip) => {
    if (tip.premium && !isPremium) return false;
    return tip.screens.includes(screenName);
  });
}

export function getTipById(tipId: string): TipConfig | undefined {
  return TIPS.find((tip) => tip.id === tipId);
}
