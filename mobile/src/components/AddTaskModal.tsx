import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Task, TaskCategory, TaskFrequency, TaskRepeatEnding } from "../types/app";
import { getTextSizeClasses } from "../utils/textSizes";
import { useSettingsStore } from "../state/stores/settingsStore";
import { formatTime } from "../utils/time";
import * as Location from "expo-location";
import { useTheme } from "../utils/useTheme";
import CustomSwitch from "./CustomSwitch";
import { useConfirmModal } from "./ConfirmModal";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  editingTask?: Task | null;
}

const categoryOptions: { value: TaskCategory; label: string; icon: string }[] = [
  { value: "personal", label: "Personal", icon: "person" },
  { value: "medical", label: "Medical", icon: "medical" },
  { value: "errand", label: "Errand", icon: "cart" },
  { value: "other", label: "Other", icon: "ellipsis-horizontal" },
];

const frequencyOptions: { value: TaskFrequency; label: string }[] = [
  { value: "once", label: "Never" },
  { value: "daily", label: "Every Day" },
  { value: "twice-daily", label: "Twice a Day" },
  { value: "three-times-daily", label: "Three Times a Day" },
  { value: "weekly", label: "Every Week" },
  { value: "monthly", label: "Every Month" },
  { value: "yearly", label: "Every Year" },
  { value: "custom", label: "Custom" },
];

const reminderOptions = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 10080, label: "1 week before" },
];

