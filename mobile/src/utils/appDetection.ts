import { ConnectedApp } from "../types/app";

/**
 * Simulates checking if apps are installed on the device.
 * In a real implementation, this would use URL schemes or other detection methods.
 *
 * Note: iOS restricts app detection for privacy. This function provides a
 * realistic simulation that randomly marks some apps as "installed" to demonstrate
 * the UI behavior. In production, you would need proper entitlements and
 * URL scheme detection.
 */
export const detectInstalledApps = async (
  availableApps: ConnectedApp[]
): Promise<ConnectedApp[]> => {
  // Simulate async detection with a small delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Known URL schemes for popular apps (for reference)
  const urlSchemes: Record<string, string> = {
    "apple-health": "x-apple-health://",
    "apple-fitness": "fitness://",
    "mychart": "mychart://",
    "teladoc": "teladoc://",
    "amwell": "amwell://",
    "calm": "calm://",
    "headspace": "headspace://",
    "carezone": "carezone://",
    "apple-calendar": "calshow://",
    "google-calendar": "googlecalendar://",
    "apple-reminders": "x-apple-reminder://",
    "todoist": "todoist://",
  };

  // For demo purposes, simulate some apps being installed
  // In production, you would use Linking.canOpenURL() with proper LSApplicationQueriesSchemes
  // Note: Removed Medisafe and MyFitnessPal - not supported integrations
  const simulatedInstalledApps = [
    "apple-health",
    "apple-fitness",
    "apple-calendar",
    "apple-reminders",
    "calm",
    "google-calendar",
  ];

  return availableApps.map((app) => ({
    ...app,
    isInstalled: simulatedInstalledApps.includes(app.id),
  }));
};

/**
 * Filters apps to only show those detected as installed on the device
 */
export const getInstalledApps = (
  apps: ConnectedApp[]
): ConnectedApp[] => {
  return apps.filter((app) => app.isInstalled === true);
};

/**
 * Sorts apps to show installed apps first
 */
export const sortByInstalled = (apps: ConnectedApp[]): ConnectedApp[] => {
  return [...apps].sort((a, b) => {
    const aInstalled = a.isInstalled === true;
    const bInstalled = b.isInstalled === true;

    if (aInstalled && !bInstalled) return -1;
    if (!aInstalled && bInstalled) return 1;
    return 0;
  });
};

// Helper function to get random items from array
function getRandomApps(apps: string[], count: number): string[] {
  const shuffled = [...apps].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, apps.length));
}
