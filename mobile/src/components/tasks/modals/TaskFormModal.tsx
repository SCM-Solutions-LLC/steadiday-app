import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { formatTime } from "../../../utils/time";
import { TaskCategory, TaskFrequency, AlertTiming, SecondAlertTiming } from "../../../types/app";
import CustomSwitch from "../../CustomSwitch";
import type { TaskFormModalProps, TaskFormData } from "../types";
import { getCategoryIcon, getCategoryColor, getFrequencyLabel, getRepeatsBadgeColors, isTaskRepeating } from "../types";
import { logger } from "../../../utils/logger";
import { useTheme } from "../../../utils/useTheme";
import * as Location from "expo-location";

const CATEGORIES: TaskCategory[] = ["medical", "errand", "personal", "other"];
const FREQUENCIES: TaskFrequency[] = [
  "once",
  "daily",
  "twice-daily",
  "three-times-daily",
  "every-other-day",
  "weekly",
  "monthly",
];

// Alert timing options
const ALERT_OPTIONS: { value: AlertTiming; label: string }[] = [
  { value: "at_time", label: "At time of event" },
  { value: "5_min", label: "5 minutes before" },
  { value: "15_min", label: "15 minutes before" },
  { value: "30_min", label: "30 minutes before" },
];

const SECOND_ALERT_OPTIONS: { value: SecondAlertTiming; label: string }[] = [
  { value: "none", label: "None" },
  ...ALERT_OPTIONS,
];

