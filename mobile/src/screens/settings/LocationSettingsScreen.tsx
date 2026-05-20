import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Screen } from "../../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { useTheme } from "../../utils/useTheme";
import Button from "../../components/Button";
import * as Haptics from "expo-haptics";
import { logger } from "../../utils/logger";

export default function LocationSettingsScreen() {
  const navigation = useNavigation();
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled) ?? true;

  const storedLocation = useSettingsStore((s) => s.userLocation) || "";
  const storedCity = useSettingsStore((s) => s.userCity) || "";
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [locationText, setLocationText] = useState(storedLocation);
  const [city, setCity] = useState(storedCity);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  useEffect(() => {
    setHasChanges(locationText !== storedLocation || city !== storedCity);
  }, [locationText, city, storedLocation, storedCity]);

  const handleSave = () => {
    triggerHaptic();
    updateSettings({
      userLocation: locationText.trim() || undefined,
      userCity: city.trim() || undefined,
    });
    navigation.goBack();
  };

  const handleUseCurrentLocation = async () => {
    triggerHaptic();
    setIsLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const cityName = address.city || address.subregion || "";
        const region = address.region || "";
        const fullLocation = [
          address.streetNumber,
          address.street,
          cityName,
          region,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

        setLocationText(fullLocation);
        setCity(cityName ? `${cityName}, ${region}` : region);
      }
    } catch (error) {
      logger.error("Error getting location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen variant="static" edges={["top"]}>
      <ScrollView className="flex-1 px-8 py-6">
        {/* Info Card */}
        <View
          className="rounded-2xl p-5 mb-6 flex-row items-start"
          style={{ backgroundColor: primaryLight }}
        >
          <Ionicons name="information-circle" size={24} color={primary} />
          <Text
            className={`${textClasses.body} ml-3 flex-1`}
            style={{ color: colors.textPrimary }}
          >
            Your location is used for weather updates and SOS emergency features.
            It is stored only on your device.
          </Text>
        </View>

        {/* Detect Location Button */}
        <Pressable
          onPress={handleUseCurrentLocation}
          disabled={isLoading}
          className="rounded-2xl p-5 mb-6 flex-row items-center justify-center"
          style={{
            backgroundColor: colors.cardBackground,
            borderWidth: 2,
            borderColor: primary,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={primary} />
          ) : (
            <Ionicons name="locate" size={24} color={primary} />
          )}
          <Text
            className={`${textClasses.body} font-semibold ml-3`}
            style={{ color: primary }}
          >
            {isLoading ? "Getting Location..." : "Continue"}
          </Text>
        </Pressable>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px" style={{ backgroundColor: colors.divider }} />
          <Text className={`${textClasses.small} mx-4`} style={{ color: colors.textSecondary }}>
            or enter manually
          </Text>
          <View className="flex-1 h-px" style={{ backgroundColor: colors.divider }} />
        </View>

        {/* Manual Entry Section */}
        <View
          className="rounded-3xl p-6 mb-6"
          style={{ backgroundColor: colors.cardBackground }}
        >
          {/* City */}
          <View className="mb-6">
            <Text
              className={`${textClasses.body} font-semibold mb-2`}
              style={{ color: colors.textPrimary }}
            >
              City
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="e.g., Winchester, VA"
              placeholderTextColor={colors.textTertiary}
              className={`px-4 py-4 rounded-xl ${textClasses.body}`}
              style={{
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: 56,
              }}
            />
            <Text
              className={`${textClasses.small} mt-2`}
              style={{ color: colors.textSecondary }}
            >
              Used for weather and local information
            </Text>
          </View>

          {/* Full Address */}
          <View>
            <Text
              className={`${textClasses.body} font-semibold mb-2`}
              style={{ color: colors.textPrimary }}
            >
              Full Address (Optional)
            </Text>
            <TextInput
              value={locationText}
              onChangeText={setLocationText}
              placeholder="Enter your address"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className={`px-4 py-4 rounded-xl ${textClasses.body}`}
              style={{
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.border,
                minHeight: 100,
              }}
            />
            <Text
              className={`${textClasses.small} mt-2`}
              style={{ color: colors.textSecondary }}
            >
              Used for navigation and emergency services
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <Button
          title="Save Location"
          onPress={handleSave}
          variant="primary"
          size="large"
          fullWidth
          disabled={!hasChanges}
          style={{ marginBottom: 24 }}
        />

        {/* Clear Location */}
        {(storedLocation || storedCity) && (
          <Pressable
            onPress={() => {
              triggerHaptic();
              setLocationText("");
              setCity("");
            }}
            className="py-4 items-center"
          >
            <Text
              className={`${textClasses.body}`}
              style={{ color: colors.textSecondary }}
            >
              Clear Saved Location
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}