export default function AddTaskModal({
  visible,
  onClose,
  onSave,
  editingTask,
}: Props) {
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary, primaryLight, onPrimary } = useTheme();
  const insets = useSafeAreaInsets();
  const { alert } = useConfirmModal();

  // Form state - initialized with empty/default values
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(() => {
    const t = new Date();
    t.setHours(9, 0);
    return t;
  });
  const [endTime, setEndTime] = useState(() => {
    const t = new Date();
    t.setHours(10, 0);
    return t;
  });
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [category, setCategory] = useState<TaskCategory>("personal");
  const [frequency, setFrequency] = useState<TaskFrequency>("once");
  const [repeatEnding, setRepeatEnding] = useState<TaskRepeatEnding>("never");
  const [repeatEndDate, setRepeatEndDate] = useState(new Date());
  const [repeatCount, setRepeatCount] = useState("10");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [secondReminderMinutes, setSecondReminderMinutes] = useState<number | undefined>();
  const [soundReminderEnabled, setSoundReminderEnabled] = useState(false);
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [attendees, setAttendees] = useState("");

  // Dropdown states
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showFirstAlertDropdown, setShowFirstAlertDropdown] = useState(false);
  const [showSecondAlertDropdown, setShowSecondAlertDropdown] = useState(false);

  // Multiple times per day state (for twice-daily, three-times-daily)
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

  // Re-initialize form when modal opens or editingTask changes
  useEffect(() => {
    if (visible) {
      if (editingTask) {
        // Populate form with existing task data
        setTitle(editingTask.title || "");
        setStartDate(editingTask.date ? new Date(editingTask.date) : new Date());
        setEndDate(editingTask.endDate ? new Date(editingTask.endDate) : new Date());

        if (editingTask.time) {
          const [hours, minutes] = editingTask.time.split(":").map(Number);
          const t = new Date();
          t.setHours(hours, minutes);
          setStartTime(t);
        } else {
          const t = new Date();
          t.setHours(9, 0);
          setStartTime(t);
        }

        if (editingTask.endTime) {
          const [hours, minutes] = editingTask.endTime.split(":").map(Number);
          const t = new Date();
          t.setHours(hours, minutes);
          setEndTime(t);
        } else {
          const t = new Date();
          t.setHours(10, 0);
          setEndTime(t);
        }

        setIsAllDay(editingTask.isAllDay ?? false);
        setLocation(editingTask.location || "");
        setLatitude(editingTask.latitude);
        setLongitude(editingTask.longitude);
        setCategory(editingTask.category || "personal");
        setFrequency(editingTask.frequency || "once");
        setRepeatEnding(editingTask.repeatEnding || "never");
        setRepeatEndDate(editingTask.repeatEndDate ? new Date(editingTask.repeatEndDate) : new Date());
        setRepeatCount(editingTask.repeatCount?.toString() || "10");
        setReminderEnabled(editingTask.reminderEnabled ?? true);
        setReminderMinutes(editingTask.reminderMinutes ?? 15);
        setSecondReminderMinutes(editingTask.secondReminderMinutes);
        setSoundReminderEnabled(editingTask.soundReminderEnabled ?? false);
        setNotes(editingTask.notes || "");
        setUrl(editingTask.url || "");
        setAttendees(editingTask.attendees?.join(", ") || "");

        // Handle multiple times
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
      } else {
        // Reset to defaults for new task
        setTitle("");
        setStartDate(new Date());
        setEndDate(new Date());
        const defaultStartTime = new Date();
        defaultStartTime.setHours(9, 0);
        setStartTime(defaultStartTime);
        const defaultEndTime = new Date();
        defaultEndTime.setHours(10, 0);
        setEndTime(defaultEndTime);
        setIsAllDay(false);
        setLocation("");
        setLatitude(undefined);
        setLongitude(undefined);
        setCategory("personal");
        setFrequency("once");
        setRepeatEnding("never");
        setRepeatEndDate(new Date());
        setRepeatCount("10");
        setReminderEnabled(true);
        setReminderMinutes(15);
        setSecondReminderMinutes(undefined);
        setSoundReminderEnabled(false);
        setNotes("");
        setUrl("");
        setAttendees("");
        const defaultTime2 = new Date();
        defaultTime2.setHours(14, 0);
        setTime2(defaultTime2);
        const defaultTime3 = new Date();
        defaultTime3.setHours(21, 0);
        setTime3(defaultTime3);
      }

      // Reset picker states
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      setShowRepeatEndDatePicker(false);
      setShowTime2Picker(false);
      setShowTime3Picker(false);
      setShowAndroidStartTimePicker(false);
      setShowAndroidEndTimePicker(false);
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
      setShowFrequencyDropdown(false);
    }
  }, [visible, editingTask?.id]);

  // UI state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showRepeatEndDatePicker, setShowRepeatEndDatePicker] = useState(false);
  const [showTime2Picker, setShowTime2Picker] = useState(false);
  const [showTime3Picker, setShowTime3Picker] = useState(false);
  const [showAndroidStartTimePicker, setShowAndroidStartTimePicker] = useState(false);
  const [showAndroidEndTimePicker, setShowAndroidEndTimePicker] = useState(false);

  // Location autocomplete state
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ name: string; address: string; lat: number; lon: number }>>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchLocations = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    setIsSearchingLocation(true);
    try {
      // Use expo-location geocoding for suggestions
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
        // Reverse geocode to get readable addresses
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
            return {
              name: name || address,
              address,
              lat: result.latitude,
              lon: result.longitude,
            };
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
    // Clear previous timeout
    if (locationSearchTimeout.current) {
      clearTimeout(locationSearchTimeout.current);
    }
    // Debounce search
    if (text.trim().length >= 2) {
      locationSearchTimeout.current = setTimeout(() => {
        searchLocations(text);
      }, 500);
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

  // Check if form has unsaved changes
  const hasUnsavedChanges = Boolean(title.trim());

  // Helper to format time for storage
  const formatTimeForStorage = (date: Date) =>
    `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  const handleSave = () => {
    if (!title.trim()) return;

    // Validate times: if not all-day and endTime is before startTime on the same day,
    // auto-adjust endTime to be startTime + 1 hour
    let validatedEndTime = endTime;
    if (!isAllDay && startDate.toDateString() === endDate.toDateString()) {
      const startTimeStr = formatTimeForStorage(startTime);
      const endTimeStr = formatTimeForStorage(endTime);

      if (endTimeStr <= startTimeStr) {
        // Auto-set endTime to startTime + 1 hour
        validatedEndTime = new Date(startTime);
        validatedEndTime.setHours(validatedEndTime.getHours() + 1);
        // If this pushes past midnight, just set to 23:59
        if (validatedEndTime.getHours() < startTime.getHours()) {
          validatedEndTime.setHours(23, 59);
        }
      }
    }

    const startTimeStr = !isAllDay ? formatTimeForStorage(startTime) : undefined;
    const endTimeStr = !isAllDay ? formatTimeForStorage(validatedEndTime) : undefined;

    // Build times array for multi-daily frequencies
    let times: string[] | undefined;
    if (!isAllDay && (frequency === "twice-daily" || frequency === "three-times-daily")) {
      times = [formatTimeForStorage(startTime), formatTimeForStorage(time2)];
      if (frequency === "three-times-daily") {
        times.push(formatTimeForStorage(time3));
      }
    }

    const task: Partial<Task> = {
      title: title.trim(),
      date: startDate.toISOString(),
      endDate: endDate.toISOString(),
      time: startTimeStr,
      endTime: endTimeStr,
      times,
      isAllDay,
      location: location.trim() || undefined,
      latitude,
      longitude,
      category,
      frequency,
      repeatEnding: frequency !== "once" ? repeatEnding : undefined,
      repeatEndDate:
        frequency !== "once" && repeatEnding === "on-date"
          ? repeatEndDate.toISOString()
          : undefined,
      repeatCount:
        frequency !== "once" && repeatEnding === "after-count"
          ? parseInt(repeatCount)
          : undefined,
      reminderEnabled,
      reminderMinutes: reminderEnabled ? reminderMinutes : undefined,
      secondReminderMinutes: reminderEnabled ? secondReminderMinutes : undefined,
      soundReminderEnabled,
      notes: notes.trim() || undefined,
      url: url.trim() || undefined,
      attendees: attendees.trim()
        ? attendees.split(",").map((e) => e.trim()).filter(Boolean)
        : undefined,
    };

    onSave(task);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !editingTask) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to close?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert(
          "Location Permission Required",
          "Please allow location access to use current location."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const addressStr = [
          addr.street,
          addr.city,
          addr.region,
          addr.postalCode,
        ]
          .filter(Boolean)
          .join(", ");
        setLocation(addressStr);
      }

      alert("Success", "Current location added");
    } catch (error) {
      alert("Error", "Failed to get current location");
    }
  };

  const handleOpenInMaps = () => {
    if (!latitude || !longitude) {
      alert("No Location", "Please add GPS coordinates first");
      return;
    }

    const scheme = Platform.select({
      ios: "maps:",
      android: "geo:",
    });
    const mapUrl = Platform.select({
      ios: `${scheme}?q=${latitude},${longitude}`,
      android: `${scheme}${latitude},${longitude}`,
    });

    if (mapUrl) {
      Linking.canOpenURL(mapUrl).then((supported) => {
        if (supported) {
          Linking.openURL(mapUrl);
        } else {
          // Fallback to Google Maps
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          Linking.openURL(googleMapsUrl);
        }
      });
    }
  };

  const dismissDropdowns = () => {
    setShowLocationSuggestions(false);
    setShowFrequencyDropdown(false);
    setShowFirstAlertDropdown(false);
    setShowSecondAlertDropdown(false);
  };

  // Get current frequency label
  const currentFrequencyLabel = frequencyOptions.find((o) => o.value === frequency)?.label || "Never";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View className="px-6 py-4 border-b flex-row justify-between items-center" style={{ borderBottomColor: colors.divider, backgroundColor: colors.cardBackground }}>
            <Pressable onPress={handleClose} className="py-2">
              <Text className={`${textClasses.button}`} style={{ color: primary }}>Cancel</Text>
            </Pressable>
            <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
              {editingTask ? "Edit Event" : "New Event"}
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={!title.trim()}
              className="py-2"
            >
              <Text
                className={`${textClasses.button}`}
                style={{ color: title.trim() ? primary : colors.textSecondary }}
              >
                {editingTask ? "Update" : "Add"}
              </Text>
            </Pressable>
          </View>

            <ScrollView
              className="flex-1 px-6 py-6"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              scrollIndicatorInsets={{ right: 1 }}
              contentContainerStyle={{ paddingBottom: 120 }}
              bounces={true}
              onScrollBeginDrag={dismissDropdowns}
            >
              {/* Title & Location (Apple Calendar style) */}
              <View className="mb-6 rounded-xl border overflow-visible" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Event Title"
                  className={`px-5 py-4 ${textClasses.body}`}
                  style={{ color: colors.textPrimary }}
                  placeholderTextColor={colors.textSecondary}
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
                        if (location.trim().length >= 2) {
                          setShowLocationSuggestions(true);
                        }
                      }}
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
                    <View
                      style={{ backgroundColor: colors.cardBackground, borderTopWidth: 1, borderTopColor: colors.divider }}
                    >
                      {/* Current Location option */}
                      <Pressable
                        onPress={() => {
                          setShowLocationSuggestions(false);
                          handleGetCurrentLocation();
                        }}
                        className="flex-row items-center px-5 py-3"
                        style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
                      >
                        <View
                          className="w-8 h-8 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: primaryLight }}
                        >
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
                          <View
                            className="w-8 h-8 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: colors.background }}
                          >
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

                      {/* Open in Maps if coordinates exist */}
                      {(latitude != null && longitude != null) && (
                        <Pressable
                          onPress={() => {
                            setShowLocationSuggestions(false);
                            handleOpenInMaps();
                          }}
                          className="flex-row items-center px-5 py-3"
                          style={{ borderTopWidth: 1, borderTopColor: colors.divider }}
                        >
                          <View
                            className="w-8 h-8 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: primaryLight }}
                          >
                            <Ionicons name="map" size={16} color={primary} />
                          </View>
                          <Text className={`${textClasses.body}`} style={{ color: primary }}>
                            Open in Maps
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Category */}
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Category
              </Text>
              <View className="flex-row mb-6">
                {categoryOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setCategory(option.value)}
                    className="flex-1 flex-row items-center justify-center px-4 py-3 mr-2 rounded-xl border-2"
                    style={{
                      backgroundColor: category === option.value ? primaryLight : colors.cardBackground,
                      borderColor: category === option.value ? primary : colors.border
                    }}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={category === option.value ? primary : colors.textSecondary}
                    />
                    <Text
                      className={`${textClasses.small} ml-2 ${category === option.value ? "font-semibold" : ""}`}
                      style={{ color: category === option.value ? primary : colors.textSecondary }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* All-day Toggle */}
              <View className="p-4 rounded-xl mb-6 border" style={{ backgroundColor: primaryLight, borderColor: primary }}>
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 pr-4">
                    <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                      All-day
                    </Text>
                  </View>
                  <CustomSwitch
                    value={isAllDay}
                    onValueChange={(value: boolean) => setIsAllDay(value)}
                    inactiveTrackColor={colors.divider}
                    activeTrackColor={primary}
                    activeThumbColor="#FFFFFF"
                    inactiveThumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Start Date/Time */}
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Starts
              </Text>
              <Pressable
                onPress={() => setShowStartDatePicker(!showStartDatePicker)}
                className="px-6 py-4 rounded-xl mb-2 border"
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
              >
                <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                  {startDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {!isAllDay && ` at ${formatTime(`${startTime.getHours().toString().padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")}`)}`}
                </Text>
              </Pressable>
              {showStartDatePicker && (
                <View className="mb-4 rounded-xl overflow-hidden border-2" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === "android") {
                        if (event.type === "dismissed") {
                          setShowStartDatePicker(false);
                          return;
                        }
                        if (selectedDate) {
                          setStartDate(selectedDate);
                          setEndDate(selectedDate);
                        }
                        if (!isAllDay) {
                          setShowAndroidStartTimePicker(true);
                        } else {
                          setShowStartDatePicker(false);
                        }
                        return;
                      }
                      if (selectedDate) {
                        setStartDate(selectedDate);
                        setEndDate(selectedDate);
                      }
                    }}
                    textColor={colors.textPrimary}
                    {...(Platform.OS === "ios" && { themeVariant: colors.cardBackground === "#FFFFFF" ? "light" : "dark" })}
                  />
                  {!isAllDay && Platform.OS === "ios" && (
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedTime) => {
                        if (selectedTime) setStartTime(selectedTime);
                      }}
                      textColor={colors.textPrimary}
                      themeVariant={colors.cardBackground === "#FFFFFF" ? "light" : "dark"}
                    />
                  )}
                  {Platform.OS === "ios" && (
                    <Pressable
                      onPress={() => setShowStartDatePicker(false)}
                      className="py-4"
                      style={{ backgroundColor: primary }}
                    >
                      <Text className={`${textClasses.body} text-center font-semibold`} style={{ color: onPrimary }}>
                        Done
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
              {showAndroidStartTimePicker && Platform.OS === "android" && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowAndroidStartTimePicker(false);
                    setShowStartDatePicker(false);
                    if (selectedTime && event.type !== "dismissed") {
                      setStartTime(selectedTime);
                    }
                  }}
                />
              )}

              {/* End Date/Time */}
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Ends
              </Text>
              <Pressable
                onPress={() => setShowEndDatePicker(!showEndDatePicker)}
                className="px-6 py-4 rounded-xl mb-6 border"
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
              >
                <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                  {endDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {!isAllDay && ` at ${formatTime(`${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`)}`}
                </Text>
              </Pressable>
              {showEndDatePicker && (
                <View className="mb-6 rounded-xl overflow-hidden border-2" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === "android") {
                        if (event.type === "dismissed") {
                          setShowEndDatePicker(false);
                          return;
                        }
                        if (selectedDate) setEndDate(selectedDate);
                        if (!isAllDay) {
                          setShowAndroidEndTimePicker(true);
                        } else {
                          setShowEndDatePicker(false);
                        }
                        return;
                      }
                      if (selectedDate) setEndDate(selectedDate);
                    }}
                    minimumDate={startDate}
                    textColor={colors.textPrimary}
                    {...(Platform.OS === "ios" && { themeVariant: colors.cardBackground === "#FFFFFF" ? "light" : "dark" })}
                  />
                  {!isAllDay && Platform.OS === "ios" && (
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedTime) => {
                        if (selectedTime) setEndTime(selectedTime);
                      }}
                      textColor={colors.textPrimary}
                      themeVariant={colors.cardBackground === "#FFFFFF" ? "light" : "dark"}
                    />
                  )}
                  {Platform.OS === "ios" && (
                    <Pressable
                      onPress={() => setShowEndDatePicker(false)}
                      className="py-4"
                      style={{ backgroundColor: primary }}
                    >
                      <Text className={`${textClasses.body} text-center font-semibold`} style={{ color: onPrimary }}>
                        Done
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
              {showAndroidEndTimePicker && Platform.OS === "android" && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowAndroidEndTimePicker(false);
                    setShowEndDatePicker(false);
                    if (selectedTime && event.type !== "dismissed") {
                      setEndTime(selectedTime);
                    }
                  }}
                />
              )}

              {/* Repeat/Frequency - Now as a dropdown */}
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Repeat
              </Text>
              <Pressable
                onPress={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
                className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl"
                style={{
                  backgroundColor: primaryLight,
                  borderWidth: 2,
                  borderColor: primary,
                  minHeight: 56,
                }}
              >
                <Text
                  className={`${textClasses.body} font-semibold`}
                  style={{ color: primary }}
                >
                  {currentFrequencyLabel}
                </Text>
                <Ionicons
                  name={showFrequencyDropdown ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={primary}
                />
              </Pressable>

              {showFrequencyDropdown && (
                <View
                  className="mb-4 rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderWidth: 2,
                    borderColor: primary,
                  }}
                >
                  {frequencyOptions.map((option, index) => (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setFrequency(option.value);
                        setShowFrequencyDropdown(false);
                      }}
                      className="flex-row items-center justify-between px-6 py-5"
                      style={{
                        backgroundColor:
                          frequency === option.value
                            ? primaryLight
                            : "transparent",
                        minHeight: 60,
                        borderBottomWidth: index < frequencyOptions.length - 1 ? 1 : 0,
                        borderBottomColor: colors.divider,
                      }}
                    >
                      <Text
                        className={`${textClasses.body} ${
                          frequency === option.value ? "font-semibold" : ""
                        }`}
                        style={{
                          color:
                            frequency === option.value ? primary : colors.textPrimary,
                          fontSize: 17,
                        }}
                      >
                        {option.label}
                      </Text>
                      {frequency === option.value && (
                        <Ionicons name="checkmark-circle" size={24} color={primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {!showFrequencyDropdown && <View className="mb-4" />}

              {/* Additional Times for twice-daily/three-times-daily (only if not all-day) */}
              {!isAllDay && (frequency === "twice-daily" || frequency === "three-times-daily") && (
                <View className="mb-6">
                  <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                    Daily Times
                  </Text>
                  <Text className={`${textClasses.small} mb-3`} style={{ color: colors.textSecondary }}>
                    Set the times for each daily occurrence
                  </Text>

                  {/* Time 1 (uses startTime) */}
                  <View className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                    <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                      Time 1
                    </Text>
                    <Pressable
                      onPress={() => setShowStartDatePicker(!showStartDatePicker)}
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: primaryLight }}
                    >
                      <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>
                        {formatTime(formatTimeForStorage(startTime))}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Time 2 */}
                  <View className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                    <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                      Time 2
                    </Text>
                    <Pressable
                      onPress={() => setShowTime2Picker(!showTime2Picker)}
                      className="px-4 py-2 rounded-lg"
                      style={{ backgroundColor: primaryLight }}
                    >
                      <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>
                        {formatTime(formatTimeForStorage(time2))}
                      </Text>
                    </Pressable>
                  </View>
                  {showTime2Picker && (
                    <View className="mb-4 rounded-xl overflow-hidden border-2" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                      <DateTimePicker
                        value={time2}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(event, selectedTime) => {
                          if (Platform.OS === "android") {
                            setShowTime2Picker(false);
                          }
                          if (selectedTime && event.type !== "dismissed") {
                            setTime2(selectedTime);
                          }
                        }}
                        textColor={colors.textPrimary}
                        {...(Platform.OS === "ios" && { themeVariant: colors.cardBackground === "#FFFFFF" ? "light" : "dark" })}
                      />
                      {Platform.OS === "ios" && (
                        <Pressable
                          onPress={() => setShowTime2Picker(false)}
                          className="py-4"
                          style={{ backgroundColor: primary }}
                        >
                          <Text className={`${textClasses.body} text-center font-semibold`} style={{ color: onPrimary }}>
                            Done
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* Time 3 (only for three-times-daily) */}
                  {frequency === "three-times-daily" && (
                    <>
                      <View className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl border" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                        <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                          Time 3
                        </Text>
                        <Pressable
                          onPress={() => setShowTime3Picker(!showTime3Picker)}
                          className="px-4 py-2 rounded-lg"
                          style={{ backgroundColor: primaryLight }}
                        >
                          <Text className={`${textClasses.body} font-semibold`} style={{ color: primary }}>
                            {formatTime(formatTimeForStorage(time3))}
                          </Text>
                        </Pressable>
                      </View>
                      {showTime3Picker && (
                        <View className="mb-4 rounded-xl overflow-hidden border-2" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                          <DateTimePicker
                            value={time3}
                            mode="time"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={(event, selectedTime) => {
                              if (Platform.OS === "android") {
                                setShowTime3Picker(false);
                              }
                              if (selectedTime && event.type !== "dismissed") {
                                setTime3(selectedTime);
                              }
                            }}
                            textColor={colors.textPrimary}
                            {...(Platform.OS === "ios" && { themeVariant: colors.cardBackground === "#FFFFFF" ? "light" : "dark" })}
                          />
                          {Platform.OS === "ios" && (
                            <Pressable
                              onPress={() => setShowTime3Picker(false)}
                              className="py-4"
                              style={{ backgroundColor: primary }}
                            >
                              <Text className={`${textClasses.body} text-center font-semibold`} style={{ color: onPrimary }}>
                                Done
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* Repeat Ending (only if frequency is not "once") */}
              {frequency !== "once" && (
                <View className="mb-6">
                  <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                    End Repeat
                  </Text>
                  <Pressable
                    onPress={() => setRepeatEnding("never")}
                    className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl border"
                    style={{
                      backgroundColor: repeatEnding === "never" ? primaryLight : colors.cardBackground,
                      borderColor: repeatEnding === "never" ? primary : colors.border
                    }}
                  >
                    <Text
                      className={`${textClasses.body} ${repeatEnding === "never" ? "font-semibold" : ""}`}
                      style={{ color: repeatEnding === "never" ? primary : colors.textPrimary }}
                    >
                      Never
                    </Text>
                    {repeatEnding === "never" && (
                      <Ionicons name="checkmark-circle" size={24} color={primary} />
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => setRepeatEnding("on-date")}
                    className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl border"
                    style={{
                      backgroundColor: repeatEnding === "on-date" ? primaryLight : colors.cardBackground,
                      borderColor: repeatEnding === "on-date" ? primary : colors.border
                    }}
                  >
                    <View className="flex-1">
                      <Text
                        className={`${textClasses.body} ${repeatEnding === "on-date" ? "font-semibold" : ""}`}
                        style={{ color: repeatEnding === "on-date" ? primary : colors.textPrimary }}
                      >
                        On Date
                      </Text>
                      {repeatEnding === "on-date" && (
                        <Text className={`${textClasses.small} mt-1`} style={{ color: primary }}>
                          {repeatEndDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      )}
                    </View>
                    {repeatEnding === "on-date" && (
                      <Ionicons name="checkmark-circle" size={24} color={primary} />
                    )}
                  </Pressable>

                  {repeatEnding === "on-date" && showRepeatEndDatePicker && (
                    <View className="mb-4 rounded-xl overflow-hidden border-2" style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}>
                      <DateTimePicker
                        value={repeatEndDate}
                        mode="date"
                        display={Platform.OS === "ios" ? "inline" : "default"}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === "android") {
                            setShowRepeatEndDatePicker(false);
                          }
                          if (selectedDate && event.type !== "dismissed") {
                            setRepeatEndDate(selectedDate);
                          }
                        }}
                        minimumDate={startDate}
                        textColor={colors.textPrimary}
                        {...(Platform.OS === "ios" && { themeVariant: colors.cardBackground === "#FFFFFF" ? "light" : "dark" })}
                      />
                      {Platform.OS === "ios" && (
                        <Pressable
                          onPress={() => setShowRepeatEndDatePicker(false)}
                          className="py-4"
                          style={{ backgroundColor: primary }}
                        >
                          <Text
                            className={`${textClasses.body} text-center font-semibold`}
                            style={{ color: onPrimary }}
                          >
                            Done
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {repeatEnding === "on-date" && (
                    <Pressable
                      onPress={() => setShowRepeatEndDatePicker(!showRepeatEndDatePicker)}
                      className="px-6 py-3 mb-2 rounded-xl border"
                      style={{ backgroundColor: primaryLight, borderColor: primary }}
                    >
                      <Text className={`${textClasses.small} text-center`} style={{ color: primary }}>
                        Change End Date
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => setRepeatEnding("after-count")}
                    className="flex-row items-center justify-between px-6 py-4 rounded-xl border"
                    style={{
                      backgroundColor: repeatEnding === "after-count" ? primaryLight : colors.cardBackground,
                      borderColor: repeatEnding === "after-count" ? primary : colors.border
                    }}
                  >
                    <View className="flex-1 flex-row items-center">
                      <Text
                        className={`${textClasses.body} ${repeatEnding === "after-count" ? "font-semibold" : ""} mr-3`}
                        style={{ color: repeatEnding === "after-count" ? primary : colors.textPrimary }}
                      >
                        After
                      </Text>
                      {repeatEnding === "after-count" && (
                        <TextInput
                          value={repeatCount}
                          onChangeText={setRepeatCount}
                          keyboardType="number-pad"
                          className="px-3 py-2 rounded-lg font-semibold w-16 text-center"
                          style={{ backgroundColor: colors.cardBackground, color: primary }}
                        />
                      )}
                      {repeatEnding === "after-count" && (
                        <Text className={`${textClasses.body} font-semibold ml-2`} style={{ color: primary }}>
                          occurrences
                        </Text>
                      )}
                    </View>
                    {repeatEnding === "after-count" && (
                      <Ionicons name="checkmark-circle" size={24} color={primary} />
                    )}
                  </Pressable>
                </View>
              )}

              {/* Reminder - After date/time selection */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                    Reminder
                  </Text>
                  <CustomSwitch
                    value={reminderEnabled}
                    onValueChange={(value: boolean) => setReminderEnabled(value)}
                    inactiveTrackColor={colors.divider}
                    activeTrackColor={primary}
                    activeThumbColor="#FFFFFF"
                    inactiveThumbColor="#FFFFFF"
                  />
                </View>

                {reminderEnabled && (
                  <View>
                    {/* First Alert Dropdown */}
                    <Text className={`${textClasses.small} font-semibold mb-2`} style={{ color: colors.textSecondary }}>
                      First Alert
                    </Text>
                    <Pressable
                      onPress={() => {
                        setShowFirstAlertDropdown(!showFirstAlertDropdown);
                        setShowSecondAlertDropdown(false);
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
                        {reminderOptions.find((o) => o.value === reminderMinutes)?.label || "15 minutes before"}
                      </Text>
                      <Ionicons
                        name={showFirstAlertDropdown ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={primary}
                      />
                    </Pressable>
                    {showFirstAlertDropdown && (
                      <View
                        className="mb-4 rounded-xl overflow-hidden"
                        style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}
                      >
                        {reminderOptions.map((option, index) => (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              setReminderMinutes(option.value);
                              setShowFirstAlertDropdown(false);
                            }}
                            className="flex-row items-center justify-between px-6 py-5"
                            style={{
                              backgroundColor: reminderMinutes === option.value ? primaryLight : "transparent",
                              minHeight: 60,
                              borderBottomWidth: index < reminderOptions.length - 1 ? 1 : 0,
                              borderBottomColor: colors.divider,
                            }}
                          >
                            <Text
                              className={`${textClasses.body} ${reminderMinutes === option.value ? "font-semibold" : ""}`}
                              style={{ color: reminderMinutes === option.value ? primary : colors.textPrimary, fontSize: 17 }}
                            >
                              {option.label}
                            </Text>
                            {reminderMinutes === option.value && (
                              <Ionicons name="checkmark-circle" size={24} color={primary} />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    {!showFirstAlertDropdown && <View className="mb-4" />}

                    {/* Second Alert Dropdown */}
                    <Text className={`${textClasses.small} font-semibold mb-2`} style={{ color: colors.textSecondary }}>
                      Second Alert (Optional)
                    </Text>
                    <Pressable
                      onPress={() => {
                        setShowSecondAlertDropdown(!showSecondAlertDropdown);
                        setShowFirstAlertDropdown(false);
                      }}
                      className="flex-row items-center justify-between px-6 py-4 mb-2 rounded-xl"
                      style={{
                        backgroundColor: secondReminderMinutes !== undefined ? primaryLight : colors.cardBackground,
                        borderWidth: 2,
                        borderColor: secondReminderMinutes !== undefined ? primary : colors.border,
                        minHeight: 56,
                      }}
                    >
                      <Text
                        className={`${textClasses.body} font-semibold`}
                        style={{ color: secondReminderMinutes !== undefined ? primary : colors.textSecondary }}
                      >
                        {secondReminderMinutes !== undefined
                          ? reminderOptions.find((o) => o.value === secondReminderMinutes)?.label || "None"
                          : "None"}
                      </Text>
                      <Ionicons
                        name={showSecondAlertDropdown ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={secondReminderMinutes !== undefined ? primary : colors.textSecondary}
                      />
                    </Pressable>
                    {showSecondAlertDropdown && (
                      <View
                        className="mb-4 rounded-xl overflow-hidden"
                        style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}
                      >
                        <Pressable
                          onPress={() => {
                            setSecondReminderMinutes(undefined);
                            setShowSecondAlertDropdown(false);
                          }}
                          className="flex-row items-center justify-between px-6 py-5"
                          style={{
                            backgroundColor: secondReminderMinutes === undefined ? primaryLight : "transparent",
                            minHeight: 60,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.divider,
                          }}
                        >
                          <Text
                            className={`${textClasses.body} ${secondReminderMinutes === undefined ? "font-semibold" : ""}`}
                            style={{ color: secondReminderMinutes === undefined ? primary : colors.textPrimary, fontSize: 17 }}
                          >
                            None
                          </Text>
                          {secondReminderMinutes === undefined && (
                            <Ionicons name="checkmark-circle" size={24} color={primary} />
                          )}
                        </Pressable>
                        {reminderOptions.map((option, index) => (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              setSecondReminderMinutes(option.value);
                              setShowSecondAlertDropdown(false);
                            }}
                            className="flex-row items-center justify-between px-6 py-5"
                            style={{
                              backgroundColor: secondReminderMinutes === option.value ? primaryLight : "transparent",
                              minHeight: 60,
                              borderBottomWidth: index < reminderOptions.length - 1 ? 1 : 0,
                              borderBottomColor: colors.divider,
                            }}
                          >
                            <Text
                              className={`${textClasses.body} ${secondReminderMinutes === option.value ? "font-semibold" : ""}`}
                              style={{ color: secondReminderMinutes === option.value ? primary : colors.textPrimary, fontSize: 17 }}
                            >
                              {option.label}
                            </Text>
                            {secondReminderMinutes === option.value && (
                              <Ionicons name="checkmark-circle" size={24} color={primary} />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    {!showSecondAlertDropdown && <View className="mb-2" />}

                    {/* Play Sound Toggle */}
                    <View className="flex-row justify-between items-center px-6 py-4 rounded-xl" style={{ backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border }}>
                      <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                        Play Sound
                      </Text>
                      <CustomSwitch
                        value={soundReminderEnabled}
                        onValueChange={(value: boolean) => setSoundReminderEnabled(value)}
                        inactiveTrackColor={colors.divider}
                        activeTrackColor={primary}
                        activeThumbColor="#FFFFFF"
                        inactiveThumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* URL / Video Conference Link */}
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                URL or Video Call Link
              </Text>
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="https://"
                keyboardType="url"
                autoCapitalize="none"
                className={`px-6 py-4 rounded-xl border ${textClasses.body} mb-6`}
                style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border }}
                placeholderTextColor={colors.textSecondary}
              />

              {/* Notes */}
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Notes
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`px-6 py-4 rounded-xl border ${textClasses.body} mb-6`}
                style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border }}
                placeholderTextColor={colors.textSecondary}
              />

              {/* Attendees */}
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Invitees (Optional)
              </Text>
              <TextInput
                value={attendees}
                onChangeText={setAttendees}
                placeholder="email@example.com, email2@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className={`px-6 py-4 rounded-xl border ${textClasses.body} mb-6`}
                style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border }}
                placeholderTextColor={colors.textSecondary}
              />
              <Text className={`${textClasses.small} mb-6`} style={{ color: colors.textSecondary }}>
                Separate multiple emails with commas
              </Text>
            </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
