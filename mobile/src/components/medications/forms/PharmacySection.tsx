import React, { useState, useCallback, useRef } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { FormSectionProps } from "../types";
import { commonPharmacies } from "../../../utils/pharmacyData";
import { fuzzyFilterStrings } from "../../../utils/fuzzySearch";
import * as Location from "expo-location";

// Format phone number as (555) 555-5555
function formatPhoneNumber(text: string): string {
  // Strip all non-digits
  const digits = text.replace(/\D/g, "");

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function PharmacySection({
  formState,
  updateField,
  textClasses,
  colors,
  primary,
  primaryLight,
}: FormSectionProps) {
  const {
    pharmacyName,
    pharmacyPhone,
    pharmacyAddress,
    showPharmacySuggestions,
  } = formState;

  // Address autocomplete state
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ name: string; address: string; lat: number; lon: number }>>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const addressSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pharmacy suggestions with fuzzy search
  const pharmacySuggestions = (
    pharmacyName.trim().length === 0
      ? commonPharmacies
      : fuzzyFilterStrings(commonPharmacies, pharmacyName, 35)
  ).filter((p) => p && p.trim().length > 0);

  const handlePharmacyNameChange = (text: string) => {
    updateField("pharmacyName", text);
    updateField("showPharmacySuggestions", text.trim().length > 0);
  };

  const handleSelectPharmacy = (pharmacy: string) => {
    updateField("pharmacyName", pharmacy);
    updateField("showPharmacySuggestions", false);
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    updateField("pharmacyPhone", formatted);
  };

  const searchAddresses = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
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
        setAddressSuggestions(suggestions);
        setShowAddressSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
    } catch {
      setAddressSuggestions([]);
    } finally {
      setIsSearchingAddress(false);
    }
  }, []);

  const handleAddressChange = (text: string) => {
    updateField("pharmacyAddress", text);
    if (addressSearchTimeout.current) {
      clearTimeout(addressSearchTimeout.current);
    }
    if (text.trim().length >= 3) {
      addressSearchTimeout.current = setTimeout(() => {
        searchAddresses(text);
      }, 500);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };

  const handleSelectAddress = (suggestion: { name: string; address: string }) => {
    updateField("pharmacyAddress", suggestion.address || suggestion.name);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

  return (
    <View className="mb-6">
      <Text
        className={`${textClasses.subtitle} mb-3 font-semibold`}
        style={{ color: colors.textPrimary }}
      >
        Pharmacy (Optional)
      </Text>

      {/* Pharmacy Name with Autocomplete */}
      <Text
        className={`${textClasses.body} mb-2`}
        style={{ color: colors.textSecondary }}
      >
        Pharmacy Name
      </Text>
      <TextInput
        value={pharmacyName}
        onChangeText={handlePharmacyNameChange}
        onFocus={() => {
          if (pharmacyName.trim().length > 0) {
            updateField("showPharmacySuggestions", true);
          }
        }}
        placeholder="e.g., CVS Pharmacy, Walgreens"
        placeholderTextColor={colors.textSecondary}
        className={`px-6 py-4 rounded-xl mb-2`}
        style={{
          backgroundColor: colors.cardBackground,
          color: colors.textPrimary,
          minHeight: 52,
          fontSize: 17,
        }}
        accessibilityLabel="Pharmacy name"
      />

      {/* Pharmacy Autocomplete Suggestions */}
      {showPharmacySuggestions && pharmacySuggestions.length > 0 && (
        <View
          className="border-2 rounded-xl mb-4 shadow-lg"
          style={{
            zIndex: 10,
            backgroundColor: colors.cardBackground,
            borderColor: primary,
          }}
        >
          <View
            className="px-6 py-2 border-b"
            style={{ backgroundColor: primaryLight, borderBottomColor: primary }}
          >
            <Text
              style={{ color: primary, fontSize: 15, fontWeight: "600" }}
            >
              Tap to select ({pharmacySuggestions.length} pharmacies)
            </Text>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            style={{ maxHeight: 250 }}
          >
            {pharmacySuggestions.map((pharmacy, index) => (
              <Pressable
                key={index}
                onPress={() => handleSelectPharmacy(pharmacy)}
                style={({ pressed }) => ({
                  paddingHorizontal: 24,
                  paddingVertical: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                  minHeight: 60,
                  justifyContent: "center",
                  backgroundColor: pressed ? colors.divider : "transparent",
                })}
              >
                <Text
                  style={{ color: colors.textPrimary, fontSize: 17 }}
                >
                  {pharmacy}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Pharmacy Phone */}
      <Text
        className={`${textClasses.body} mb-2`}
        style={{ color: colors.textSecondary }}
      >
        Pharmacy Phone Number
      </Text>
      <TextInput
        value={pharmacyPhone}
        onChangeText={handlePhoneChange}
        placeholder="(555) 555-5555"
        placeholderTextColor={colors.textSecondary}
        keyboardType="phone-pad"
        maxLength={14}
        className={`px-6 py-4 rounded-xl mb-4`}
        style={{
          backgroundColor: colors.cardBackground,
          color: colors.textPrimary,
          minHeight: 52,
          fontSize: 17,
        }}
        accessibilityLabel="Pharmacy phone number"
      />

      {/* Pharmacy Address with Autocomplete */}
      <Text
        className={`${textClasses.body} mb-2`}
        style={{ color: colors.textSecondary }}
      >
        Pharmacy Address
      </Text>
      <TextInput
        value={pharmacyAddress}
        onChangeText={handleAddressChange}
        onFocus={() => {
          if (pharmacyAddress.trim().length >= 3) {
            setShowAddressSuggestions(true);
          }
        }}
        placeholder="Start typing an address..."
        placeholderTextColor={colors.textSecondary}
        className={`px-6 py-4 rounded-xl mb-2`}
        style={{
          backgroundColor: colors.cardBackground,
          color: colors.textPrimary,
          minHeight: 52,
          fontSize: 17,
        }}
        accessibilityLabel="Pharmacy address"
        multiline
        numberOfLines={2}
      />

      {/* Address Autocomplete Suggestions */}
      {showAddressSuggestions && (
        <View
          className="border-2 rounded-xl mb-4 shadow-lg"
          style={{
            zIndex: 10,
            backgroundColor: colors.cardBackground,
            borderColor: primary,
          }}
        >
          {isSearchingAddress && (
            <View className="py-3 items-center">
              <ActivityIndicator size="small" color={primary} />
            </View>
          )}
          {addressSuggestions.length > 0 && (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 200 }}
            >
              {addressSuggestions.map((suggestion, index) => (
                <Pressable
                  key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                  onPress={() => handleSelectAddress(suggestion)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 24,
                    paddingVertical: 18,
                    borderBottomWidth: index < addressSuggestions.length - 1 ? 1 : 0,
                    borderBottomColor: colors.divider,
                    minHeight: 56,
                    justifyContent: "center",
                    backgroundColor: pressed ? colors.divider : "transparent",
                  })}
                >
                  <Text
                    style={{ color: colors.textPrimary, fontSize: 16 }}
                    numberOfLines={2}
                  >
                    {suggestion.address || suggestion.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          {!isSearchingAddress && addressSuggestions.length === 0 && pharmacyAddress.trim().length >= 3 && (
            <View className="py-3 px-5">
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                No results found
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
