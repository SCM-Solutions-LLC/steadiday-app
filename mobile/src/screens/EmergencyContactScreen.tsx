import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { Screen } from "../components/Screen";
import { useUserStore } from "../state/stores/userStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { EmergencyContact } from "../types/app";
import { formatPhoneNumber } from "../utils/phoneFormatter";
import { Ionicons } from "@expo/vector-icons";
import ContactImportModal from "../components/ContactImportModal";
import { PhoneContact } from "../utils/contactImporter";
import { SessionManager } from "../utils/sessionManager";
import { useTheme } from "../utils/useTheme";
import { useSettingsStore } from "../state/stores/settingsStore";
import { getTextSizeClasses } from "../utils/textSizes";
import { useSlowMode } from "../utils/useSlowMode";
import { BackButton } from "../components/ui";
import { useConfirmModal } from "../components/ConfirmModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "EmergencyContact">;
};

interface ContactRow {
  id: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
  imageUri?: string;
}

// Storage key for tracking trusted contacts onboarding completion
const TRUSTED_CONTACTS_ONBOARDING_KEY = "hasCompletedTrustedContactsOnboarding";

export default function EmergencyContactScreen({ navigation }: Props) {
  const [contactRows, setContactRows] = useState<ContactRow[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [attemptedContinue, setAttemptedContinue] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { primaryButtonHeight, minTouchTarget } = useSlowMode();
  const { alert, confirm } = useConfirmModal();

  // User data from useUserStore
  const existingContacts = useUserStore((s) => s.userProfile.emergencyContacts);
  const addEmergencyContact = useUserStore((s) => s.addEmergencyContact);
  const updateEmergencyContact = useUserStore((s) => s.updateEmergencyContact);
  const setPrimaryContact = useUserStore((s) => s.setPrimaryContact);
  const clearEmergencyContacts = useUserStore((s) => s.clearEmergencyContacts);

  // Initialize with one empty row for new users - always start fresh during onboarding
  useEffect(() => {
    // Clear any existing contacts from previous sessions to start fresh
    clearEmergencyContacts();

    // Start with one empty row for manual entry (no prefilled data)
    setContactRows([
      {
        id: `temp-${Date.now()}`,
        name: "",
        relationship: "",
        phoneNumber: "",
        isPrimary: true,
        imageUri: undefined,
      },
    ]);
  }, []);

  const handlePhoneNumberChange = (text: string, rowId: string) => {
    const formatted = formatPhoneNumber(text);
    setContactRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, phoneNumber: formatted } : row
      )
    );
  };

  const handleFieldChange = (
    rowId: string,
    field: "name" | "relationship",
    value: string
  ) => {
    setContactRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSetPrimary = (rowId: string) => {
    SessionManager.updateActivity();
    setContactRows((prev) =>
      prev.map((row) => ({ ...row, isPrimary: row.id === rowId }))
    );
  };

  const handleAddAnotherContact = () => {
    SessionManager.updateActivity();
    setContactRows((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        name: "",
        relationship: "",
        phoneNumber: "",
        isPrimary: false,
        imageUri: undefined,
      },
    ]);
  };

  const handleRemoveContact = (rowId: string) => {
    SessionManager.updateActivity();
    if (contactRows.length === 1) {
      alert(
        "Cannot Remove",
        "You must have at least one trusted contact. If you want to clear this contact, leave the fields empty and add a new one."
      );
      return;
    }

    const updatedRows = contactRows.filter((row) => row.id !== rowId);

    // If we removed the primary contact, make the first remaining contact primary
    const hasPrimary = updatedRows.some((row) => row.isPrimary);
    if (!hasPrimary && updatedRows.length > 0) {
      updatedRows[0].isPrimary = true;
    }

    setContactRows(updatedRows);
  };

  const handleImportContacts = (
    contacts: Array<{
      contact: PhoneContact;
      type: "favorite" | "emergency";
      relationship?: string;
    }>
  ) => {
    SessionManager.updateActivity();
    const emergencyContactsToAdd = contacts.filter((c) => c.type === "emergency");

    if (emergencyContactsToAdd.length === 0) {
      return;
    }

    const newRows: ContactRow[] = emergencyContactsToAdd.map((item) => ({
      id: `imported-${Date.now()}-${Math.random().toString().substring(2)}`,
      name: item.contact.name,
      relationship: item.relationship || "Contact",
      phoneNumber: item.contact.phoneNumber,
      isPrimary: false,
      imageUri: item.contact.imageUri,
    }));

    setContactRows((prev) => {
      // If all existing rows are empty, replace them
      const hasContent = prev.some(
        (row) => row.name.trim() || row.phoneNumber.trim()
      );

      if (!hasContent) {
        // Replace empty rows with imported contacts
        newRows[0].isPrimary = true;
        return newRows;
      } else {
        // Add imported contacts to existing ones
        return [...prev, ...newRows];
      }
    });
  };

  const handleContinue = () => {
    SessionManager.updateActivity();
    setAttemptedContinue(true);

    // Filter out empty rows
    const validRows = contactRows.filter(
      (row) => row.name.trim() && row.phoneNumber.trim()
    );

    if (validRows.length === 0) {
      setValidationError("Please add at least one trusted contact with a name and phone number.");
      return;
    }

    // Validate phone numbers
    const invalidPhoneRow = validRows.find(row => row.phoneNumber.replace(/\D/g, "").length < 10);
    if (invalidPhoneRow) {
      setValidationError("Please enter a valid phone number with at least 10 digits.");
      return;
    }

    // Ensure exactly one contact is primary
    let hasPrimary = validRows.some((row) => row.isPrimary);
    if (!hasPrimary) {
      validRows[0].isPrimary = true;
      hasPrimary = true;
    }

    // Check for duplicate phone numbers
    const phoneNumbers = validRows.map((row) => row.phoneNumber);
    const uniquePhoneNumbers = new Set(phoneNumbers);
    if (phoneNumbers.length !== uniquePhoneNumbers.size) {
      setValidationError("Please ensure each trusted contact has a unique phone number.");
      return;
    }

    // Clear any validation errors
    setValidationError(null);

    // Save contacts to store
    validRows.forEach((row) => {
      // Check if this contact already exists in the store
      const existingContact = existingContacts.find(
        (c) => c.id === row.id || c.phoneNumber === row.phoneNumber
      );

      if (existingContact) {
        // Update existing contact
        updateEmergencyContact(existingContact.id, {
          name: row.name.trim(),
          relationship: row.relationship.trim() || "Trusted Contact",
          phoneNumber: row.phoneNumber.trim(),
          imageUri: row.imageUri,
        });

        // Update primary status if needed
        if (row.isPrimary) {
          setPrimaryContact(existingContact.id);
        }
      } else {
        // Add new contact
        const newContact: EmergencyContact = {
          id: row.id.startsWith("temp-") || row.id.startsWith("imported-")
            ? `contact-${Date.now()}-${Math.random().toString().substring(2)}`
            : row.id,
          name: row.name.trim(),
          relationship: row.relationship.trim() || "Trusted Contact",
          phoneNumber: row.phoneNumber.trim(),
          isPrimary: row.isPrimary,
          isEmergencyContact: true,
          imageUri: row.imageUri,
        };
        addEmergencyContact(newContact);
      }
    });

    // Ensure the primary contact is set correctly in the store
    const primaryRow = validRows.find((row) => row.isPrimary);
    if (primaryRow) {
      const primaryInStore = existingContacts.find(
        (c) => c.phoneNumber === primaryRow.phoneNumber
      );
      if (primaryInStore) {
        setPrimaryContact(primaryInStore.id);
      }
    }

    navigation.navigate("AllSet");
  };

  // Handle skip button - show warning first
  const handleSkipPress = () => {
    setShowSkipWarning(true);
  };

  // Handle confirming skip after warning
  const handleSkipConfirm = async () => {
    // Mark as completed (even though skipped) so we know they saw the screen
    await AsyncStorage.setItem(TRUSTED_CONTACTS_ONBOARDING_KEY, "true");
    navigation.navigate("AllSet");
  };

  // Check if continue button should be enabled
  const hasValidContact = contactRows.some(
    (row) => row.name.trim() && row.phoneNumber.trim()
  );

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 40, paddingVertical: 32 }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={Keyboard.dismiss}>
            {/* Back Button */}
            <BackButton label="Back" style={{ marginBottom: 16 }} />

            <Text style={{ color: colors.textPrimary }} className={`${textClasses.largeTitle} text-center mb-4`}>
              Add Your Trusted Contacts
            </Text>
            <Text style={{ color: colors.textSecondary }} className={`${textClasses.subtitle} text-center mb-4 leading-relaxed`}>
              These people can be quickly contacted in an emergency
            </Text>

            {/* Tip Card */}
            <View style={{ backgroundColor: colors.warningBackground, borderColor: colors.warning }} className="border rounded-xl p-4 mb-4">
              <View className="flex-row items-center">
                <Ionicons name="bulb" size={22} color={colors.warning} />
                <Text style={{ color: colors.onWarning }} className={`${textClasses.body} font-medium ml-2 flex-1`}>
                  We recommend adding 2-3 trusted contacts for emergencies.
                </Text>
              </View>
            </View>

            {/* Inline Validation Error */}
            {validationError && attemptedContinue && (
              <View style={{ backgroundColor: colors.errorBackground, borderColor: colors.error }} className="border rounded-xl p-4 mb-4">
                <View className="flex-row items-start">
                  <Ionicons name="alert-circle" size={22} color={colors.error} />
                  <Text style={{ color: colors.error }} className={`${textClasses.body} font-medium ml-2 flex-1`}>
                    {validationError}
                  </Text>
                </View>
              </View>
            )}

            {/* SOS Usage Note */}
            <View style={{ backgroundColor: colors.primaryLight, borderColor: colors.warning }} className="border-2 rounded-2xl p-6 mb-8">
              <View className="flex-row items-center mb-3">
                <Ionicons name="alert-circle" size={28} color={colors.warning} />
                <Text style={{ color: colors.textPrimary }} className={`${textClasses.subtitle} ml-3`}>Important</Text>
              </View>
              <Text style={{ color: colors.textSecondary }} className={`${textClasses.body} leading-relaxed`}>
                These contacts will be notified when you press the SOS button. Choose one as your primary SOS contact.
              </Text>
            </View>

            {/* Import Contacts Button */}
            <Pressable
              onPress={() => {
                SessionManager.updateActivity();
                setShowImportModal(true);
              }}
              style={{ backgroundColor: colors.cardBackground, borderColor: primary }}
              className="border-2 rounded-2xl px-6 py-5 mb-2 items-center justify-center active:opacity-80"
            >
              <Ionicons name="people" size={28} color={primary} />
              <Text style={{ color: primary }} className={`${textClasses.subtitle} mt-2 text-center`}>
                {"Choose from Your Phone's Contacts"}
              </Text>
            </Pressable>
            <Text style={{ color: colors.textSecondary }} className={`${textClasses.body} text-center mb-8 px-2 leading-relaxed`}>
              Pick people you already have saved in your phone. You can add multiple contacts at once.
            </Text>

            {/* Contact Rows */}
            {contactRows.map((row, index) => (
              <View
                key={row.id}
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
                className="rounded-3xl p-6 mb-6 border-2"
              >
                {/* Header Row with Contact Number and Remove Button */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text style={{ color: colors.textPrimary }} className={`${textClasses.title} `}>
                    Contact {index + 1}
                  </Text>
                  {/* Remove Button */}
                  {contactRows.length > 1 && (
                    <Pressable
                      onPress={() => handleRemoveContact(row.id)}
                      className="p-2 active:opacity-60"
                    >
                      <Ionicons name="close-circle" size={28} color={colors.error} />
                    </Pressable>
                  )}
                </View>

                {/* Primary for SOS Toggle - Separate Row */}
                <Pressable
                  onPress={() => handleSetPrimary(row.id)}
                  style={{ backgroundColor: colors.background }}
                  className="flex-row items-center mb-6 p-3 rounded-2xl"
                >
                  <View
                    style={{
                      borderColor: row.isPrimary ? primary : colors.border,
                      backgroundColor: row.isPrimary ? primary : "transparent",
                    }}
                    className="w-7 h-7 rounded-full border-2 mr-3 items-center justify-center flex-shrink-0"
                  >
                    {row.isPrimary && (
                      <Ionicons name="checkmark" size={18} color="white" />
                    )}
                  </View>
                  <Text style={{ color: colors.textSecondary }} className={`${textClasses.body} flex-1 flex-wrap`}>
                    Primary for SOS
                  </Text>
                </Pressable>

                <Text style={{ color: colors.textPrimary }} className={`${textClasses.body} font-semibold mb-2`}>
                  Name *
                </Text>
                <TextInput
                  value={row.name}
                  onChangeText={(text) => handleFieldChange(row.id, "name", text)}
                  placeholder="Enter name"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  }}
                  className={`px-5 py-4 rounded-2xl ${textClasses.body} mb-4 border`}
                  returnKeyType="next"
                />

                <Text style={{ color: colors.textPrimary }} className={`${textClasses.body} font-semibold mb-2`}>
                  Relationship
                </Text>
                <TextInput
                  value={row.relationship}
                  onChangeText={(text) =>
                    handleFieldChange(row.id, "relationship", text)
                  }
                  placeholder="e.g., Daughter, Friend"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  }}
                  className={`px-5 py-4 rounded-2xl ${textClasses.body} mb-4 border`}
                  returnKeyType="next"
                />

                <Text style={{ color: colors.textPrimary }} className={`${textClasses.body} font-semibold mb-2`}>
                  Phone Number *
                </Text>
                <TextInput
                  value={row.phoneNumber}
                  onChangeText={(text) => handlePhoneNumberChange(text, row.id)}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  }}
                  className={`px-5 py-4 rounded-2xl ${textClasses.body} border`}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  maxLength={14}
                />
              </View>
            ))}

            {/* Add More Button - shown only if there are existing contacts */}
            {contactRows.length > 0 && contactRows.some(row => row.name.trim() || row.phoneNumber.trim()) && (
              <Pressable
                onPress={handleAddAnotherContact}
                style={{ borderColor: colors.success }}
                className="border-2 rounded-2xl px-6 py-4 mb-6 flex-row items-center justify-center active:opacity-80"
              >
                <Ionicons name="add-circle" size={24} color={colors.success} />
                <Text style={{ color: colors.success }} className={`${textClasses.button} ml-2`}>
                  Add Another Contact
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleContinue}
              disabled={!hasValidContact}
              style={{
                backgroundColor: hasValidContact ? primary : colors.textTertiary,
                minHeight: primaryButtonHeight,
              }}
              className="px-14 py-6 rounded-2xl items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <Text
                style={{
                  color: hasValidContact ? "white" : colors.textTertiary,
                }}
                className={`${textClasses.title}`}
              >
                Continue
              </Text>
            </Pressable>

            {/* Skip for now link */}
            {!showSkipWarning && (
              <Pressable
                onPress={handleSkipPress}
                className="mt-6 py-4 items-center"
                accessibilityRole="button"
                accessibilityLabel="Skip for now"
              >
                <Text style={{ color: colors.textSecondary }} className={`${textClasses.body} underline`}>
                  Skip for now
                </Text>
              </Pressable>
            )}

            {/* Skip Warning Message */}
            {showSkipWarning && (
              <View style={{ backgroundColor: colors.warningBackground, borderColor: colors.warning }} className="mt-6 rounded-2xl p-5 border-2">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="warning" size={24} color={colors.warning} />
                  <Text style={{ color: colors.onWarning }} className={`${textClasses.subtitle} ml-2`}>
                    Important Reminder
                  </Text>
                </View>
                <Text style={{ color: colors.onWarning }} className={`${textClasses.body} leading-relaxed mb-4`}>
                  Without trusted contacts, the SOS button will not be able to alert anyone in an emergency. You can always add contacts later in Settings.
                </Text>
                <View className="flex-row" style={{ gap: 12 }}>
                  <Pressable
                    onPress={() => setShowSkipWarning(false)}
                    style={{ backgroundColor: primary }}
                    className="flex-1 py-4 rounded-xl items-center active:opacity-80"
                    accessibilityRole="button"
                  >
                    <Text className={`text-white ${textClasses.button}`}>Add Contact</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSkipConfirm}
                    style={{ backgroundColor: colors.cardBackground, borderColor: colors.border, minHeight: minTouchTarget }}
                    className="flex-1 py-4 rounded-xl items-center border-2 active:opacity-80"
                    accessibilityRole="button"
                  >
                    <Text style={{ color: colors.textSecondary }} className={textClasses.button}>Skip Anyway</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Contact Import Modal */}
      <ContactImportModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportContacts={handleImportContacts}
        mode="emergency"
      />
    </Screen>
  );
}
