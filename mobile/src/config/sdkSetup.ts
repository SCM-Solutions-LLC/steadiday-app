/**
 * Third-Party SDK Setup and Configuration
 *
 * This file manages initialization of all third-party SDKs and services.
 *
 * SECURITY NOTES:
 * - Keep SDK list minimal - only use trusted sources
 * - Review SDK privacy policies before integration
 * - Never send health data or PII to analytics/ad networks
 * - Document what data each SDK collects
 * - Obtain user consent for data collection where required
 */

import { secureLog, secureWarn } from "../utils/secureLogger";
import { isDevelopment } from "../config/env";

/**
 * SDK Configuration Interface
 */
interface SDKInfo {
  name: string;
  purpose: string;
  dataCollected: string[];
  isRequired: boolean;
  privacyPolicyUrl: string;
}

/**
 * List of all SDKs used in the app
 *
 * SECURITY: Document what each SDK does and what data it collects
 */
export const REGISTERED_SDKS: SDKInfo[] = [
  {
    name: "Expo",
    purpose: "Core app framework and native APIs",
    dataCollected: ["Device info", "App version", "Crash reports"],
    isRequired: true,
    privacyPolicyUrl: "https://expo.dev/privacy",
  },
  // Example: Analytics SDK (uncomment if you add analytics)
  // {
  //   name: "Analytics Service",
  //   purpose: "App usage analytics",
  //   dataCollected: ["Screen views", "User actions", "Device info"],
  //   isRequired: false,
  //   privacyPolicyUrl: "https://analytics-service.com/privacy",
  // },
  // Example: Error Tracking (uncomment if you add error tracking)
  // {
  //   name: "Error Tracking",
  //   purpose: "Monitor app crashes and errors",
  //   dataCollected: ["Error logs", "Device info", "App state"],
  //   isRequired: false,
  //   privacyPolicyUrl: "https://error-tracker.com/privacy",
  // },
];

/**
 * Initialize all third-party SDKs
 *
 * SECURITY NOTES:
 * - Initialize SDKs with minimal permissions
 * - Disable data collection in development if possible
 * - Never initialize SDKs before user consent (if required)
 * - Handle initialization errors gracefully
 */
export const initializeSDKs = async (): Promise<void> => {
  try {
    secureLog("Initializing third-party SDKs");

    // Initialize analytics SDK (if using)
    await initializeAnalytics();

    // Initialize error tracking SDK (if using)
    await initializeErrorTracking();

    // Initialize push notifications (if using)
    await initializePushNotifications();

    secureLog("All SDKs initialized successfully");
  } catch (error) {
    secureWarn("SDK initialization failed", { error });
    // Don't throw - app should work even if SDKs fail
  }
};

/**
 * Initialize Analytics SDK
 *
 * SECURITY GUIDELINES:
 * - Never send PII (email, name, phone, address)
 * - Never send health data or medical information
 * - Never send insurance or payment information
 * - Use anonymous user IDs only
 * - Respect user opt-out preferences
 */
const initializeAnalytics = async (): Promise<void> => {
  try {
    // Example: Initialize your analytics SDK here
    // Replace with actual SDK initialization code

    if (isDevelopment()) {
      secureLog("Analytics SDK would be initialized here (dev mode)");
      return;
    }

    // IMPORTANT: Get user consent before initializing analytics
    // const hasConsent = await getAnalyticsConsent();
    // if (!hasConsent) {
    //   secureLog("Analytics disabled - no user consent");
    //   return;
    // }

    // Example SDK initialization:
    // await Analytics.init({
    //   apiKey: "YOUR_API_KEY", // Store in env or secure config
    //   enableAutoTracking: false, // Manual tracking for better control
    //   enableCrashReporting: false, // Separate SDK for crashes
    //   enablePersonalization: false, // Don't track individuals
    // });

    secureLog("Analytics initialized");
  } catch (error) {
    secureWarn("Analytics initialization failed", { error });
  }
};

/**
 * Initialize Error Tracking SDK
 *
 * SECURITY GUIDELINES:
 * - Scrub sensitive data from error logs
 * - Don't log user input that might contain passwords
 * - Filter out API tokens from network errors
 * - Limit breadcrumbs to prevent data leakage
 */
