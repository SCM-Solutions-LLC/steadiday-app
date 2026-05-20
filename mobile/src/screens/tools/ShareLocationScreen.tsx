import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Linking, ActivityIndicator, Share, ScrollView, Platform } from "react-native";
import { Screen } from "../../components/Screen";
import { useUserStore } from "../../state/stores/userStore";
import { useUIStore } from "../../state/stores/uiStore";
import { useTipStore } from "../../state/stores/tipStore";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { getTextSizeClasses } from "../../utils/textSizes";
import * as Location from "expo-location";
import { useTheme } from "../../utils/useTheme";
import { useConfirmModal } from "../../components/ConfirmModal";
import { ScreenErrorBoundary } from "../../components/ui";

export default function ShareLocationScreen() {
  const { colors, primary } = useTheme();
  const { alert } = useConfirmModal();

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);

  // User data from useUserStore
  const emergencyContacts = useUserStore((s) => s.userProfile.emergencyContacts);
  const userName = useUserStore((s) => s.userProfile.name);

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  const textClasses = getTextSizeClasses(textSize);

  // Helper function for checking if card is dismissed
  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === "granted") {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

      // Reverse geocode to get address
      const [addressData] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (addressData) {
        const addressStr = [
          addressData.streetNumber,
          addressData.street,
          addressData.city,
          addressData.region,
          addressData.postalCode,
        ]
          .filter(Boolean)
          .join(" ");
        setAddress(addressStr || "Address not available");
      }
    } catch (error) {
      alert("Error", "Could not get your location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const shareLocation = async (method: "sms" | "share") => {
    if (!location) return;

    const lat = location.coords.latitude;
    const lng = location.coords.longitude;
    const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const appleMapsUrl = `http://maps.apple.com/?ll=${lat},${lng}`;

    const message = `${userName ? `${userName} is sharing their location with you` : "Location shared"}

${address}

Google Maps: ${googleMapsUrl}
Apple Maps: ${appleMapsUrl}`;

    if (method === "sms") {
      const primaryContact = emergencyContacts.find((c) => c.isPrimary);
      const phoneNumber = primaryContact?.phoneNumber || "";

      if (!phoneNumber) {
        alert("No Contact", "Please add a trusted contact first.");
        return;
      }

      const smsUrl = `sms:${phoneNumber}${
        Platform.OS === "ios" ? "&" : "?"
      }body=${encodeURIComponent(message)}`;

      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        alert("Error", "Cannot open messaging app.");
      }
    } else {
      try {
        await Share.share({
          message: message,
        });
      } catch (error) {
        alert("Error", "Could not share location.");
      }
    }
  };

  const openInMaps = () => {
    if (!location) return;

    const lat = location.coords.latitude;
    const lng = location.coords.longitude;
    const url = Platform.OS === "ios"
      ? `http://maps.apple.com/?ll=${lat},${lng}`
      : `https://maps.google.com/?q=${lat},${lng}`;

    Linking.openURL(url);
  };

  if (permissionStatus === null) {
    return (
      <ScreenErrorBoundary screenName="ShareLocationScreen">
        <Screen variant="static" edges={["bottom"]}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={primary} />
          </View>
        </Screen>
      </ScreenErrorBoundary>
    );
  }

  if (permissionStatus !== "granted") {
    return (
      <ScreenErrorBoundary screenName="ShareLocationScreen">
        <Screen variant="static" edges={["bottom"]}>
          <View className="flex-1 items-center justify-center px-6">
            <View className="rounded-full p-8 mb-6" style={{ backgroundColor: `${primary}15` }}>
              <Ionicons name="location" size={64} color={primary} />
            </View>
            <Text className={`${textClasses.title} text-center mb-3`} style={{ color: colors.textPrimary }}>
              Location Permission Needed
            </Text>
            <Text className={`${textClasses.body} text-center mb-8 leading-relaxed`} style={{ color: colors.textSecondary }}>
              To share your location, we need access to your location services.
            </Text>
            <Pressable
              onPress={requestPermission}
              className="px-10 py-5 rounded-2xl active:opacity-80"
              style={{ backgroundColor: primary, minHeight: 56 }}
              accessibilityRole="button"
              accessibilityLabel="Allow location access"
            >
              <Text className={`${textClasses.button} text-white font-semibold`}>
                Allow Location Access
              </Text>
            </Pressable>
          </View>
        </Screen>
      </ScreenErrorBoundary>
    );
  }

  return (
    <ScreenErrorBoundary screenName="ShareLocationScreen">
      <Screen variant="static" edges={["bottom"]}>
      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          {/* Location Status Card */}
          <View className="rounded-3xl p-6 mb-6 shadow-sm" style={{ backgroundColor: colors.cardBackground }}>
            <View className="flex-row items-center mb-6">
              <View className="rounded-2xl p-4 mr-4" style={{ backgroundColor: `${primary}15` }}>
                <Ionicons name="location" size={32} color={primary} />
              </View>
              <Text className={`${textClasses.subtitle} flex-1`} style={{ color: colors.textPrimary }}>
                Your Location
              </Text>
            </View>

            {location ? (
              <View>
                <Text className={`${textClasses.body} mb-3 font-semibold leading-relaxed`} style={{ color: colors.textPrimary }}>
                  {address || "Getting address..."}
                </Text>
                <Text className={`${textClasses.small} mb-6 leading-relaxed`} style={{ color: colors.textSecondary }}>
                  {`${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`}
                </Text>

                <Pressable
                  onPress={openInMaps}
                  className="flex-row items-center justify-center py-4 rounded-2xl mb-4"
                  style={{ minHeight: 56, backgroundColor: colors.background }}
                  accessibilityRole="button"
                  accessibilityLabel="Open in maps"
                >
                  <Ionicons name="map" size={24} color={primary} />
                  <Text className={`${textClasses.button} ml-3`} style={{ color: primary }}>
                    Open in Maps
                  </Text>
                </Pressable>

                <Pressable
                  onPress={getCurrentLocation}
                  className="flex-row items-center justify-center py-4 rounded-2xl"
                  style={{ minHeight: 56 }}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh location"
                >
                  <Ionicons name="refresh" size={24} color={colors.textPrimary} />
                  <Text className={`${textClasses.button} ml-3`} style={{ color: colors.textSecondary }}>
                    Refresh Location
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Text className={`${textClasses.body} mb-6 leading-relaxed`} style={{ color: colors.textSecondary }}>
                  Tap the button below to get your current location
                </Text>
                <Pressable
                  onPress={getCurrentLocation}
                  disabled={loading}
                  className="py-5 rounded-2xl active:opacity-80 flex-row items-center justify-center"
                  style={{ backgroundColor: primary, minHeight: 56 }}
                  accessibilityRole="button"
                  accessibilityLabel="Get location"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="locate" size={28} color="white" />
                      <Text className={`${textClasses.button} text-white ml-3 font-semibold`}>
                        Get My Location
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>

          {/* Share Options */}
          {location && (
            <View className="rounded-3xl p-6 mb-6 shadow-sm" style={{ backgroundColor: colors.cardBackground }}>
              <Text className={`${textClasses.subtitle} mb-6`} style={{ color: colors.textPrimary }}>
                Share With
              </Text>

              {emergencyContacts.length > 0 && (
                <Pressable
                  onPress={() => shareLocation("sms")}
                  className="py-5 rounded-2xl mb-4 active:opacity-80 flex-row items-center justify-center"
                  style={{ backgroundColor: "#6DB193", minHeight: 56 }}
                  accessibilityRole="button"
                  accessibilityLabel="Send to trusted contact"
                >
                  <Ionicons name="chatbubble" size={28} color="white" />
                  <Text className={`${textClasses.button} text-white ml-3 font-semibold`}>
                    Send to Trusted Contact
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => shareLocation("share")}
                className="py-5 rounded-2xl active:opacity-80 flex-row items-center justify-center"
                style={{ backgroundColor: primary, minHeight: 56 }}
                accessibilityRole="button"
                accessibilityLabel="Share location"
              >
                <Ionicons name="share" size={28} color="white" />
                <Text className={`${textClasses.button} text-white ml-3 font-semibold`}>
                  Share Location
                </Text>
              </Pressable>
            </View>
          )}

          {/* Info Card */}
          {!isCardDismissed("share-location-info") && (
            <View className="rounded-3xl p-6" style={{ backgroundColor: colors.infoBackground, borderWidth: 2, borderColor: colors.onInfo }}>
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={28} color={colors.onInfo} />
                <View className="flex-1 ml-4">
                  <Text className={`${textClasses.body} mb-2 font-semibold`} style={{ color: colors.textPrimary }}>
                    How it works
                  </Text>
                  <Text className={`${textClasses.small} leading-relaxed`} style={{ color: colors.textSecondary }}>
                    Share your current location via text message or any app. Recipients will receive a message with your address and links to view your location in maps.
                  </Text>
                </View>
                <Pressable
                  onPress={() => dismissInfoCard("share-location-info")}
                  className="p-1 ml-2 active:opacity-50"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={28} color={colors.onInfo} />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
    </ScreenErrorBoundary>
  );
}
