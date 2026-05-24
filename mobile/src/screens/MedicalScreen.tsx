import React, { useState, useCallback, useRef } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { Screen } from "../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useHealthStore } from "../state/stores/healthStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useTipStore } from "../state/stores/tipStore";
import { useTheme } from "../utils/useTheme";
import { getTextSizeClasses } from "../utils/textSizes";
import { Doctor, InsuranceCard } from "../types/app";
import AddDoctorModal from "../components/AddDoctorModal";
import AddInsuranceModal from "../components/AddInsuranceModal";
import MaskedText from "../components/MaskedText";
import { useToast } from "../components/ui";

export default function MedicalScreen() {
  const { colors, primary } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const textClasses = getTextSizeClasses(textSize);

  const insuranceCards = useHealthStore((s) => s.insuranceCards);
  const addInsuranceCard = useHealthStore((s) => s.addInsuranceCard);
  const removeInsuranceCard = useHealthStore((s) => s.removeInsuranceCard);
  const doctors = useHealthStore((s) => s.doctors);
  const addDoctor = useHealthStore((s) => s.addDoctor);
  const removeDoctor = useHealthStore((s) => s.removeDoctor);

  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | undefined>(undefined);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [editingCard, setEditingCard] = useState<InsuranceCard | undefined>(undefined);

  const deletedDoctorRef = useRef<Doctor | null>(null);
  const deletedCardRef = useRef<InsuranceCard | null>(null);

  const { showSuccess, showUndo, ToastComponent } = useToast();

  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);

  const handleAddDoctor = useCallback(() => {
    setEditingDoctor(undefined);
    setShowDoctorModal(true);
  }, []);

  const handleEditDoctor = useCallback((doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowDoctorModal(true);
  }, []);

  const handleDeleteDoctor = useCallback((doctor: Doctor) => {
    deletedDoctorRef.current = doctor;
    removeDoctor(doctor.id);
    showUndo(`"${doctor.name}" deleted`, () => {
      if (deletedDoctorRef.current) {
        addDoctor(deletedDoctorRef.current);
        showSuccess("Doctor restored!");
        deletedDoctorRef.current = null;
      }
    });
  }, [removeDoctor, addDoctor, showUndo, showSuccess]);

  const handleAddInsurance = useCallback(() => {
    setEditingCard(undefined);
    setShowInsuranceModal(true);
  }, []);

  const handleEditInsurance = useCallback((card: InsuranceCard) => {
    setEditingCard(card);
    setShowInsuranceModal(true);
  }, []);

  const handleDeleteInsurance = useCallback((card: InsuranceCard) => {
    deletedCardRef.current = card;
    removeInsuranceCard(card.id);
    showUndo(`"${card.providerName}" deleted`, () => {
      if (deletedCardRef.current) {
        addInsuranceCard(deletedCardRef.current);
        showSuccess("Insurance card restored!");
        deletedCardRef.current = null;
      }
    });
  }, [removeInsuranceCard, addInsuranceCard, showUndo, showSuccess]);

  const handleCallDoctor = useCallback((phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  }, []);

  const handleOpenAddress = useCallback((address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`maps://app?daddr=${encodedAddress}`);
  }, []);

  const getSpecialtyIcon = useCallback((specialty: string): keyof typeof Ionicons.glyphMap => {
    const lower = specialty.toLowerCase();
    if (lower.includes("cardio") || lower.includes("heart")) return "heart";
    if (lower.includes("dent")) return "fitness";
    if (lower.includes("eye") || lower.includes("ophthalm")) return "eye";
    if (lower.includes("ortho") || lower.includes("bone")) return "body";
    if (lower.includes("neuro") || lower.includes("brain")) return "bulb";
    if (lower.includes("derma") || lower.includes("skin")) return "hand-left";
    return "medical";
  }, []);

  const getInsuranceColor = useCallback((type: InsuranceCard["type"]) => {
    switch (type) {
      case "health": return "#2563eb";
      case "dental": return "#16a34a";
      case "vision": return "#9333ea";
    }
  }, []);

  const getInsuranceIcon = useCallback((type: InsuranceCard["type"]): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "health": return "medical";
      case "dental": return "fitness";
      case "vision": return "eye";
    }
  }, []);

  const getInsuranceLabel = useCallback((type: InsuranceCard["type"]) => {
    switch (type) {
      case "health": return "Health";
      case "dental": return "Dental";
      case "vision": return "Vision";
    }
  }, []);

  return (
    <Screen variant="static" edges={["top"]} extraBottomPadding={0}>
      <View className="flex-1">
        {/* Header */}
        <View style={{ paddingHorizontal: 32, paddingVertical: 24, backgroundColor: colors.cardBackground, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 30, fontWeight: "600", color: colors.textPrimary }}>Medical</Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8 }}>
            Manage your health information
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
          <View className="px-6 py-6">
            {/* Info Banner */}
            {!isCardDismissed("medical-hub-info") && (
              <View style={{ backgroundColor: colors.primaryLight, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: colors.primary }}>
                <View className="flex-row items-start">
                  <Ionicons name="information-circle" size={24} color={colors.primary} style={{ marginTop: 2 }} />
                  <View className="flex-1 ml-3">
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 }}>
                      Your Medical Hub
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20 }}>
                      Access your insurance cards and doctor contacts in one place.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => dismissInfoCard("medical-hub-info")}
                    className="p-1 ml-2 active:opacity-50"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={24} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* ===== MY DOCTORS SECTION ===== */}
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    <Ionicons name="people" size={22} color={primary} />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>
                    My Doctors
                  </Text>
                </View>
                <Pressable
                  onPress={handleAddDoctor}
                  className="flex-row items-center px-4 py-2 rounded-full active:opacity-70"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <Ionicons name="add" size={20} color={primary} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: primary, marginLeft: 4 }}>Add</Text>
                </Pressable>
              </View>

              {doctors.length === 0 ? (
                <Pressable
                  onPress={handleAddDoctor}
                  className="rounded-2xl p-6 items-center active:opacity-80"
                  style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, borderStyle: "dashed" }}
                >
                  <Ionicons name="person-add-outline" size={32} color={colors.textTertiary} />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary, marginTop: 12 }}>
                    Add your first doctor
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textTertiary, marginTop: 4, textAlign: "center" }}>
                    Keep your healthcare providers organized in one place
                  </Text>
                </Pressable>
              ) : (
                doctors.map((doctor) => (
                  <View
                    key={doctor.id}
                    className="rounded-2xl p-5 mb-3"
                    style={{ backgroundColor: colors.cardBackground }}
                  >
                    <View className="flex-row items-start mb-3">
                      <View className="rounded-full p-3 mr-4" style={{ backgroundColor: colors.primaryLight }}>
                        <Ionicons name={getSpecialtyIcon(doctor.specialty)} size={24} color={primary} />
                      </View>
                      <View className="flex-1">
                        <Text className={`${textClasses.body} font-bold`} style={{ color: colors.textPrimary, fontSize: 17 }}>
                          {doctor.name}
                        </Text>
                        <Text className={`${textClasses.small} font-semibold`} style={{ color: primary, marginTop: 2 }}>
                          {doctor.specialty}
                        </Text>
                        {doctor.notes && (
                          <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary, marginTop: 4 }}>
                            {doctor.notes}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Contact details */}
                    <View className="border-t pt-3 mb-3" style={{ borderTopColor: colors.border }}>
                      {doctor.phoneNumber ? (
                        <Pressable
                          onPress={() => handleCallDoctor(doctor.phoneNumber)}
                          className="flex-row items-center mb-2 active:opacity-60"
                          style={{ minHeight: 40 }}
                        >
                          <Ionicons name="call" size={16} color={primary} />
                          <Text className={`${textClasses.small} ml-3 font-semibold`} style={{ color: primary }}>
                            {doctor.phoneNumber}
                          </Text>
                        </Pressable>
                      ) : null}
                      {doctor.address ? (
                        <Pressable
                          onPress={() => handleOpenAddress(doctor.address)}
                          className="flex-row items-start active:opacity-60"
                          style={{ minHeight: 40 }}
                        >
                          <Ionicons name="location" size={16} color={primary} style={{ marginTop: 2 }} />
                          <Text className={`${textClasses.small} ml-3 flex-1 font-semibold`} style={{ color: primary }}>
                            {doctor.address}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {/* Actions */}
                    <View className="flex-row">
                      <Pressable
                        onPress={() => handleCallDoctor(doctor.phoneNumber)}
                        className="flex-1 py-3 rounded-xl active:opacity-80 flex-row items-center justify-center mr-2"
                        style={{ backgroundColor: colors.success, minHeight: 44 }}
                      >
                        <Ionicons name="call" size={16} color="white" />
                        <Text className="text-white ml-2 font-semibold" style={{ fontSize: 14 }}>Call</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleEditDoctor(doctor)}
                        className="flex-1 py-3 rounded-xl active:opacity-80 flex-row items-center justify-center mr-2"
                        style={{ backgroundColor: colors.primaryLight, minHeight: 44 }}
                      >
                        <Ionicons name="create-outline" size={16} color={primary} />
                        <Text className="ml-2 font-semibold" style={{ color: primary, fontSize: 14 }}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteDoctor(doctor)}
                        className="flex-1 py-3 rounded-xl active:opacity-80 flex-row items-center justify-center"
                        style={{ backgroundColor: colors.errorBackground, minHeight: 44 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                        <Text className="ml-2 font-semibold" style={{ color: colors.error, fontSize: 14 }}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* ===== INSURANCE CARDS SECTION ===== */}
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    <Ionicons name="card" size={22} color={primary} />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary }}>
                    Insurance Cards
                  </Text>
                </View>
                <Pressable
                  onPress={handleAddInsurance}
                  className="flex-row items-center px-4 py-2 rounded-full active:opacity-70"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <Ionicons name="add" size={20} color={primary} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: primary, marginLeft: 4 }}>Add</Text>
                </Pressable>
              </View>

              {insuranceCards.length === 0 ? (
                <Pressable
                  onPress={handleAddInsurance}
                  className="rounded-2xl p-6 items-center active:opacity-80"
                  style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, borderStyle: "dashed" }}
                >
                  <Ionicons name="card-outline" size={32} color={colors.textTertiary} />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary, marginTop: 12 }}>
                    Add your first insurance card
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textTertiary, marginTop: 4, textAlign: "center" }}>
                    Store your insurance information securely for quick access
                  </Text>
                </Pressable>
              ) : (
                insuranceCards.map((card) => {
                  const typeColor = getInsuranceColor(card.type);
                  return (
                    <View
                      key={card.id}
                      className="rounded-2xl p-5 mb-3"
                      style={{ backgroundColor: colors.cardBackground }}
                    >
                      <View className="flex-row items-center mb-3">
                        <View
                          className="rounded-full p-3 mr-4"
                          style={{ backgroundColor: typeColor + "20" }}
                        >
                          <Ionicons name={getInsuranceIcon(card.type)} size={24} color={typeColor} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className={`${textClasses.body} font-bold`} style={{ color: colors.textPrimary, fontSize: 17 }}>
                              {card.providerName}
                            </Text>
                          </View>
                          <View className="flex-row items-center mt-1">
                            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: typeColor + "20" }}>
                              <Text style={{ fontSize: 12, fontWeight: "600", color: typeColor }}>
                                {getInsuranceLabel(card.type)}
                              </Text>
                            </View>
                            <Text className={`${textClasses.small} ml-2`} style={{ color: colors.textSecondary }}>
                              {card.policyHolder}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Card details */}
                      <View className="border-t pt-3 mb-3" style={{ borderTopColor: colors.border }}>
                        <View className="mb-2">
                          <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>Member ID</Text>
                          <MaskedText
                            value={card.memberId}
                            maskByDefault={true}
                            textSize={textClasses.body}
                            inCard={true}
                          />
                        </View>
                        {card.groupNumber && (
                          <View className="mb-2">
                            <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>Group Number</Text>
                            <MaskedText
                              value={card.groupNumber}
                              maskByDefault={true}
                              textSize={textClasses.body}
                              inCard={true}
                            />
                          </View>
                        )}
                      </View>

                      {/* Actions */}
                      <View className="flex-row">
                        <Pressable
                          onPress={() => handleEditInsurance(card)}
                          className="flex-1 py-3 rounded-xl active:opacity-80 flex-row items-center justify-center mr-2"
                          style={{ backgroundColor: colors.primaryLight, minHeight: 44 }}
                        >
                          <Ionicons name="create-outline" size={16} color={primary} />
                          <Text className="ml-2 font-semibold" style={{ color: primary, fontSize: 14 }}>Edit</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteInsurance(card)}
                          className="flex-1 py-3 rounded-xl active:opacity-80 flex-row items-center justify-center"
                          style={{ backgroundColor: colors.errorBackground, minHeight: 44 }}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                          <Text className="ml-2 font-semibold" style={{ color: colors.error, fontSize: 14 }}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Modals */}
      <AddDoctorModal
        visible={showDoctorModal}
        onClose={() => {
          setShowDoctorModal(false);
          setEditingDoctor(undefined);
        }}
        editingDoctor={editingDoctor}
      />
      <AddInsuranceModal
        visible={showInsuranceModal}
        onClose={() => {
          setShowInsuranceModal(false);
          setEditingCard(undefined);
        }}
        editingCard={editingCard}
      />

      {ToastComponent}
    </Screen>
  );
}
