import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "./logger";

const SURVEY_STATUS_KEY = "userProfileSurveyStatus";
const APP_OPEN_COUNT_KEY = "appOpenCount";
const USER_PROFILE_KEY = "userProfile";

export type SurveyStatus = "pending" | "completed" | "skipped";

export interface UserProfile {
  setupRole: string;
  source: string;
  motivation: string;
  completedAt: string;
}

export async function getSurveyStatus(): Promise<SurveyStatus> {
  try {
    const status = await AsyncStorage.getItem(SURVEY_STATUS_KEY);
    if (status === "completed" || status === "skipped" || status === "pending") {
      return status;
    }
    return "pending";
  } catch {
    return "pending";
  }
}

export async function setSurveyStatus(status: SurveyStatus): Promise<void> {
  try {
    await AsyncStorage.setItem(SURVEY_STATUS_KEY, status);
  } catch (err) {
    logger.error("[UserProfile] Failed to set survey status:", err);
  }
}

export async function getAppOpenCount(): Promise<number> {
  try {
    const count = await AsyncStorage.getItem(APP_OPEN_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

export async function incrementAppOpenCount(): Promise<number> {
  try {
    const current = await getAppOpenCount();
    const next = current + 1;
    await AsyncStorage.setItem(APP_OPEN_COUNT_KEY, next.toString());
    return next;
  } catch {
    return 0;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    logger.error("[UserProfile] Failed to save profile:", err);
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (data) {
      return JSON.parse(data) as UserProfile;
    }
    return null;
  } catch {
    return null;
  }
}

export async function initSurveyStatusIfNeeded(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(SURVEY_STATUS_KEY);
    if (!existing) {
      await AsyncStorage.setItem(SURVEY_STATUS_KEY, "pending");
    }
  } catch (err) {
    logger.error("[UserProfile] Failed to init survey status:", err);
  }
}
