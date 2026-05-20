// ============================================================================
// FEATURE ACCESS CONFIGURATION
// Defines features, limits, and pricing with senior-friendly labels
// ============================================================================

export type FeatureTier = "essentials" | "premium";

export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  tier: FeatureTier;
  icon: string;
  premiumTip?: string;
}

// Essentials features (always available)
export const ESSENTIALS_FEATURES: FeatureConfig[] = [
  {
    id: "medications-basic",
    name: "Medication Reminders",
    description: "Track up to 5 medications with reminders",
    tier: "essentials",
    icon: "medical",
  },
  {
    id: "tasks-basic",
    name: "Task Reminders",
    description: "Track up to 10 tasks and appointments",
    tier: "essentials",
    icon: "checkbox",
  },
  {
    id: "sos",
    name: "Emergency Button",
    description: "Quick access to emergency help",
    tier: "essentials",
    icon: "alert-circle",
  },
  {
    id: "fall-detection",
    name: "Fall Detection",
    description: "Automatic alerts if a fall is detected",
    tier: "essentials",
    icon: "body",
  },
  {
    id: "trusted-contacts-basic",
    name: "Trusted Contacts",
    description: "Add up to 3 trusted contacts (1 emergency)",
    tier: "essentials",
    icon: "people",
  },
];

// Premium features
// Note: Health features display data FROM Apple Health - the app does not collect health data directly
export const PREMIUM_FEATURES: FeatureConfig[] = [
  {
    id: "medications-unlimited",
    name: "Unlimited Medications",
    description: "Track as many medications as you need",
    tier: "premium",
    icon: "medical",
    premiumTip: "You can now add as many medications as you need!",
  },
  {
    id: "tasks-unlimited",
    name: "Unlimited Tasks",
    description: "No limit on tasks and appointments",
    tier: "premium",
    icon: "checkbox",
    premiumTip: "You can now add as many tasks as you need!",
  },
  {
    id: "task-templates",
    name: "Ready-Made Task Ideas",
    description: "Pre-made reminders for common tasks",
    tier: "premium",
    icon: "list",
    premiumTip: "Browse ready-made task ideas for health, home safety, and more!",
  },
  {
    id: "health-screenings",
    name: "Health Checkup Guide",
    description: "Recommended health screenings for your age",
    tier: "premium",
    icon: "shield-checkmark",
    premiumTip: "See recommended health checkups for your age.",
  },
  {
    id: "health-tracking",
    name: "Health Tracking",
    description: "View steps, heart rate, and more from Apple Health",
    tier: "premium",
    icon: "fitness",
    premiumTip: "View your health data synced from Apple Health.",
  },
  {
    id: "food-water-tracking",
    name: "Food & Water Tracking",
    description: "Log meals and water intake",
    tier: "premium",
    icon: "restaurant",
    premiumTip: "Track your meals and stay hydrated.",
  },
  {
    id: "tools",
    name: "Helpful Tools",
    description: "Magnifier, flashlight, notes, find car, and more",
    tier: "premium",
    icon: "build",
    premiumTip: "Access helpful tools like magnifier and flashlight.",
  },
  {
    id: "trusted-contacts-unlimited",
    name: "Unlimited Trusted Contacts",
    description: "Add as many trusted contacts as you need, all can be emergency",
    tier: "premium",
    icon: "people",
    premiumTip: "Add more trusted contacts for extra peace of mind.",
  },
  // favorite-contacts feature removed
  {
    id: "home-customization",
    name: "Customize Home Screen",
    description: "Choose which cards show on your home screen",
    tier: "premium",
    icon: "apps",
    premiumTip: "Choose which cards to show on your home screen.",
  },
  {
    id: "calendar-sync",
    name: "Calendar Sync",
    description: "Sync with your phone's calendar",
    tier: "premium",
    icon: "calendar",
    premiumTip: "Your tasks now appear in your phone's calendar!",
  },
  {
    id: "color-themes",
    name: "Color Choices",
    description: "Pick your favorite colors for the app",
    tier: "premium",
    icon: "color-palette",
    premiumTip: "Pick your favorite colors for buttons.",
  },
  {
    id: "cloud-backup",
    name: "Automatic Backup",
    description: "Your data is saved automatically",
    tier: "premium",
    icon: "cloud-upload",
    premiumTip: "Your data is now backed up automatically.",
  },
  {
    id: "reminder-sounds",
    name: "Reminder Sounds",
    description: "Choose different sounds for reminders",
    tier: "premium",
    icon: "volume-high",
    premiumTip: "Pick the reminder sounds that work best for you.",
  },
];

