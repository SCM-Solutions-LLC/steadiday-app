import React from "react";
import { View, Text, Modal, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../Button";
import type { LocationModalProps } from "../types";

export function LocationModal({
  visible,
  onClose,
  onSave,
  newLocation,
  onLocationChange,
  locationSuggestions,
  showLocationSuggestions,
  isLoadingSuggestions,
  onSelectLocation,
  onUseCurrentLocation,
  isRequestingLocation,
  locationError,
  hasValidLocation,
  textClasses,
  colors,
  primary,
}: LocationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-8">
        <View
          className="rounded-3xl p-10 w-full max-w-md"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <View className="items-center mb-6">
            <View
              className="rounded-full p-5 mb-6"
              style={{ backgroundColor: "#E5F2FF" }}
            >
              <Ionicons name="location" size={56} color="#2F80ED" />
            </View>
            <Text
              className={`${textClasses.title} text-center mb-3`}
              style={{ color: colors.textPrimary }}
            >
              Change Location
            </Text>
            <Text
              className={`${textClasses.subtitle} text-center leading-relaxed`}
              style={{ color: colors.textSecondary }}
            >
              Search for a city or use your current location
            </Text>
          </View>

          {/* Detect Location Button */}
          <Pressable
            onPress={onUseCurrentLocation}
            disabled={isRequestingLocation}
            className="flex-row items-center justify-center rounded-2xl px-6 py-4 mb-4"
            style={{
              backgroundColor: primary + "15",
              borderWidth: 2,
              borderColor: primary,
              opacity: isRequestingLocation ? 0.7 : 1,
            }}
          >
            {isRequestingLocation ? (
              <ActivityIndicator size="small" color={primary} />
            ) : (
              <Ionicons name="navigate" size={24} color={primary} />
            )}
            <Text
              className={`${textClasses.subtitle} font-semibold ml-3`}
              style={{ color: primary }}
            >
              {isRequestingLocation ? "Getting location..." : "Continue"}
            </Text>
          </Pressable>

          {/* Location Error */}
          {locationError && (
            <View
              className="rounded-xl p-4 mb-4 flex-row items-center"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text
                className={`${textClasses.body} ml-2 flex-1`}
                style={{ color: "#DC2626" }}
              >
                {locationError}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-px" style={{ backgroundColor: colors.divider }} />
            <Text
              className={`${textClasses.body} px-4`}
              style={{ color: colors.textSecondary }}
            >
              or search
            </Text>
            <View className="flex-1 h-px" style={{ backgroundColor: colors.divider }} />
          </View>

          {/* Location Input */}
          <View className="mb-6">
            <TextInput
              value={newLocation}
              onChangeText={onLocationChange}
              placeholder="Type city name to search..."
              className={`rounded-2xl px-6 py-4 ${textClasses.subtitle}`}
              style={{
                backgroundColor: colors.background,
                borderWidth: 2,
                borderColor: hasValidLocation ? colors.success : colors.divider,
                color: colors.textPrimary,
              }}
              placeholderTextColor={colors.textSecondary}
              autoFocus={false}
              returnKeyType="search"
            />

            {/* Search hint */}
            {newLocation.length > 0 && newLocation.length < 3 && (
              <Text
                className={`${textClasses.small} mt-2 ml-2`}
                style={{ color: colors.textSecondary }}
              >
                Type at least 3 characters to search
              </Text>
            )}

            {/* Valid location indicator */}
            {hasValidLocation && (
              <View className="flex-row items-center mt-2 ml-2">
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text
                  className={`${textClasses.small} ml-1`}
                  style={{ color: colors.success }}
                >
                  Location selected
                </Text>
              </View>
            )}

            {/* Loading indicator */}
            {isLoadingSuggestions && (
              <View
                className="mt-3 rounded-2xl p-4 border-2"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.divider,
                }}
              >
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color={primary} />
                  <Text
                    className={`${textClasses.body} ml-3`}
                    style={{ color: colors.textSecondary }}
                  >
                    Searching locations...
                  </Text>
                </View>
              </View>
            )}

            {/* No results message */}
            {showLocationSuggestions && locationSuggestions.length === 0 && !isLoadingSuggestions && newLocation.length >= 3 && (
              <View
                className="mt-3 rounded-2xl p-4 border-2"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.divider,
                }}
              >
                <Text
                  className={`${textClasses.body} text-center`}
                  style={{ color: colors.textSecondary }}
                >
                  No locations found. Try a different search.
                </Text>
              </View>
            )}

            {/* Location Suggestions */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <View
                className="mt-3 rounded-2xl border-2 overflow-hidden"
                style={{
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.divider,
                }}
              >
                <ScrollView style={{ maxHeight: 200 }}>
                  {locationSuggestions.map((suggestion, index) => (
                    <Pressable
                      key={index}
                      onPress={() => onSelectLocation(suggestion)}
                      className="flex-1 px-6 py-4 border-b"
                      style={{ borderBottomColor: colors.divider }}
                    >
                      <Text
                        className={`${textClasses.subtitle} font-semibold`}
                        style={{ color: colors.textPrimary }}
                      >
                        {suggestion.name}
                      </Text>
                      {(suggestion.region || suggestion.country) && (
                        <Text
                          className={`${textClasses.body} mt-1`}
                          style={{ color: colors.textSecondary }}
                        >
                          {[suggestion.region, suggestion.country]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Save Button */}
          <Button
            title="Save Location"
            onPress={onSave}
            variant="primary"
            size="large"
            fullWidth
            disabled={!hasValidLocation}
            style={{ marginBottom: 16, opacity: hasValidLocation ? 1 : 0.5 }}
            accessibilityLabel="Save location"
          />

        </View>
      </View>
    </Modal>
  );
}