const initializeErrorTracking = async (): Promise<void> => {
  try {
    if (isDevelopment()) {
      secureLog("Error tracking SDK would be initialized here (dev mode)");
      return;
    }

    // Example: Initialize error tracking SDK
    // Replace with actual SDK initialization code

    // Example SDK initialization:
    // await ErrorTracker.init({
    //   apiKey: "YOUR_API_KEY",
    //   environment: config.environment,
    //   beforeSend: (event) => {
    //     // Scrub sensitive data before sending
    //     return scrubbedEvent(event);
    //   },
    // });

    secureLog("Error tracking initialized");
  } catch (error) {
    secureWarn("Error tracking initialization failed", { error });
  }
};

/**
 * Initialize Push Notifications
 *
 * SECURITY GUIDELINES:
 * - Use push notifications responsibly
 * - Never send sensitive data in push payload
 * - Validate all push notification payloads
 * - Implement notification preferences
 * - Respect user's notification settings
 */
const initializePushNotifications = async (): Promise<void> => {
  try {
    if (isDevelopment()) {
      secureLog("Push notifications would be initialized here (dev mode)");
      return;
    }

    // Push notification setup is already handled by expo-notifications
    // Add any additional configuration here if needed

    secureLog("Push notifications ready");
  } catch (error) {
    secureWarn("Push notification initialization failed", { error });
  }
};

/**
 * Track an analytics event (example)
 *
 * SECURITY: Never track sensitive information
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>): void => {
  try {
    if (isDevelopment()) {
      secureLog("Would track event", { eventName, properties });
      return;
    }

    // Filter out any accidentally included sensitive data
    const safeProperties = properties ? filterSensitiveData(properties) : undefined;

    // Example: Send to analytics SDK
    // Analytics.track(eventName, safeProperties);
  } catch (error) {
    // Fail silently - don't break app if analytics fails
    secureWarn("Event tracking failed", { error });
  }
};

/**
 * Track a screen view (example)
 *
 * SECURITY: Screen names are generally safe to track
 */
export const trackScreenView = (screenName: string): void => {
  try {
    if (isDevelopment()) {
      secureLog("Would track screen view", { screenName });
      return;
    }

    // Example: Send to analytics SDK
    // Analytics.screen(screenName);
  } catch (error) {
    secureWarn("Screen view tracking failed", { error });
  }
};

/**
 * Filter sensitive data from analytics properties
 */
const filterSensitiveData = (data: Record<string, any>): Record<string, any> => {
  const filtered: Record<string, any> = {};

  const sensitiveKeys = [
    "password",
    "token",
    "email",
    "phone",
    "address",
    "ssn",
    "credit",
    "medical",
    "insurance",
  ];

  for (const key in data) {
    // Check if key contains sensitive words
    const isSensitive = sensitiveKeys.some((sensitive) =>
      key.toLowerCase().includes(sensitive)
    );

    if (!isSensitive) {
      filtered[key] = data[key];
    }
  }

  return filtered;
};

/**
 * Disable all analytics and tracking
 *
 * Call this when user opts out of analytics
 */
export const disableTracking = async (): Promise<void> => {
  try {
    secureLog("Disabling all tracking");

    // Example: Disable analytics SDK
    // await Analytics.disable();

    // Example: Disable error tracking
    // await ErrorTracker.disable();

    secureLog("All tracking disabled");
  } catch (error) {
    secureWarn("Failed to disable tracking", { error });
  }
};

/**
 * IMPORTANT SECURITY AND PRIVACY NOTES:
 *
 * SDK SELECTION:
 * 1. Only use SDKs from trusted sources
 * 2. Review SDK privacy policies before integration
 * 3. Keep number of SDKs minimal
 * 4. Regularly update SDKs for security patches
 * 5. Remove unused SDKs
 *
 * DATA COLLECTION:
 * 6. Never collect or send PII without explicit consent
 * 7. Never send health data to analytics or ad networks
 * 8. Never send insurance or payment information
 * 9. Use anonymous identifiers only
 * 10. Implement user opt-out mechanisms
 *
 * LEGAL COMPLIANCE:
 * 11. Comply with GDPR, CCPA, HIPAA (if applicable)
 * 12. Obtain user consent before data collection
 * 13. Provide clear privacy policy
 * 14. Allow users to export/delete their data
 * 15. Document all third-party data sharing
 *
 * BEST PRACTICES:
 * 16. Initialize SDKs after user consent
 * 17. Fail gracefully if SDK initialization fails
 * 18. Log SDK initialization for debugging
 * 19. Test SDK behavior in all environments
 * 20. Monitor SDK bundle size impact
 */
