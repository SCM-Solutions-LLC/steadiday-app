import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PhotoImportSectionProps } from "../types";

const PRIVACY_DISMISSED_KEY = "medication_privacy_dismissed";
const SCAN_COUNT_KEY = "medication_scan_count";
const SCAN_GUIDANCE_THRESHOLD = 3;

export function PhotoImportSection({
  formState,
  updateField,
  textClasses,
  colors,
  primary,
  onAnalyzePhoto,
}: PhotoImportSectionProps) {
  const { isAnalyzingPhoto } = formState;
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const [showScanGuidance, setShowScanGuidance] = useState(false);

  // Check if user has dismissed the privacy notice before
  useEffect(() => {
    const checkPrivacyDismissed = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(PRIVACY_DISMISSED_KEY);
        if (dismissed === "true") {
          setShowPrivacyNotice(false);
        }
      } catch {
        // Ignore errors, just show the notice
      }
    };
    checkPrivacyDismissed();
  }, []);

  const handleDismissPrivacy = async () => {
    setShowPrivacyNotice(false);
    try {
      await AsyncStorage.setItem(PRIVACY_DISMISSED_KEY, "true");
    } catch {
      // Ignore storage errors
    }
  };

  const launchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        // Parent (extractMedicationFromPhoto) is responsible for deleting the
        // temp URI in a finally block — see src/api/vision.ts.
        await onAnalyzePhoto(result.assets[0].uri);
      }
    } catch (error) {
      // Error handled by parent
    }
  };

  const handleTakePhoto = async () => {
    try {
      const countStr = await AsyncStorage.getItem(SCAN_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) || 0 : 0;
      await AsyncStorage.setItem(SCAN_COUNT_KEY, String(count + 1));
      if (count < SCAN_GUIDANCE_THRESHOLD) {
        setShowScanGuidance(true);
        return;
      }
    } catch {
      // If storage fails, just proceed to camera
    }
    await launchCamera();
  };

  const handleConfirmGuidance = async () => {
    setShowScanGuidance(false);
    await launchCamera();
  };

  const handleSkipGuidance = async () => {
    try {
      await AsyncStorage.setItem(SCAN_COUNT_KEY, String(SCAN_GUIDANCE_THRESHOLD));
    } catch {
      // ignore
    }
    setShowScanGuidance(false);
    await launchCamera();
  };

  const handleImportPhoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        // Parent extractor handles preprocessing and temp-file deletion.
        await onAnalyzePhoto(result.assets[0].uri);
      }
    } catch (error) {
      // Error handled by parent
    }
  };

  return (
    <>
      {/* Dismissible Privacy Reassurance for Seniors */}
      {showPrivacyNotice && (
        <View
          style={{
            backgroundColor: colors.primaryLight,
            borderLeftWidth: 4,
            borderLeftColor: primary,
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
            position: "relative",
          }}
        >
          {/* Close Button */}
          <Pressable
            onPress={handleDismissPrivacy}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.08)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1,
            }}
            accessibilityLabel="Dismiss privacy notice"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>

          <View className="flex-row items-start" style={{ paddingRight: 28 }}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={primary}
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <View className="flex-1">
              <Text
                className={`${textClasses.body} leading-relaxed`}
                style={{ color: colors.textPrimary }}
              >
                <Text className="font-semibold">Your Privacy: </Text>
                The photo is only used to read your prescription label and fill in
                the form below. The app removes the image right after and only
                keeps the typed details.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Camera and Import Buttons */}
      <View className="flex-row mb-2">
        <Pressable
          onPress={handleTakePhoto}
          disabled={isAnalyzingPhoto}
          style={{
            flex: 1,
            backgroundColor: colors.primaryLight,
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderWidth: 2,
            borderColor: primary,
            marginRight: 8,
            minHeight: 64,
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="Scan Pill Bottle"
        >
          {isAnalyzingPhoto ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color={primary} />
              <Text
                className={`${textClasses.body} font-semibold ml-3`}
                style={{ color: primary }}
              >
                Analyzing...
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row items-center justify-center mb-1">
                <Ionicons name="camera" size={28} color={primary} />
                <Text
                  className={`${textClasses.body} font-bold ml-2`}
                  style={{ color: primary }}
                >
                  Scan Pill Bottle
                </Text>
              </View>
              <Text
                className={`${textClasses.small} text-center`}
                style={{ color: colors.textSecondary }}
              >
                AI fills in details
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={handleImportPhoto}
          disabled={isAnalyzingPhoto}
          style={{
            flex: 1,
            backgroundColor: colors.primaryLight,
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderWidth: 2,
            borderColor: primary,
            minHeight: 64,
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="Import Photo from gallery"
        >
          <View className="flex-row items-center justify-center mb-1">
            <Ionicons name="images" size={28} color={primary} />
            <Text
              className={`${textClasses.body} font-bold ml-2`}
              style={{ color: primary }}
            >
              Import Photo
            </Text>
          </View>
          <Text
            className={`${textClasses.small} text-center`}
            style={{ color: colors.textSecondary }}
          >
            Choose from gallery
          </Text>
        </Pressable>
      </View>

      {/* Helper text explaining the scan feature */}
      <Text
        className={`${textClasses.small} mb-6`}
        style={{ color: colors.textSecondary, lineHeight: 20 }}
      >
        Take a clear photo of your pill bottle label. The AI will fill in medication details automatically.
      </Text>

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
              Tips for a Good Scan
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
                Use good lighting — avoid shadows and glare on the label
              </Text>
            </View>

            <View className="flex-row items-start mb-4">
              <View
                className="rounded-full p-2 mr-3"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={primary} />
              </View>
              <Text
                className={`${textClasses.body} flex-1`}
                style={{ color: colors.textPrimary, lineHeight: 24 }}
              >
                Hold the phone about 6 inches from the label
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
                Make sure all text on the label is visible in frame
              </Text>
            </View>

            <Pressable
              onPress={handleConfirmGuidance}
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
              <Text className="text-white text-xl font-semibold">
                Got it, Open Camera
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSkipGuidance}
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
    </>
  );
}
