import React, { useState, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Screen } from "../components/Screen";
import { useHealthStore } from "../state/stores/healthStore";
import { useSettingsStore } from "../state/stores/settingsStore";
import { useAppStore } from "../state/appStore";
import { Ionicons } from "@expo/vector-icons";
import { getTextSizeClasses } from "../utils/textSizes";
import { InsuranceCard } from "../types/app";
import AddInsuranceModal from "../components/AddInsuranceModal";
import MaskedText from "../components/MaskedText";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import {
  useToast,
  EmptyState,
  RefreshableScrollView,
  SearchInput,
} from "../components/ui";
import { useNavigation } from "@react-navigation/native";

/**
 * SECURITY: Attack Story 9 Defense - Screen Sharing Exposure
 * This screen now uses MaskedText to protect insurance information
 * when users share their screen over video calls
 */

export default function InsuranceScreen() {
  const { colors, primary } = useTheme();
  const navigation = useNavigation();

  // Health data from useHealthStore
  const insuranceCards = useHealthStore((s) => s.insuranceCards);
  const addInsuranceCard = useHealthStore((s) => s.addInsuranceCard);
  const removeInsuranceCard = useHealthStore((s) => s.removeInsuranceCard);

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);

  // Non-health data from useAppStore
  const performTwoWaySync = useAppStore((s) => s.performTwoWaySync);

  const textClasses = getTextSizeClasses(textSize);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<InsuranceCard | undefined>(undefined);
  const [selectedCard, setSelectedCard] = useState<InsuranceCard | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // For undo functionality
  const deletedCardRef = useRef<InsuranceCard | null>(null);

  const { showSuccess, showError, showUndo, ToastComponent } = useToast();

  const handleAddCard = useCallback(() => {
    setEditingCard(undefined);
    setShowAddModal(true);
  }, []);

  // Set up header right button for adding
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleAddCard}
          className="mr-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add-circle" size={28} color={primary} />
        </Pressable>
      ),
    });
  }, [navigation, primary, handleAddCard]);

  // Memoized filtered cards
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return insuranceCards;
    const query = searchQuery.toLowerCase();
    return insuranceCards.filter(
      (card) =>
        card.providerName.toLowerCase().includes(query) ||
        card.policyHolder.toLowerCase().includes(query) ||
        card.memberId.toLowerCase().includes(query) ||
        card.type.toLowerCase().includes(query)
    );
  }, [insuranceCards, searchQuery]);

  const handleEditCard = useCallback((card: InsuranceCard) => {
    setEditingCard(card);
    setShowAddModal(true);
  }, []);

  const handleDeleteCard = useCallback((card: InsuranceCard) => {
    // Store for potential undo
    deletedCardRef.current = card;

    // Remove immediately
    removeInsuranceCard(card.id);

    // Show undo toast
    showUndo(`"${card.providerName}" deleted`, () => {
      if (deletedCardRef.current) {
        addInsuranceCard(deletedCardRef.current);
        showSuccess("Insurance card restored!");
        deletedCardRef.current = null;
      }
    });
  }, [removeInsuranceCard, addInsuranceCard, showUndo, showSuccess]);

  const handleRefresh = useCallback(async () => {
    try {
      await performTwoWaySync();
      showSuccess("Synced successfully!");
    } catch (error) {
      showError("Sync failed. Please try again.");
    }
  }, [performTwoWaySync, showSuccess, showError]);

  const handleViewCard = useCallback((card: InsuranceCard) => {
    setSelectedCard(card);
  }, []);

  const getInsuranceTypeLabel = useCallback((type: InsuranceCard["type"]) => {
    switch (type) {
      case "health":
        return "Health";
      case "dental":
        return "Dental";
      case "vision":
        return "Vision";
    }
  }, []);

  const getInsuranceIcon = useCallback((type: InsuranceCard["type"]) => {
    switch (type) {
      case "health":
        return "medical";
      case "dental":
        return "fitness";
      case "vision":
        return "eye";
    }
  }, []);

  const getInsuranceColor = useCallback((type: InsuranceCard["type"]) => {
    switch (type) {
      case "health":
        return "#2563eb"; // blue
      case "dental":
        return "#16a34a"; // green
      case "vision":
        return "#9333ea"; // purple
    }
  }, []);

  const healthCards = filteredCards.filter((c) => c.type === "health");
  const dentalCards = filteredCards.filter((c) => c.type === "dental");
  const visionCards = filteredCards.filter((c) => c.type === "vision");

  const renderInsuranceCard = useCallback((card: InsuranceCard, bgColor: string) => (
    <Pressable
      key={card.id}
      onPress={() => handleViewCard(card)}
      style={{ backgroundColor: colors.cardBackground }}
      className="rounded-2xl p-5 mb-3 shadow-sm active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={`View ${card.providerName} ${card.type} insurance card`}
    >
      <View className="flex-row items-center mb-3">
        <View style={{ backgroundColor: bgColor }} className="rounded-full p-3 mr-4">
          <Ionicons name={getInsuranceIcon(card.type)} size={28} color={getInsuranceColor(card.type)} />
        </View>
        <View className="flex-1">
          <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
            {card.providerName}
          </Text>
          <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
            Policy Holder: {card.policyHolder}
          </Text>
        </View>
      </View>
      {/* SECURITY: Mask sensitive insurance information */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.divider }} className="pt-3 space-y-2">
        <View>
          <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>Member ID:</Text>
          <MaskedText
            value={card.memberId}
            maskByDefault={true}
            textSize={textClasses.body}
            inCard={true}
          />
        </View>
        {card.groupNumber && (
          <View>
            <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>Group Number:</Text>
            <MaskedText
              value={card.groupNumber}
              maskByDefault={true}
              textSize={textClasses.body}
              inCard={true}
            />
          </View>
        )}
      </View>
      <View className="flex-row mt-4 space-x-2">
        <Pressable
          onPress={() => handleEditCard(card)}
          style={{ backgroundColor: colors.primaryLight, minHeight: 48 }}
          className="flex-1 py-3 rounded-xl active:opacity-80 flex-row items-center justify-center mr-2"
          accessibilityRole="button"
          accessibilityLabel="Edit card"
        >
          <Ionicons name="create-outline" size={20} color={primary} />
          <Text className={`${textClasses.small} ml-2 font-semibold`} style={{ color: primary }}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => handleDeleteCard(card)}
          className="flex-1 bg-red-50 py-3 rounded-xl active:bg-red-100 flex-row items-center justify-center"
          style={{ minHeight: 48 }}
          accessibilityRole="button"
          accessibilityLabel="Delete card"
        >
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
          <Text className={`${textClasses.small} text-red-600 ml-2 font-semibold`}>Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  ), [colors, textClasses, primary, handleViewCard, handleEditCard, handleDeleteCard, getInsuranceIcon, getInsuranceColor]);

  return (
    <Screen variant="static" edges={["bottom"]}>
      <RefreshableScrollView
        onRefresh={handleRefresh}
        className="flex-1"
      >
        <View className="px-6 py-4">
          {/* Search Input - only show if there are cards */}
          {insuranceCards.length > 0 && (
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search insurance cards..."
            />
          )}

          {/* Search with no results */}
          {searchQuery.trim() && filteredCards.length === 0 && (
            <EmptyState
              icon="search"
              title="No results found"
              description={`No insurance cards match "${searchQuery}". Try different keywords.`}
              actionLabel="Clear Search"
              onAction={() => setSearchQuery("")}
            />
          )}

          {/* Empty State */}
          {!searchQuery.trim() && insuranceCards.length === 0 && (
            <EmptyState
              icon="card"
              title="No insurance cards"
              description="Store your insurance information securely. Having your cards ready makes check-ins at appointments faster."
              tip="Tip: You can take a photo of your insurance card and we will automatically extract the information"
              actionLabel="Add Insurance Card"
              onAction={handleAddCard}
            />
          )}

          {/* Health Insurance */}
          {healthCards.length > 0 && (
            <View className="mb-6">
              <Text className={`${textClasses.subtitle} mb-3`} style={{ color: colors.textPrimary }}>
                Health Insurance
              </Text>
              {healthCards.map((card) => renderInsuranceCard(card, colors.primaryLight))}
            </View>
          )}

          {/* Dental Insurance */}
          {dentalCards.length > 0 && (
            <View className="mb-6">
              <Text className={`${textClasses.subtitle} mb-3`} style={{ color: colors.textPrimary }}>
                Dental Insurance
              </Text>
              {dentalCards.map((card) => renderInsuranceCard(card, "#dcfce7"))}
            </View>
          )}

          {/* Vision Insurance */}
          {visionCards.length > 0 && (
            <View className="mb-6">
              <Text className={`${textClasses.subtitle} mb-3`} style={{ color: colors.textPrimary }}>
                Vision Insurance
              </Text>
              {visionCards.map((card) => renderInsuranceCard(card, "#f3e8ff"))}
            </View>
          )}
        </View>
      </RefreshableScrollView>

      {/* Add/Edit Insurance Modal */}
      <AddInsuranceModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCard(undefined);
        }}
        editingCard={editingCard}
      />

      {/* View Card Detail Modal */}
      <Modal
        visible={!!selectedCard}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedCard(undefined)}
      >
        <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.cardBackground }} className="rounded-3xl p-8 w-full max-w-md shadow-2xl">
            {selectedCard && (
              <>
                {/* Title Section */}
                <View className="mb-6">
                  <Text className={`${textClasses.title} font-bold text-center mb-2`} style={{ color: colors.textPrimary }}>
                    {selectedCard.providerName}
                  </Text>
                  <Text className={`${textClasses.body} text-center`} style={{ color: colors.textSecondary }}>
                    {getInsuranceTypeLabel(selectedCard.type)} Insurance
                  </Text>
                </View>

                <View className="flex-row items-center mb-6">
                  <View
                    className="rounded-full p-3 mr-4"
                    style={{ backgroundColor: `${getInsuranceColor(selectedCard.type)}20` }}
                  >
                    <Ionicons
                      name={getInsuranceIcon(selectedCard.type)}
                      size={32}
                      color={getInsuranceColor(selectedCard.type)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                      Policy Holder
                    </Text>
                    <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                      {selectedCard.policyHolder}
                    </Text>
                  </View>
                </View>

                {/* Card Details */}
                <View style={{ backgroundColor: colors.background }} className="rounded-2xl p-5 mb-4">
                  <View className="mb-4">
                    <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>Policy Holder</Text>
                    <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                      {selectedCard.policyHolder}
                    </Text>
                  </View>
                  <View className="mb-4">
                    <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>Member ID</Text>
                    <Text className={`${textClasses.body} font-mono font-semibold`} style={{ color: colors.textPrimary }}>
                      {selectedCard.memberId}
                    </Text>
                  </View>
                  {selectedCard.groupNumber && (
                    <View className="mb-4">
                      <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>Group Number</Text>
                      <Text className={`${textClasses.body} font-mono font-semibold`} style={{ color: colors.textPrimary }}>
                        {selectedCard.groupNumber}
                      </Text>
                    </View>
                  )}
                  {selectedCard.phoneNumber && (
                    <View className="mb-4">
                      <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>Customer Service</Text>
                      <Text className={`${textClasses.body} font-semibold`} style={{ color: colors.textPrimary }}>
                        {selectedCard.phoneNumber}
                      </Text>
                    </View>
                  )}
                  {selectedCard.notes && (
                    <View>
                      <Text className={`${textClasses.small} mb-1`} style={{ color: colors.textSecondary }}>Notes</Text>
                      <Text className={`${textClasses.body}`} style={{ color: colors.textPrimary }}>
                        {selectedCard.notes}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Close Button */}
                <Pressable
                  onPress={() => setSelectedCard(undefined)}
                  style={{ backgroundColor: colors.border, minHeight: 56 }}
                  className="rounded-2xl p-5 active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text className={`${textClasses.button} text-center`} style={{ color: colors.textPrimary }}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Toast notifications */}
      {ToastComponent}
    </Screen>
  );
}
