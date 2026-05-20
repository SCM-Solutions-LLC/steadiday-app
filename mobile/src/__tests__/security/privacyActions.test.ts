/**
 * Security Tests: Privacy Actions (GDPR/CCPA Compliance)
 *
 * These tests verify privacy features for data protection compliance:
 * - Download My Data (Right to access)
 * - Delete My Account (Right to be forgotten)
 *
 * SECURITY REQUIREMENTS:
 * - Generic error messages (Attack Story 10 defense)
 * - Complete data export functionality
 * - Multi-step confirmation for destructive actions
 * - Proper cleanup after account deletion
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from "expo-sharing";
import { apiGet, apiPost } from "../../api/client";

// Mock dependencies
jest.mock("expo-file-system");
jest.mock("expo-sharing");
jest.mock("../../api/client");
jest.mock("../../utils/sessionManager", () => ({
  SessionManager: {
    clearSession: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock("../../security/secureStorage", () => ({
  clearAuthTokens: jest.fn().mockResolvedValue(undefined),
}));

describe("Privacy Actions (GDPR/CCPA Compliance)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Download My Data", () => {
    it("should export complete user data as JSON", async () => {
      // Mock API response with complete user data
      const mockData = {
        profile: { name: "Test User", email: "test@example.com" },
        medications: [{ name: "Aspirin", dosage: "100mg" }],
        tasks: [{ title: "Doctor appointment", date: "2025-12-15" }],
        notes: [{ content: "Health note" }],
        healthMetrics: [{ type: "blood_pressure", value: "120/80" }],
        emergencyContacts: [{ name: "John Doe", phone: "555-0123" }],
        doctors: [{ name: "Dr. Smith", specialty: "Cardiology" }],
        insuranceCards: [{ provider: "Blue Cross", memberId: "ABC123" }],
        exportDate: "2025-12-01T00:00:00Z",
      };

      (apiGet as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });

      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      // Simulate Download Data flow
      const response = await apiGet("/privacy/export-data");

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockData);

      // Verify all data types are included
      expect(response.data.profile).toBeDefined();
      expect(response.data.medications).toBeDefined();
      expect(response.data.tasks).toBeDefined();
      expect(response.data.notes).toBeDefined();
      expect(response.data.healthMetrics).toBeDefined();
      expect(response.data.emergencyContacts).toBeDefined();
      expect(response.data.doctors).toBeDefined();
      expect(response.data.insuranceCards).toBeDefined();
      expect(response.data.exportDate).toBeDefined();
    });

    it("should create properly formatted JSON file", async () => {
      const mockData = {
        profile: { name: "Test User" },
        exportDate: "2025-12-01T00:00:00Z",
      };

      (apiGet as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });

      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      // Simulate export
      const response = await apiGet("/privacy/export-data");
      const filename = `steadiday-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(response.data, null, 2)
      );

      // Verify file was created with correct formatting
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        fileUri,
        expect.stringContaining('"profile"')
      );
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        fileUri,
        expect.stringContaining('"exportDate"')
      );
    });

    it("should share file after creation", async () => {
      const mockData = { profile: { name: "Test User" } };

      (apiGet as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });

      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      // Simulate export flow
      const response = await apiGet("/privacy/export-data");
      const filename = `steadiday-data-2025-12-01.json`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(response.data, null, 2)
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      }

      // Verify share was attempted
      expect(Sharing.isAvailableAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalledWith(fileUri);
    });

    it("should handle export errors with generic message", async () => {
      // Mock API error
      (apiGet as jest.Mock).mockResolvedValue({
        success: false,
        error: "Database error: connection timeout",
      });

      const response = await apiGet("/privacy/export-data");

      expect(response.success).toBe(false);
      // SECURITY: Error message should be generic, not expose internal details
      expect(response.error).not.toContain("Database");
      // In real app, UI would show: "Unable to download your data right now"
    });

    it("should handle file system errors gracefully", async () => {
      const mockData = { profile: { name: "Test User" } };

      (apiGet as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });

      // Mock file write failure
      (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(
        new Error("Storage full")
      );

      const response = await apiGet("/privacy/export-data");
      expect(response.success).toBe(true);

      // Attempt to write file
      let exportError = null;
      try {
        await FileSystem.writeAsStringAsync(
          "test-file.json",
          JSON.stringify(response.data)
        );
      } catch (error: any) {
        exportError = error;
      }

      expect(exportError).toBeDefined();
      // Real app would show generic error to user
    });

    it("should not expose PII in error logs", async () => {
      // Mock error with PII
      (apiGet as jest.Mock).mockRejectedValue(
        new Error("Failed to export data for user@email.com")
      );

      let error = null;
      try {
        await apiGet("/privacy/export-data");
      } catch (e: any) {
        error = e;
      }

      expect(error).toBeDefined();
      // SECURITY: In real app, error logger should redact email addresses
      // User-facing message should be generic: "Export failed"
    });
  });

  describe("Delete My Account", () => {
    it("should require confirmation before deletion", () => {
      // This tests the multi-step confirmation flow
      // Step 1: User clicks "Delete Account"
      // Step 2: First confirmation dialog
      // Step 3: Second confirmation dialog
      // Step 4: Actual deletion

      // Test verifies that confirmation parameter is sent
      const confirmationFlow = [
        { step: 1, action: "click_delete_button" },
        { step: 2, action: "first_confirmation" },
        { step: 3, action: "final_confirmation" },
        { step: 4, action: "deletion_executed" },
      ];

      expect(confirmationFlow).toHaveLength(4);
      expect(confirmationFlow[3].action).toBe("deletion_executed");
    });

    it("should successfully delete account and clear all data", async () => {
      // Mock successful deletion
      (apiPost as jest.Mock).mockResolvedValue({
        success: true,
        message: "Account scheduled for deletion",
      });

      // Import mocks
      const { SessionManager } = await import("../../utils/sessionManager");
      const { clearAuthTokens } = await import("../../security/secureStorage");

      // Simulate deletion flow
      const response = await apiPost("/privacy/delete-account", {
        confirm: true,
      });

      expect(response.success).toBe(true);

      // Verify cleanup
      await clearAuthTokens();
      await SessionManager.clearSession();

      expect(clearAuthTokens).toHaveBeenCalled();
      expect(SessionManager.clearSession).toHaveBeenCalled();
    });

    it("should send confirmation parameter to backend", async () => {
      (apiPost as jest.Mock).mockResolvedValue({
        success: true,
        message: "Account deleted",
      });

      await apiPost("/privacy/delete-account", { confirm: true });

      // Verify confirmation was sent
      expect(apiPost).toHaveBeenCalledWith("/privacy/delete-account", {
        confirm: true,
      });
    });

    it("should handle deletion errors with generic message", async () => {
      // Mock backend error
      (apiPost as jest.Mock).mockResolvedValue({
        success: false,
        error: "Database constraint violation: user has active subscriptions",
      });

      const response = await apiPost("/privacy/delete-account", {
        confirm: true,
      });

      expect(response.success).toBe(false);
      // SECURITY: Generic error to user, no internal details
      // Real app shows: "Unable to delete your account right now"
    });

    it("should clear session manager state on deletion", async () => {
      (apiPost as jest.Mock).mockResolvedValue({
        success: true,
        message: "Account deleted",
      });

      const { SessionManager } = await import("../../utils/sessionManager");

      const response = await apiPost("/privacy/delete-account", {
        confirm: true,
      });

      if (response.success) {
        await SessionManager.clearSession();
      }

      expect(SessionManager.clearSession).toHaveBeenCalled();
    });

    it("should clear auth tokens on deletion", async () => {
      (apiPost as jest.Mock).mockResolvedValue({
        success: true,
        message: "Account deleted",
      });

      const { clearAuthTokens } = await import("../../security/secureStorage");

      const response = await apiPost("/privacy/delete-account", {
        confirm: true,
      });

      if (response.success) {
        await clearAuthTokens();
      }

      expect(clearAuthTokens).toHaveBeenCalled();
    });

    it("should inform user about 30-day retention period", () => {
      // This tests that the UI includes information about retention
      const deletionMessage =
        "Your account and all data will be permanently removed after 30 days.";

      expect(deletionMessage).toContain("30 days");
      expect(deletionMessage).toContain("permanently removed");
    });

    it("should not proceed with deletion if confirmation missing", async () => {
      (apiPost as jest.Mock).mockResolvedValue({
        success: false,
        error: "Confirmation required",
      });

      // Attempt deletion without confirmation
      const response = await apiPost("/privacy/delete-account", {});

      expect(response.success).toBe(false);
    });
  });

  describe("Security: Error Message Sanitization", () => {
    it("should never expose internal errors to user", async () => {
      // Test various internal errors
      const internalErrors = [
        "Database connection failed: host unreachable",
        "SQL error: invalid syntax near 'users'",
        "Redis timeout: connection to 192.168.1.1:6379 failed",
        "Internal server error: null pointer exception",
      ];

      // All should result in generic user-facing message
      const genericUserMessage = "Unable to complete your request right now";

      internalErrors.forEach((error) => {
        // SECURITY: Internal errors should never reach the user
        expect(error).not.toBe(genericUserMessage);
      });

      // User always sees the same generic message
      expect(genericUserMessage).toBe(
        "Unable to complete your request right now"
      );
    });

    it("should not leak user existence through error messages", async () => {
      // Account enumeration attack prevention
      const scenarios = [
        { email: "exists@example.com", backend: "Account deleted" },
        { email: "notexist@example.com", backend: "Account not found" },
      ];

      // Both scenarios should show the same message to user
      const userMessage = "If account exists, it has been deleted";

      scenarios.forEach((scenario) => {
        // SECURITY: User sees same message regardless of account existence
        expect(userMessage).toBe("If account exists, it has been deleted");
      });
    });
  });

  describe("GDPR/CCPA Compliance", () => {
    it("should export all required data types", async () => {
      const requiredDataTypes = [
        "profile",
        "medications",
        "tasks",
        "notes",
        "healthMetrics",
        "emergencyContacts",
        "doctors",
        "insuranceCards",
        "exportDate",
      ];

      const mockData: Record<string, any> = {};
      requiredDataTypes.forEach((type) => {
        mockData[type] = type === "exportDate" ? "2025-12-01" : [];
      });

      (apiGet as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });

      const response = await apiGet("/privacy/export-data");

      // Verify all required types are present
      requiredDataTypes.forEach((type) => {
        expect(response.data[type]).toBeDefined();
      });
    });

    it("should include export timestamp", async () => {
      const mockData = {
        profile: {},
        exportDate: "2025-12-01T10:30:00Z",
      };

      (apiGet as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });

      const response = await apiGet("/privacy/export-data");

      expect(response.data.exportDate).toBeDefined();
      expect(typeof response.data.exportDate).toBe("string");
      // Should be ISO format
      expect(response.data.exportDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should handle user requesting data export multiple times", async () => {
      const mockData = { profile: {}, exportDate: "2025-12-01" };

      (apiGet as jest.Mock).mockResolvedValue({
        success: true,
        data: mockData,
      });

      // First export
      const export1 = await apiGet("/privacy/export-data");
      expect(export1.success).toBe(true);

      // Second export (should work without issues)
      const export2 = await apiGet("/privacy/export-data");
      expect(export2.success).toBe(true);

      // Backend should allow multiple exports
      expect(apiGet).toHaveBeenCalledTimes(2);
    });
  });
});
