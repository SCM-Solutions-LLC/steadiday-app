import type { HomeScreenWidget, Task, Medication, EmergencyContact, TaskInstance } from "../../types/app";
import type { ThemeColors } from "../../utils/colorThemes";

// ============================================================================
// SHARED WIDGET TYPES
// ============================================================================

export interface BaseWidgetProps {
  textClasses: {
    title: string;
    subtitle: string;
    body: string;
    small: string;
    button: string;
  };
  colors: ThemeColors;
  primary: string;
  isLandscape?: boolean;
}

export interface LocationSuggestion {
  name: string;
  region?: string;
  country?: string;
  displayName: string;
}

// ============================================================================
// WIDGET OPTIONS CONFIGURATION
// ============================================================================

export interface WidgetOption {
  value: HomeScreenWidget;
  label: string;
  icon: string;
  description: string;
}

export const WIDGET_OPTIONS: WidgetOption[] = [
  { value: "daily-check-in", label: "How Are You Feeling?", icon: "heart-outline", description: "Daily emotional check-in" },
  { value: "weather", label: "Weather", icon: "cloud", description: "Current weather for your location" },
  { value: "tasks", label: "Tasks", icon: "checkbox", description: "Today's tasks and reminders" },
  { value: "medications", label: "Medications", icon: "medical", description: "Next medication reminder" },
  { value: "sos", label: "SOS Button", icon: "alert-circle", description: "Emergency help button" },
  { value: "care-summary", label: "Care Summary", icon: "heart", description: "Preview and share daily updates" },
  { value: "food-water", label: "Food & Water", icon: "restaurant", description: "Track meals and water intake" },
  { value: "emergency-contacts", label: "Trusted Contact", icon: "call", description: "Quick access to primary contact" },
  // favorite-contacts removed - Favorite Contacts feature removed
  { value: "health-metrics", label: "Health Metrics", icon: "fitness", description: "View your health data" },
  { value: "insurance-cards", label: "Insurance Cards", icon: "card", description: "Access insurance information" },
  { value: "my-doctors", label: "My Doctors", icon: "people", description: "Healthcare provider contacts" },
  { value: "magnifier", label: "Magnifier", icon: "search", description: "Zoom in to read small text" },
  { value: "flashlight", label: "Flashlight", icon: "flashlight", description: "Turn on your phone light" },
  { value: "notes", label: "Notes", icon: "document-text", description: "Quick notes and reminders" },
  { value: "find-my-car", label: "Find My Car", icon: "car", description: "Remember where you parked" },
  { value: "safety-session", label: "Safety Session", icon: "shield-checkmark", description: "Fall detection while app is open" },
];

/**
 * Get all available widget options (all features are free)
 */
export function getAvailableWidgetOptions(_isPremiumUnlocked?: boolean): WidgetOption[] {
  return WIDGET_OPTIONS;
}

/**
 * Return widgets as-is (all features are free, no filtering needed)
 */
export function filterWidgetsForPlan(widgets: HomeScreenWidget[], _isPremiumUnlocked?: boolean): HomeScreenWidget[] {
  return widgets;
}

export const DEFAULT_WIDGETS: HomeScreenWidget[] = ["daily-check-in", "medications", "tasks", "safety-session", "sos", "care-summary"];

// ============================================================================
// WIDGET-SPECIFIC PROPS
// ============================================================================

export interface WeatherWidgetProps extends BaseWidgetProps {
  weather: {
    temperature: number;
    condition: string;
    icon: string;
    feelsLike?: number;
  } | null;
  userLocation: string | undefined;
  useDeviceLocation: boolean;
  loadingWeather: boolean;
  onChangeLocation: () => void;
  onToggleDeviceLocation: () => void;
}

export interface TasksWidgetProps extends BaseWidgetProps {
  tasks: Task[];
}

export interface TaskInstancesWidgetProps extends BaseWidgetProps {
  instances: TaskInstance[];
  onCompleteInstance?: (instance: TaskInstance) => void;
}

export interface MedicationsWidgetProps extends BaseWidgetProps {
  nextMed: (Medication & { nextTime: string; isUpcoming: boolean }) | null;
  allMedications?: Medication[];
}

export interface SOSWidgetProps extends BaseWidgetProps {
  onPress: () => void;
}

export interface EmergencyContactsWidgetProps extends BaseWidgetProps {
  emergencyContacts: EmergencyContact[];
  onNavigate: () => void;
}

// FavoriteContactsWidgetProps removed - Favorite Contacts feature removed

export interface FoodWaterWidgetProps extends BaseWidgetProps {
  todaysCalories: number;
  todaysMeals: number;
  todaysWater: number;
  onNavigateFood: () => void;
  onNavigateWater: () => void;
}

export interface NavigationWidgetProps extends BaseWidgetProps {
  type: "health-metrics" | "insurance-cards" | "my-doctors" | "magnifier" | "flashlight" | "notes" | "find-my-car";
  onNavigate: () => void;
}

// ============================================================================
// SLOW ANIMATION CONFIG FOR OLDER ADULTS
// ============================================================================

import { LayoutAnimation } from "react-native";

export const SLOW_WIDGET_ANIMATION = {
  duration: 800, // 800ms - NOT the typical 300ms - slow enough for older adults to follow
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
    springDamping: 0.7,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

// ============================================================================
// MODAL PROPS
// ============================================================================

export interface SOSModalProps {
  visible: boolean;
  onClose: () => void;
  onCall911: () => void;
  onSendSOSTextAll: () => void;
  onCallEmergencyContact: (contact: EmergencyContact) => void;
  emergencyContacts: EmergencyContact[];
  textClasses: BaseWidgetProps["textClasses"];
  colors: BaseWidgetProps["colors"];
  sending?: boolean;
}

export interface FallAlertModalProps {
  visible: boolean;
  countdown: number;
  onCancel: () => void;
  onCallNow: () => void;
  textClasses: BaseWidgetProps["textClasses"];
  colors: BaseWidgetProps["colors"];
}

export interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  newLocation: string;
  onLocationChange: (text: string) => void;
  locationSuggestions: LocationSuggestion[];
  showLocationSuggestions: boolean;
  isLoadingSuggestions: boolean;
  onSelectLocation: (suggestion: LocationSuggestion) => void;
  onUseCurrentLocation: () => void;
  isRequestingLocation: boolean;
  locationError: string | null;
  hasValidLocation: boolean;
  textClasses: BaseWidgetProps["textClasses"];
  colors: BaseWidgetProps["colors"];
  primary: string;
}

export interface WidgetEditorModalProps {
  visible: boolean;
  onClose: () => void;
  homeScreenWidgets: HomeScreenWidget[];
  movingWidgetIndex: number | null;
  onMoveWidgetUp: (index: number) => void;
  onMoveWidgetDown: (index: number) => void;
  onToggleWidget: (widgetType: HomeScreenWidget) => void;
  textClasses: BaseWidgetProps["textClasses"];
  colors: BaseWidgetProps["colors"];
  primary: string;
  shouldReduceMotion: boolean;
  isPremiumUnlocked: boolean;
}