export function TaskFormModal({
  visible,
  editingTask,
  onClose,
  onSave,
  textClasses,
  colors,
  primary,
  primaryLight,
}: TaskFormModalProps) {
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
  const repeatsBadgeColors = getRepeatsBadgeColors(themeColors);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [time2, setTime2] = useState(() => {
    const t = new Date();
    t.setHours(14, 0); // Default 2 PM
    return t;
  });
  const [time3, setTime3] = useState(() => {
    const t = new Date();
    t.setHours(21, 0); // Default 9 PM
    return t;
  });
  const [hasTime, setHasTime] = useState(true);
  const [category, setCategory] = useState<TaskCategory>("personal");
  const [frequency, setFrequency] = useState<TaskFrequency>("once");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [soundReminderEnabled, setSoundReminderEnabled] = useState(false);
  const [firstAlert, setFirstAlert] = useState<AlertTiming>("at_time");
  const [secondAlert, setSecondAlert] = useState<SecondAlertTiming>("none");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ name: string; address: string; lat: number; lon: number }>>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTime2Picker, setShowTime2Picker] = useState(false);
  const [showTime3Picker, setShowTime3Picker] = useState(false);
  const [showAndroidTimePicker, setShowAndroidTimePicker] = useState(false);
  const [firstAlertOpen, setFirstAlertOpen] = useState(false);
  const [secondAlertOpen, setSecondAlertOpen] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);

  // Check if frequency needs multiple times
  const needsMultipleTimes = frequency === "twice-daily" || frequency === "three-times-daily";
  const needsThirdTime = frequency === "three-times-daily";

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDate(new Date(editingTask.date));
        if (editingTask.time) {
          const [hours, minutes] = editingTask.time.split(":").map(Number);
          const t = new Date();
          t.setHours(hours, minutes);
          setTime(t);
          setHasTime(true);
        } else {
          setHasTime(false);
        }
        // Handle multiple times from editing task
        if (editingTask.times && editingTask.times.length >= 2) {
          const [h2, m2] = editingTask.times[1].split(":").map(Number);
          const t2 = new Date();
          t2.setHours(h2, m2);
          setTime2(t2);
        }
        if (editingTask.times && editingTask.times.length >= 3) {
          const [h3, m3] = editingTask.times[2].split(":").map(Number);
          const t3 = new Date();
          t3.setHours(h3, m3);
          setTime3(t3);
        }
        setCategory(editingTask.category || "personal");
        setFrequency(editingTask.frequency || "once");
        setReminderEnabled(editingTask.reminderEnabled);
        setSoundReminderEnabled(editingTask.soundReminderEnabled || false);
        // Convert reminderMinutes to AlertTiming for editing
        if (editingTask.reminderMinutes !== undefined) {
          if (editingTask.reminderMinutes === 0) setFirstAlert("at_time");
          else if (editingTask.reminderMinutes === 5) setFirstAlert("5_min");
          else if (editingTask.reminderMinutes === 15) setFirstAlert("15_min");
          else if (editingTask.reminderMinutes === 30) setFirstAlert("30_min");
          else setFirstAlert("at_time");
        } else {
          setFirstAlert("at_time");
        }
        // Convert secondReminderMinutes to SecondAlertTiming
        if (editingTask.secondReminderMinutes !== undefined) {
          if (editingTask.secondReminderMinutes === 0) setSecondAlert("at_time");
          else if (editingTask.secondReminderMinutes === 5) setSecondAlert("5_min");
          else if (editingTask.secondReminderMinutes === 15) setSecondAlert("15_min");
          else if (editingTask.secondReminderMinutes === 30) setSecondAlert("30_min");
          else setSecondAlert("none");
        } else {
          setSecondAlert("none");
        }
        setNotes(editingTask.notes || "");
        setLocation(editingTask.location || "");
        setLatitude(editingTask.latitude);
        setLongitude(editingTask.longitude);
      } else {
        setTitle("");
        setDate(new Date());
        setTime(new Date());
        const defaultTime2 = new Date();
        defaultTime2.setHours(14, 0);
        setTime2(defaultTime2);
        const defaultTime3 = new Date();
        defaultTime3.setHours(21, 0);
        setTime3(defaultTime3);
        setHasTime(true);
        setCategory("personal");
        setFrequency("once");
        setReminderEnabled(true);
        setSoundReminderEnabled(false);
        setFirstAlert("at_time");
        setSecondAlert("none");
        setNotes("");
        setLocation("");
        setLatitude(undefined);
        setLongitude(undefined);
      }
      setShowDatePicker(false);
      setShowTime2Picker(false);
      setShowTime3Picker(false);
      setShowAndroidTimePicker(false);
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
    }
  }, [visible, editingTask]);

  // Helper to format time for storage
  const formatTimeForStorage = (d: Date) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  // Location autocomplete search
  const searchLocations = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
        const suggestions = await Promise.all(
          results.slice(0, 5).map(async (result) => {
            const addresses = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });
            const addr = addresses[0];
            const name = addr?.name || addr?.street || query;
            const addressParts = [addr?.street, addr?.city, addr?.region, addr?.postalCode].filter(Boolean);
            const address = addressParts.join(", ");
            return { name: name || address, address, lat: result.latitude, lon: result.longitude };
          })
        );
        setLocationSuggestions(suggestions);
        setShowLocationSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggestions(query.trim().length >= 2);
      }
    } catch {
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocation(false);
    }
  }, []);

  const handleLocationTextChange = useCallback((text: string) => {
    setLocation(text);
    if (locationSearchTimeout.current) clearTimeout(locationSearchTimeout.current);
    if (text.trim().length >= 2) {
      locationSearchTimeout.current = setTimeout(() => searchLocations(text), 500);
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  }, [searchLocations]);

  const handleSelectLocation = useCallback((suggestion: { name: string; address: string; lat: number; lon: number }) => {
    setLocation(suggestion.address || suggestion.name);
    setLatitude(suggestion.lat);
    setLongitude(suggestion.lon);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  }, []);

  const handleGetCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      const addresses = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const addressStr = [addr.street, addr.city, addr.region, addr.postalCode].filter(Boolean).join(", ");
        setLocation(addressStr);
      }
    } catch (error) {
      logger.error("Failed to get current location", error);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!title.trim()) return;

    // Build times array for multi-daily frequencies
    let times: string[] | undefined;
    if (hasTime && needsMultipleTimes) {
      times = [formatTimeForStorage(time), formatTimeForStorage(time2)];
      if (needsThirdTime) {
        times.push(formatTimeForStorage(time3));
      }
    }

    const formData: TaskFormData = {
      title: title.trim(),
      date,
      time,
      time2: needsMultipleTimes ? time2 : undefined,
      time3: needsThirdTime ? time3 : undefined,
      times,
      hasTime,
      category,
      frequency,
      reminderEnabled,
      soundReminderEnabled,
      firstAlert,
      secondAlert,
      notes: notes.trim(),
      location: location.trim() || undefined,
      latitude,
      longitude,
    };

    onSave(formData);
  }, [title, date, time, time2, time3, hasTime, category, frequency, reminderEnabled, soundReminderEnabled, firstAlert, secondAlert, notes, location, latitude, longitude, onSave, needsMultipleTimes, needsThirdTime]);

  // Check if editing task is a repeating item from external source
  const isRepeatingImport = editingTask && isTaskRepeating(editingTask) && editingTask.isImported;
  const isCalendarEvent = editingTask?.sourceSystem === "apple_calendar" || editingTask?.syncSource === "calendar";
  const isReminderItem = editingTask?.sourceSystem === "apple_reminders" || editingTask?.syncSource === "reminders";

  // Handle opening source app (Part F)
  const handleOpenInCalendar = useCallback(async () => {
    try {
      // Try to open Calendar app
      const calendarUrl = "calshow://";
      const canOpen = await Linking.canOpenURL(calendarUrl);
      if (canOpen) {
        await Linking.openURL(calendarUrl);
      } else {
        // Fallback - try opening Calendar app directly
        await Linking.openURL("calshow:");
      }
    } catch (error) {
      logger.error("Error opening Calendar app:", error);
    }
  }, []);

  const handleOpenInReminders = useCallback(async () => {
    try {
      // Try to open Reminders app
      const remindersUrl = "x-apple-reminderkit://";
      const canOpen = await Linking.canOpenURL(remindersUrl);
      if (canOpen) {
        await Linking.openURL(remindersUrl);
      } else {
        // Fallback - try opening Reminders app directly
        await Linking.openURL("x-apple-reminder://");
      }
    } catch (error) {
      logger.error("Error opening Reminders app:", error);
    }
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable className="flex-1" onPress={Keyboard.dismiss}>
            <View className="flex-1">
              {/* Modal Header */}
              <View
                className="px-6 py-4 border-b flex-row justify-between items-center"
                style={{ borderBottomColor: colors.divider }}
              >
                <Pressable
                  onPress={onClose}
                  className="py-2"
                  style={{ minHeight: 48, justifyContent: "center" }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text className={`${textClasses.button}`} style={{ color: primary }}>
                    Cancel
                  </Text>
                </Pressable>
                <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
                  {editingTask ? "Edit Task" : "Add Task"}
                </Text>
                <Pressable
                  onPress={handleSave}
                  disabled={!title.trim()}
                  className="py-2"
                  style={{ minHeight: 48, justifyContent: "center" }}
                  accessibilityRole="button"
                  accessibilityLabel="Save"
                >
                  <Text
                    className={`${textClasses.button}`}
                    style={{ color: title.trim() ? primary : colors.textSecondary }}
                  >
                    Save
                  </Text>
                </Pressable>
              </View>

              <ScrollView className="flex-1 px-6 py-6">
                {/* Repeating item helper text and actions (Part F) */}
                {isRepeatingImport && (
                  <View className="mb-6">
                    {/* Helper text */}
                    <View
                      className="rounded-xl p-4 mb-4"
                      style={{
                        backgroundColor: repeatsBadgeColors.bg,
                        borderWidth: 1,
                        borderColor: repeatsBadgeColors.border,
                      }}
                    >
                      <View className="flex-row items-start">
                        <Ionicons name="information-circle" size={20} color={repeatsBadgeColors.text} />
                        <Text
                          style={{ color: repeatsBadgeColors.text }}
                          className="text-sm ml-2 flex-1 leading-relaxed"
                        >
                          This event repeats. Changes here apply only to this one.
                        </Text>
                      </View>
                    </View>

                    {/* Open in source app buttons */}
                    <View className="flex-row">
                      {isCalendarEvent && (
                        <Pressable
                          onPress={handleOpenInCalendar}
                          className="flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl mr-2"
                          style={{
                            backgroundColor: themeColors.surfaceSubtle,
                            borderWidth: 1,
                            borderColor: themeColors.borderSubtle,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Open in Calendar app"
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={18}
                            color={themeColors.textPrimary}
                          />
                          <Text
                            className="text-sm font-medium ml-2"
                            style={{ color: themeColors.textPrimary }}
                          >
                            Open in Calendar
                          </Text>
                        </Pressable>
                      )}
                      {isReminderItem && (
                        <Pressable
                          onPress={handleOpenInReminders}
                          className="flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl"
                          style={{
                            backgroundColor: themeColors.surfaceSubtle,
                            borderWidth: 1,
                            borderColor: themeColors.borderSubtle,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Open in Reminders app"
                        >
                          <Ionicons
                            name="list-outline"
                            size={18}
                            color={themeColors.textPrimary}
                          />
                          <Text
                            className="text-sm font-medium ml-2"
                            style={{ color: themeColors.textPrimary }}
                          >
                            Open in Reminders
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}

                {/* Title & Location (Apple Calendar style) */}
                <View className="mb-6 rounded-xl border overflow-visible" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter task title"
                    className={`px-5 py-4 ${textClasses.body}`}
                    style={{
                      color: colors.textPrimary,
                      minHeight: 52,
                    }}
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
                    accessibilityLabel="Task title"
                  />
                  <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: 16 }} />
                  <View>
                    <View className="flex-row items-center px-5 py-1">
                      <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                      <TextInput
                        value={location}
                        onChangeText={handleLocationTextChange}
                        placeholder="Add Location"
                        className={`flex-1 py-3 ${textClasses.body}`}
                        style={{ color: colors.textPrimary }}
                        placeholderTextColor={colors.textSecondary}
                        onFocus={() => {
                          if (location.trim().length >= 2) setShowLocationSuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowLocationSuggestions(false), 200);
                        }}
                        accessibilityLabel="Task location"
                      />
                      {location.length > 0 && (
                        <Pressable
                          onPress={() => {
                            setLocation("");
                            setLatitude(undefined);
                            setLongitude(undefined);
                            setLocationSuggestions([]);
                            setShowLocationSuggestions(false);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </Pressable>
                      )}
                    </View>
                    {/* Location suggestions dropdown */}
                    {showLocationSuggestions && (
                      <View style={{ backgroundColor: colors.cardBackground, borderTopWidth: 1, borderTopColor: colors.divider }}>
                        {/* Current Location option */}
                        <Pressable
                          onPress={() => {
                            setShowLocationSuggestions(false);
                            handleGetCurrentLocation();
                          }}
                          className="flex-row items-center px-5 py-3"
                          style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
                        >
                          <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: primaryLight }}>
                            <Ionicons name="navigate" size={16} color={primary} />
                          </View>
                          <Text className={`${textClasses.body}`} style={{ color: primary }}>
                            Current Location
                          </Text>
                        </Pressable>

                        {isSearchingLocation && (
                          <View className="py-3 items-center">
                            <ActivityIndicator size="small" color={primary} />
                          </View>
                        )}

                        {locationSuggestions.map((suggestion, index) => (
                          <Pressable
                            key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                            onPress={() => handleSelectLocation(suggestion)}
                            className="flex-row items-center px-5 py-3"
                            style={{
                              borderBottomWidth: index < locationSuggestions.length - 1 ? 1 : 0,
                              borderBottomColor: colors.divider,
                            }}
                          >
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.background }}>
                              <Ionicons name="location" size={16} color={colors.textSecondary} />
                            </View>
                            <View className="flex-1">
                              <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }} numberOfLines={1}>
                                {suggestion.name}
                              </Text>
                              {suggestion.address !== suggestion.name && (
                                <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }} numberOfLines={1}>
                                  {suggestion.address}
                                </Text>
                              )}
                            </View>
                          </Pressable>
                        ))}

                        {!isSearchingLocation && locationSuggestions.length === 0 && location.trim().length >= 2 && (
                          <View className="py-3 px-5">
                            <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                              No results found
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Category Picker */}
                <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                  Category
                </Text>
                <View className="flex-row mb-6 flex-wrap">
                  {CATEGORIES.map((cat) => {
                    const categoryStyle = getCategoryColor(cat, primary, primaryLight);
                    const isSelected = category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className="py-4 px-4 rounded-xl items-center mb-2 mr-2 border-2"
                        style={{
                          width: "47%",
                          backgroundColor: isSelected ? categoryStyle.iconColor + "20" : colors.cardBackground,
                          borderColor: isSelected ? categoryStyle.iconColor : colors.border,
                          minHeight: 48,
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <Ionicons
                          name={getCategoryIcon(cat) as any}
                          size={24}
                          color={isSelected ? categoryStyle.iconColor : colors.textSecondary}
                        />
                        <Text
                          className={`${textClasses.small} mt-1 capitalize`}
                          style={{ color: isSelected ? categoryStyle.iconColor : colors.textSecondary }}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Date Picker */}
                <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                  Date
                </Text>
                <Pressable
                  onPress={() => {
                    if (Platform.OS === "android") {
                      DateTimePickerAndroid.open({
                        value: date,
                        mode: "date",
                        display: "default",
                        onChange: (_event, selectedDate) => {
                          if (_event.type !== "dismissed" && selectedDate) {
                            setDate(selectedDate);
                          }
                        },
                      });
                    } else {
                      setShowDatePicker(!showDatePicker);
                    }
                  }}
                  className="px-6 py-4 rounded-xl mb-4 border"
                  style={{ backgroundColor: primaryLight, borderColor: primary, minHeight: 48 }}
                  accessibilityRole="button"
                  accessibilityLabel="Select date"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>
                      {format(date, "EEEE, MMMM d, yyyy")}
                    </Text>
                    <Ionicons name="calendar" size={24} color={primary} />
                  </View>
                </Pressable>

                {Platform.OS === "ios" && showDatePicker && (
                  <View
                    className="rounded-xl p-4 mb-6 border-2"
                    style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
                  >
                    <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.cardBackground }}>
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display="inline"
                        onChange={(event, selectedDate) => {
                          if (selectedDate && event.type !== "dismissed") {
                            setDate(selectedDate);
                          }
                        }}
                        textColor={colors.textPrimary}
                        themeVariant={colors.cardBackground === "#FFFFFF" ? "light" : "dark"}
                      />
                    </View>
                  </View>
                )}

                {/* Time Toggle and Picker */}
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                    Time
                  </Text>
                  <Pressable
                    onPress={() => setHasTime(!hasTime)}
                    className="flex-row items-center"
                    style={{ minHeight: 48 }}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: hasTime }}
                  >
                    <Text className={`${textClasses.small} mr-2`} style={{ color: colors.textSecondary }}>
                      {hasTime ? "Specific time" : "All day"}
                    </Text>
                    <View
                      className="w-14 h-8 rounded-full p-1"
                      style={{ backgroundColor: hasTime ? primary : colors.divider }}
                    >
                      <View className={`w-6 h-6 rounded-full bg-white ${hasTime ? "ml-auto" : ""}`} />
                    </View>
                  </Pressable>
                </View>

                {hasTime && (
                  <View
                    className="rounded-xl p-6 mb-6 border"
                    style={{ backgroundColor: primaryLight, borderColor: primary }}
                  >
                    <Text
                      className={`${textClasses.small} mb-2`}
                      style={{ color: colors.textSecondary }}
                    >
                      {needsMultipleTimes ? "First time" : "Task time"}
                    </Text>
                    <Pressable
                      onPress={() => {
                        if (Platform.OS === "android") {
                          DateTimePickerAndroid.open({
                            value: time,
                            mode: "time",
                            display: "default",
                            onChange: (_event, selectedTime) => {
                              if (_event.type !== "dismissed" && selectedTime) {
                                setTime(selectedTime);
                              }
                            },
                          });
                        }
                      }}
                    >
                      <Text
                        className={`${textClasses.body} text-center mb-4 font-semibold`}
                        style={{ color: primary }}
                      >
                        {formatTime(
                          `${time.getHours().toString().padStart(2, "0")}:${time
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}`
                        )}
                      </Text>
                    </Pressable>
                    {Platform.OS === "ios" && (
                      <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.cardBackground }}>
                        <DateTimePicker
                          value={time}
                          mode="time"
                          display="spinner"
                          onChange={(event, selectedTime) => {
                            if (selectedTime && event.type !== "dismissed") {
                              setTime(selectedTime);
                            }
                          }}
                          textColor={colors.textPrimary}
                          themeVariant={colors.cardBackground === "#FFFFFF" ? "light" : "dark"}
                        />
                      </View>
                    )}
                    <Text className={`${textClasses.small} text-center mt-3`} style={{ color: primary }}>
                      {Platform.OS === "android" ? "Tap the time above to change it" : "Scroll to select task time"}
                    </Text>
                  </View>
                )}

                {/* Second Time Picker for twice-daily / three-times-daily */}
                {hasTime && needsMultipleTimes && (
                  <View
                    className="rounded-xl p-6 mb-6 border"
                    style={{ backgroundColor: primaryLight, borderColor: primary }}
                  >
                    <Text
                      className={`${textClasses.small} mb-2`}
                      style={{ color: colors.textSecondary }}
                    >
                      Second time
                    </Text>
                    <Pressable
                      onPress={() => {
                        if (Platform.OS === "android") {
                          DateTimePickerAndroid.open({
                            value: time2,
                            mode: "time",
                            display: "default",
                            onChange: (_event, selectedTime) => {
                              if (_event.type !== "dismissed" && selectedTime) {
                                setTime2(selectedTime);
                              }
                            },
                          });
                        } else {
                          setShowTime2Picker(!showTime2Picker);
                        }
                      }}
                      className="py-3 px-4 rounded-xl mb-2"
                      style={{ backgroundColor: colors.cardBackground }}
                    >
                      <Text
                        className={`${textClasses.body} text-center font-semibold`}
                        style={{ color: primary }}
                      >
                        {formatTime(formatTimeForStorage(time2))}
                      </Text>
                    </Pressable>
                    {Platform.OS === "ios" && showTime2Picker && (
                      <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.cardBackground }}>
                        <DateTimePicker
                          value={time2}
                          mode="time"
                          display="spinner"
                          onChange={(event, selectedTime) => {
                            if (selectedTime && event.type !== "dismissed") {
                              setTime2(selectedTime);
                            }
                          }}
                          textColor={colors.textPrimary}
                          themeVariant={colors.cardBackground === "#FFFFFF" ? "light" : "dark"}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Third Time Picker for three-times-daily */}
                {hasTime && needsThirdTime && (
                  <View
                    className="rounded-xl p-6 mb-6 border"
                    style={{ backgroundColor: primaryLight, borderColor: primary }}
                  >
                    <Text
                      className={`${textClasses.small} mb-2`}
                      style={{ color: colors.textSecondary }}
                    >
                      Third time
                    </Text>
                    <Pressable
                      onPress={() => {
                        if (Platform.OS === "android") {
                          DateTimePickerAndroid.open({
                            value: time3,
                            mode: "time",
                            display: "default",
                            onChange: (_event, selectedTime) => {
                              if (_event.type !== "dismissed" && selectedTime) {
                                setTime3(selectedTime);
                              }
                            },
                          });
                        } else {
                          setShowTime3Picker(!showTime3Picker);
                        }
                      }}
                      className="py-3 px-4 rounded-xl mb-2"
                      style={{ backgroundColor: colors.cardBackground }}
                    >
                      <Text
                        className={`${textClasses.body} text-center font-semibold`}
                        style={{ color: primary }}
                      >
                        {formatTime(formatTimeForStorage(time3))}
                      </Text>
                    </Pressable>
                    {Platform.OS === "ios" && showTime3Picker && (
                      <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.cardBackground }}>
                        <DateTimePicker
                          value={time3}
                          mode="time"
                          display="spinner"
                          onChange={(event, selectedTime) => {
                            if (selectedTime && event.type !== "dismissed") {
                              setTime3(selectedTime);
                            }
                          }}
                          textColor={colors.textPrimary}
                          themeVariant={colors.cardBackground === "#FFFFFF" ? "light" : "dark"}
                        />
                      </View>
                    )}
                  </View>
                )}

                {!hasTime && <View className="mb-6" />}

                {/* Frequency Picker - Accordion */}
                <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                  Frequency
                </Text>
                <Pressable
                  onPress={() => {
                    setFrequencyOpen(!frequencyOpen);
                    setFirstAlertOpen(false);
                    setSecondAlertOpen(false);
                  }}
                  className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl"
                  style={{
                    backgroundColor: primaryLight,
                    borderWidth: 2,
                    borderColor: primary,
                    minHeight: 56,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Frequency: ${getFrequencyLabel(frequency)}. Tap to change.`}
                >
                  <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>
                    {getFrequencyLabel(frequency)}
                  </Text>
                  <Ionicons
                    name={frequencyOpen ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={primary}
                  />
                </Pressable>
                {frequencyOpen && (
                  <View
                    className="mb-4 rounded-xl overflow-hidden"
                    style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}
                  >
                    {FREQUENCIES.map((freq, index) => {
                      const isSelected = frequency === freq;
                      return (
                        <Pressable
                          key={freq}
                          onPress={() => {
                            setFrequency(freq);
                            setFrequencyOpen(false);
                          }}
                          className="flex-row items-center justify-between px-6"
                          style={{
                            backgroundColor: isSelected ? primaryLight : "transparent",
                            minHeight: 64,
                            paddingVertical: 16,
                            borderBottomWidth: index < FREQUENCIES.length - 1 ? 1 : 0,
                            borderBottomColor: colors.divider,
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text
                            className={`${textClasses.body} ${isSelected ? "font-semibold" : ""}`}
                            style={{ color: isSelected ? primary : colors.textPrimary, fontSize: 17 }}
                          >
                            {getFrequencyLabel(freq)}
                          </Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={24} color={primary} />}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
                {!frequencyOpen && <View className="mb-4" />}

                {/* Reminder Toggle */}
                <View
                  className="mb-6 rounded-xl p-6 border"
                  style={{ backgroundColor: primaryLight, borderColor: primary }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-1 pr-4">
                      <Text
                        className={`${textClasses.body} font-semibold mb-1`}
                        style={{ color: colors.textPrimary }}
                      >
                        Do you want a reminder for this task?
                      </Text>
                      <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                        Get notified before your task is due
                      </Text>
                    </View>
                    <CustomSwitch
                      value={reminderEnabled}
                      onValueChange={setReminderEnabled}
                      inactiveTrackColor={colors.border}
                      activeTrackColor={primary}
                      activeThumbColor="#FFFFFF"
                      inactiveThumbColor="#FFFFFF"
                    />
                  </View>
                  {reminderEnabled && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="notifications" size={16} color={primary} />
                      <Text className={`${textClasses.small} ml-2`} style={{ color: primary }}>
                        Reminder is on
                      </Text>
                    </View>
                  )}
                </View>

                {/* Alert Time Options - Accordion style */}
                {reminderEnabled && (
                  <View className="mb-6">
                    {/* First Alert - Accordion */}
                    <Text
                      className={`${textClasses.small} font-semibold mb-2`}
                      style={{ color: colors.textSecondary }}
                    >
                      First Alert
                    </Text>
                    <Pressable
                      onPress={() => {
                        setFirstAlertOpen(!firstAlertOpen);
                        setSecondAlertOpen(false);
                        setFrequencyOpen(false);
                      }}
                      className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl"
                      style={{
                        backgroundColor: primaryLight,
                        borderWidth: 2,
                        borderColor: primary,
                        minHeight: 56,
                      }}
                    >
                      <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>
                        {ALERT_OPTIONS.find((o) => o.value === firstAlert)?.label || "At time of event"}
                      </Text>
                      <Ionicons
                        name={firstAlertOpen ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={primary}
                      />
                    </Pressable>
                    {firstAlertOpen && (
                      <View
                        className="mb-4 rounded-xl overflow-hidden"
                        style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}
                      >
                        {ALERT_OPTIONS.map((option, index) => (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              setFirstAlert(option.value);
                              setFirstAlertOpen(false);
                            }}
                            className="flex-row items-center justify-between px-6"
                            style={{
                              backgroundColor: firstAlert === option.value ? primaryLight : "transparent",
                              minHeight: 64,
                              paddingVertical: 16,
                              borderBottomWidth: index < ALERT_OPTIONS.length - 1 ? 1 : 0,
                              borderBottomColor: colors.divider,
                            }}
                          >
                            <Text
                              className={`${textClasses.body} ${firstAlert === option.value ? "font-semibold" : ""}`}
                              style={{ color: firstAlert === option.value ? primary : colors.textPrimary, fontSize: 17 }}
                            >
                              {option.label}
                            </Text>
                            {firstAlert === option.value && (
                              <Ionicons name="checkmark-circle" size={24} color={primary} />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    {!firstAlertOpen && <View className="mb-4" />}

                    {/* Second Alert - Accordion */}
                    <Text
                      className={`${textClasses.small} font-semibold mb-2`}
                      style={{ color: colors.textSecondary }}
                    >
                      Second Alert (Optional)
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSecondAlertOpen(!secondAlertOpen);
                        setFirstAlertOpen(false);
                        setFrequencyOpen(false);
                      }}
                      className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl"
                      style={{
                        backgroundColor: secondAlert !== "none" ? primaryLight : colors.cardBackground,
                        borderWidth: 2,
                        borderColor: secondAlert !== "none" ? primary : colors.border,
                        minHeight: 56,
                      }}
                    >
                      <Text
                        className={`${textClasses.body} font-semibold`}
                        style={{ color: secondAlert !== "none" ? primary : colors.textSecondary }}
                      >
                        {SECOND_ALERT_OPTIONS.find((o) => o.value === secondAlert)?.label || "None"}
                      </Text>
                      <Ionicons
                        name={secondAlertOpen ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={secondAlert !== "none" ? primary : colors.textSecondary}
                      />
                    </Pressable>
                    {secondAlertOpen && (
                      <View
                        className="mb-4 rounded-xl overflow-hidden"
                        style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}
                      >
                        {SECOND_ALERT_OPTIONS.map((option, index) => (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              setSecondAlert(option.value);
                              setSecondAlertOpen(false);
                            }}
                            className="flex-row items-center justify-between px-6"
                            style={{
                              backgroundColor: secondAlert === option.value ? primaryLight : "transparent",
                              minHeight: 64,
                              paddingVertical: 16,
                              borderBottomWidth: index < SECOND_ALERT_OPTIONS.length - 1 ? 1 : 0,
                              borderBottomColor: colors.divider,
                            }}
                          >
                            <Text
                              className={`${textClasses.body} ${secondAlert === option.value ? "font-semibold" : ""}`}
                              style={{ color: secondAlert === option.value ? primary : colors.textPrimary, fontSize: 17 }}
                            >
                              {option.label}
                            </Text>
                            {secondAlert === option.value && (
                              <Ionicons name="checkmark-circle" size={24} color={primary} />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    {!secondAlertOpen && <View className="mb-2" />}
                  </View>
                )}

                {/* Sound Reminder Toggle */}
                {reminderEnabled && (
                  <View
                    className="p-6 rounded-xl mb-6 border"
                    style={{ backgroundColor: primaryLight, borderColor: primary }}
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <View className="flex-1 pr-4">
                        <Text
                          className={`${textClasses.body} font-semibold mb-1`}
                          style={{ color: colors.textPrimary }}
                        >
                          Play a sound with reminder?
                        </Text>
                        <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                          Helpful if you might miss the notification
                        </Text>
                      </View>
                      <CustomSwitch
                        value={soundReminderEnabled}
                        onValueChange={setSoundReminderEnabled}
                        inactiveTrackColor={colors.border}
                        activeTrackColor={primary}
                        activeThumbColor="#FFFFFF"
                        inactiveThumbColor="#FFFFFF"
                      />
                    </View>
                    {soundReminderEnabled && (
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="volume-high" size={16} color={primary} />
                        <Text className={`${textClasses.small} ml-2`} style={{ color: primary }}>
                          Sound alert enabled
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Notes Input */}
                <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                  Notes (Optional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any additional details"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className={`px-6 py-4 rounded-xl border ${textClasses.body} min-h-[100px]`}
                  style={{
                    backgroundColor: colors.cardBackground,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  }}
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Task notes"
                />
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