// Limits for Essentials tier
// Active = not completed/archived for tasks, not discontinued for medications
export const ESSENTIALS_LIMITS = {
  maxMedications: 999,  // v1.0: All features free — restore to 7 when re-enabling IAP
  maxTasks: 999,         // v1.0: All features free — restore to 15 when re-enabling IAP
  maxTrustedContacts: 99, // v1.0: All features free — restore to 3 when re-enabling IAP
  maxEmergencyContacts: 99, // v1.0: All features free — restore to 1 when re-enabling IAP
};

// Pricing configuration
export const PRICING = {
  monthly: {
    price: 3.99,
    priceDisplay: "$3.99",
    period: "month",
    periodDisplay: "per month",
    productId: "steadiday.premium.monthly",
  },
  annual: {
    price: 29.99,
    priceDisplay: "$29.99",
    period: "year",
    periodDisplay: "per year",
    monthlyEquivalent: "$2.50",
    savingsPercent: 37,
    productId: "steadiday.premium.annual",
  },
  lifetime: {
    price: 59.99,
    priceDisplay: "$59.99",
    period: "lifetime",
    periodDisplay: "one-time",
    productId: "steadiday.premium.lifetime",
  },
};

// Senior-friendly section labels
export const SECTION_LABELS = {
  health: {
    name: "Health Tracking",
    description: "Track steps, heart rate, and more",
    icon: "fitness",
  },
  tools: {
    name: "Helpful Tools",
    description: "Magnifier, flashlight, notes, and more",
    icon: "build",
  },
  connect: {
    name: "Contacts",
    description: "Favorite people and trusted contacts",
    icon: "people",
  },
};

// Senior-friendly home card labels
export const HOME_CARD_LABELS = {
  medications: {
    name: "Next Medication",
    description: "Shows your next pill to take",
    icon: "medical",
  },
  tasks: {
    name: "Today's Tasks",
    description: "Shows what you need to do today",
    icon: "checkbox",
  },
  sos: {
    name: "Emergency Button",
    description: "Quick access to get help",
    icon: "alert-circle",
    alwaysOn: true,
  },
  steps: {
    name: "Steps Today",
    description: "Shows how many steps you've walked",
    icon: "footsteps",
  },
  water: {
    name: "Water Reminder",
    description: "Reminds you to drink water",
    icon: "water",
  },
  weather: {
    name: "Weather",
    description: "Shows today's weather",
    icon: "partly-sunny",
  },
  quickTools: {
    name: "Quick Tools",
    description: "Fast access to magnifier and flashlight",
    icon: "build",
  },
  upcomingAppointments: {
    name: "Upcoming Appointments",
    description: "Shows your next appointments",
    icon: "calendar",
  },
};

// Helper functions
export function isPremiumFeature(featureId: string): boolean {
  return PREMIUM_FEATURES.some((f) => f.id === featureId);
}

export function getFeatureConfig(featureId: string): FeatureConfig | undefined {
  return [...ESSENTIALS_FEATURES, ...PREMIUM_FEATURES].find(
    (f) => f.id === featureId
  );
}

export function getPricingDisplay(tier: "monthly" | "annual" | "lifetime") {
  return PRICING[tier];
}
