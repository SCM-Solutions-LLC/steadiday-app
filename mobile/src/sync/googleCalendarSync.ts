/**
 * Google Calendar Integration Service
 *
 * Two-way sync between SteadiDay tasks and Google Calendar.
 *
 * Key Features:
 * - User connects their Google account with OAuth (no custom backend needed)
 * - OAuth tokens stored ONLY in secure device storage (never in AsyncStorage or CloudKit)
 * - Changes in SteadiDay update linked Google Calendar events
 * - Changes in Google Calendar update linked SteadiDay tasks
 * - User chooses which Google calendar to use
 * - Uses Google's sync token to fetch only changes
 * - Minimal scopes (only calendar events access)
 * - Clear "Disconnect" option that deletes tokens
 */

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { Task } from "../types/app";
import { logger } from "../utils/logger";

// Track if auth session has been completed
let authSessionCompleted = false;

/**
 * Complete WebBrowser auth session - call this before initiating OAuth
 * Lazy initialization prevents crashes on TestFlight/production builds
 */
function ensureAuthSessionCompleted(): void {
  if (!authSessionCompleted) {
    WebBrowser.maybeCompleteAuthSession();
    authSessionCompleted = true;
  }
}

// Google OAuth Configuration - uses environment variables
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

// Use iOS client ID for mobile app, web client ID as fallback
const GOOGLE_CLIENT_ID = GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;

// Check if Google Calendar integration is properly configured
export const isGoogleCalendarConfigured = (): boolean => {
  return GOOGLE_CLIENT_ID !== "" && GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE";
};

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events", // Only calendar events, minimal scope
];

export interface GoogleCalendarLinkInfo {
  taskId: string;
  eventId: string;
  calendarId: string;
  lastSyncedAt: string;
  title: string;
}

export interface GoogleCalendarInfo {
  id: string;
  summary: string; // Calendar name
  primary: boolean;
  backgroundColor: string;
}

interface GoogleOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

class GoogleCalendarService {
  private calendarLinks: Map<string, GoogleCalendarLinkInfo> = new Map();
  private isConnected: boolean = false;
  private userEmail: string | null = null;
  private selectedCalendarId: string | null = null;
  private syncToken: string | null = null;

  // Secure storage keys
  private readonly ACCESS_TOKEN_KEY = "google_calendar_access_token";
  private readonly REFRESH_TOKEN_KEY = "google_calendar_refresh_token";
  private readonly EXPIRES_AT_KEY = "google_calendar_expires_at";
  private readonly USER_EMAIL_KEY = "google_calendar_user_email";
  private readonly SYNC_TOKEN_KEY = "google_calendar_sync_token";

