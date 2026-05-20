import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  InteractionManager,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useHealthStore } from "../state/stores/healthStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { Doctor } from "../types/app";
import { getTextSizeClasses } from "../utils/textSizes";
import { useTheme } from "../utils/useTheme";
import {
  commonSpecialties,
  commonDoctorsAndPractices,
  DoctorTemplate,
  searchHealthcareProviders,
  searchNursingFacilities,
  searchHospitals,
  type FormattedProvider,
  NPI_REGISTRY_STATS,
} from "../utils/doctorData";
import { formatPhoneNumber } from "../utils/phoneFormatter";
import * as Location from "expo-location";
import { fuzzyFilterStrings } from "../utils/fuzzySearch";
import { DismissableInfoBox } from "./ui";
import { logger } from "../utils/logger";

interface AddressSuggestion {
  displayName: string;
  fullAddress: string;
}

interface AddDoctorModalProps {
  visible: boolean;
  onClose: () => void;
  editingDoctor?: Doctor;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function AddDoctorModal({ visible, onClose, editingDoctor }: AddDoctorModalProps) {
  const { primary, primaryDark, onPrimary, colors, isDark } = useTheme();
  const addDoctor = useHealthStore((s) => s.addDoctor);
  const updateDoctor = useHealthStore((s) => s.updateDoctor);
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [npiNumber, setNpiNumber] = useState("");
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showSpecialtySuggestions, setShowSpecialtySuggestions] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // NPI Registry search state
  const [npiResults, setNpiResults] = useState<FormattedProvider[]>([]);
  const [isSearchingNPI, setIsSearchingNPI] = useState(false);
  const [searchSource, setSearchSource] = useState<"npi" | "local" | "mixed">("local");
  const [userState, setUserState] = useState<string>("");
  const [userCity, setUserCity] = useState<string>("");

  // Refs for location so changes don't abort in-flight searches
  const userStateRef = useRef(userState);
  const userCityRef = useRef(userCity);
  useEffect(() => { userStateRef.current = userState; }, [userState]);
  useEffect(() => { userCityRef.current = userCity; }, [userCity]);

  // Debounced search term for NPI lookups
  const debouncedName = useDebounce(name, 500);

  // AbortController to cancel stale NPI requests and prevent freezing
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll ref for auto-scrolling when dropdowns appear
  const scrollViewRef = useRef<ScrollView>(null);
  const nameFieldYRef = useRef<number>(0);
  const specialtyFieldYRef = useRef<number>(0);

