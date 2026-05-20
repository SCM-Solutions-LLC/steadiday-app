import { ConnectedApp } from "../types/app";

/**
 * Determines if an app has real two-way sync capabilities
 */
export function hasRealSyncCapability(appId: string): boolean {
  const realSyncApps = [
    "apple-calendar",
    "google-calendar",
    "apple-reminders",
    // Apple Health would be added here once react-native-health is installed
    // "apple-health",
  ];

  return realSyncApps.includes(appId);
}

/**
 * Gets sync capability description for an app
 */
export function getSyncCapabilityDescription(appId: string, category: string): string {
  if (hasRealSyncCapability(appId)) {
    if (category === "calendar") {
      return "Full two-way sync: Tasks created in either app will automatically appear in both.";
    }
    if (appId === "apple-health") {
      return "Full two-way sync: Health data automatically syncs between apps.";
    }
  }

  // Mock sync description
  if (category === "calendar") {
    return "Sample data sync: Connecting this app will add example tasks to demonstrate the feature.";
  }
  if (category === "medication") {
    return "Sample data sync: Connecting this app will add example medications to demonstrate the feature.";
  }
  if (category === "health") {
    return "Sample data sync: Connecting this app will add example health activities to demonstrate the feature.";
  }

  return "Connects to demonstrate app integration features.";
}

/**
 * Gets the sync badge text for an app
 */
export function getSyncBadgeText(appId: string): string | null {
  if (hasRealSyncCapability(appId)) {
    return "Real Sync";
  }
  return "Demo Data";
}

/**
 * Gets the sync badge color for an app
 */
export function getSyncBadgeColor(appId: string): { bg: string; text: string } {
  if (hasRealSyncCapability(appId)) {
    return {
      bg: "bg-[#E5F5ED]",
      text: "text-sage",
    };
  }
  return {
    bg: "bg-[#FFF4E5]",
    text: "text-[#F59E0B]",
  };
}

/**
 * Gets list of apps with real sync capability
 */
export function getAppsWithRealSync(): string[] {
  return ["apple-calendar", "google-calendar", "apple-reminders"];
}

/**
 * Gets list of apps with mock/demo sync
 */
export function getAppsWithMockSync(connectedApps: ConnectedApp[]): ConnectedApp[] {
  return connectedApps.filter((app) => !hasRealSyncCapability(app.id));
}
