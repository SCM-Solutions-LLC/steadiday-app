import React, { useState, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { Screen } from "../components/Screen";
import { useHealthStore } from "../state/stores/healthStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useAppStore } from "../state/appStore";
import { Ionicons } from "@expo/vector-icons";
import { getTextSizeClasses } from "../utils/textSizes";
import { Doctor } from "../types/app";
import AddDoctorModal from "../components/AddDoctorModal";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import {
  useToast,
  EmptyState,
  RefreshableScrollView,
  SearchInput,
} from "../components/ui";
import { useNavigation } from "@react-navigation/native";

export default function DoctorsScreen() {
  // Health data from useHealthStore
  const doctors = useHealthStore((s) => s.doctors);
  const addDoctor = useHealthStore((s) => s.addDoctor);
  const removeDoctor = useHealthStore((s) => s.removeDoctor);

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);

  // Non-health data from useAppStore
  const performTwoWaySync = useAppStore((s) => s.performTwoWaySync);

  const textClasses = getTextSizeClasses(textSize);
  const { colors, primary } = useTheme();
  const navigation = useNavigation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // For undo functionality
  const deletedDoctorRef = useRef<Doctor | null>(null);

  const { showSuccess, showError, showUndo, ToastComponent } = useToast();

  const handleAddDoctor = useCallback(() => {
    setEditingDoctor(undefined);
    setShowAddModal(true);
  }, []);

  // Set up header right button for adding
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleAddDoctor}
          className="mr-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add-circle" size={28} color={primary} />
        </Pressable>
      ),
    });
  }, [navigation, primary, handleAddDoctor]);

  // Memoized filtered doctors

  // Memoized filtered doctors
  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    const query = searchQuery.toLowerCase();
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.phoneNumber.includes(query) ||
        doctor.address.toLowerCase().includes(query)
    );
  }, [doctors, searchQuery]);

  const handleEditDoctor = useCallback((doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowAddModal(true);
  }, []);

  const handleDeleteDoctor = useCallback((doctor: Doctor) => {
    // Store for potential undo
    deletedDoctorRef.current = doctor;

    // Remove immediately
    removeDoctor(doctor.id);

    // Show undo toast
    showUndo(`"${doctor.name}" deleted`, () => {
      if (deletedDoctorRef.current) {
        addDoctor(deletedDoctorRef.current);
        showSuccess("Doctor restored!");
        deletedDoctorRef.current = null;
      }
    });
  }, [removeDoctor, addDoctor, showUndo, showSuccess]);

  const handleRefresh = useCallback(async () => {
    try {
      await performTwoWaySync();
      showSuccess("Synced successfully!");
    } catch (error) {
      showError("Sync failed. Please try again.");
    }
  }, [performTwoWaySync, showSuccess, showError]);

  const handleCallDoctor = useCallback((phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  }, []);

  const handleOpenAddress = useCallback((address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`maps://app?daddr=${encodedAddress}`);
  }, []);

  const getSpecialtyIcon = useCallback((specialty: string): keyof typeof Ionicons.glyphMap => {
    const lowerSpecialty = specialty.toLowerCase();
    if (lowerSpecialty.includes("cardio") || lowerSpecialty.includes("heart")) return "heart";
    if (lowerSpecialty.includes("dent")) return "fitness";
    if (lowerSpecialty.includes("eye") || lowerSpecialty.includes("ophthalm")) return "eye";
    if (lowerSpecialty.includes("ortho") || lowerSpecialty.includes("bone")) return "body";
    if (lowerSpecialty.includes("neuro") || lowerSpecialty.includes("brain")) return "bulb";
    if (lowerSpecialty.includes("derma") || lowerSpecialty.includes("skin")) return "hand-left";
    return "medical";
  }, []);

  return (
    <Screen variant="static" edges={["bottom"]}>
      <RefreshableScrollView
        onRefresh={handleRefresh}
        className="flex-1"
      >
        <View className="px-6 py-4">
          {/* Search Input - only show if there are doctors */}
          {doctors.length > 0 && (
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search doctors..."
            />
          )}

          {/* Search with no results */}
          {searchQuery.trim() && filteredDoctors.length === 0 && (
            <EmptyState
              icon="search"
              title="No results found"
              description={`No doctors match "${searchQuery}". Try different keywords.`}
              actionLabel="Clear Search"
              onAction={() => setSearchQuery("")}
            />
          )}

          {/* Empty State */}
          {!searchQuery.trim() && doctors.length === 0 && (
            <EmptyState
              icon="person"
              title="No doctors added"
              description="Keep your healthcare providers organized in one place. Add your doctors for quick access to their contact information."
              actionLabel="Add Doctor"
              onAction={handleAddDoctor}
            />
          )}

          {/* Doctors List */}
          {filteredDoctors.map((doctor) => (
            <View
              key={doctor.id}
              className="rounded-2xl p-5 mb-3 shadow-sm"
              style={{ backgroundColor: colors.cardBackground }}
            >
              {/* Doctor Info */}
              <View className="flex-row items-start mb-4">
                <View className="rounded-full p-3 mr-4" style={{ backgroundColor: colors.primaryLight }}>
                  <Ionicons
                    name={getSpecialtyIcon(doctor.specialty)}
                    size={28}
                    color={primary}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`${textClasses.body} font-semibold mb-1`} style={{ color: colors.textPrimary }}>
                    {doctor.name}
                  </Text>
                  <Text className={`${textClasses.small} font-semibold mb-1`} style={{ color: primary }}>
                    {doctor.specialty}
                  </Text>
                  {doctor.notes && (
                    <Text className={`${textClasses.small} mt-1`} style={{ color: colors.textSecondary }}>
                      {doctor.notes}
                    </Text>
                  )}
                </View>
              </View>

              {/* Contact Info */}
              <View className="border-t pt-3 mb-3" style={{ borderTopColor: colors.border }}>
                {/* Phone */}
                <Pressable
                  onPress={() => handleCallDoctor(doctor.phoneNumber)}
                  className="flex-row items-center mb-2 active:opacity-60"
                  style={{ minHeight: 48 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${doctor.name}`}
                >
                  <Ionicons name="call" size={18} color={primary} />
                  <Text className={`${textClasses.body} ml-3 font-semibold`} style={{ color: primary }}>
                    {doctor.phoneNumber}
                  </Text>
                </Pressable>

                {/* Address */}
                <Pressable
                  onPress={() => handleOpenAddress(doctor.address)}
                  className="flex-row items-start active:opacity-60"
                  style={{ minHeight: 48 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Open directions to ${doctor.name}`}
                >
                  <Ionicons name="location" size={18} color={primary} />
                  <Text className={`${textClasses.body} ml-3 flex-1 font-semibold`} style={{ color: primary }}>
                    {doctor.address}
                  </Text>
                </Pressable>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-2">
                <Pressable
                  onPress={() => handleCallDoctor(doctor.phoneNumber)}
                  className="flex-1 py-3 rounded-xl active:opacity-80 flex-row items-center justify-center mr-2"
                  style={{ backgroundColor: colors.success, minHeight: 48 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${doctor.name}`}
                >
                  <Ionicons name="call" size={18} color="white" />
                  <Text className={`${textClasses.small} text-white ml-2 font-semibold`}>Call</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleEditDoctor(doctor)}
                  className="flex-1 py-3 rounded-xl flex-row items-center justify-center mr-2"
                  style={{ backgroundColor: colors.primaryLight, minHeight: 48 }}
                  accessibilityRole="button"
                  accessibilityLabel="Edit doctor"
                >
                  <Ionicons name="create-outline" size={18} color={primary} />
                  <Text className={`${textClasses.small} ml-2 font-semibold`} style={{ color: primary }}>Edit</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteDoctor(doctor)}
                  className="flex-1 py-3 rounded-xl active:opacity-80 flex-row items-center justify-center"
                  style={{ backgroundColor: colors.errorBackground, minHeight: 48 }}
                  accessibilityRole="button"
                  accessibilityLabel="Delete doctor"
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text className={`${textClasses.small} ml-2 font-semibold`} style={{ color: colors.error }}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </RefreshableScrollView>

      {/* Add/Edit Doctor Modal */}
      <AddDoctorModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingDoctor(undefined);
        }}
        editingDoctor={editingDoctor}
      />

      {/* Toast notifications */}
      {ToastComponent}
    </Screen>
  );
}