  // Get user location for better search results - deferred to avoid blocking UI
  useEffect(() => {
    if (!visible) return;

    const task = InteractionManager.runAfterInteractions(() => {
      const getLocation = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const location = await Location.getCurrentPositionAsync({});
            const [addr] = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            if (addr) {
              setUserState(addr.region || "");
              setUserCity(addr.city || "");
            }
          }
        } catch (error) {
          // Location not available, will search nationwide
        }
      };
      getLocation();
    });

    return () => task.cancel();
  }, [visible]);

  // Search NPI Registry when name changes - with AbortController to cancel stale requests
  useEffect(() => {
    const searchProviders = async () => {
      if (debouncedName.trim().length < 2) {
        setNpiResults([]);
        setSearchSource("local");
        return;
      }

      // Cancel any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSearchingNPI(true);
      try {
        const result = await searchHealthcareProviders({
          query: debouncedName.trim(),
          state: userStateRef.current || undefined,
          city: userCityRef.current || undefined,
          type: "all",
          limit: 40,
          useLocalFallback: true,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setNpiResults(result.providers);
          setSearchSource(result.source);
        }
      } catch (error: any) {
        if (error?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        logger.error("Provider search error:", error);
        if (!controller.signal.aborted) {
          const localMatches = commonDoctorsAndPractices.filter(doc =>
            doc.name.toLowerCase().includes(debouncedName.toLowerCase())
          );
          setNpiResults(localMatches.map(doc => ({
            npi: "",
            name: doc.name,
            type: doc.type === "doctor" ? "individual" as const : "organization" as const,
            specialty: doc.specialty,
            address: doc.address,
            city: "",
            state: "",
            zipCode: "",
            phone: doc.phoneNumber,
          })));
          setSearchSource("local");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingNPI(false);
        }
      }
    };

    if (showNameSuggestions) {
      searchProviders();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedName, showNameSuggestions]);

  const handlePhoneNumberChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  // Handle selecting a provider from NPI results
  const handleSelectProvider = (provider: FormattedProvider) => {
    const isDoctor = provider.type === "individual";

    if (isDoctor) {
      // For doctors: set name with Dr. prefix
      const doctorName = provider.name?.match(/^(Dr\.?)\s/i)
        ? provider.name
        : `Dr. ${provider.name}`;
      setName(doctorName);
    } else if (provider.authorizedOfficialName) {
      // For facilities with a known doctor contact
      setName(`Dr. ${provider.authorizedOfficialName}`);
    } else {
      // For facilities without a doctor name, use facility name
      setName(provider.name);
    }

    if (provider.specialty) {
      setSpecialty(provider.specialty);
    }
    if (provider.phone) {
      setPhoneNumber(formatPhoneNumber(provider.phone));
    }
    const addressParts = [
      provider.address,
      provider.city,
      provider.state,
      provider.zipCode,
    ].filter(Boolean);
    if (addressParts.length > 0) {
      setAddress(addressParts.join(", "));
    }
    if (provider.npi) {
      setNpiNumber(provider.npi);
    }
    setShowNameSuggestions(false);
    Keyboard.dismiss();
  };

  // Handle selecting from local fallback data
  const handleSelectDoctor = (doctor: DoctorTemplate) => {
    setName(doctor.name);
    setSpecialty(doctor.specialty);
    setPhoneNumber(doctor.phoneNumber);
    setAddress(doctor.address);
    setShowNameSuggestions(false);
    Keyboard.dismiss();
  };

  // Debounce address search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.trim().length >= 5 && showAddressSuggestions) {
        searchAddresses(address.trim());
      } else {
        setAddressSuggestions([]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [address, showAddressSuggestions]);

  const searchAddresses = async (query: string) => {
    setIsLoadingAddresses(true);
    try {
      const results = await Location.geocodeAsync(query);

      if (results.length > 0) {
        const suggestions: AddressSuggestion[] = [];

        for (let i = 0; i < Math.min(results.length, 3); i++) {
          const result = results[i];
          try {
            const [addr] = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });

            if (addr) {
              const street = addr.street || addr.name || "";
              const city = addr.city || "";
              const region = addr.region || "";
              const postalCode = addr.postalCode || "";

              let fullAddress = "";
              const parts = [];

              if (street) parts.push(street);
              if (city) parts.push(city);
              if (region) parts.push(region);
              if (postalCode) parts.push(postalCode);

              fullAddress = parts.join(", ");

              if (fullAddress && !suggestions.some(s => s.fullAddress === fullAddress)) {
                suggestions.push({
                  displayName: street || city || fullAddress,
                  fullAddress,
                });
              }
            }
          } catch (error: any) {
            // Skipping address result due to geocoding error
          }
        }

        setAddressSuggestions(suggestions);
      } else {
        setAddressSuggestions([]);
      }
    } catch (error: any) {
      if (error.message && error.message.includes("rate limit")) {
        // Rate limit reached for address search
      }
      setAddressSuggestions([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (visible && editingDoctor) {
      setName(editingDoctor.name);
      setSpecialty(editingDoctor.specialty);
      setPhoneNumber(editingDoctor.phoneNumber);
      setAddress(editingDoctor.address);
      setNotes(editingDoctor.notes || "");
      setNpiNumber((editingDoctor as any).npiNumber || "");
    } else if (visible && !editingDoctor) {
      // Reset form for new doctor
      setName("");
      setSpecialty("");
      setPhoneNumber("");
      setAddress("");
      setNotes("");
      setNpiNumber("");
    }
  }, [visible, editingDoctor]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = Boolean(name.trim() || phoneNumber.trim());

  // Auto-scroll when name dropdown appears so it's visible above keyboard
  useEffect(() => {
    if (showNameSuggestions && npiResults.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: nameFieldYRef.current, animated: true });
      }, 150);
    }
  }, [showNameSuggestions, npiResults.length]);

  // Auto-scroll when specialty dropdown appears
  useEffect(() => {
    if (showSpecialtySuggestions && specialty && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: specialtyFieldYRef.current, animated: true });
      }, 150);
    }
  }, [showSpecialtySuggestions, specialty]);

  const handleSave = () => {
    // Only name is required
    if (!name.trim()) {
      return;
    }

    const doctorData: Partial<Doctor> & { npiNumber?: string } = {
      name: name.trim(),
      specialty: specialty.trim() || "General Practice",
      phoneNumber: phoneNumber.trim() || "",
      address: address.trim() || "",
      notes: notes.trim() || undefined,
      npiNumber: npiNumber || undefined,
    };

    if (editingDoctor) {
      updateDoctor(editingDoctor.id, doctorData);
    } else {
      const newDoctor: Doctor = {
        id: Date.now().toString(),
        ...doctorData,
        createdAt: new Date().toISOString(),
      } as Doctor;
      addDoctor(newDoctor);
    }

    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !editingDoctor) {
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

  const specialtySuggestions = useMemo(
    () => specialty
      ? fuzzyFilterStrings(commonSpecialties, specialty, 35)
      : commonSpecialties,
    [specialty]
  );

  const isFormValid = name.trim(); // Only name is required

  // Determine what to show in suggestions
  const showNPIResults = npiResults.length > 0;
  const resultCount = npiResults.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="overFullScreen" onRequestClose={handleClose}>
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="px-6 py-4" style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
            <View className="flex-row justify-between items-center">
              <Pressable
                onPress={handleClose}
                className="p-2 rounded-full"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </Pressable>
              <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
                {editingDoctor ? "Edit Doctor" : "Add Doctor"}
              </Text>
              <Pressable
                onPress={handleSave}
                disabled={!isFormValid}
                className="px-6 py-3 rounded-xl"
                style={({ pressed }) => ({
                  backgroundColor: !isFormValid ? colors.divider : pressed ? primaryDark : primary,
                  minWidth: 80,
                })}
                accessibilityRole="button"
                accessibilityLabel="Save doctor"
              >
                <Text style={{ color: isFormValid ? onPrimary : colors.textSecondary, fontSize: 18, fontWeight: "700", textAlign: "center" }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 py-6">
              {/* Database Info Banner - Dismissable */}
              <DismissableInfoBox
                id="add-doctor-provider-database"
                icon="search"
                iconColor={primary}
                lightBgColor={isDark ? colors.cardBackground : "#EFF6FF"}
                darkBgColor={colors.cardBackground}
                lightBorderColor={isDark ? colors.border : "#BFDBFE"}
                darkBorderColor={colors.border}
                title="Find Your Provider"
                message="Search by doctor name, clinic name, hospital, or facility. Results are sorted by your location."
              />

              {/* Doctor Name with Autocomplete */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Doctor or Facility Name *
              </Text>
              <View className="mb-6" onLayout={(e: LayoutChangeEvent) => {
                nameFieldYRef.current = e.nativeEvent.layout.y;
              }}>
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setShowNameSuggestions(true);
                  }}
                  onFocus={() => { setFocusedField("name"); setShowNameSuggestions(true); }}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g., Dr. Smith, Valley Hospital, Cardiology Clinic"
                  className={`${textClasses.body} px-6 py-4 rounded-xl`}
                  style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "name" ? primary : colors.border }}
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Doctor or facility name"
                />

                {/* Search Results */}
                {showNameSuggestions && (name.trim().length >= 2 || isSearchingNPI) && (
                  <View className="mt-2 rounded-xl shadow-lg" style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}>
                    {/* Loading State */}
                    {isSearchingNPI && (
                      <View className="px-6 py-4 items-center">
                        <ActivityIndicator size="small" color={primary} />
                        <Text className={`${textClasses.small} mt-2`} style={{ color: colors.textSecondary }}>
                          Searching nationwide database...
                        </Text>
                      </View>
                    )}

                    {/* Results Header */}
                    {!isSearchingNPI && showNPIResults && (
                      <>
                        <View className="px-6 py-3 border-b" style={{ backgroundColor: colors.primaryLight, borderBottomColor: primary + "40" }}>
                          <View className="flex-row items-center justify-between">
                            <Text className={`${textClasses.small} font-semibold`} style={{ color: colors.textPrimary }}>
                              {resultCount} {resultCount === 1 ? "match" : "matches"} found
                            </Text>
                            <View className="flex-row items-center">
                              {searchSource === "npi" && (
                                <View className="flex-row items-center px-2 py-1 rounded" style={{ backgroundColor: isDark ? "#064E3B" : "#DCFCE7" }}>
                                  <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                  <Text className={`${textClasses.small} ml-1`} style={{ color: colors.success }}>
                                    Live Data
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          {userState && (
                            <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                              Showing results near {userCity ? `${userCity}, ` : ""}{userState}
                            </Text>
                          )}
                        </View>

                        {/* Results List */}
                        <ScrollView
                          style={{ maxHeight: 400 }}
                          keyboardShouldPersistTaps="handled"
                          nestedScrollEnabled={true}
                        >
                          {npiResults.map((provider, index) => {
                            const isDoctor = provider.type === "individual";

                            const displayName = isDoctor
                              ? (provider.name.match(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s/i) ? provider.name : `Dr. ${provider.name}`)
                              : provider.name;

                            const practiceName = !isDoctor && provider.authorizedOfficialName
                              ? `Dr. ${provider.authorizedOfficialName}`
                              : null;

                            return (
                              <Pressable
                                key={provider.npi || `${provider.name}-${index}`}
                                onPress={() => handleSelectProvider(provider)}
                                className="flex-1 px-6 py-4"
                                style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
                              >
                                {/* Doctor/Facility badge */}
                                <View className="flex-row items-center mb-1">
                                  <View
                                    className="flex-row items-center px-2 rounded-full"
                                    style={{
                                      backgroundColor: isDoctor ? (isDark ? "#064E3B" : "#F0FDF4") : (isDark ? "#1E3A5F" : "#EFF6FF"),
                                      paddingVertical: 2,
                                    }}
                                  >
                                    <Ionicons
                                      name={isDoctor ? "person" : "business"}
                                      size={12}
                                      color={isDoctor ? colors.success : primary}
                                    />
                                    <Text style={{ color: isDoctor ? colors.success : primary, fontSize: 11, fontWeight: "600", marginLeft: 3 }}>
                                      {isDoctor ? "Doctor" : "Facility"}
                                    </Text>
                                  </View>
                                </View>

                                {/* Name */}
                                <Text
                                  className="font-bold mb-1"
                                  style={{ color: colors.textPrimary, fontSize: 18 }}
                                  numberOfLines={2}
                                >
                                  {displayName}
                                </Text>

                                {/* Specialty */}
                                <Text style={{ color: isDoctor ? colors.success : primary, fontSize: 14, marginBottom: 4 }}>
                                  {provider.specialty}
                                </Text>

                                {/* For facilities: show authorized official / doctor name */}
                                {practiceName && (
                                  <View className="flex-row items-center mb-1">
                                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                                    <Text style={{ color: colors.textSecondary, fontSize: 14, marginLeft: 4 }} numberOfLines={1}>
                                      {practiceName}
                                    </Text>
                                  </View>
                                )}

                                {/* Address */}
                                {(provider.city || provider.state || provider.address) && (
                                  <View className="flex-row items-center mb-1">
                                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                                    <Text style={{ color: colors.textSecondary, fontSize: 14, marginLeft: 4, flex: 1 }} numberOfLines={2}>
                                      {[provider.address, provider.city, provider.state, provider.zipCode]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </Text>
                                  </View>
                                )}

                                {/* Phone */}
                                {provider.phone && (
                                  <View className="flex-row items-center">
                                    <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                                    <Text style={{ color: colors.textSecondary, fontSize: 14, marginLeft: 4 }}>
                                      {provider.phone}
                                    </Text>
                                  </View>
                                )}
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </>
                    )}

                    {/* No Results */}
                    {!isSearchingNPI && !showNPIResults && name.trim().length >= 2 && (
                      <View className="px-6 py-4">
                        <Text className={`${textClasses.small} text-center`} style={{ color: colors.textSecondary }}>
                          No providers found. Try a different search term.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Specialty with Autocomplete */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Specialty (Optional)
              </Text>
              <View className="mb-6" onLayout={(e: LayoutChangeEvent) => {
                specialtyFieldYRef.current = e.nativeEvent.layout.y;
              }}>
                <TextInput
                  value={specialty}
                  onChangeText={(text) => {
                    setSpecialty(text);
                    setShowSpecialtySuggestions(true);
                  }}
                  onFocus={() => { setFocusedField("specialty"); setShowSpecialtySuggestions(true); }}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g., Cardiology"
                  className={`${textClasses.body} px-6 py-4 rounded-xl`}
                  style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "specialty" ? primary : colors.border }}
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Specialty"
                />

                {/* Specialty Suggestions */}
                {showSpecialtySuggestions && specialtySuggestions.length > 0 && (
                  <View className="mt-2 rounded-xl shadow-lg" style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}>
                    <ScrollView
                      style={{ maxHeight: 300 }}
                      keyboardShouldPersistTaps="handled"
                      nestedScrollEnabled={true}
                    >
                      <View className="py-2">
                        <Text className={`${textClasses.small} px-6 py-2`} style={{ color: colors.textSecondary }}>
                          Tap to select ({specialtySuggestions.length} options)
                        </Text>
                        {specialtySuggestions.map((suggestion) => (
                          <Pressable
                            key={suggestion}
                            onPress={() => {
                              setSpecialty(suggestion);
                              setShowSpecialtySuggestions(false);
                              Keyboard.dismiss();
                            }}
                            className="flex-1 px-6 py-5"
                            style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
                          >
                            <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>{suggestion}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Phone Number */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Phone Number (Optional)
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g., (555) 123-4567"
                keyboardType="phone-pad"
                className={`${textClasses.body} px-6 py-4 rounded-xl mb-6`}
                style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "phone" ? primary : colors.border }}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Phone number"
                maxLength={14}
              />

              {/* Address with Autocomplete */}
              <Text className={`text-lg font-semibold mb-2`} style={{ color: colors.textPrimary }}>
                Address (Optional)
              </Text>
              <View className="mb-6">
                <TextInput
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    setShowAddressSuggestions(true);
                  }}
                  onFocus={() => { setFocusedField("address"); setShowAddressSuggestions(true); }}
                  onBlur={() => { setFocusedField(null); setTimeout(() => setShowAddressSuggestions(false), 200); }}
                  placeholder="e.g., 123 Medical Center Dr"
                  multiline
                  numberOfLines={2}
                  className={`${textClasses.body} px-6 py-4 rounded-xl`}
                  style={{ backgroundColor: isDark ? "#1F2937" : "#E5E7EB", color: colors.textPrimary, borderWidth: 1.5, borderColor: focusedField === "address" ? primary : colors.border }}
                  placeholderTextColor={colors.textSecondary}
                  textAlignVertical="top"
                  accessibilityLabel="Address"
                />

                {/* Address Suggestions */}
                {showAddressSuggestions && (
                  <View className="mt-2">
                    {isLoadingAddresses && (
                      <View className="rounded-xl p-4 items-center" style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}>
                        <ActivityIndicator size="small" color={primary} />
                        <Text className={`${textClasses.small} mt-2`} style={{ color: colors.textSecondary }}>
                          Searching addresses...
                        </Text>
                      </View>
                    )}

                    {!isLoadingAddresses && addressSuggestions.length > 0 && (
                      <View className="rounded-xl shadow-lg" style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: primary }}>
                        <View className="py-2">
                          <Text className={`${textClasses.small} px-6 py-2`} style={{ color: colors.textSecondary }}>
                            Tap to select ({addressSuggestions.length} results)
                          </Text>
                          {addressSuggestions.map((suggestion, index) => (
                            <Pressable
                              key={index}
                              onPress={() => {
                                setAddress(suggestion.fullAddress);
                                setShowAddressSuggestions(false);
                                Keyboard.dismiss();
                              }}
                              className="flex-1 px-6 py-5"
                              style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}
                            >
                              <Text className={`${textClasses.body} font-semibold mb-1`} style={{ color: colors.textPrimary }}>
                                {suggestion.displayName}
                              </Text>
                              <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                                {suggestion.fullAddress}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>

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

              {/* NPI Number (if found) */}
              {npiNumber && (
                <View className="rounded-xl p-4 mb-6" style={{ backgroundColor: isDark ? "#111827" : "#F9FAFB", borderWidth: 1, borderColor: colors.divider }}>
                  <View className="flex-row items-center">
                    <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                    <Text className={`${textClasses.small} font-semibold ml-2`} style={{ color: colors.textSecondary }}>
                      NPI: {npiNumber}
                    </Text>
                  </View>
                  <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                    National Provider Identifier - verified with CMS
                  </Text>
                </View>
              )}

              <Text className={`${textClasses.small} text-center mb-6`} style={{ color: colors.textSecondary }}>
                * Only name is required
              </Text>
            </View>
          </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
