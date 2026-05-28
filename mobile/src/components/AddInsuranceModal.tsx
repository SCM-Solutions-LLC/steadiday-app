import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INSURANCE_SCAN_COUNT_KEY = "insurance_scan_count";
const INSURANCE_SCAN_GUIDANCE_THRESHOLD = 3;
import { Ionicons } from "@expo/vector-icons";
import { useHealthStore } from "../state/stores/healthStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { InsuranceCard } from "../types/app";
import { getTextSizeClasses } from "../utils/textSizes";
import { useTheme } from "../utils/useTheme";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { extractInsuranceData } from "../utils/insuranceOcr";
import { commonInsuranceProviders } from "../utils/insuranceData";
import { extractInsuranceFromPhoto, hasAnyExtractedField } from "../api/vision";
import * as FileSystem from 'expo-file-system/legacy';
import { fuzzyFilterStrings } from "../utils/fuzzySearch";
import { useConfirmModal } from "./ConfirmModal";
import { logger } from "../utils/logger";
import { DismissableInfoBox } from "./ui";

interface AddInsuranceModalProps {
  visible: boolean;
  onClose: () => void;
  editingCard?: InsuranceCard;
}

export default function AddInsuranceModal({ visible, onClose, editingCard }: AddInsuranceModalProps) {
  const { primary, primaryDark, onPrimary, isDark, colors } = useTheme();
  const addInsuranceCard = useHealthStore((s) => s.addInsuranceCard);
  const updateInsuranceCard = useHealthStore((s) => s.updateInsuranceCard);
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const { alert } = useConfirmModal();

  const [type, setType] = useState<InsuranceCard["type"]>("health");
  const [providerName, setProviderName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [groupNumber, setGroupNumber] = useState("");
  const [policyHolder, setPolicyHolder] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [showProviderSuggestions, setShowProviderSuggestions] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showCameraInstructions, setShowCameraInstructions] = useState(true);
  const [showScanGuidance, setShowScanGuidance] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (visible && editingCard) {
      setType(editingCard.type);
      setProviderName(editingCard.providerName);
      setMemberId(editingCard.memberId);
      setGroupNumber(editingCard.groupNumber || "");
      setPolicyHolder(editingCard.policyHolder);
      setPhoneNumber(editingCard.phoneNumber || "");
      setNotes(editingCard.notes || "");
      // photoUri is not persisted, so we don't load it
      setPhotoUri(undefined);
    } else if (visible && !editingCard) {
      // Reset form for new card
      setType("health");
      setProviderName("");
      setMemberId("");
      setGroupNumber("");
      setPolicyHolder("");
      setPhoneNumber("");
      setNotes("");
      setPhotoUri(undefined);
      setShowProviderSuggestions(false);
    }
  }, [visible, editingCard]);

  // Filter provider suggestions with fuzzy search - handles typos
  const providerSuggestions = providerName.trim().length === 0
    ? commonInsuranceProviders
    : fuzzyFilterStrings(commonInsuranceProviders, providerName, 35);

  // Check if form has unsaved changes
  const hasUnsavedChanges = Boolean(providerName.trim() || memberId.trim());

  const handleSave = () => {
    if (!providerName.trim() || !memberId.trim() || !policyHolder.trim()) {
      return;
    }

    const cardData: Partial<InsuranceCard> = {
      type,
      providerName: providerName.trim(),
      memberId: memberId.trim(),
      groupNumber: groupNumber.trim() || undefined,
      policyHolder: policyHolder.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      // Note: photoUri is intentionally not saved for privacy/security
    };

    if (editingCard) {
      updateInsuranceCard(editingCard.id, cardData);
    } else {
      const newCard: InsuranceCard = {
        id: Date.now().toString(),
        ...cardData,
        createdAt: new Date().toISOString(),
      } as InsuranceCard;
      addInsuranceCard(newCard);
    }

    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !editingCard) {
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

  const openCameraView = async () => {
    if (!cameraPermission) {
      await requestCameraPermission();
      return;
    }

    if (!cameraPermission.granted) {
      await requestCameraPermission();
      return;
    }

    setShowCameraInstructions(true); // Reset instructions when opening camera
    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    try {
      const countStr = await AsyncStorage.getItem(INSURANCE_SCAN_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) || 0 : 0;
      await AsyncStorage.setItem(INSURANCE_SCAN_COUNT_KEY, String(count + 1));
      if (count < INSURANCE_SCAN_GUIDANCE_THRESHOLD) {
        setShowScanGuidance(true);
        return;
      }
    } catch {
      // If storage fails, just proceed
    }
    await openCameraView();
  };

  const handleConfirmScanGuidance = async () => {
    setShowScanGuidance(false);
    await openCameraView();
  };

  const handleSkipScanGuidance = async () => {
    try {
      await AsyncStorage.setItem(
        INSURANCE_SCAN_COUNT_KEY,
        String(INSURANCE_SCAN_GUIDANCE_THRESHOLD)
      );
    } catch {
      // ignore
    }
    setShowScanGuidance(false);
    await openCameraView();
  };

  const handleCapturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        setPhotoUri(photo.uri);
        setShowCamera(false);

        // Process OCR
        await processOcr(photo.uri);
      } catch (error) {
        logger.error("Error taking photo:", error);
      }
    }
  };

  const handleChooseFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);

      // Process OCR
      await processOcr(result.assets[0].uri);
    }
  };

  const processOcr = async (imageUri: string) => {
    setIsProcessingOcr(true);
    try {
      // Caller (this component) manages the source URI lifecycle and deletes
      // it in the finally block below, so we tell the extractor to skip it.
      // The Vision extractor owns deletion of imageUri (its `finally` block
       // always runs). The modal's own finally below clears the preview state
       // and idempotent-deletes the same file as a defensive second pass.
      const data = await extractInsuranceFromPhoto(imageUri);

      if (!hasAnyExtractedField(data)) {
        // Last-resort fallback to legacy on-device OCR
        try {
          const extracted = await extractInsuranceData(imageUri);
          if (extracted.providerName) setProviderName(extracted.providerName);
          if (extracted.memberId) setMemberId(extracted.memberId);
          if (extracted.groupNumber) setGroupNumber(extracted.groupNumber);
          if (extracted.policyHolder) setPolicyHolder(extracted.policyHolder);

          const fallbackUseful = extracted.providerName || extracted.memberId || extracted.groupNumber || extracted.policyHolder;
          alert(
            fallbackUseful ? "Card Information Detected" : "Unable to Read Card",
            fallbackUseful
              ? "Insurance card fields have been filled. Please review and adjust as needed."
              : "We couldn't read this card clearly. You can fill in the details manually."
          );
        } catch (fallbackError) {
          logger.error("Fallback OCR also failed:", fallbackError);
          alert(
            "Unable to Read Card",
            "We couldn't read this card clearly. You can fill in the details manually."
          );
        }
      } else {
        // Apply only non-null values. Never write the string "null".
        if (data.insurance_company) setProviderName(data.insurance_company);
        else if (data.plan_name) setProviderName(data.plan_name);
        if (data.member_id) setMemberId(data.member_id);
        if (data.group_number) setGroupNumber(data.group_number);
        if (data.member_name) setPolicyHolder(data.member_name);

        alert(
          "Card Information Detected",
          "We filled in what we could read. Please review the details and tap Save when they look right."
        );
      }
    } catch (error) {
      logger.error("OCR processing error:", error);
      alert(
        "Auto-Fill Not Available",
        "Could not automatically detect card information. Please enter the details manually."
      );
    } finally {
      // PRIVACY: Immediately delete the temporary photo after OCR processing
      // The photo is only used to extract text and is never stored
      try {
        // Clear the photo URI from state (this was only for preview)
        setPhotoUri(undefined);

        // Delete the temporary file if it exists and is not from the photo library
        // Files from ImagePicker camera start with "file://"
        if (imageUri && imageUri.startsWith("file://")) {
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(imageUri, { idempotent: true });
          }
        }
      } catch (deleteError) {
        // Silently fail - file might already be cleaned up
      }

      setIsProcessingOcr(false);
    }
  };

  const getInsuranceTypeLabel = (t: InsuranceCard["type"]) => {
    switch (t) {
      case "health":
        return "Health Insurance";
      case "dental":
        return "Dental Insurance";
      case "vision":
        return "Vision Insurance";
    }
  };

  const isFormValid = providerName.trim() && memberId.trim() && policyHolder.trim();

  if (showCamera) {
    return (
      <Modal visible={true} animationType="slide">
        <View className="flex-1 bg-black">
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" enableTorch={flashEnabled}>
            {/* Camera Controls Overlay */}
            <View className="absolute top-0 left-0 right-0 bottom-0 z-10">
              {/* Top Bar */}
              <View className="bg-black/50 px-6 py-4 pt-14">
                <View className="flex-row justify-between items-center">
                  <Pressable
                    onPress={() => setShowCamera(false)}
                    className="self-start"
                    accessibilityRole="button"
                    accessibilityLabel="Close camera"
                  >
                    <Ionicons name="close" size={32} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={() => setFlashEnabled(!flashEnabled)}
                    className="bg-white/20 rounded-full p-3 active:bg-white/30"
                    accessibilityRole="button"
                    accessibilityLabel={flashEnabled ? "Turn flash off" : "Turn flash on"}
                  >
                    <Ionicons
                      name={flashEnabled ? "flash" : "flash-off"}
                      size={28}
                      color="white"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Center Instructions - Dismissable */}
              {showCameraInstructions && (
                <View className="absolute top-1/4 left-0 right-0 px-6">
                  <View className="rounded-2xl px-6 py-5 shadow-lg" style={{ backgroundColor: primary + "E6" }}>
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-xl font-bold flex-1" style={{ color: onPrimary }}>
                        How to Take a Good Photo
                      </Text>
                      <Pressable
                        onPress={() => setShowCameraInstructions(false)}
                        className="rounded-full p-2 ml-2"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                        accessibilityRole="button"
                        accessibilityLabel="Dismiss instructions"
                      >
                        <Ionicons name="close" size={20} color={onPrimary} />
                      </Pressable>
                    </View>
                    <View className="space-y-2">
                      <View className="flex-row items-start mb-2">
                        <Ionicons name="checkmark-circle" size={20} color={onPrimary} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text className="text-base flex-1" style={{ color: onPrimary }}>
                          Place card on a flat, solid-colored surface
                        </Text>
                      </View>
                      <View className="flex-row items-start mb-2">
                        <Ionicons name="checkmark-circle" size={20} color={onPrimary} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text className="text-base flex-1" style={{ color: onPrimary }}>
                          Ensure all text is clearly visible and in focus
                        </Text>
                      </View>
                      <View className="flex-row items-start mb-2">
                        <Ionicons name="checkmark-circle" size={20} color={onPrimary} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text className="text-base flex-1" style={{ color: onPrimary }}>
                          Use flash if needed for better lighting
                        </Text>
                      </View>
                      <View className="flex-row items-start">
                        <Ionicons name="checkmark-circle" size={20} color={onPrimary} style={{ marginRight: 8, marginTop: 2 }} />
                        <Text className="text-base flex-1" style={{ color: onPrimary }}>
                          Avoid shadows and glare on the card
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Show Instructions Button (when dismissed) */}
              {!showCameraInstructions && (
                <View className="absolute top-32 right-6">
                  <Pressable
                    onPress={() => setShowCameraInstructions(true)}
                    className="rounded-full p-3"
                    style={{ backgroundColor: primary + "E6" }}
                    accessibilityRole="button"
                    accessibilityLabel="Show instructions"
                  >
                    <Ionicons name="help-circle" size={28} color={onPrimary} />
                  </Pressable>
                </View>
              )}

              {/* Bottom Bar */}
              <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-6 py-8 pb-12">
                <View className="flex-row justify-center items-center mb-4">
                  <Pressable
                    onPress={handleChooseFromGallery}
                    className="absolute left-0 bg-white/20 rounded-full p-4 active:bg-white/30"
                    accessibilityRole="button"
                    accessibilityLabel="Choose from gallery"
                  >
                    <Ionicons name="images" size={28} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={handleCapturePhoto}
                    className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 active:bg-gray-200"
                    accessibilityRole="button"
                    accessibilityLabel="Take photo"
                  />
                </View>
                <Text className="text-white text-center text-base font-medium">
                  Position card in frame and tap to capture
                </Text>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          {/* Header */}
          <View className="px-6 py-4 pt-14" style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
            <View className="flex-row justify-between items-center">
              <Pressable
                onPress={handleClose}
                className="p-2 rounded-full"
                style={{ backgroundColor: "transparent" }}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </Pressable>
              <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
                {editingCard ? "Edit Insurance Card" : "Add Insurance Card"}
              </Text>
              <Pressable
                onPress={handleSave}
                disabled={!isFormValid}
                className="px-5 py-2 rounded-xl"
                style={{ backgroundColor: isFormValid ? primary : colors.divider }}
                accessibilityRole="button"
                accessibilityLabel="Save insurance card"
              >
                <Text className={`${textClasses.button}`} style={{ color: isFormValid ? onPrimary : colors.textSecondary }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>

          {/* OCR Processing Overlay */}
          {isProcessingOcr && (
            <View className="absolute inset-0 justify-center items-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <View className="rounded-3xl p-8 items-center" style={{ backgroundColor: colors.cardBackground }}>
                <ActivityIndicator size="large" color={primary} />
                <Text className="text-xl font-semibold mt-4 text-center" style={{ color: colors.textPrimary }}>
                  Detecting Card Information...
                </Text>
                <Text className="text-base mt-2 text-center" style={{ color: colors.textSecondary }}>
                  Please wait while we extract the details
                </Text>
              </View>
            </View>
          )}

          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 py-6">
              {/* Insurance Type Selection */}
              <Text className={`text-lg font-semibold mb-3`} style={{ color: colors.textPrimary }}>
                Insurance Type
              </Text>
              <View className="mb-6">
                {(["health", "dental", "vision"] as InsuranceCard["type"][]).map((t) => {
                  const isSelected = type === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setType(t)}
                      className="py-4 px-6 rounded-xl mb-2 flex-row items-center justify-between"
                      style={{
                        backgroundColor: isSelected ? colors.primaryLight : (isDark ? "#1F2937" : "#F3F4F6"),
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: isSelected ? primary : "transparent",
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${getInsuranceTypeLabel(t)}`}
                    >
                      <Text
                        className={`${textClasses.body} ${isSelected ? "font-semibold" : ""}`}
                        style={{ color: isSelected ? colors.textPrimary : colors.textSecondary }}
                      >
                        {getInsuranceTypeLabel(t)}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={24} color={primary} />}
                    </Pressable>
                  );
                })}
              </View>

              {/* Photo Section */}
              <Text className={`text-lg font-semibold mb-3`} style={{ color: colors.textPrimary }}>
                Card Photo (Optional)
              </Text>

              {/* Privacy Reassurance for Seniors - Dismissable */}
              <DismissableInfoBox
                id="add-insurance-privacy"
                icon="shield-checkmark"
                iconColor={colors.success}
                lightBgColor={colors.successBackground}
                darkBgColor={colors.cardBackground}
                lightBorderColor={colors.success + "60"}
                darkBorderColor={colors.border}
                title="Your Privacy"
                message="The photo is only used to read your card and fill in the form below. The app removes the image right after and only keeps the typed details."
              />

              <View className="mb-6">
                {photoUri ? (
                  <View>
                    <Image
                      source={{ uri: photoUri }}
                      className="w-full h-48 rounded-xl mb-3"
                      resizeMode="contain"
                    />
                    <View className="flex-row space-x-2">
                      <Pressable
                        onPress={handleTakePhoto}
                        className="flex-1 py-4 rounded-xl flex-row items-center justify-center mr-2"
                        style={{ backgroundColor: primary }}
                        accessibilityRole="button"
                        accessibilityLabel="Retake photo"
                      >
                        <Ionicons name="camera" size={20} color={onPrimary} />
                        <Text className={`${textClasses.button} ml-2`} style={{ color: onPrimary }}>Retake</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setPhotoUri(undefined)}
                        className="flex-1 py-4 rounded-xl flex-row items-center justify-center"
                        style={{ backgroundColor: colors.error || "#DC2626" }}
                        accessibilityRole="button"
                        accessibilityLabel="Remove photo"
                      >
                        <Ionicons name="trash-outline" size={20} color={onPrimary} />
                        <Text className={`${textClasses.button} ml-2`} style={{ color: onPrimary }}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <View className="flex-row space-x-2">
                      <Pressable
                        onPress={handleTakePhoto}
                        className="flex-1 rounded-xl flex-row items-center justify-center mr-2"
                        style={{ minHeight: 64, paddingVertical: 16, paddingHorizontal: 24, backgroundColor: primary }}
                        accessibilityRole="button"
                        accessibilityLabel="Scan Insurance Card"
                      >
                        <Ionicons name="camera" size={28} color={onPrimary} />
                        <Text className={`${textClasses.button} ml-2 font-bold`} style={{ color: onPrimary }}>Scan Insurance Card</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleChooseFromGallery}
                        className="rounded-xl flex-row items-center justify-center"
                        style={{ minHeight: 64, paddingVertical: 16, paddingHorizontal: 20, backgroundColor: colors.textSecondary }}
                        accessibilityRole="button"
                        accessibilityLabel="Choose from gallery"
                      >
                        <Ionicons name="images" size={28} color={onPrimary} />
                      </Pressable>
                    </View>
                    <Text
                      className={`${textClasses.small} mt-3`}
                      style={{ color: colors.textSecondary, lineHeight: 20 }}
                    >
                      Take a photo of your insurance card. Hold it steady in good lighting for best results.
                    </Text>
                  </>
                )}
              </View>

              {/* Provider Name with Autocomplete */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Insurance Provider *
              </Text>
              <TextInput
                value={providerName}
                onChangeText={(text) => {
                  setProviderName(text);
                  setShowProviderSuggestions(true);
                }}
                onFocus={() => { setFocusedField("providerName"); setShowProviderSuggestions(true); }}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g., Blue Cross Blue Shield"
                className={`${textClasses.body} px-6 py-4 rounded-xl mb-2`}
                style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "providerName" ? primary : colors.border }}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Insurance provider name"
              />
              {showProviderSuggestions && providerSuggestions.length > 0 && (
                <View className="rounded-xl mb-4 shadow-lg" style={{ maxHeight: 300, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}>
                  <View className="px-6 py-2 border-b" style={{ backgroundColor: colors.primaryLight, borderBottomColor: primary + "40" }}>
                    <Text className={`${textClasses.small} font-semibold`} style={{ color: colors.textPrimary }}>
                      Tap to select or keep typing ({providerSuggestions.length} providers)
                    </Text>
                  </View>
                  <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                    {providerSuggestions.map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        onPress={() => {
                          setProviderName(suggestion);
                          setShowProviderSuggestions(false);
                          Keyboard.dismiss();
                        }}
                        className="flex-1 px-6 py-4"
                        style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
                      >
                        <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              {!showProviderSuggestions && <View className="mb-4" />}

              {/* Member ID */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Member ID *
              </Text>
              <TextInput
                value={memberId}
                onChangeText={setMemberId}
                onFocus={() => setFocusedField("memberId")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g., ABC123456789"
                className={`${textClasses.body} px-6 py-4 rounded-xl mb-6 font-mono`}
                style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "memberId" ? primary : colors.border }}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Member ID"
              />

              {/* Group Number */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Group Number (Optional)
              </Text>
              <TextInput
                value={groupNumber}
                onChangeText={setGroupNumber}
                onFocus={() => setFocusedField("groupNumber")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g., GRP987654"
                className={`${textClasses.body} px-6 py-4 rounded-xl mb-6 font-mono`}
                style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "groupNumber" ? primary : colors.border }}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Group number"
              />

              {/* Policy Holder */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Policy Holder Name *
              </Text>
              <TextInput
                value={policyHolder}
                onChangeText={setPolicyHolder}
                onFocus={() => setFocusedField("policyHolder")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g., John Smith"
                className={`${textClasses.body} px-6 py-4 rounded-xl mb-6`}
                style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "policyHolder" ? primary : colors.border }}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Policy holder name"
              />

              {/* Phone Number */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Customer Service Phone (Optional)
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                onFocus={() => setFocusedField("phoneNumber")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g., (800) 555-1234"
                keyboardType="phone-pad"
                className={`${textClasses.body} px-6 py-4 rounded-xl mb-6`}
                style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "phoneNumber" ? primary : colors.border }}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Customer service phone number"
              />

              {/* Notes */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Notes (Optional)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                onFocus={() => setFocusedField("notes")}
                onBlur={() => setFocusedField(null)}
                placeholder="Add any additional information..."
                multiline
                numberOfLines={4}
                className={`${textClasses.body} px-6 py-4 rounded-xl mb-6`}
                style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "notes" ? primary : colors.border }}
                placeholderTextColor={colors.textSecondary}
                textAlignVertical="top"
                accessibilityLabel="Notes"
              />

              <Text className={`${textClasses.small} text-center mb-6`} style={{ color: colors.textSecondary }}>
                * Required fields
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Scan Guidance Modal (shown on first 3 scans) */}
      <Modal
        visible={showScanGuidance}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScanGuidance(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 24,
              padding: 24,
            }}
          >
            <Text
              className={`${textClasses.subtitle} font-bold mb-5`}
              style={{ color: colors.textPrimary }}
            >
              Tips for Scanning Your Card
            </Text>

            <View className="flex-row items-start mb-4">
              <View
                className="rounded-full p-2 mr-3"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons name="sunny-outline" size={24} color={primary} />
              </View>
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textPrimary, lineHeight: 24 }}
              >
                Find a well-lit area — avoid glare from overhead lights
              </Text>
            </View>

            <View className="flex-row items-start mb-4">
              <View
                className="rounded-full p-2 mr-3"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons name="card-outline" size={24} color={primary} />
              </View>
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textPrimary, lineHeight: 24 }}
              >
                Place the card on a flat, dark surface
              </Text>
            </View>

            <View className="flex-row items-start mb-6">
              <View
                className="rounded-full p-2 mr-3"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons name="scan-outline" size={24} color={primary} />
              </View>
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textPrimary, lineHeight: 24 }}
              >
                Make sure all corners and text are visible
              </Text>
            </View>

            <Pressable
              onPress={handleConfirmScanGuidance}
              style={{
                backgroundColor: primary,
                borderRadius: 16,
                paddingVertical: 16,
                minHeight: 64,
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel="Got it, open camera"
            >
              <Text className="text-xl font-semibold" style={{ color: onPrimary }}>
                Got it, Open Camera
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSkipScanGuidance}
              style={{ marginTop: 12, paddingVertical: 8, alignItems: "center" }}
              accessibilityRole="button"
              accessibilityLabel="Skip tips"
            >
              <Text
                className={`${textClasses.body}`}
                style={{ color: colors.textSecondary }}
              >
                Skip Tips
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
