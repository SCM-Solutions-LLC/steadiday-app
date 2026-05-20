import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { Screen } from "../components/Screen";
import { useTaskStore } from "../state/stores/taskStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Task, TaskCategory, TaskFrequency } from "../types/app";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getNextFriday } from "../utils/time";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { formatTime } from "../utils/time";
import { useTheme } from "../utils/useTheme";
import { getTextSizeClasses } from "../utils/textSizes";
import CustomSwitch from "../components/CustomSwitch";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ExampleTask">;
};

export default function ExampleTaskScreen({ navigation }: Props) {
  const [title, setTitle] = useState("Doctor appointment");
  const nextFriday = new Date(getNextFriday());
  const [date, setDate] = useState(nextFriday);
  const [time, setTime] = useState(new Date());
  const [hasTime, setHasTime] = useState(true);
  const [category, setCategory] = useState<TaskCategory>("medical");
  const [frequency, setFrequency] = useState<TaskFrequency>("once");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [soundReminderEnabled, setSoundReminderEnabled] = useState(false);
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Task actions from useTaskStore
  const addTask = useTaskStore((s) => s.addTask);

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);

  const textClasses = getTextSizeClasses(textSize);
  const { primary, primaryLight, colors } = useTheme();

  time.setHours(14, 0, 0, 0);

  const getCategoryIcon = (cat: TaskCategory) => {
    switch (cat) {
      case "medical":
        return "medical";
      case "errand":
        return "cart";
      case "personal":
        return "person";
      case "other":
        return "ellipsis-horizontal-circle";
    }
  };

  const getCategoryColor = (cat: TaskCategory) => {
    switch (cat) {
      case "medical":
        return { bg: "bg-[#FFE5E5]", text: "text-critical", iconColor: "#CC3A3A" };
      case "errand":
        return { bg: `bg-[${colors.warning}15]`, text: "", iconColor: colors.warning };
      case "personal":
        return { bg: primaryLight + "20", text: "", iconColor: primary };
      case "other":
        return { bg: "bg-[#F3E8FF]", text: "text-[#9333EA]", iconColor: "#9333EA" };
    }
  };

  const getFrequencyLabel = (freq: TaskFrequency) => {
    switch (freq) {
      case "once":
        return "One time";
      case "daily":
        return "Daily";
      case "twice-daily":
        return "Twice daily";
      case "three-times-daily":
        return "Three times daily";
      case "every-other-day":
        return "Every other day";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "custom":
        return "Custom";
    }
  };

  const handleContinue = () => {
    if (title.trim()) {
      const timeStr = hasTime
        ? `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`
        : undefined;

      const task: Task = {
        id: Date.now().toString(),
        title: title.trim(),
        date: date.toISOString(),
        time: timeStr,
        category,
        frequency,
        reminderEnabled,
        notes: notes.trim() || undefined,
        completed: false,
        // Manual task defaults
        sourceSystem: "manual",
        isImported: false,
        isReadOnly: false,
        syncStatus: "unlinked",
      };
      addTask(task);
      navigation.navigate("Tutorial");
    }
  };

  const handleSkip = () => {
    // Skip adding a task and continue to the next onboarding screen
    navigation.navigate("Tutorial");
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable className="flex-1" onPress={Keyboard.dismiss}>
          <View className="flex-1">
            {/* Modal Header - matching TasksScreen */}
            <View className="px-6 py-4 border-b border-gray-200 flex-row justify-between items-center">
              <Pressable
                onPress={handleSkip}
                className="py-2"
                style={{ width: 60 }}
                accessibilityRole="button"
                accessibilityLabel="Skip adding a task"
              >
                <Text className={`${textClasses.button}`} style={{ color: colors.textSecondary }}>
                  Skip
                </Text>
              </Pressable>
              <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
                Add Your First Task
              </Text>
              <Pressable
                onPress={handleContinue}
                disabled={!title.trim()}
                className="py-2"
                style={{ width: 60 }}
                accessibilityRole="button"
                accessibilityLabel="Save task"
              >
                <Text
                  className={`${textClasses.button} text-right`}
                  style={{ color: title.trim() ? primary : colors.textTertiary }}
                >
                  Save
                </Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Doctor appointment"
                placeholderTextColor={colors.inputPlaceholder}
                className="px-6 py-4 rounded-xl text-xl mb-6"
                style={{
                  backgroundColor: colors.inputBackground,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: colors.inputBorder
                }}
                returnKeyType="done"
                accessibilityLabel="Task title"
              />

              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Category
              </Text>
              <View className="flex-row mb-6 flex-wrap">
                {(["medical", "errand", "personal", "other"] as TaskCategory[]).map((cat) => {
                  const colors = getCategoryColor(cat);
                  const isSelected = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      className={`py-4 px-4 rounded-xl items-center mb-2 mr-2 ${
                        isSelected ? colors.bg : "bg-gray-100"
                      }`}
                      style={{ width: "47%" }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                    >
                      <Ionicons
                        name={getCategoryIcon(cat)}
                        size={24}
                        color={isSelected ? colors.iconColor : "#6b7280"}
                      />
                      <Text
                        className={`${textClasses.small} mt-1 capitalize ${
                          isSelected ? colors.text : "text-gray-600"
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Frequency
              </Text>
              <View className="mb-6">
                {(["once", "daily", "twice-daily", "three-times-daily", "every-other-day", "weekly", "monthly"] as TaskFrequency[]).map((freq) => {
                  const isSelected = frequency === freq;
                  return (
                    <Pressable
                      key={freq}
                      onPress={() => setFrequency(freq)}
                      className="py-4 px-6 rounded-xl mb-2 flex-row items-center justify-between"
                      style={{
                        backgroundColor: isSelected ? colors.primaryLight : colors.inputBackground,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: isSelected ? primary : "transparent"
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                    >
                      <View className="flex-1">
                        <Text
                          className={`${textClasses.body}`}
                          style={{ color: isSelected ? colors.textPrimary : colors.textSecondary, fontWeight: isSelected ? "600" : "normal" }}
                        >
                          {getFrequencyLabel(freq)}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Reminder Toggle */}
              <View
                className="mb-6 rounded-xl p-6 border-2"
                style={{ backgroundColor: colors.primaryLight, borderColor: primary + "40" }}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-1 pr-4">
                    <Text className={`${textClasses.body} font-semibold mb-1`} style={{ color: colors.textPrimary }}>
                      Do you want a reminder for this task?
                    </Text>
                    <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                      Get notified before your task is due
                    </Text>
                  </View>
                  <CustomSwitch
                    value={reminderEnabled}
                    onValueChange={(value: boolean) => setReminderEnabled(value)}
                    inactiveTrackColor={colors.toggleTrackOff}
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

              {/* Sound Reminder Toggle */}
              {reminderEnabled && (
                <View
                  className="p-6 rounded-xl mb-6 border-2"
                  style={{ backgroundColor: colors.success + "15", borderColor: colors.success + "40" }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-1 pr-4">
                      <Text className={`${textClasses.body} font-semibold mb-1`} style={{ color: colors.textPrimary }}>
                        Play a sound with reminder?
                      </Text>
                      <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                        Helpful if you might miss the notification
                      </Text>
                    </View>
                    <CustomSwitch
                      value={soundReminderEnabled}
                      onValueChange={(value: boolean) => setSoundReminderEnabled(value)}
                      inactiveTrackColor={colors.toggleTrackOff}
                      activeTrackColor={colors.success}
                      activeThumbColor="#FFFFFF"
                      inactiveThumbColor="#FFFFFF"
                    />
                  </View>
                  {soundReminderEnabled && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="volume-high" size={16} color={colors.success} />
                      <Text className={`${textClasses.small} ml-2`} style={{ color: colors.success }}>
                        Sound alert enabled
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Date
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(!showDatePicker)}
                className="px-6 py-4 rounded-xl mb-4 border-2"
                style={{ backgroundColor: colors.primaryLight, borderColor: primary + "40" }}
                accessibilityRole="button"
                accessibilityLabel="Select date"
              >
                <View className="flex-row items-center justify-between">
                  <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                    {format(date, "EEEE, MMMM d, yyyy")}
                  </Text>
                  <Ionicons name="calendar" size={24} color={primary} />
                </View>
              </Pressable>

              {showDatePicker && (
                <View
                  className="rounded-xl p-4 mb-6 border-2"
                  style={{ backgroundColor: colors.primaryLight, borderColor: primary + "40" }}
                >
                  <View className="bg-white rounded-xl overflow-hidden">
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setDate(selectedDate);
                        }
                        setShowDatePicker(false);
                      }}
                      textColor="#111827"
                      themeVariant="light"
                    />
                  </View>
                </View>
              )}

              <View className="flex-row items-center justify-between mb-2">
                <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                  Time
                </Text>
                <Pressable
                  onPress={() => setHasTime(!hasTime)}
                  className="flex-row items-center"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hasTime }}
                >
                  <Text className={`${textClasses.small} mr-2`} style={{ color: colors.textSecondary }}>
                    {hasTime ? "Specific time" : "All day"}
                  </Text>
                  <View
                    className="w-14 h-8 rounded-full p-1"
                    style={{ backgroundColor: hasTime ? primary : colors.toggleTrackOff }}
                  >
                    <View
                      className={`w-6 h-6 rounded-full bg-white ${
                        hasTime ? "ml-auto" : ""
                      }`}
                    />
                  </View>
                </Pressable>
              </View>

              {hasTime && (
                <View
                  className="rounded-xl p-6 mb-6 border-2"
                  style={{ backgroundColor: colors.primaryLight, borderColor: primary + "40" }}
                >
                  <Text className={`${textClasses.body} text-center mb-4 font-semibold`} style={{ color: colors.textPrimary }}>
                    {formatTime(
                      `${time.getHours().toString().padStart(2, "0")}:${time
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}`
                    )}
                  </Text>
                  <View className="bg-white rounded-xl overflow-hidden">
                    <DateTimePicker
                      value={time}
                      mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, selectedTime) => {
                        if (selectedTime) {
                          setTime(selectedTime);
                        }
                      }}
                      textColor="#111827"
                      themeVariant="light"
                    />
                  </View>
                  <Text className={`${textClasses.small} text-center mt-3`} style={{ color: colors.textSecondary }}>
                    Scroll to select task time
                  </Text>
                </View>
              )}

              {!hasTime && <View className="mb-6" />}

              <Text className={`${textClasses.body} font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Notes (Optional)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional details"
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="px-6 py-4 rounded-xl text-lg min-h-[100px] mb-8"
                style={{
                  backgroundColor: colors.inputBackground,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: colors.inputBorder
                }}
                accessibilityLabel="Task notes"
              />
            </ScrollView>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}
