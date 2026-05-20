import React, { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { Screen } from "../components/Screen";
import { useMedicationStore } from "../state/stores/medicationStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Medication } from "../types/app";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { commonPharmacies, searchPharmacy } from "../utils/pharmacyData";
import { fuzzyFilterStrings } from "../utils/fuzzySearch";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ExampleMedication">;
};

export default function ExampleMedicationScreen({ navigation }: Props) {
  const { colors, primary } = useTheme();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [pharmacyAddress, setPharmacyAddress] = useState("");
  const [showPharmacySuggestions, setShowPharmacySuggestions] = useState(false);

  // Medication actions from useMedicationStore
  const addMedication = useMedicationStore((s) => s.addMedication);

  time.setHours(9, 0, 0, 0);

  const pharmacySuggestions = (pharmacyName.trim().length === 0
    ? []
    : fuzzyFilterStrings(commonPharmacies, pharmacyName, 35)
  ).slice(0, 5);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handlePharmacyNameChange = (text: string) => {
    setPharmacyName(text);
    setShowPharmacySuggestions(true);
  };

  const handleSelectPharmacy = (pharmacy: string) => {
    setPharmacyName(pharmacy);
    setShowPharmacySuggestions(false);
    Keyboard.dismiss();

    // Look up pharmacy data and auto-fill phone
    const pharmacyData = searchPharmacy(pharmacy);
    if (pharmacyData?.phone) {
      setPharmacyPhone(pharmacyData.phone);
    }
    if (pharmacyData?.address) {
      setPharmacyAddress(pharmacyData.address);
    }
  };

  const handlePharmacyNameBlur = () => {
    setTimeout(() => setShowPharmacySuggestions(false), 200);
  };

  const handleContinue = () => {
    if (name.trim() && dosage.trim()) {
      const medication: Medication = {
        id: Date.now().toString(),
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: "daily",
        timeOfDay: "morning",
        specificTime: `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`,
        reminderEnabled: true,
        scheduleType: "daily",
        times: [`${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`],
        createdAt: new Date().toISOString(),
        pharmacy: pharmacyName.trim()
          ? {
              name: pharmacyName.trim(),
              phoneNumber: pharmacyPhone.trim() || undefined,
              address: pharmacyAddress.trim() || undefined,
            }
          : undefined,
      };
      addMedication(medication);
      navigation.navigate("ExampleTask");
    }
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable className="flex-1" onPress={Keyboard.dismiss}>
          <ScrollView contentContainerClassName="px-8 py-6">
            <Text style={{ color: colors.textPrimary }} className="text-3xl font-bold text-center mb-4">
              Add Your First Medication
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-lg text-center mb-8">
              You can edit or add more medications later.
            </Text>

            <Text style={{ color: colors.textPrimary }} className="text-xl font-semibold mb-2">Medication Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Lisinopril"
              style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border }}
              className="px-6 py-4 rounded-xl text-xl mb-6 border-2"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
              accessibilityLabel="Medication name"
            />

            <Text style={{ color: colors.textPrimary }} className="text-xl font-semibold mb-2">Dosage</Text>
            <TextInput
              value={dosage}
              onChangeText={setDosage}
              placeholder="10 mg"
              style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border }}
              className="px-6 py-4 rounded-xl text-xl mb-6 border-2"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
              accessibilityLabel="Dosage"
            />

            <Text style={{ color: colors.textPrimary }} className="text-xl font-semibold mb-2">Time</Text>
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
              className="px-6 py-4 rounded-xl mb-8 border-2"
              accessibilityLabel="Select time"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.textPrimary }} className="text-xl">Once daily at {formatTime(time)}</Text>
            </Pressable>

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    setTime(selectedTime);
                  }
                }}
              />
            )}

            {/* Pharmacy Section */}
            <View className="mt-4 mb-6">
              <Text style={{ color: colors.textPrimary }} className="text-2xl font-bold mb-4">
                Pharmacy Info (Optional)
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-base mb-4">
                Add your pharmacy to get refill reminders and track prescriptions.
              </Text>

              {/* Pharmacy Name with Autocomplete */}
              <Text style={{ color: colors.textPrimary }} className="text-xl font-semibold mb-2">Pharmacy Name</Text>
              <TextInput
                value={pharmacyName}
                onChangeText={handlePharmacyNameChange}
                onFocus={() => setShowPharmacySuggestions(true)}
                onBlur={handlePharmacyNameBlur}
                placeholder="e.g., CVS Pharmacy, Walgreens"
                style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border }}
                className="px-6 py-4 rounded-xl text-xl mb-2 border-2"
                placeholderTextColor={colors.textTertiary}
                returnKeyType="next"
                accessibilityLabel="Pharmacy name"
              />

              {/* Pharmacy Autocomplete Suggestions */}
              {showPharmacySuggestions && pharmacySuggestions.length > 0 && (
                <View style={{ backgroundColor: colors.cardBackground, borderColor: primary }} className="border-2 rounded-xl mb-4 shadow-lg overflow-hidden">
                  <View style={{ backgroundColor: colors.primaryLight, borderBottomColor: colors.border }} className="px-6 py-3 border-b">
                    <Text style={{ color: primary }} className="text-base font-semibold">
                      Tap to select ({pharmacySuggestions.length} pharmacies)
                    </Text>
                  </View>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    style={{ maxHeight: 200 }}
                  >
                    {pharmacySuggestions.map((pharmacy, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleSelectPharmacy(pharmacy)}
                        style={{ borderBottomColor: colors.divider }}
                        className="px-6 py-4 border-b active:opacity-50"
                      >
                        <Text style={{ color: colors.textPrimary }} className="text-lg">{pharmacy}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Pharmacy Phone */}
              <Text style={{ color: colors.textPrimary }} className="text-xl font-semibold mb-2">Pharmacy Phone</Text>
              <TextInput
                value={pharmacyPhone}
                onChangeText={setPharmacyPhone}
                placeholder="e.g., (555) 123-4567"
                keyboardType="phone-pad"
                style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border }}
                className="px-6 py-4 rounded-xl text-xl mb-6 border-2"
                placeholderTextColor={colors.textTertiary}
                returnKeyType="next"
                accessibilityLabel="Pharmacy phone number"
              />

              {/* Pharmacy Address */}
              <Text style={{ color: colors.textPrimary }} className="text-xl font-semibold mb-2">Pharmacy Address</Text>
              <TextInput
                value={pharmacyAddress}
                onChangeText={setPharmacyAddress}
                placeholder="e.g., 123 Main St, City, State"
                style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.border }}
                className="px-6 py-4 rounded-xl text-xl mb-6 border-2"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={2}
                returnKeyType="done"
                accessibilityLabel="Pharmacy address"
              />
            </View>

            <Button
              title="Continue"
              onPress={handleContinue}
              variant="primary"
              size="large"
              fullWidth
              disabled={!name.trim() || !dosage.trim()}
              accessibilityLabel="Continue"
            />
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}
