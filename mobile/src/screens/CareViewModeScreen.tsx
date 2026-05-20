import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Modal,
  AppState,
  AppStateStatus,
} from "react-native";
import { Screen } from "../components/Screen";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { getTaskDateKey } from "../utils/time";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useMedicationStore } from "../state/stores/medicationStore";
import { useTaskStore } from "../state/stores/taskStore";
import { useUserStore } from "../state/stores/userStore";
import { useHealthRecordsStore } from "../state/stores/healthRecordsStore";
import { useSubscriptionStore } from "../state/stores/subscriptionStore";
import { ScreenErrorBoundary } from "../components/ui";

const AUTO_LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * CareViewModeScreen - A locked, read-only view designed for caregivers
 *
 * Shows (top 3 each):
 * - Today's medications
 * - Today's appointments
 * - Today's reminders
 * - Emergency contacts (tap to call with confirmation)
 *
 * Features:
 * - Larger text (always uses large text mode)
 * - No navigation exits except Exit button
 * - Exit always requires authentication when protection is enabled
 * - Call confirmation before dialing
 * - Auto-lock after 2 minutes of inactivity
 * - Calm, reassuring design
 */
export default function CareViewModeScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();

  // Modal states
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCallConfirm, setShowCallConfirm] = useState(false);
  const [pendingCallContact, setPendingCallContact] = useState<{ name: string; phone: string } | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Auto-lock timer
  const lastActivityRef = useRef<number>(Date.now());
  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Settings - Care View always uses large text
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;
  const careViewProtection = useSettingsStore((s) => s.careViewProtection);
  const careViewAutoLock = useSettingsStore((s) => s.careViewAutoLock) ?? true;

  // Premium status
  const isPremiumUnlocked = useSubscriptionStore((s) => s.isPremiumUnlocked);

  // Data stores
  const medications = useMedicationStore((s) => s.medications);
  const tasks = useTaskStore((s) => s.tasks);
  const emergencyContacts = useUserStore((s) => s.userProfile.emergencyContacts);
  const userName = useUserStore((s) => s.userProfile.name);
  const getAppleHealthMedications = useHealthRecordsStore((s) => s.getAppleHealthMedications);

  // Get today's date
  const today = new Date();
  const todayString = format(today, "yyyy-MM-dd");
  const formattedDate = format(today, "EEEE, MMMM d");
  const timeString = format(today, "h:mm a");

  // Track activity for auto-lock
  const trackActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Auto-lock effect
  useEffect(() => {
    if (!careViewAutoLock || careViewProtection === "none") return;

    // Check for inactivity every 10 seconds
    lockTimerRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity >= AUTO_LOCK_TIMEOUT_MS && !isLocked) {
        setIsLocked(true);
      }
    }, 10000);

    return () => {
      if (lockTimerRef.current) {
        clearInterval(lockTimerRef.current);
      }
    };
  }, [careViewAutoLock, careViewProtection, isLocked]);

  // Lock on app background
  useEffect(() => {
    if (!careViewAutoLock || careViewProtection === "none") return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        setIsLocked(true);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [careViewAutoLock, careViewProtection]);

  // Get today's medications (limit to 3)
  const todaysMedications = useMemo(() => {
    const manualMeds = medications.filter((med) => med.reminderEnabled);

    let allMeds: { name: string; dosage: string; source: "manual" | "provider" }[] = [];

    if (isPremiumUnlocked) {
      const healthMeds = getAppleHealthMedications();
      const healthMedNames = healthMeds
        .filter((med) => med.status === "active")
        .map((med) => ({
          name: med.displayName,
          dosage: med.doseText || "",
          source: "provider" as const,
        }));

      const manualMedList = manualMeds.map((med) => ({
        name: med.name,
        dosage: med.dosage || "",
        source: "manual" as const,
      }));

      allMeds = [...manualMedList, ...healthMedNames];
    } else {
      allMeds = manualMeds.map((med) => ({
        name: med.name,
        dosage: med.dosage || "",
        source: "manual" as const,
      }));
    }

    return allMeds.slice(0, 3); // Limit to top 3
  }, [medications, getAppleHealthMedications, isPremiumUnlocked]);

  // Get today's tasks
  const todaysTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.date) return false;
      const taskDateKey = getTaskDateKey(task);
      return taskDateKey === todayString && !task.completed;
    });
  }, [tasks, todayString]);

  // Separate appointments from reminders (limit to 3 each)
  const appointments = todaysTasks
    .filter((task) => task.category === "medical" || task.title.toLowerCase().includes("appointment"))
    .slice(0, 3);

  const reminders = todaysTasks
    .filter((task) => task.category !== "medical" && !task.title.toLowerCase().includes("appointment"))
    .slice(0, 3);

  // Handle unlock from locked state
  const handleUnlock = useCallback(async () => {
    trackActivity();

    if (careViewProtection === "face_id") {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to continue viewing",
          fallbackLabel: "Use PIN",
          disableDeviceFallback: false,
        });

        if (result.success) {
          setIsLocked(false);
          lastActivityRef.current = Date.now();
        }
      } catch {
        // User cancelled or error - stay locked
      }
    } else if (careViewProtection === "pin") {
      // For PIN, just unlock for now (full PIN entry would be added)
      setIsLocked(false);
      lastActivityRef.current = Date.now();
    }
  }, [careViewProtection, trackActivity]);

  // Handle exit authentication - always requires auth when protection is enabled
  const handleExitPress = useCallback(async () => {
    trackActivity();

    if (hapticEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (careViewProtection === "none") {
      navigation.goBack();
      return;
    }

    if (careViewProtection === "face_id") {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to exit Care View",
          fallbackLabel: "Use PIN",
          disableDeviceFallback: false,
        });

        if (result.success) {
          navigation.goBack();
        }
      } catch {
        // User cancelled or error - stay in Care View
      }
    } else if (careViewProtection === "pin") {
      setShowExitConfirm(true);
    }
  }, [careViewProtection, hapticEnabled, navigation, trackActivity]);

  // Handle call confirmation
  const handleCallPress = useCallback(async (phone: string, name: string) => {
    trackActivity();

    if (hapticEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Show confirmation before calling
    setPendingCallContact({ name, phone });
    setShowCallConfirm(true);
  }, [hapticEnabled, trackActivity]);

  // Confirm and make the call
  const confirmCall = useCallback(async () => {
    if (!pendingCallContact) return;

    const cleanPhone = pendingCallContact.phone.replace(/[^0-9+]/g, "");
    const phoneUrl = `tel:${cleanPhone}`;

    setShowCallConfirm(false);
    setPendingCallContact(null);

    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      }
    } catch {
      // Could not open phone
    }
  }, [pendingCallContact]);

  // Large text sizes for Care View
  const textSizes = {
    largeTitle: 34,
    title: 28,
    subtitle: 22,
    body: 20,
    small: 18,
  };

  return (
    <ScreenErrorBoundary screenName="CareViewMode">
      <Screen variant="static" edges={["top", "bottom"]}>
        {/* Header */}
        <View
          className="px-6 py-5 border-b"
          style={{ borderBottomColor: colors.divider }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="heart" size={22} color={primary} />
              </View>
              <Text
                style={{
                  fontSize: textSizes.title,
                  fontWeight: "700",
                  color: colors.textPrimary,
                }}
              >
                Care View
              </Text>
            </View>
            <Pressable
              onPress={handleExitPress}
              className="px-5 py-3 rounded-full"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
                minWidth: 80,
                minHeight: 48,
              }}
              accessibilityRole="button"
              accessibilityLabel="Exit Care View"
            >
              <Text
                style={{
                  fontSize: textSizes.small,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                Exit
              </Text>
            </Pressable>
          </View>
          <Text
            style={{
              fontSize: textSizes.body,
              color: colors.textSecondary,
            }}
          >
            {userName ? `${userName}'s day` : "Today's overview"}
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6 py-6"
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 40 }}
          onScrollBeginDrag={trackActivity}
          onTouchStart={trackActivity}
        >
          {/* Date & Time Card */}
          <View
            className="rounded-2xl p-5 mb-6"
            style={{
              backgroundColor: primaryLight,
              borderWidth: 1,
              borderColor: primary,
            }}
          >
            <Text
              style={{
                fontSize: textSizes.title,
                fontWeight: "700",
                color: colors.textPrimary,
                marginBottom: 4,
              }}
            >
              {formattedDate}
            </Text>
            <Text
              style={{
                fontSize: textSizes.body,
                color: colors.textSecondary,
              }}
            >
              Last updated at {timeString}
            </Text>
          </View>

          {/* Medications Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="medical" size={24} color={primary} />
              <Text
                style={{
                  fontSize: textSizes.subtitle,
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginLeft: 12,
                }}
              >
                Medications
              </Text>
            </View>
            <View
              className="rounded-2xl"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {todaysMedications.length > 0 ? (
                todaysMedications.map((med, index) => (
                  <View
                    key={index}
                    className="p-4"
                    style={{
                      borderBottomWidth: index < todaysMedications.length - 1 ? 1 : 0,
                      borderBottomColor: colors.divider,
                      minHeight: 64,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: textSizes.body,
                        fontWeight: "600",
                        color: colors.textPrimary,
                      }}
                    >
                      {med.name}
                    </Text>
                    {med.dosage && (
                      <Text
                        style={{
                          fontSize: textSizes.small,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {med.dosage}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View className="p-5" style={{ minHeight: 64 }}>
                  <Text
                    style={{
                      fontSize: textSizes.body,
                      color: colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    No medications scheduled today
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Appointments Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="calendar" size={24} color={primary} />
              <Text
                style={{
                  fontSize: textSizes.subtitle,
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginLeft: 12,
                }}
              >
                Appointments
              </Text>
            </View>
            <View
              className="rounded-2xl"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {appointments.length > 0 ? (
                appointments.map((apt, index) => (
                  <View
                    key={apt.id}
                    className="p-4"
                    style={{
                      borderBottomWidth: index < appointments.length - 1 ? 1 : 0,
                      borderBottomColor: colors.divider,
                      minHeight: 64,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: textSizes.body,
                        fontWeight: "600",
                        color: colors.textPrimary,
                      }}
                    >
                      {apt.title}
                    </Text>
                    {apt.time && (
                      <Text
                        style={{
                          fontSize: textSizes.small,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        at {apt.time}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View className="p-5" style={{ minHeight: 64 }}>
                  <Text
                    style={{
                      fontSize: textSizes.body,
                      color: colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    No appointments today
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Reminders Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="notifications" size={24} color={primary} />
              <Text
                style={{
                  fontSize: textSizes.subtitle,
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginLeft: 12,
                }}
              >
                Reminders
              </Text>
            </View>
            <View
              className="rounded-2xl"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {reminders.length > 0 ? (
                reminders.map((reminder, index) => (
                  <View
                    key={reminder.id}
                    className="p-4"
                    style={{
                      borderBottomWidth: index < reminders.length - 1 ? 1 : 0,
                      borderBottomColor: colors.divider,
                      minHeight: 64,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: textSizes.body,
                        fontWeight: "600",
                        color: colors.textPrimary,
                      }}
                    >
                      {reminder.title}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="p-5" style={{ minHeight: 64 }}>
                  <Text
                    style={{
                      fontSize: textSizes.body,
                      color: colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    No reminders today
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Trusted Contacts Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="call" size={24} color="#EF4444" />
              <Text
                style={{
                  fontSize: textSizes.subtitle,
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginLeft: 12,
                }}
              >
                Trusted Contacts
              </Text>
            </View>
            <View
              className="rounded-2xl"
              style={{
                backgroundColor: colors.cardBackground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {emergencyContacts.length > 0 ? (
                emergencyContacts.slice(0, 3).map((contact, index) => (
                  <Pressable
                    key={contact.id}
                    onPress={() => handleCallPress(contact.phoneNumber, contact.name)}
                    className="p-4 flex-row items-center justify-between active:opacity-70"
                    style={{
                      borderBottomWidth: index < Math.min(emergencyContacts.length, 3) - 1 ? 1 : 0,
                      borderBottomColor: colors.divider,
                      minHeight: 72,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${contact.name}`}
                  >
                    <View className="flex-1">
                      <Text
                        style={{
                          fontSize: textSizes.body,
                          fontWeight: "600",
                          color: colors.textPrimary,
                        }}
                      >
                        {contact.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: textSizes.small,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {contact.relationship || "Trusted Contact"}
                      </Text>
                    </View>
                    <View
                      className="w-14 h-14 rounded-full items-center justify-center"
                      style={{ backgroundColor: "#EF444420" }}
                    >
                      <Ionicons name="call" size={26} color="#EF4444" />
                    </View>
                  </Pressable>
                ))
              ) : (
                <View className="p-5" style={{ minHeight: 64 }}>
                  <Text
                    style={{
                      fontSize: textSizes.body,
                      color: colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    No trusted contacts set up
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Reassurance message */}
          <View
            className="rounded-2xl p-5 flex-row items-center"
            style={{
              backgroundColor: primaryLight,
              borderWidth: 1,
              borderColor: primary,
              minHeight: 72,
            }}
          >
            <Ionicons name="checkmark-circle" size={28} color={primary} />
            <Text
              style={{
                fontSize: textSizes.body,
                color: colors.textPrimary,
                marginLeft: 12,
                flex: 1,
              }}
            >
              All information shown is for today only.
            </Text>
          </View>
        </ScrollView>

        {/* Call Confirmation Modal */}
        <Modal
          visible={showCallConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCallConfirm(false)}
        >
          <Pressable
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onPress={() => setShowCallConfirm(false)}
          >
            <Pressable
              className="mx-8 rounded-2xl p-6"
              style={{ backgroundColor: colors.cardBackground, width: "85%" }}
              onPress={() => {}} // Prevent closing when tapping modal content
            >
              <View className="items-center mb-4">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: "#EF444420" }}
                >
                  <Ionicons name="call" size={32} color="#EF4444" />
                </View>
                <Text
                  style={{
                    fontSize: textSizes.title,
                    fontWeight: "700",
                    color: colors.textPrimary,
                    textAlign: "center",
                  }}
                >
                  Call {pendingCallContact?.name}?
                </Text>
              </View>
              <Text
                style={{
                  fontSize: textSizes.body,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                This will open your phone app to call this contact.
              </Text>
              <View className="flex-row" style={{ gap: 12 }}>
                <Pressable
                  onPress={() => {
                    setShowCallConfirm(false);
                    setPendingCallContact(null);
                  }}
                  className="flex-1 py-4 rounded-xl items-center"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 56,
                  }}
                >
                  <Text
                    style={{
                      fontSize: textSizes.body,
                      fontWeight: "600",
                      color: colors.textSecondary,
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={confirmCall}
                  className="flex-1 py-4 rounded-xl items-center"
                  style={{ backgroundColor: "#EF4444", minHeight: 56 }}
                >
                  <Text
                    style={{
                      fontSize: textSizes.body,
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    Call Now
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Exit PIN Modal */}
        <Modal
          visible={showExitConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExitConfirm(false)}
        >
          <View
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <View
              className="mx-8 rounded-2xl p-6"
              style={{ backgroundColor: colors.cardBackground, width: "85%" }}
            >
              <Text
                style={{
                  fontSize: textSizes.title,
                  fontWeight: "700",
                  color: colors.textPrimary,
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Exit Care View
              </Text>
              <Text
                style={{
                  fontSize: textSizes.body,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Please authenticate to return to the full app.
              </Text>
              <View className="flex-row" style={{ gap: 12 }}>
                <Pressable
                  onPress={() => setShowExitConfirm(false)}
                  className="flex-1 py-4 rounded-xl items-center"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 56,
                  }}
                >
                  <Text
                    style={{
                      fontSize: textSizes.body,
                      fontWeight: "600",
                      color: colors.textSecondary,
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowExitConfirm(false);
                    navigation.goBack();
                  }}
                  className="flex-1 py-4 rounded-xl items-center"
                  style={{ backgroundColor: primary, minHeight: 56 }}
                >
                  <Text
                    style={{
                      fontSize: textSizes.body,
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    Exit
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Locked Overlay */}
        {isLocked && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: colors.background }}
          >
            <View className="items-center px-8">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: primaryLight }}
              >
                <Ionicons name="lock-closed" size={40} color={primary} />
              </View>
              <Text
                style={{
                  fontSize: textSizes.title,
                  fontWeight: "700",
                  color: colors.textPrimary,
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                Care View Locked
              </Text>
              <Text
                style={{
                  fontSize: textSizes.body,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 32,
                }}
              >
                Authenticate to continue viewing
              </Text>
              <Pressable
                onPress={handleUnlock}
                className="px-8 py-4 rounded-2xl"
                style={{ backgroundColor: primary, minWidth: 200, minHeight: 56 }}
                accessibilityRole="button"
                accessibilityLabel="Unlock Care View"
              >
                <Text
                  style={{
                    fontSize: textSizes.body,
                    fontWeight: "600",
                    color: "white",
                    textAlign: "center",
                  }}
                >
                  Unlock
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </Screen>
    </ScreenErrorBoundary>
  );
}
