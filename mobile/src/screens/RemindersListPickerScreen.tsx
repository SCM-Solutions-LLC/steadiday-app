import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Screen } from "../components/Screen";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import * as Linking from "expo-linking";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import Button from "../components/Button";
import {
  useIntegrationsStore,
  ReminderListMeta,
} from "../state/stores/integrationsStore";
import { useAppStore } from "../state/appStore";
import { logger } from "../utils/logger";

// Patterns for reminder lists to exclude by default
const EXCLUDED_LIST_PATTERNS = [
  /holiday/i,
  /birthdays/i,
];

interface ReminderListItem {
  id: string;
  title: string;
  color?: string;
  source?: { name?: string };
  allowsModifications: boolean;
  isSelected: boolean;
}

type RemindersListPickerParams = {
  RemindersListPicker: {
    fromOnboarding?: boolean;
  };
};

export default function RemindersListPickerScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RemindersListPickerParams, "RemindersListPicker">>();
  const fromOnboarding = route.params?.fromOnboarding ?? false;

  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  // Integrations store
  const appleReminders = useIntegrationsStore((s) => s.appleReminders);
  const setSelectedReminderLists = useIntegrationsStore((s) => s.setSelectedReminderLists);
  const setAppleRemindersPermission = useIntegrationsStore((s) => s.setAppleRemindersPermission);

  const [reminderLists, setReminderLists] = useState<ReminderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Load reminder lists on mount
  useEffect(() => {
    loadReminderLists();
  }, []);

  const loadReminderLists = async () => {
    setIsLoading(true);
    try {
      const { status } = await Calendar.getRemindersPermissionsAsync();

      if (status !== "granted") {
        setAppleRemindersPermission("denied");
        setPermissionDenied(true);
        setIsLoading(false);
        return;
      }

      setAppleRemindersPermission("granted");
      const fetchedLists = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);

      // Get previously selected list IDs
      const previouslySelectedIds = new Set(appleReminders.selectedListIds);

      // Map lists with selection state
      const listItems: ReminderListItem[] = fetchedLists.map((list) => {
        // If we have previously selected lists, use those
        // Otherwise, default select all except excluded patterns
        let isSelected: boolean;

        if (previouslySelectedIds.size > 0) {
          isSelected = previouslySelectedIds.has(list.id);
        } else {
          // Default selection: exclude lists matching patterns
          const shouldExclude = EXCLUDED_LIST_PATTERNS.some((pattern) =>
            pattern.test(list.title)
          );
          isSelected = !shouldExclude;
        }

        return {
          id: list.id,
          title: list.title,
          color: list.color,
          source: list.source,
          allowsModifications: list.allowsModifications,
          isSelected,
        };
      });

      // Sort: selected first, then alphabetically
      listItems.sort((a, b) => {
        if (a.isSelected !== b.isSelected) {
          return a.isSelected ? -1 : 1;
        }
        return a.title.localeCompare(b.title);
      });

      setReminderLists(listItems);
    } catch (error) {
      logger.error("Error loading reminder lists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleList = useCallback((listId: string) => {
    setReminderLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, isSelected: !list.isSelected } : list
      )
    );
  }, []);

  const selectAll = useCallback(() => {
    setReminderLists((prev) => prev.map((list) => ({ ...list, isSelected: true })));
  }, []);

  const selectNone = useCallback(() => {
    setReminderLists((prev) => prev.map((list) => ({ ...list, isSelected: false })));
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSave = useCallback(async () => {
    const selectedLists = reminderLists.filter((list) => list.isSelected);
    const selectedIds = selectedLists.map((list) => list.id);
    const selectedMeta: ReminderListMeta[] = selectedLists.map((list) => ({
      id: list.id,
      name: list.title,
      source: list.source?.name ?? "Unknown",
      color: list.color ?? "#007AFF",
      isReadOnly: !list.allowsModifications,
    }));

    setSelectedReminderLists(selectedIds, selectedMeta);

    // Trigger sync to import reminders as tasks
    if (selectedIds.length > 0) {
      setIsSyncing(true);
      try {
        await useAppStore.getState().performTwoWaySync();
        logger.log("Reminders sync completed after saving selection");
      } catch (error) {
        logger.error("Error syncing after reminders selection:", error);
      } finally {
        setIsSyncing(false);
      }
    }

    navigation.goBack();
  }, [reminderLists, setSelectedReminderLists, navigation]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const selectedCount = reminderLists.filter((list) => list.isSelected).length;

  // Permission denied state
  if (permissionDenied) {
    return (
      <Screen variant="static" edges={["top", "bottom"]}>
        <View className="flex-1 px-6 py-4">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-12 h-12 items-center justify-center rounded-full mr-3"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text className={`${textClasses.title} flex-1`} style={{ color: colors.textPrimary }}>
              Select Reminder Lists
            </Text>
          </View>

          {/* Permission Denied */}
          <View className="flex-1 items-center justify-center px-6">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: colors.warningBackground }}
            >
              <Ionicons name="checkbox-outline" size={40} color={colors.warning} />
            </View>
            <Text className={`${textClasses.title} text-center mb-3`} style={{ color: colors.textPrimary }}>
              Reminders Access Required
            </Text>
            <Text className={`${textClasses.body} text-center mb-6`} style={{ color: colors.textSecondary }}>
              To import your reminders, please enable reminders access in your device settings.
            </Text>
            <Button
              title="Open Settings"
              onPress={handleOpenSettings}
              variant="primary"
              size="large"
              icon={<Ionicons name="settings-outline" size={20} color="white" />}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b" style={{ borderBottomColor: colors.divider }}>
          <View className="flex-row items-center mb-4">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-12 h-12 items-center justify-center rounded-full mr-3"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text className={`${textClasses.title} flex-1`} style={{ color: colors.textPrimary }}>
              Select Reminder Lists
            </Text>
          </View>

          {/* Info note */}
          <View
            className="p-4 rounded-xl mb-4"
            style={{ backgroundColor: primary + "10" }}
            accessibilityRole="text"
            accessibilityLabel="SteadiDay imports reminders from the last 30 days and the next 90 days. Older reminders are not imported. You can change this later in Settings."
          >
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color={primary} style={{ marginTop: 2 }} accessibilityElementsHidden />
              <Text className={`${textClasses.small} flex-1 ml-2`} style={{ color: colors.textSecondary }}>
                SteadiDay imports reminders from the last 30 days and the next 90 days. Older reminders are not imported. You can change this later in Settings.
              </Text>
            </View>
          </View>

          {/* Privacy note */}
          <View className="flex-row items-center" accessibilityRole="text" accessibilityLabel="Your reminders data stays on your device.">
            <Ionicons name="lock-closed" size={16} color={colors.textSecondary} accessibilityElementsHidden />
            <Text className={`${textClasses.small} ml-2`} style={{ color: colors.textSecondary }}>
              Your reminders data stays on your device.
            </Text>
          </View>
        </View>

        {/* Select All / None actions */}
        <View className="flex-row justify-between px-6 py-3 border-b" style={{ borderBottomColor: colors.divider }}>
          <Pressable onPress={selectAll} className="flex-row items-center">
            <Ionicons name="checkbox" size={20} color={primary} />
            <Text className={`${textClasses.body} ml-2 font-semibold`} style={{ color: primary }}>
              Select All
            </Text>
          </Pressable>
          <Pressable onPress={selectNone} className="flex-row items-center">
            <Ionicons name="square-outline" size={20} color={colors.textSecondary} />
            <Text className={`${textClasses.body} ml-2`} style={{ color: colors.textSecondary }}>
              Select None
            </Text>
          </Pressable>
        </View>

        {/* Reminder lists */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={primary} />
            <Text className={`${textClasses.body} mt-4`} style={{ color: colors.textSecondary }}>
              Loading reminder lists...
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6 py-4">
            {reminderLists.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="checkbox-outline" size={48} color={colors.textSecondary} />
                <Text className={`${textClasses.body} mt-4 text-center`} style={{ color: colors.textSecondary }}>
                  No reminder lists found on your device.
                </Text>
              </View>
            ) : (
              reminderLists.map((list) => (
                <Pressable
                  key={list.id}
                  onPress={() => toggleList(list.id)}
                  className="flex-row items-center p-4 rounded-xl mb-3"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: list.isSelected ? 2 : 1,
                    borderColor: list.isSelected ? primary : colors.border,
                  }}
                >
                  {/* Color dot */}
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: list.color ?? "#007AFF" }}
                  />

                  {/* List info */}
                  <View className="flex-1">
                    <Text
                      className={`${textClasses.body} font-semibold`}
                      style={{ color: colors.textPrimary }}
                      numberOfLines={1}
                    >
                      {list.title}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                        {list.source?.name ?? "Local"}
                      </Text>
                      {!list.allowsModifications && (
                        <View
                          className="ml-2 px-2 py-0.5 rounded"
                          style={{ backgroundColor: colors.background }}
                        >
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            Read-only
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Checkbox */}
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center"
                    style={{
                      backgroundColor: list.isSelected ? primary : "transparent",
                      borderWidth: list.isSelected ? 0 : 2,
                      borderColor: colors.divider,
                    }}
                  >
                    {list.isSelected && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}

        {/* Footer */}
        <View
          className="px-6 py-4 border-t"
          style={{ borderTopColor: colors.divider, backgroundColor: colors.cardBackground }}
        >
          {/* Selection summary with visual feedback */}
          <View
            className="flex-row items-center justify-center mb-3 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: selectedCount > 0 ? colors.successBackground : colors.warningBackground,
            }}
            accessibilityRole="text"
            accessibilityLabel={selectedCount > 0 ? `${selectedCount} list${selectedCount !== 1 ? "s" : ""} selected` : "No lists selected"}
          >
            <Ionicons
              name={selectedCount > 0 ? "checkmark-circle" : "alert-circle"}
              size={18}
              color={selectedCount > 0 ? colors.success : colors.warning}
              style={{ marginRight: 8 }}
              accessibilityElementsHidden
            />
            <Text
              className={`${textClasses.small} font-medium`}
              style={{ color: selectedCount > 0 ? colors.onSuccess : colors.onWarning }}
            >
              {selectedCount > 0
                ? `${selectedCount} list${selectedCount !== 1 ? "s" : ""} selected`
                : "Select at least one list"}
            </Text>
          </View>
          <Button
            title={isSyncing ? "Syncing..." : "Save Selection"}
            onPress={handleSave}
            variant="primary"
            size="large"
            fullWidth
            disabled={selectedCount === 0 || isSyncing}
            loading={isSyncing}
            accessibilityLabel={selectedCount === 0 ? "Save Selection - disabled, select at least one list" : "Save Selection"}
          />
        </View>
      </View>
    </Screen>
  );
}
