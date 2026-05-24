import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, TextInput, Linking, ScrollView, Platform, StyleSheet, Keyboard, Image, ActivityIndicator, useWindowDimensions } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Screen } from "../../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useTaskStore } from "../../state/stores/taskStore";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import * as Location from "expo-location";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "../../utils/useTheme";
import { useConfirmModal } from "../../components/ConfirmModal";
import { ScreenErrorBoundary } from "../../components/ui";
import { logger } from "../../utils/logger";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

// Static map URL generator - uses OpenStreetMap (free, no API key)
const getStaticMapUrl = (lat: number, lng: number, zoom: number = 16): string => {
  const width = 600;
  const height = 300;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=osmarenderer&markers=${lat},${lng},red-pushpin`;
};

export default function FindMyCarScreen() {
  const { colors, primary, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  // Map height adapts to screen: proportional to width, larger cap on bigger screens
  const maxMapHeight = height > 900 ? 320 : 220;
  const mapHeight = Math.min(Math.round(width * 0.48), maxMapHeight);
  const insets = useSafeAreaInsets();
  const { alert, confirm, destructive } = useConfirmModal();
  const parkingSpot = useTaskStore((s) => s.parkingSpot);
  const saveParkingSpot = useTaskStore((s) => s.saveParkingSpot);
  const clearParkingSpot = useTaskStore((s) => s.clearParkingSpot);
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // State for editing existing notes
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState("");

  // State for map loading
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  const triggerHaptic = useCallback((type: "light" | "success" = "light") => {
    if (hapticEnabled) {
      if (type === "success") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [hapticEnabled]);

  // Animation values
  const saveButtonScale = useSharedValue(1);
  const directionsButtonScale = useSharedValue(1);

  const saveButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  const directionsButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: directionsButtonScale.value }],
  }));

  // Determine if we have a saved spot
  const hasSavedSpot = parkingSpot != null;

  useEffect(() => {
    if (parkingSpot) {
      calculateDistance();
      // Reset map state when a new spot is saved
      setMapLoading(true);
      setMapError(false);
    }
  }, [parkingSpot?.latitude, parkingSpot?.longitude]);

  // Sync edited note when parking spot changes
  useEffect(() => {
    if (parkingSpot?.note) {
      setEditedNote(parkingSpot.note);
    } else {
      setEditedNote("");
    }
  }, [parkingSpot?.note]);

  const calculateDistance = async () => {
    if (!parkingSpot) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      const dist = getDistanceFromLatLonInKm(
        location.coords.latitude,
        location.coords.longitude,
        parkingSpot.latitude,
        parkingSpot.longitude
      );
      setDistance(dist);
    } catch (error) {
      logger.error("Error calculating distance:", error);
    }
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const formatTimeAgo = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const formatDistanceDisplay = (dist: number): string => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m`;
    }
    return `${dist.toFixed(1)}km`;
  };

  const handleSaveSpot = async () => {
    Keyboard.dismiss();
    triggerHaptic();
    saveButtonScale.value = withSpring(0.95, { damping: 15 });
    setTimeout(() => {
      saveButtonScale.value = withSpring(1, { damping: 15 });
    }, 100);

    setSaving(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert(
          "Location Permission Needed",
          "Please enable location access to save your parking spot."
        );
        setSaving(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      saveParkingSpot({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        note: note.trim() || undefined,
      });

      setNote("");
      triggerHaptic("success");
    } catch (error) {
      logger.error("Error saving parking spot:", error);
      alert("Error", "Could not save your location. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isValidCoordinate = (lat: number, lng: number): boolean => {
    return (
      typeof lat === "number" &&
      typeof lng === "number" &&
      isFinite(lat) &&
      isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  const handleGetDirections = async () => {
    if (!parkingSpot) return;

    if (!isValidCoordinate(parkingSpot.latitude, parkingSpot.longitude)) {
      alert("Invalid Location", "The saved parking location appears to be invalid. Please save a new location.");
      return;
    }

    triggerHaptic();
    directionsButtonScale.value = withSpring(0.95, { damping: 15 });
    setTimeout(() => {
      directionsButtonScale.value = withSpring(1, { damping: 15 });
    }, 100);

    await calculateDistance();

    const lat = parkingSpot.latitude;
    const lng = parkingSpot.longitude;

    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });

    try {
      await Linking.openURL(url);
    } catch (error) {
      logger.error("Error opening maps:", error);
      alert("Error", "Could not open maps application.");
    }
  };

  const handleCopyLocation = async () => {
    if (!parkingSpot) return;

    if (!isValidCoordinate(parkingSpot.latitude, parkingSpot.longitude)) {
      alert("Invalid Location", "The saved parking location appears to be invalid.");
      return;
    }

    triggerHaptic();
    const link = `https://www.google.com/maps/search/?api=1&query=${parkingSpot.latitude},${parkingSpot.longitude}`;
    await Clipboard.setStringAsync(link);
    triggerHaptic("success");
    alert("Copied", "Location link copied to clipboard.");
  };

  const handleSaveNewSpot = () => {
    triggerHaptic();
    confirm(
      "Save New Location?",
      "This will replace your current saved parking spot with your current location.",
      async () => {
        setSaving(true);
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            alert(
              "Location Permission Needed",
              "Please enable location access to save your parking spot."
            );
            setSaving(false);
            return;
          }

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          saveParkingSpot({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toISOString(),
            note: undefined,
          });

          setDistance(null);
          triggerHaptic("success");
        } catch (error) {
          logger.error("Error saving new parking spot:", error);
          alert("Error", "Could not save your location. Please try again.");
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleDeleteSpot = () => {
    triggerHaptic();
    destructive(
      "Delete Saved Location?",
      "This will permanently remove your saved parking spot.",
      "Delete",
      () => {
        clearParkingSpot();
        setDistance(null);
        setNote("");
        setIsEditingNote(false);
        setEditedNote("");
        triggerHaptic("success");
      }
    );
  };

  const handleSaveNote = () => {
    if (!parkingSpot) return;

    triggerHaptic("success");
    saveParkingSpot({
      ...parkingSpot,
      note: editedNote.trim() || undefined,
    });
    setIsEditingNote(false);
    Keyboard.dismiss();
  };

  const handleCancelNoteEdit = () => {
    setEditedNote(parkingSpot?.note || "");
    setIsEditingNote(false);
    Keyboard.dismiss();
  };

  return (
    <ScreenErrorBoundary screenName="FindMyCarScreen">
      <Screen variant="static" edges={["bottom"]}>
        <ScrollView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!hasSavedSpot ? (
            /* ========== NO SAVED SPOT - SAVE MODE ========== */
            <View>
              {/* Hero Card */}
              <View style={[styles.heroCard, { backgroundColor: colors.cardBackground }]}>
                <View style={[styles.heroIconContainer, { backgroundColor: primary + "15" }]}>
                  <Ionicons name="car" size={48} color={primary} />
                </View>
                <Text
                  className={`${textClasses.title} text-center mb-3`}
                  style={{ color: colors.textPrimary }}
                >
                  Save Your Parking Spot
                </Text>
                <Text
                  className={`${textClasses.body} text-center`}
                  style={{ color: colors.textSecondary, lineHeight: 24 }}
                >
                  Tap the button below when you park. We will remember this location so you can find your car later.
                </Text>
              </View>

              {/* Note Input Card */}
              <View style={[styles.noteCard, { backgroundColor: colors.cardBackground }]}>
                <Text
                  className={`${textClasses.body} font-medium mb-3`}
                  style={{ color: colors.textPrimary }}
                >
                  Add a note (optional)
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g., Level 2, near elevator, blue sign..."
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.noteInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      borderColor: colors.border || colors.textSecondary + "30",
                    },
                  ]}
                  className={textClasses.body}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  accessibilityLabel="Parking spot note"
                />
              </View>

              {/* Save Button - Large and Prominent */}
              <Pressable
                onPress={handleSaveSpot}
                disabled={saving}
                accessibilityLabel="Save parking spot"
                accessibilityRole="button"
              >
                <Animated.View
                  style={[
                    saveButtonStyle,
                    styles.primaryButton,
                    {
                      backgroundColor: primary,
                      opacity: saving ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name="location" size={24} color="#FFFFFF" />
                  <Text className={`${textClasses.body} font-semibold ml-3`} style={{ color: "#FFFFFF" }}>
                    {saving ? "Saving..." : "Save Parking Spot"}
                  </Text>
                </Animated.View>
              </Pressable>
            </View>
          ) : (
            /* ========== HAS SAVED SPOT - FIND MODE ========== */
            <View>
              {/* Real Map Preview Card */}
              <Pressable
                onPress={handleGetDirections}
                style={[styles.mapCard, { backgroundColor: colors.cardBackground }]}
                accessibilityLabel="Open in Maps"
                accessibilityRole="button"
              >
                <View style={[styles.mapContainer, { backgroundColor: isDark ? "#1a1a2e" : "#e8f4f8", height: mapHeight }]}>
                  {/* Real Map Image */}
                  {parkingSpot && (
                    <Image
                      source={{ uri: getStaticMapUrl(parkingSpot.latitude, parkingSpot.longitude) }}
                      style={styles.mapImage}
                      resizeMode="cover"
                      onLoadStart={() => { setMapLoading(true); setMapError(false); }}
                      onLoad={() => setMapLoading(false)}
                      onLoadEnd={() => setMapLoading(false)}
                      onError={() => {
                        setMapLoading(false);
                        setMapError(true);
                      }}
                    />
                  )}

                  {/* Loading indicator */}
                  {mapLoading && (
                    <View style={[styles.mapLoadingOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.8)" }]}>
                      <ActivityIndicator size="large" color={primary} />
                      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                        Loading map...
                      </Text>
                    </View>
                  )}

                  {/* Error fallback - show grid pattern */}
                  {mapError && (
                    <View style={styles.mapGridOverlay}>
                      {[...Array(5)].map((_, i) => (
                        <View
                          key={`h-${i}`}
                          style={[
                            styles.mapGridLine,
                            styles.mapGridHorizontal,
                            { top: `${(i + 1) * 16.66}%`, backgroundColor: isDark ? "#2a2a4e" : "#c8dce4" },
                          ]}
                        />
                      ))}
                      {[...Array(7)].map((_, i) => (
                        <View
                          key={`v-${i}`}
                          style={[
                            styles.mapGridLine,
                            styles.mapGridVertical,
                            { left: `${(i + 1) * 12.5}%`, backgroundColor: isDark ? "#2a2a4e" : "#c8dce4" },
                          ]}
                        />
                      ))}
                      {/* Car pin in center */}
                      <View style={styles.mapOverlay}>
                        <View style={[styles.mapPinContainer, { backgroundColor: primary }]}>
                          <Ionicons name="car" size={24} color="#FFFFFF" />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Coordinates display */}
                  <View style={[styles.coordsContainer, { backgroundColor: colors.background + "E6" }]}>
                    <Ionicons name="location" size={14} color={primary} />
                    <Text style={[styles.coordsText, { color: colors.textSecondary }]}>
                      {parkingSpot?.latitude.toFixed(5)}, {parkingSpot?.longitude.toFixed(5)}
                    </Text>
                  </View>
                </View>

                {/* Tap hint */}
                <View style={[styles.mapTapHint, { backgroundColor: colors.background }]}>
                  <Ionicons name="navigate" size={18} color={primary} />
                  <Text style={{ fontSize: 16, fontWeight: "600", marginLeft: 8, color: primary }}>
                    Tap to Open in Maps
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={primary} style={{ marginLeft: "auto" }} />
                </View>
              </Pressable>

              {/* Saved Location Card */}
              <View style={[styles.savedCard, { backgroundColor: colors.cardBackground }]}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: primary + "15" }]}>
                  <Ionicons name="checkmark-circle" size={18} color={primary} />
                  <Text
                    className={`${textClasses.small} font-semibold ml-1.5`}
                    style={{ color: primary }}
                  >
                    Location Saved
                  </Text>
                </View>

                {/* Saved Info */}
                <Text
                  className={`${textClasses.title} text-center mb-2`}
                  style={{ color: colors.textPrimary }}
                >
                  Your car is parked
                </Text>

                {/* Distance (only show if more than 10m away) */}
                {distance !== null && distance * 1000 > 10 && (
                  <View style={styles.distanceRow}>
                    <Ionicons name="navigate" size={20} color={primary} />
                    <Text
                      className={`${textClasses.body} font-semibold ml-2`}
                      style={{ color: primary }}
                    >
                      About {formatDistanceDisplay(distance)} away
                    </Text>
                  </View>
                )}

                {/* Time saved */}
                <Text
                  className={`${textClasses.small} mt-2`}
                  style={{ color: colors.textSecondary }}
                >
                  Saved {parkingSpot ? formatTimeAgo(parkingSpot.timestamp) : ""}
                </Text>
              </View>

              {/* Editable Note Section */}
              <View style={[styles.noteSection, { backgroundColor: colors.cardBackground }]}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                    <Text style={{ fontSize: 16, fontWeight: "600", marginLeft: 8, color: colors.textPrimary }}>
                      Parking Note
                    </Text>
                  </View>
                  {!isEditingNote && (
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        setIsEditingNote(true);
                      }}
                      style={{
                        padding: 10,
                        marginRight: -10,
                        minWidth: 48,
                        minHeight: 48,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      accessibilityLabel="Edit parking note"
                      accessibilityRole="button"
                    >
                      <Ionicons name="pencil" size={20} color={primary} />
                    </Pressable>
                  )}
                </View>

                {isEditingNote ? (
                  <View>
                    <TextInput
                      value={editedNote}
                      onChangeText={setEditedNote}
                      placeholder="e.g., Level 2, near elevator, blue sign..."
                      placeholderTextColor={colors.textTertiary}
                      style={[
                        styles.noteInput,
                        {
                          backgroundColor: colors.background,
                          color: colors.textPrimary,
                          borderColor: primary,
                          borderWidth: 2,
                        },
                      ]}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      autoFocus
                    />
                    <View style={{ flexDirection: "row", marginTop: 12, gap: 12 }}>
                      <Pressable
                        onPress={handleCancelNoteEdit}
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          borderRadius: 12,
                          backgroundColor: colors.cardBackground,
                          borderWidth: 1,
                          borderColor: colors.border || colors.textSecondary + "30",
                          alignItems: "center",
                          minHeight: 48,
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 16 }}>
                          Cancel
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSaveNote}
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          borderRadius: 12,
                          backgroundColor: primary,
                          alignItems: "center",
                          minHeight: 48,
                        }}
                      >
                        <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>
                          Save Note
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text style={{
                    fontSize: 15,
                    color: parkingSpot?.note ? colors.textPrimary : colors.textTertiary,
                    lineHeight: 22,
                  }}>
                    {parkingSpot?.note || "No note added. Tap the pencil to add details about where you parked."}
                  </Text>
                )}
              </View>

              {/* Get Directions Button - Primary Action */}
              <Pressable
                onPress={handleGetDirections}
                accessibilityLabel="Get directions to car"
                accessibilityRole="button"
              >
                <Animated.View
                  style={[
                    directionsButtonStyle,
                    styles.primaryButton,
                    { backgroundColor: primary },
                  ]}
                >
                  <Ionicons name="navigate" size={24} color="#FFFFFF" />
                  <Text className={`${textClasses.body} font-semibold ml-3`} style={{ color: "#FFFFFF" }}>
                    Get Directions
                  </Text>
                </Animated.View>
              </Pressable>

              {/* Copy Location Link */}
              <Pressable
                onPress={handleCopyLocation}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  borderRadius: 16,
                  backgroundColor: pressed ? colors.textSecondary + "15" : colors.cardBackground,
                  borderWidth: 1.5,
                  borderColor: colors.border || colors.textSecondary + "30",
                  marginBottom: 16,
                  minHeight: 52,
                })}
                accessibilityLabel="Copy location link to clipboard"
                accessibilityRole="button"
              >
                <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginLeft: 10, fontWeight: "600", fontSize: 16 }}>
                  Copy Location Link
                </Text>
              </Pressable>

              {/* Improved Action Buttons */}
              <View style={{ marginTop: 8, marginBottom: 20 }}>
                {/* Save New Location - Outlined style with visible border */}
                <Pressable
                  onPress={handleSaveNewSpot}
                  disabled={saving}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderRadius: 16,
                    backgroundColor: pressed ? primary + "15" : isDark ? "#1F2937" : "#FFFFFF",
                    borderWidth: 2.5,
                    borderColor: primary,
                    marginBottom: 12,
                    minHeight: 56,
                    opacity: saving ? 0.6 : 1,
                    // Shadow for depth
                    shadowColor: primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  })}
                  accessibilityLabel="Save new parking location"
                  accessibilityRole="button"
                >
                  <Ionicons name="add-circle-outline" size={24} color={primary} />
                  <Text style={{ color: primary, marginLeft: 10, fontWeight: "700", fontSize: 18 }}>
                    Save New Location
                  </Text>
                </Pressable>

                {/* Delete - Visible outlined button with red border */}
                <Pressable
                  onPress={handleDeleteSpot}
                  disabled={saving}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 16,
                    backgroundColor: pressed ? "#EF444415" : isDark ? "#1F2937" : "#FFFFFF",
                    borderWidth: 2,
                    borderColor: "#EF4444",
                    minHeight: 48,
                    opacity: saving ? 0.6 : 1,
                  })}
                  accessibilityLabel="Delete saved parking location"
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={{ color: "#EF4444", marginLeft: 8, fontWeight: "600", fontSize: 16 }}>
                    Delete Saved Location
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Help Text */}
          <View style={styles.helpSection}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text
              className={`${textClasses.small} ml-2 flex-1`}
              style={{ color: colors.textSecondary, lineHeight: 20 }}
            >
              {hasSavedSpot
                ? "Tap \"Get Directions\" to open Maps and navigate to your car"
                : "Your location is only used to help you find your car"
              }
            </Text>
          </View>
        </ScrollView>
      </Screen>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  // Hero Card (No Saved Spot)
  heroCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  // Note Card
  noteCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  noteSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
  },
  // Buttons
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    minHeight: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 24,
    minHeight: 56,
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  secondaryButtonHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    minHeight: 60,
  },
  // Saved Card
  savedCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  savedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  savedNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    width: "100%",
  },
  // Map Card
  mapCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  mapContainer: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
  },
  mapGridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapGridLine: {
    position: "absolute",
  },
  mapGridHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  mapGridVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  mapPinContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  mapPinShadow: {
    position: "absolute",
    width: 60,
    height: 20,
    borderRadius: 30,
    marginTop: 56,
    opacity: 0.3,
  },
  coordsContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  coordsText: {
    fontSize: 11,
    marginLeft: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  mapTapHint: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  // Help Section
  helpSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 8,
  },
});