  /**
   * Initialize and check if user is already connected
   */
  async initialize(): Promise<boolean> {
    try {
      const accessToken = await SecureStore.getItemAsync(this.ACCESS_TOKEN_KEY);
      const userEmail = await SecureStore.getItemAsync(this.USER_EMAIL_KEY);
      const syncToken = await SecureStore.getItemAsync(this.SYNC_TOKEN_KEY);

      if (accessToken && userEmail) {
        this.isConnected = true;
        this.userEmail = userEmail;
        this.syncToken = syncToken;
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error initializing Google Calendar service:", error);
      return false;
    }
  }

  /**
   * Connect to Google Calendar using OAuth
   */
  async connect(): Promise<{ success: boolean; email?: string; error?: string }> {
    try {
      // Check if Google Calendar is configured
      if (!isGoogleCalendarConfigured()) {
        return {
          success: false,
          error: "Google Calendar integration is not configured. Please contact support.",
        };
      }

      // Ensure auth session is completed before starting OAuth
      ensureAuthSessionCompleted();

      // Create OAuth redirect URI
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "vibecode",
        path: "oauth/google-calendar",
      });

      // Configure OAuth request
      const authRequest = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: GOOGLE_OAUTH_SCOPES,
        redirectUri: redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true, // Use PKCE for security
        extraParams: {
          access_type: "offline", // Get refresh token
          prompt: "consent", // Force consent screen to get refresh token
        },
      });

      // Prompt for authorization
      const result = await authRequest.promptAsync({
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      });

      if (result.type !== "success") {
        return { success: false, error: "Authorization cancelled" };
      }

      // Exchange authorization code for tokens
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: GOOGLE_CLIENT_ID,
          code: result.params.code,
          redirectUri: redirectUri,
          extraParams: {
            code_verifier: authRequest.codeVerifier || "",
          },
        },
        {
          tokenEndpoint: "https://oauth2.googleapis.com/token",
        }
      );

      if (!tokenResult.accessToken) {
        return { success: false, error: "Failed to get access token" };
      }

      // Store tokens securely
      await SecureStore.setItemAsync(
        this.ACCESS_TOKEN_KEY,
        tokenResult.accessToken
      );

      if (tokenResult.refreshToken) {
        await SecureStore.setItemAsync(
          this.REFRESH_TOKEN_KEY,
          tokenResult.refreshToken
        );
      }

      const expiresAt = Date.now() + (tokenResult.expiresIn || 3600) * 1000;
      await SecureStore.setItemAsync(
        this.EXPIRES_AT_KEY,
        expiresAt.toString()
      );

      // Get user email from Google API
      const userInfo = await this.fetchUserInfo(tokenResult.accessToken);
      if (userInfo.email) {
        this.userEmail = userInfo.email;
        await SecureStore.setItemAsync(this.USER_EMAIL_KEY, userInfo.email);
      }

      this.isConnected = true;

      return { success: true, email: userInfo.email };
    } catch (error) {
      logger.error("Error connecting to Google Calendar:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Disconnect from Google Calendar
   * Deletes ALL tokens from secure storage
   */
  async disconnect(): Promise<boolean> {
    try {
      // Delete all secure storage keys
      await SecureStore.deleteItemAsync(this.ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(this.EXPIRES_AT_KEY);
      await SecureStore.deleteItemAsync(this.USER_EMAIL_KEY);
      await SecureStore.deleteItemAsync(this.SYNC_TOKEN_KEY);

      // Clear in-memory state
      this.isConnected = false;
      this.userEmail = null;
      this.selectedCalendarId = null;
      this.syncToken = null;
      this.calendarLinks.clear();

      return true;
    } catch (error) {
      logger.error("Error disconnecting from Google Calendar:", error);
      return false;
    }
  }

  /**
   * Check if user is connected
   */
  isUserConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connected user's email
   */
  getUserEmail(): string | null {
    return this.userEmail;
  }

  /**
   * Get access token, refreshing if needed
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const expiresAtStr = await SecureStore.getItemAsync(this.EXPIRES_AT_KEY);
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

      // Check if token is expired (with 5 minute buffer)
      if (Date.now() >= expiresAt - 5 * 60 * 1000) {
        // Token expired, refresh it
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          return null;
        }
      }

      return await SecureStore.getItemAsync(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      logger.error("Error getting access token:", error);
      return null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(
        this.REFRESH_TOKEN_KEY
      );

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }).toString(),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      // Store new access token
      await SecureStore.setItemAsync(this.ACCESS_TOKEN_KEY, data.access_token);

      const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      await SecureStore.setItemAsync(this.EXPIRES_AT_KEY, expiresAt.toString());

      return true;
    } catch (error) {
      logger.error("Error refreshing access token:", error);
      // If refresh fails, user needs to reconnect
      await this.disconnect();
      return false;
    }
  }

  /**
   * Fetch user info from Google
   */
  private async fetchUserInfo(
    accessToken: string
  ): Promise<{ email?: string }> {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      const data = await response.json();
      return { email: data.email };
    } catch (error) {
      logger.error("Error fetching user info:", error);
      return {};
    }
  }

  /**
   * Get list of user's Google calendars
   */
  async getCalendars(): Promise<GoogleCalendarInfo[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return [];
      }

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch calendars");
      }

      const data = await response.json();

      return (data.items || []).map((cal: any) => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor || "#4285F4",
      }));
    } catch (error) {
      logger.error("Error fetching Google calendars:", error);
      return [];
    }
  }

  /**
   * Set the calendar to use for syncing
   */
  setSelectedCalendar(calendarId: string) {
    this.selectedCalendarId = calendarId;
  }

  /**
   * Get the selected calendar ID
   */
  getSelectedCalendar(): string | null {
    return this.selectedCalendarId;
  }

  /**
   * Create a sanitized title for Google Calendar events
   */
  private sanitizeEventTitle(taskTitle: string, category?: string): string {
    const sensitiveKeywords = [
      "medication",
      "prescription",
      "doctor",
      "health",
      "medical",
      "pharmacy",
      "pill",
      "dose",
    ];

    const lowerTitle = taskTitle.toLowerCase();
    const hasSensitiveInfo = sensitiveKeywords.some((keyword) =>
      lowerTitle.includes(keyword)
    );

    if (hasSensitiveInfo || category === "medical") {
      return "SteadiDay appointment";
    }

    return taskTitle;
  }

  /**
   * Create a Google Calendar event from a task
   */
  async createEventFromTask(task: Task): Promise<string | null> {
    try {
      if (!this.isConnected || !this.selectedCalendarId) {
        return null;
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return null;
      }

      // Parse task date and time
      const startDate = new Date(task.date);
      let endDate = new Date(task.date);

      if (task.time) {
        const [hours, minutes] = task.time.split(":").map(Number);
        startDate.setHours(hours, minutes, 0, 0);

        if (task.endTime) {
          const [endHours, endMinutes] = task.endTime.split(":").map(Number);
          endDate.setHours(endHours, endMinutes, 0, 0);
        } else {
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        }
      }

      if (task.endDate) {
        endDate = new Date(task.endDate);
      }

      // Create event object
      const event: any = {
        summary: this.sanitizeEventTitle(task.title, task.category),
        description: task.notes || undefined,
        location: task.location || undefined,
      };

      if (task.isAllDay) {
        event.start = {
          date: startDate.toISOString().split("T")[0],
        };
        event.end = {
          date: endDate.toISOString().split("T")[0],
        };
      } else {
        event.start = {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        event.end = {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }

      // Add reminders
      if (task.reminderEnabled) {
        event.reminders = {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: task.reminderMinutes || 15 },
          ],
        };
      }

      // Create the event
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          this.selectedCalendarId
        )}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create Google Calendar event");
      }

      const data = await response.json();

      // Store the link
      const linkInfo: GoogleCalendarLinkInfo = {
        taskId: task.id,
        eventId: data.id,
        calendarId: this.selectedCalendarId,
        lastSyncedAt: new Date().toISOString(),
        title: task.title,
      };

      this.calendarLinks.set(task.id, linkInfo);

      return data.id;
    } catch (error) {
      logger.error("Error creating Google Calendar event:", error);
      return null;
    }
  }

  /**
   * Update a Google Calendar event when task changes
   */
  async updateEventFromTask(task: Task): Promise<boolean> {
    try {
      const linkInfo = this.calendarLinks.get(task.id);
      if (!linkInfo) {
        return false;
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return false;
      }

      // Parse task date and time
      const startDate = new Date(task.date);
      let endDate = new Date(task.date);

      if (task.time) {
        const [hours, minutes] = task.time.split(":").map(Number);
        startDate.setHours(hours, minutes, 0, 0);

        if (task.endTime) {
          const [endHours, endMinutes] = task.endTime.split(":").map(Number);
          endDate.setHours(endHours, endMinutes, 0, 0);
        } else {
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        }
      }

      if (task.endDate) {
        endDate = new Date(task.endDate);
      }

      // Update event object
      const event: any = {
        summary: this.sanitizeEventTitle(task.title, task.category),
        description: task.notes || undefined,
        location: task.location || undefined,
      };

      if (task.isAllDay) {
        event.start = {
          date: startDate.toISOString().split("T")[0],
        };
        event.end = {
          date: endDate.toISOString().split("T")[0],
        };
      } else {
        event.start = {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        event.end = {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }

      if (task.reminderEnabled) {
        event.reminders = {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: task.reminderMinutes || 15 },
          ],
        };
      }

      // Update the event
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          linkInfo.calendarId
        )}/events/${encodeURIComponent(linkInfo.eventId)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update Google Calendar event");
      }

      linkInfo.lastSyncedAt = new Date().toISOString();
      return true;
    } catch (error) {
      logger.error("Error updating Google Calendar event:", error);
      return false;
    }
  }

  /**
   * Delete a Google Calendar event
   */
  async deleteEvent(taskId: string): Promise<boolean> {
    try {
      const linkInfo = this.calendarLinks.get(taskId);
      if (!linkInfo) {
        return false;
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return false;
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
          linkInfo.calendarId
        )}/events/${encodeURIComponent(linkInfo.eventId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete Google Calendar event");
      }

      this.calendarLinks.delete(taskId);
      return true;
    } catch (error) {
      logger.error("Error deleting Google Calendar event:", error);
      return false;
    }
  }

  /**
   * Sync changes FROM Google Calendar TO SteadiDay
   * Uses sync token to fetch only changes since last sync
   */
  async syncEventsToTasks(
    tasks: Task[],
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  ): Promise<void> {
    try {
      if (!this.isConnected || !this.selectedCalendarId) {
        return;
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return;
      }

      // Build URL with sync token if available
      let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        this.selectedCalendarId
      )}/events`;

      const params = new URLSearchParams();
      if (this.syncToken) {
        params.append("syncToken", this.syncToken);
      } else {
        // First sync: get events from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        params.append("timeMin", thirtyDaysAgo.toISOString());
      }

      url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        // Sync token invalid, clear it and try full sync next time
        if (response.status === 410) {
          this.syncToken = null;
          await SecureStore.deleteItemAsync(this.SYNC_TOKEN_KEY);
        }
        throw new Error("Failed to sync Google Calendar events");
      }

      const data = await response.json();

      // Process changed/deleted events
      for (const event of data.items || []) {
        // Find linked task
        const linkInfo = Array.from(this.calendarLinks.values()).find(
          (link) => link.eventId === event.id
        );

        if (!linkInfo) {
          continue; // Event not linked to a task
        }

        const task = tasks.find((t) => t.id === linkInfo.taskId);
        if (!task) {
          continue;
        }

        // Check if event was deleted
        if (event.status === "cancelled") {
          // Unlink the task (but don't delete it)
          this.calendarLinks.delete(linkInfo.taskId);
          continue;
        }

        // Update task from event
        const updates: Partial<Task> = {};

        if (event.start) {
          if (event.start.date) {
            // All-day event
            updates.date = event.start.date;
            updates.isAllDay = true;
          } else if (event.start.dateTime) {
            const startDate = new Date(event.start.dateTime);
            updates.date = startDate.toISOString();
            updates.time = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
          }
        }

        if (event.end) {
          if (event.end.dateTime) {
            const endDate = new Date(event.end.dateTime);
            updates.endDate = endDate.toISOString();
            updates.endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;
          }
        }

        if (event.description !== task.notes) {
          updates.notes = event.description || undefined;
        }

        if (event.location !== task.location) {
          updates.location = event.location || undefined;
        }

        // Apply updates
        if (Object.keys(updates).length > 0) {
          onTaskUpdate(linkInfo.taskId, updates);
          linkInfo.lastSyncedAt = new Date().toISOString();
        }
      }

      // Save new sync token for next time
      if (data.nextSyncToken) {
        this.syncToken = data.nextSyncToken;
        await SecureStore.setItemAsync(this.SYNC_TOKEN_KEY, data.nextSyncToken);
      }
    } catch (error) {
      logger.error("Error syncing Google Calendar events:", error);
    }
  }

  /**
   * Check if a task is linked
   */
  isTaskLinked(taskId: string): boolean {
    return this.calendarLinks.has(taskId);
  }

  /**
   * Get link info
   */
  getLinkInfo(taskId: string): GoogleCalendarLinkInfo | null {
    return this.calendarLinks.get(taskId) || null;
  }

  /**
   * Load links from storage
   */
  async loadLinks(links: GoogleCalendarLinkInfo[]): Promise<void> {
    this.calendarLinks = new Map(links.map((link) => [link.taskId, link]));
  }

  /**
   * Get all links for persistence
   */
  getLinks(): GoogleCalendarLinkInfo[] {
    return Array.from(this.calendarLinks.values());
  }
}

// Singleton instance
export const googleCalendarService = new GoogleCalendarService();
