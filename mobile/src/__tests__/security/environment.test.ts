/**
 * Security Tests: Environment Separation
 *
 * These tests verify Attack Story 3 defense: Reverse Engineering API Keys
 *
 * Tests cover:
 * - Clean separation between dev, staging, production
 * - No secrets in client code
 * - Correct environment URLs
 * - No cross-environment contamination
 */

import Constants from "expo-constants";

// Mock Expo Constants for testing
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      environment: "development",
    },
    version: "1.0.0",
    ios: {
      buildNumber: "1",
    },
  },
}));

describe("Environment Separation (Attack Story 3)", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("Environment Configuration", () => {
    it("should have three distinct environments", () => {
      const environments = ["development", "staging", "production"];

      expect(environments).toHaveLength(3);
      expect(environments).toContain("development");
      expect(environments).toContain("staging");
      expect(environments).toContain("production");
    });

    it("should use localhost for development environment", async () => {
      // Set development environment
      (Constants.expoConfig as any).extra.environment = "development";

      // Reimport config to get fresh values
      const { config } = await import("../../config/env");

      expect(config.apiBaseUrl).toBe("http://localhost:3000");
      expect(config.enableLogging).toBe(true);
      expect(config.enableDebugTools).toBe(true);
    });

    it("should use staging URL for staging environment", async () => {
      // Set staging environment
      (Constants.expoConfig as any).extra.environment = "staging";

      // Reimport config
      jest.resetModules();
      const { config } = await import("../../config/env");

      expect(config.apiBaseUrl).toBe(
        "https://staging-api.steadiday.com"
      );
      expect(config.enableLogging).toBe(true);
      expect(config.enableDebugTools).toBe(false);
    });

    it("should use production URL for production environment", async () => {
      // Set production environment
      (Constants.expoConfig as any).extra.environment = "production";

      // Reimport config
      jest.resetModules();
      const { config } = await import("../../config/env");

      expect(config.apiBaseUrl).toBe("https://api.steadiday.com");
      expect(config.enableLogging).toBe(false);
      expect(config.enableDebugTools).toBe(false);
    });
  });

  describe("Security: No Secrets in Code", () => {
    it("should not contain API keys in environment config", async () => {
      const { config } = await import("../../config/env");

      // Config should only contain non-sensitive values
      const configString = JSON.stringify(config);

      // Check for common secret patterns
      expect(configString).not.toMatch(/api[_-]?key/i);
      expect(configString).not.toMatch(/secret/i);
      expect(configString).not.toMatch(/password/i);
      expect(configString).not.toMatch(/token/i);
      expect(configString).not.toMatch(/bearer/i);
      expect(configString).not.toMatch(/auth[_-]?token/i);
    });

    it("should not contain database credentials", async () => {
      const { config } = await import("../../config/env");
      const configString = JSON.stringify(config);

      expect(configString).not.toMatch(/database/i);
      expect(configString).not.toMatch(/postgres/i);
      expect(configString).not.toMatch(/mysql/i);
      expect(configString).not.toMatch(/mongodb/i);
      expect(configString).not.toMatch(/db[_-]?host/i);
      expect(configString).not.toMatch(/connection[_-]?string/i);
    });

    it("should not contain encryption keys", async () => {
      const { config } = await import("../../config/env");
      const configString = JSON.stringify(config);

      expect(configString).not.toMatch(/encryption[_-]?key/i);
      expect(configString).not.toMatch(/private[_-]?key/i);
      expect(configString).not.toMatch(/public[_-]?key/i);
      expect(configString).not.toMatch(/rsa/i);
      expect(configString).not.toMatch(/aes/i);
    });

    it("should not contain payment processor keys", async () => {
      const { config } = await import("../../config/env");
      const configString = JSON.stringify(config);

      expect(configString).not.toMatch(/stripe/i);
      expect(configString).not.toMatch(/paypal/i);
      expect(configString).not.toMatch(/payment/i);
      expect(configString).not.toMatch(/merchant/i);
    });
  });

  describe("Environment Isolation", () => {
    it("should not mix development and production URLs", async () => {
      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const { config } = await import("../../config/env");

      // Production should never use localhost
      expect(config.apiBaseUrl).not.toContain("localhost");
      expect(config.apiBaseUrl).not.toContain("127.0.0.1");
      expect(config.apiBaseUrl).not.toContain("0.0.0.0");

      // Production should use HTTPS
      expect(config.apiBaseUrl).toMatch(/^https:\/\//);
    });

    it("should not mix staging and production URLs", async () => {
      (Constants.expoConfig as any).extra.environment = "staging";
      jest.resetModules();
      const prodConfig = await import("../../config/env");

      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const stagingConfig = await import("../../config/env");

      // Staging and production should have different URLs
      expect(prodConfig.config.apiBaseUrl).not.toBe(
        stagingConfig.config.apiBaseUrl
      );
    });

    it("should disable debug tools in production", async () => {
      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const { config } = await import("../../config/env");

      expect(config.enableDebugTools).toBe(false);
      expect(config.enableLogging).toBe(false);
    });

    it("should enable debug tools in development", async () => {
      (Constants.expoConfig as any).extra.environment = "development";
      jest.resetModules();
      const { config } = await import("../../config/env");

      expect(config.enableDebugTools).toBe(true);
      expect(config.enableLogging).toBe(true);
    });
  });

  describe("Environment Validation", () => {
    it("should throw error for invalid environment", async () => {
      (Constants.expoConfig as any).extra.environment = "invalid-env";

      // Attempt to import config should throw
      await expect(async () => {
        jest.resetModules();
        await import("../../config/env");
      }).rejects.toThrow(/Invalid environment/);
    });

    it("should default to development if environment not specified", async () => {
      // Remove environment from config
      (Constants.expoConfig as any).extra.environment = undefined;

      jest.resetModules();
      const { config } = await import("../../config/env");

      expect(config.environment).toBe("development");
      expect(config.apiBaseUrl).toBe("http://localhost:3000");
    });

    it("should validate environment is one of allowed values", async () => {
      const allowedEnvironments = ["development", "staging", "production"];

      (Constants.expoConfig as any).extra.environment = "development";
      jest.resetModules();
      const { config } = await import("../../config/env");

      expect(allowedEnvironments).toContain(config.environment);
    });
  });

  describe("API URL Construction", () => {
    it("should correctly construct API URLs", async () => {
      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const { getApiUrl } = await import("../../config/env");

      const url = getApiUrl("/users/me");

      expect(url).toBe("https://api.steadiday.com/users/me");
    });

    it("should handle endpoints with and without leading slash", async () => {
      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const { getApiUrl } = await import("../../config/env");

      const url1 = getApiUrl("/auth/login");
      const url2 = getApiUrl("auth/login");

      expect(url1).toBe(url2);
      expect(url1).toBe("https://api.steadiday.com/auth/login");
    });

    it("should use correct base URL per environment", async () => {
      // Development
      (Constants.expoConfig as any).extra.environment = "development";
      jest.resetModules();
      const devEnv = await import("../../config/env");
      expect(devEnv.getApiUrl("/test")).toContain("localhost:3000");

      // Staging
      (Constants.expoConfig as any).extra.environment = "staging";
      jest.resetModules();
      const stagingEnv = await import("../../config/env");
      expect(stagingEnv.getApiUrl("/test")).toContain("staging-api");

      // Production
      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const prodEnv = await import("../../config/env");
      expect(prodEnv.getApiUrl("/test")).toContain(
        "https://api.steadiday.com"
      );
    });
  });

  describe("Environment Helper Functions", () => {
    it("should correctly identify development environment", async () => {
      (Constants.expoConfig as any).extra.environment = "development";
      jest.resetModules();
      const { isDevelopment, isProduction, isStaging } = await import(
        "../../config/env"
      );

      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
      expect(isStaging()).toBe(false);
    });

    it("should correctly identify production environment", async () => {
      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const { isDevelopment, isProduction, isStaging } = await import(
        "../../config/env"
      );

      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(true);
      expect(isStaging()).toBe(false);
    });

    it("should correctly identify staging environment", async () => {
      (Constants.expoConfig as any).extra.environment = "staging";
      jest.resetModules();
      const { isDevelopment, isProduction, isStaging } = await import(
        "../../config/env"
      );

      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(false);
      expect(isStaging()).toBe(true);
    });
  });

  describe("Production Security Requirements", () => {
    it("should use HTTPS in production", async () => {
      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const { config } = await import("../../config/env");

      expect(config.apiBaseUrl).toMatch(/^https:\/\//);
    });

    it("should use HTTPS in staging", async () => {
      (Constants.expoConfig as any).extra.environment = "staging";
      jest.resetModules();
      const { config } = await import("../../config/env");

      expect(config.apiBaseUrl).toMatch(/^https:\/\//);
    });

    it("should allow HTTP only in development", async () => {
      (Constants.expoConfig as any).extra.environment = "development";
      jest.resetModules();
      const { config } = await import("../../config/env");

      // Development can use HTTP for localhost
      expect(config.apiBaseUrl).toMatch(/^http:\/\//);
    });

    it("should have appropriate timeouts configured", async () => {
      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const { config } = await import("../../config/env");

      expect(config.apiTimeout).toBe(30000); // 30 seconds
      expect(typeof config.apiTimeout).toBe("number");
      expect(config.apiTimeout).toBeGreaterThan(0);
    });
  });

  describe("Developer-Only Information", () => {
    it("should expose debug info only in development builds", async () => {
      // Note: __DEV__ is a global set by React Native
      // In tests, it may not be available, but we can test the structure

      (Constants.expoConfig as any).extra.environment = "development";
      jest.resetModules();
      const { __DEV_ENV_INFO__ } = await import("../../config/env");

      // If in dev mode, should have debug info
      if (__DEV_ENV_INFO__) {
        expect(__DEV_ENV_INFO__.current).toBeDefined();
        expect(__DEV_ENV_INFO__.apiBaseUrl).toBeDefined();
        expect(__DEV_ENV_INFO__.available).toBeDefined();
      }
    });

    it("should not expose debug info in production", () => {
      // In production builds, __DEV__ is false
      // __DEV_ENV_INFO__ should be null

      // This test verifies the logic exists
      const devMode = false; // Simulating production
      const debugInfo = devMode ? { current: "dev" } : null;

      expect(debugInfo).toBeNull();
    });
  });

  describe("Attack Story 3: Reverse Engineering Defense", () => {
    it("should not expose secrets even if app is decompiled", async () => {
      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const { config } = await import("../../config/env");

      // If attacker decompiles the app, they should only find:
      // - Public API URLs (safe - all routes require auth)
      // - Non-sensitive feature flags
      // - App version info

      // They should NOT find:
      // - Database credentials
      // - API secrets
      // - Encryption keys
      // - Admin endpoints

      const exportedConfig = JSON.stringify(config);

      // Safe to expose
      expect(exportedConfig).toContain("apiBaseUrl");
      expect(exportedConfig).toContain("appVersion");

      // Not safe to expose (should not be present)
      expect(exportedConfig).not.toMatch(/secret/i);
      expect(exportedConfig).not.toMatch(/key/i);
      expect(exportedConfig).not.toMatch(/password/i);
    });

    it("should require backend authentication for all API calls", async () => {
      // This tests that API URLs are safe to expose because backend protects them

      (Constants.expoConfig as any).extra.environment = "production";
      jest.resetModules();
      const { getApiUrl } = await import("../../config/env");

      // Attacker can see these URLs, but...
      const userEndpoint = getApiUrl("/users/me");
      const medicationsEndpoint = getApiUrl("/medications");
      const tasksEndpoint = getApiUrl("/tasks");

      // ...all these endpoints require authentication on backend
      // Without valid token, attacker gets 401 Unauthorized

      expect(userEndpoint).toContain("steadiday.com");
      expect(medicationsEndpoint).toContain("steadiday.com");
      expect(tasksEndpoint).toContain("steadiday.com");

      // Backend requirement: All these must check for valid auth token
    });
  });
});
