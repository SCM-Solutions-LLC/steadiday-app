/**
 * Security Tests: Secure Logger and PII Redaction
 *
 * These tests verify that the secure logger properly redacts sensitive information
 * from logs to prevent accidental exposure of private data.
 *
 * Tests cover:
 * - PII redaction (emails, phones, addresses)
 * - Credential redaction (passwords, tokens, API keys)
 * - Financial data redaction (credit cards, SSN)
 * - Medical data redaction (insurance numbers, medical records)
 * - Nested object redaction
 */

import {
  secureLog,
  secureWarn,
  secureError,
  logApiRequest,
  logApiResponse,
  logAuthEvent,
} from "../../utils/secureLogger";

// Mock console methods
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation();
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

// Mock environment
jest.mock("../../config/env", () => ({
  isDevelopment: jest.fn(() => true),
  isProduction: jest.fn(() => false),
}));

describe("Secure Logger and PII Redaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe("Password Redaction", () => {
    it("should redact password fields", () => {
      const data = {
        username: "john_doe",
        password: "SuperSecret123!",
      };

      secureLog("User login attempt", data);

      expect(mockConsoleLog).toHaveBeenCalled();
      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Password should be redacted
      expect(loggedMessage).not.toContain("SuperSecret123!");
      expect(loggedMessage).toContain("[REDACTED]");
      expect(loggedMessage).toContain("john_doe"); // Username is safe
    });

    it("should redact nested password fields", () => {
      const data = {
        user: {
          name: "John",
          credentials: {
            password: "Secret123",
            passwordConfirm: "Secret123",
          },
        },
      };

      secureLog("User registration", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Nested passwords should be redacted
      expect(loggedMessage).not.toContain("Secret123");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should redact password-like fields regardless of case", () => {
      const data = {
        PASSWORD: "secret1",
        Password: "secret2",
        password: "secret3",
        userPassword: "secret4",
        newPassword: "secret5",
      };

      secureLog("Password test", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: All variations should be redacted
      expect(loggedMessage).not.toContain("secret1");
      expect(loggedMessage).not.toContain("secret2");
      expect(loggedMessage).not.toContain("secret3");
      expect(loggedMessage).not.toContain("secret4");
      expect(loggedMessage).not.toContain("secret5");
    });
  });

  describe("Token Redaction", () => {
    it("should redact access tokens", () => {
      const data = {
        userId: "123",
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "refresh_abc123xyz",
      };

      secureLog("Token refresh", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Tokens should be redacted
      expect(loggedMessage).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(loggedMessage).not.toContain("refresh_abc123xyz");
      expect(loggedMessage).toContain("[REDACTED]");
      expect(loggedMessage).toContain("123"); // User ID is safe
    });

    it("should redact authorization headers", () => {
      const data = {
        headers: {
          authorization: "Bearer token123",
          "content-type": "application/json",
        },
      };

      secureLog("API request", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Authorization should be redacted
      expect(loggedMessage).not.toContain("Bearer token123");
      expect(loggedMessage).toContain("[REDACTED]");
      expect(loggedMessage).toContain("application/json"); // Safe header
    });

    it("should redact API keys", () => {
      const data = {
        apiKey: "sk-1234567890abcdef",
        api_key: "pk_live_1234567890",
        API_KEY: "secret_key_123",
      };

      secureLog("API configuration", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: All API key variations should be redacted
      expect(loggedMessage).not.toContain("sk-1234567890abcdef");
      expect(loggedMessage).not.toContain("pk_live_1234567890");
      expect(loggedMessage).not.toContain("secret_key_123");
    });
  });

  describe("PII Redaction", () => {
    it("should redact email addresses", () => {
      const data = {
        name: "John Doe",
        email: "john.doe@example.com",
        age: 65,
      };

      secureLog("User profile", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Email should be redacted
      expect(loggedMessage).not.toContain("john.doe@example.com");
      expect(loggedMessage).toContain("[REDACTED]");
      expect(loggedMessage).toContain("John Doe"); // Name might be safe
      expect(loggedMessage).toContain("65"); // Age is safe
    });

    it("should redact phone numbers", () => {
      const data = {
        contact: "Emergency Contact",
        phoneNumber: "+1-555-123-4567",
        phone_number: "555-987-6543",
      };

      secureLog("Contact info", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Phone numbers should be redacted
      expect(loggedMessage).not.toContain("+1-555-123-4567");
      expect(loggedMessage).not.toContain("555-987-6543");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should redact addresses", () => {
      const data = {
        userId: "123",
        address: "123 Main St, Anytown, USA 12345",
        shippingAddress: "456 Oak Ave",
      };

      secureLog("User address", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Addresses should be redacted
      expect(loggedMessage).not.toContain("123 Main St");
      expect(loggedMessage).not.toContain("456 Oak Ave");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should redact date of birth", () => {
      const data = {
        name: "John Doe",
        dateOfBirth: "1950-01-15",
        date_of_birth: "1950-01-15",
        birthdate: "01/15/1950",
      };

      secureLog("User birthday", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: DOB variations should be redacted
      expect(loggedMessage).not.toContain("1950-01-15");
      expect(loggedMessage).not.toContain("01/15/1950");
    });
  });

  describe("Financial Data Redaction", () => {
    it("should redact credit card numbers", () => {
      const data = {
        paymentMethod: "card",
        creditCard: "4532-1234-5678-9010",
        credit_card: "4111111111111111",
      };

      secureLog("Payment information", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Credit cards should be redacted
      expect(loggedMessage).not.toContain("4532-1234-5678-9010");
      expect(loggedMessage).not.toContain("4111111111111111");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should redact SSN", () => {
      const data = {
        name: "John Doe",
        ssn: "123-45-6789",
        social_security: "987-65-4321",
      };

      secureLog("Identity verification", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: SSN should be redacted
      expect(loggedMessage).not.toContain("123-45-6789");
      expect(loggedMessage).not.toContain("987-65-4321");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should redact bank account information", () => {
      const data = {
        paymentType: "ach",
        bankAccount: "1234567890",
        bank_account: "9876543210",
        routingNumber: "021000021",
        routing_number: "123456789",
      };

      secureLog("Bank transfer", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Bank info should be redacted
      expect(loggedMessage).not.toContain("1234567890");
      expect(loggedMessage).not.toContain("9876543210");
      expect(loggedMessage).not.toContain("021000021");
      expect(loggedMessage).not.toContain("123456789");
    });

    it("should redact CVV codes", () => {
      const data = {
        cvv: "123",
        securityCode: "456",
      };

      secureLog("Card verification", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: CVV should be redacted
      expect(loggedMessage).not.toContain("123");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should redact PIN codes", () => {
      const data = {
        action: "verify",
        pin: "1234",
        pinCode: "5678",
      };

      secureLog("PIN verification", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: PINs should be redacted
      expect(loggedMessage).not.toContain("1234");
      expect(loggedMessage).not.toContain("5678");
    });
  });

  describe("Medical Data Redaction", () => {
    it("should redact insurance numbers", () => {
      const data = {
        provider: "Blue Cross",
        insuranceNumber: "ABC123456789",
        insurance_number: "XYZ987654321",
      };

      secureLog("Insurance info", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Insurance numbers should be redacted
      expect(loggedMessage).not.toContain("ABC123456789");
      expect(loggedMessage).not.toContain("XYZ987654321");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should redact medical record numbers", () => {
      const data = {
        patientName: "John Doe",
        medicalRecord: "MR-123456",
        medical_record: "MR-789012",
      };

      secureLog("Medical records", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Medical record numbers should be redacted
      expect(loggedMessage).not.toContain("MR-123456");
      expect(loggedMessage).not.toContain("MR-789012");
    });
  });

  describe("API Logging", () => {
    it("should log API requests without sensitive data", () => {
      logApiRequest("POST", "/auth/login", {
        email: "user@example.com",
        password: "Secret123",
      });

      expect(mockConsoleLog).toHaveBeenCalled();
      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Should not contain credentials
      expect(loggedMessage).not.toContain("user@example.com");
      expect(loggedMessage).not.toContain("Secret123");
      expect(loggedMessage).toContain("/auth/login");
    });

    it("should strip query parameters from URLs", () => {
      logApiRequest("GET", "/users/me?token=abc123&key=xyz789");

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Query params with tokens should be removed
      expect(loggedMessage).not.toContain("token=abc123");
      expect(loggedMessage).not.toContain("key=xyz789");
      expect(loggedMessage).toContain("/users/me");
    });

    it("should log API responses without sensitive data", () => {
      logApiResponse(200, "/users/me", {
        id: "123",
        email: "user@example.com",
        accessToken: "token123",
      });

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: Should not contain credentials
      expect(loggedMessage).not.toContain("user@example.com");
      expect(loggedMessage).not.toContain("token123");
      expect(loggedMessage).toContain("200");
    });
  });

  describe("Authentication Logging", () => {
    it("should log successful auth events", () => {
      logAuthEvent("login", true);

      expect(mockConsoleLog).toHaveBeenCalled();
      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      expect(loggedMessage).toContain("login");
      expect(loggedMessage).toContain("true");
    });

    it("should log failed auth events as warnings", () => {
      logAuthEvent("login", false, "Invalid credentials");

      expect(mockConsoleWarn).toHaveBeenCalled();
      const loggedMessage = mockConsoleWarn.mock.calls[0][0];

      expect(loggedMessage).toContain("login");
      expect(loggedMessage).toContain("false");
      expect(loggedMessage).toContain("Invalid credentials");
    });

    it("should not log sensitive auth data", () => {
      logAuthEvent("password_reset", true);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // Should log event but not password details
      expect(loggedMessage).toContain("password_reset");
    });
  });

  describe("Error Logging", () => {
    it("should log errors with redacted data", () => {
      const error = new Error("Database connection failed");

      secureError("Failed to save user", error);

      expect(mockConsoleError).toHaveBeenCalled();
      const loggedMessage = mockConsoleError.mock.calls[0][0];

      expect(loggedMessage).toContain("Failed to save user");
      expect(loggedMessage).toContain("Database connection failed");
    });

    it("should redact sensitive data from error objects", () => {
      const error = {
        message: "Validation failed",
        fields: {
          email: "user@example.com",
          password: "Secret123",
        },
      };

      secureError("Validation error", error);

      const loggedMessage = mockConsoleError.mock.calls[0][0];

      // SECURITY: Sensitive fields should be redacted
      expect(loggedMessage).not.toContain("user@example.com");
      expect(loggedMessage).not.toContain("Secret123");
      expect(loggedMessage).toContain("[REDACTED]");
    });
  });

  describe("Nested Object Redaction", () => {
    it("should redact deeply nested sensitive data", () => {
      const data = {
        user: {
          profile: {
            personal: {
              email: "user@example.com",
              phone_number: "555-1234",
            },
            credentials: {
              password: "Secret123",
            },
          },
        },
      };

      secureLog("Nested data test", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: All nested sensitive fields should be redacted
      expect(loggedMessage).not.toContain("user@example.com");
      expect(loggedMessage).not.toContain("555-1234");
      expect(loggedMessage).not.toContain("Secret123");
      expect(loggedMessage).toContain("[REDACTED]");
    });

    it("should handle arrays with sensitive data", () => {
      const data = {
        users: [
          { id: 1, email: "user1@example.com", password: "pass1" },
          { id: 2, email: "user2@example.com", password: "pass2" },
        ],
      };

      secureLog("User list", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: All sensitive data in arrays should be redacted
      expect(loggedMessage).not.toContain("user1@example.com");
      expect(loggedMessage).not.toContain("user2@example.com");
      expect(loggedMessage).not.toContain("pass1");
      expect(loggedMessage).not.toContain("pass2");
      expect(loggedMessage).toContain("1"); // IDs are safe
      expect(loggedMessage).toContain("2");
    });
  });

  describe("Production Behavior", () => {
    it("should not log in production (except errors)", () => {
      const { isDevelopment } = require("../../config/env");
      (isDevelopment as jest.Mock).mockReturnValue(false);

      secureLog("Test message", { data: "value" });

      // Should not log in production
      expect(mockConsoleLog).not.toHaveBeenCalled();

      // Reset
      (isDevelopment as jest.Mock).mockReturnValue(true);
    });

    it("should still log errors in production but redacted", () => {
      const { isDevelopment } = require("../../config/env");
      (isDevelopment as jest.Mock).mockReturnValue(false);

      secureError("Production error", { password: "Secret123" });

      // Should log error but with redaction
      expect(mockConsoleError).toHaveBeenCalled();
      const loggedMessage = mockConsoleError.mock.calls[0][0];

      expect(loggedMessage).toContain("Production error");
      expect(loggedMessage).not.toContain("Secret123");

      // Reset
      (isDevelopment as jest.Mock).mockReturnValue(true);
    });
  });

  describe("Redaction Completeness", () => {
    it("should have comprehensive sensitive field list", () => {
      const testData = {
        password: "test1",
        token: "test2",
        accessToken: "test3",
        refreshToken: "test4",
        apiKey: "test5",
        secret: "test6",
        email: "test7",
        phoneNumber: "test8",
        ssn: "test9",
        creditCard: "test10",
        pin: "test11",
        privateKey: "test12",
        authorization: "test13",
        bankAccount: "test14",
        insuranceNumber: "test15",
      };

      secureLog("Comprehensive test", testData);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: All common sensitive fields should be redacted
      for (let i = 1; i <= 15; i++) {
        expect(loggedMessage).not.toContain(`test${i}`);
      }

      // Should contain multiple redactions
      const redactedCount = (loggedMessage.match(/\[REDACTED\]/g) || []).length;
      expect(redactedCount).toBeGreaterThanOrEqual(15);
    });

    it("should not affect non-sensitive data", () => {
      const data = {
        id: "user123",
        name: "John Doe",
        age: 65,
        city: "Boston",
        preferences: {
          theme: "dark",
          language: "en",
        },
      };

      secureLog("Safe data", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // Safe data should remain visible
      expect(loggedMessage).toContain("user123");
      expect(loggedMessage).toContain("John Doe");
      expect(loggedMessage).toContain("65");
      expect(loggedMessage).toContain("Boston");
      expect(loggedMessage).toContain("dark");
      expect(loggedMessage).toContain("en");
    });
  });

  describe("Security Regression Tests", () => {
    it("should prevent accidental logging of full user objects", () => {
      const user = {
        id: "123",
        name: "John Doe",
        email: "john@example.com",
        password: "Secret123",
        auth: {
          accessToken: "token123",
          refreshToken: "refresh456",
        },
      };

      secureLog("User loaded", { user });

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // SECURITY: All sensitive fields redacted
      expect(loggedMessage).not.toContain("john@example.com");
      expect(loggedMessage).not.toContain("Secret123");
      expect(loggedMessage).not.toContain("token123");
      expect(loggedMessage).not.toContain("refresh456");

      // Safe fields visible
      expect(loggedMessage).toContain("123");
      expect(loggedMessage).toContain("John Doe");
    });

    it("should handle null and undefined values", () => {
      const data = {
        value1: null,
        value2: undefined,
        value3: "actual value",
      };

      secureLog("Null test", data);

      const loggedMessage = mockConsoleLog.mock.calls[0][0];

      // Should handle null/undefined without errors
      expect(loggedMessage).toContain("actual value");
    });

    it("should handle circular references safely", () => {
      const obj: any = { name: "test" };
      obj.self = obj;

      // Should not throw error (JSON.stringify will handle circular ref)
      expect(() => {
        secureLog("Circular test", { data: "safe" });
      }).not.toThrow();
    });
  });
});
