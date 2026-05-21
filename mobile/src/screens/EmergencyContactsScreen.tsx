import React, { useState, useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Modal, Image, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Keep for modal internal styling only
import { Screen } from "../components/Screen";
import { useUserStore } from "../state/stores/userStore";
import { useAppStore } from "../state/appStore";
import { Ionicons } from "@expo/vector-icons";
import { EmergencyContact } from "../types/app";
import { formatPhoneNumber } from "../utils/phoneFormatter";
import { promptAndSendOptIn, promptAndSendOptInForMultiple } from "../utils/optInSms";
import ContactImportModal from "../components/ContactImportModal";
import { PhoneContact } from "../utils/contactImporter";
import SwipeableRow from "../components/SwipeableRow";
import MaskedText from "../components/MaskedText";
import { useTheme } from "../utils/useTheme";
import Button from "../components/Button";
import { usePremiumFeature, usePurchase } from "../hooks";
import { PremiumUpgradePrompt } from "../components/premium";
import { ESSENTIALS_LIMITS } from "../config/featureAccess";
import {
  useToast,
  EmptyState,
  RefreshableScrollView,
  SearchInput,
} from "../components/ui";

export default function EmergencyContactsScreen() {
  const { colors, primary } = useTheme();

  // Enable LayoutAnimation for Android
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  // Custom slow animation for collapsing/expanding
  const slowLayoutAnimation = {
    duration: 500,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  };

  // User data from useUserStore
  const emergencyContacts = useUserStore((s) => s.userProfile.emergencyContacts);
  const addEmergencyContact = useUserStore((s) => s.addEmergencyContact);
  const updateEmergencyContact = useUserStore((s) => s.updateEmergencyContact);
  const removeEmergencyContact = useUserStore((s) => s.removeEmergencyContact);
  const setPrimaryContact = useUserStore((s) => s.setPrimaryContact);

  // Non-user data from useAppStore
  const performTwoWaySync = useAppStore((s) => s.performTwoWaySync);

  // Premium feature gating
  const {
    checkItemLimit,
    getRemainingCount,
    isPremiumUnlocked,
    showUpgradePrompt,
    triggeredFeature,
    closeUpgradePrompt,
  } = usePremiumFeature();

  // Purchase handling
  const { handlePurchase, handleRestore, isLoading: isPurchaseLoading } = usePurchase();

  const contactCount = emergencyContacts.length;
  const remainingContacts = getRemainingCount("emergencyContacts", contactCount);

  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // For undo functionality
  const deletedContactRef = useRef<EmergencyContact | null>(null);

  const { showSuccess, showError, showUndo, ToastComponent } = useToast();

  // Memoized filtered contacts
  const filteredContacts = useMemo(() => {
    const sorted = [...emergencyContacts].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.name.localeCompare(b.name);
    });

    if (!searchQuery.trim()) return sorted;
    const query = searchQuery.toLowerCase();
    return sorted.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.relationship.toLowerCase().includes(query) ||
        contact.phoneNumber.includes(query)
    );
  }, [emergencyContacts, searchQuery]);

  const handleAddContact = useCallback(() => {
    // Check limit before allowing add
    if (!checkItemLimit("emergencyContacts", contactCount)) {
      return; // Upgrade prompt will show automatically
    }
    setEditingContact(null);
    setName("");
    setRelationship("");
    setPhoneNumber("");
    setShowModal(true);
  }, [checkItemLimit, contactCount]);

  const handleEditContact = useCallback((contact: EmergencyContact) => {
    setEditingContact(contact);
    setName(contact.name);
    setRelationship(contact.relationship);
    setPhoneNumber(contact.phoneNumber);
    setShowModal(true);
  }, []);

  const handleSaveContact = useCallback(() => {
    if (!name.trim() || !phoneNumber.trim()) {
      showError("Please enter a name and phone number.");
      return;
    }

    if (editingContact) {
      // Check for duplicate phone number (excluding current contact)
      const isDuplicate = emergencyContacts.some(
        (c) => c.id !== editingContact.id && c.phoneNumber === phoneNumber.trim()
      );

      if (isDuplicate) {
        showError("A trusted contact with this phone number already exists.");
        return;
      }

      // Update existing contact
      const phoneChanged = editingContact.phoneNumber !== phoneNumber.trim();
      updateEmergencyContact(editingContact.id, {
        name: name.trim(),
        relationship: relationship.trim() || "Contact",
        phoneNumber: phoneNumber.trim(),
        ...(phoneChanged ? { optInSmsSent: false } : {}),
      });
      showSuccess("Contact updated!");

      if (phoneChanged) {
        const updatedContact = { ...editingContact, phoneNumber: phoneNumber.trim(), optInSmsSent: false };
        promptAndSendOptIn(updatedContact);
      }
    } else {
      // Check for duplicate phone number
      const isDuplicate = emergencyContacts.some(
        (c) => c.phoneNumber === phoneNumber.trim()
      );

      if (isDuplicate) {
        showError("A trusted contact with this phone number already exists.");
        return;
      }

      // Add new contact
      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        name: name.trim(),
        relationship: relationship.trim() || "Contact",
        phoneNumber: phoneNumber.trim(),
        isPrimary: emergencyContacts.length === 0,
        isEmergencyContact: true,
      };
      addEmergencyContact(newContact);
      showSuccess("Contact added!");
      promptAndSendOptIn(newContact);
    }

    setShowModal(false);
    setName("");
    setRelationship("");
    setPhoneNumber("");
    setEditingContact(null);
  }, [name, phoneNumber, relationship, editingContact, emergencyContacts, updateEmergencyContact, addEmergencyContact, showSuccess, showError]);

  const handleDeleteContact = useCallback((contact: EmergencyContact) => {
    // Store for potential undo
    deletedContactRef.current = contact;

    // Remove immediately
    removeEmergencyContact(contact.id);

    // Show undo toast
    showUndo(`"${contact.name}" deleted`, () => {
      if (deletedContactRef.current) {
        addEmergencyContact(deletedContactRef.current);
        showSuccess("Contact restored!");
        deletedContactRef.current = null;
      }
    });
  }, [removeEmergencyContact, addEmergencyContact, showUndo, showSuccess]);

  const handleSetPrimary = useCallback((contact: EmergencyContact) => {
    if (!contact.isPrimary) {
      setPrimaryContact(contact.id);
      showSuccess(`${contact.name} set as primary contact`);
    }
  }, [setPrimaryContact, showSuccess]);

  const handleRefresh = useCallback(async () => {
    try {
      await performTwoWaySync();
      showSuccess("Synced successfully!");
    } catch (error) {
      showError("Sync failed. Please try again.");
    }
  }, [performTwoWaySync, showSuccess, showError]);

  const handleImportContacts = useCallback(async (contacts: Array<{ contact: PhoneContact; type: "emergency"; relationship?: string }>) => {
    const currentEmergencyCount = emergencyContacts.length;
    let emergencyIndex = 0;
    let emergencyDuplicateCount = 0;
    const importedContacts: EmergencyContact[] = [];

    contacts.forEach(({ contact, relationship: rel }) => {
      const isDuplicate = emergencyContacts.some(
        (c) => c.phoneNumber === contact.phoneNumber
      );

      if (isDuplicate) {
        emergencyDuplicateCount++;
      } else {
        const newContact: EmergencyContact = {
          id: `contact-${Date.now()}-${Math.random().toString().substring(2)}`,
          name: contact.name,
          relationship: rel || "Contact",
          phoneNumber: contact.phoneNumber,
          isPrimary: currentEmergencyCount === 0 && emergencyIndex === 0,
          isEmergencyContact: true,
          imageUri: contact.imageUri,
        };
        addEmergencyContact(newContact);
        importedContacts.push(newContact);
        emergencyIndex++;
      }
    });

    setShowImportModal(false);

    if (importedContacts.length > 0) {
      showSuccess(`${importedContacts.length} contact${importedContacts.length !== 1 ? "s" : ""} imported!`);
      await promptAndSendOptInForMultiple(importedContacts);
    }
    if (emergencyDuplicateCount > 0) {
      setTimeout(() => {
        showError(`${emergencyDuplicateCount} duplicate${emergencyDuplicateCount !== 1 ? "s" : ""} skipped`);
      }, 500);
    }
  }, [emergencyContacts, addEmergencyContact, showSuccess, showError]);

  const getInitials = useCallback((contactName: string) => {
    return contactName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, []);

  const getAvatarColor = useCallback((index: number) => {
    const avatarColors = [primary, colors.success, colors.info, colors.warning, colors.error];
    return avatarColors[index % avatarColors.length];
  }, [primary, colors]);

  return (
    <Screen variant="static" edges={["bottom"]}>
      <RefreshableScrollView
        onRefresh={handleRefresh}
        className="flex-1 px-8"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Description - native header shows title */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg flex-1 leading-relaxed" style={{ color: colors.textSecondary }}>
            Manage your trusted contacts. The primary contact will be used for SOS alerts.
          </Text>
          {emergencyContacts.length > 0 && (
            <Pressable
              onPress={() => {
                LayoutAnimation.configureNext(slowLayoutAnimation);
                setIsExpanded(!isExpanded);
              }}
              className="p-2 ml-2 active:opacity-60"
              style={{ minWidth: 48, minHeight: 48, justifyContent: "center", alignItems: "center" }}
              accessibilityRole="button"
              accessibilityLabel={isExpanded ? "Collapse contacts list" : "Expand contacts list"}
            >
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={28}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* Limit Indicator for Essentials users */}
        {!isPremiumUnlocked && (
          <View
            className="mb-4 px-4 py-3 rounded-xl flex-row items-center justify-between"
            style={{ backgroundColor: remainingContacts === 0 ? colors.warningBackground : colors.cardBackground }}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons
                name={remainingContacts === 0 ? "alert-circle" : "information-circle"}
                size={20}
                color={remainingContacts === 0 ? colors.warning : colors.textSecondary}
              />
              <Text
                className="text-base ml-2 flex-1"
                style={{ color: remainingContacts === 0 ? colors.onWarning : colors.textSecondary }}
              >
                {remainingContacts === 0
                  ? `Limit reached (${ESSENTIALS_LIMITS.maxEmergencyContacts}/${ESSENTIALS_LIMITS.maxEmergencyContacts})`
                  : `${contactCount} of ${ESSENTIALS_LIMITS.maxEmergencyContacts} trusted contact${ESSENTIALS_LIMITS.maxEmergencyContacts !== 1 ? "s" : ""} used`
                }
              </Text>
            </View>
            {remainingContacts === 0 && (
              <Pressable
                onPress={() => checkItemLimit("emergencyContacts", ESSENTIALS_LIMITS.maxEmergencyContacts)}
                className="px-3 py-1 rounded-lg ml-2"
                style={{ backgroundColor: primary }}
              >
                <Text className="text-white text-sm font-semibold">Upgrade</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Search Input - only show if there are contacts */}
        {emergencyContacts.length > 0 && (
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search contacts..."
          />
        )}

        {/* Search with no results */}
        {searchQuery.trim() && filteredContacts.length === 0 && (
          <EmptyState
            icon="search"
            title="No results found"
            description={`No contacts match "${searchQuery}". Try different keywords.`}
            actionLabel="Clear Search"
            onAction={() => setSearchQuery("")}
          />
        )}

        {/* Empty State - only when no search and no contacts */}
        {!searchQuery.trim() && emergencyContacts.length === 0 && (
          <EmptyState
            icon="people"
            title="No trusted contacts"
            description="Add trusted people who can be contacted in an emergency. Your trusted contacts can be quickly called with one tap."
            tip="Tip: We recommend adding at least 2-3 trusted contacts"
            actionLabel="Add Trusted Contact"
            onAction={handleAddContact}
          />
        )}

        {/* Contacts List */}
        {!searchQuery.trim() && emergencyContacts.length > 0 && !isExpanded && (
          <View className="p-6 rounded-3xl mb-6" style={{ backgroundColor: colors.cardBackground }}>
            <Text className="text-lg text-center" style={{ color: colors.textSecondary }}>
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""} (collapsed)
            </Text>
          </View>
        )}

        {filteredContacts.length > 0 && isExpanded && (
          <View className="mb-6">
            {filteredContacts.map((contact, index) => (
              <SwipeableRow
                key={contact.id}
                onEdit={() => handleEditContact(contact)}
                onDelete={() => handleDeleteContact(contact)}
              >
                <View className="rounded-3xl p-6 mb-4 border-2" style={{ backgroundColor: colors.cardBackground, borderColor: colors.divider }}>
                  {/* Contact Info */}
                  <View className="flex-row items-center mb-4">
                    {contact.imageUri ? (
                      <Image
                        source={{ uri: contact.imageUri }}
                        className="w-16 h-16 rounded-full mr-4"
                        style={{ width: 64, height: 64, borderRadius: 32 }}
                        accessible={true}
                        accessibilityLabel={`Photo of ${contact.name}`}
                      />
                    ) : (
                      <View
                        style={{ backgroundColor: getAvatarColor(index) }}
                        className="w-16 h-16 rounded-full items-center justify-center mr-4"
                      >
                        <Text className="text-white text-2xl font-bold">
                          {getInitials(contact.name)}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-2xl font-semibold mb-1" style={{ color: colors.textPrimary }}>
                        {contact.name}
                      </Text>
                      <Text className="text-lg mb-1" style={{ color: colors.textSecondary }}>
                        {contact.relationship}
                      </Text>
                      <MaskedText
                        value={formatPhoneNumber(contact.phoneNumber)}
                        maskByDefault={true}
                        textSize="text-lg"
                        inCard={true}
                      />
                    </View>
                  </View>

                  {/* Primary Badge */}
                  {contact.isPrimary && (
                    <View className="px-4 py-2 rounded-2xl self-start mb-4" style={{ backgroundColor: primary + "20" }}>
                      <Text className="text-lg font-semibold" style={{ color: primary }}>
                        Primary Contact
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons Row */}
                  <View className="flex-row">
                    {!contact.isPrimary && (
                      <Pressable
                        onPress={() => handleSetPrimary(contact)}
                        style={{ backgroundColor: colors.success, minHeight: 48, flex: 1, marginRight: 8 }}
                        className="px-4 py-3 rounded-2xl active:opacity-80 items-center justify-center"
                      >
                        <Text className="text-white text-base font-semibold">
                          Set as Primary
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleEditContact(contact)}
                      style={{ backgroundColor: primary, minWidth: 48, minHeight: 48 }}
                      className="p-3 rounded-xl mr-2 active:opacity-80 items-center justify-center"
                      accessibilityRole="button"
                      accessibilityLabel="Edit contact"
                    >
                      <Ionicons name="pencil" size={20} color="white" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteContact(contact)}
                      style={{ backgroundColor: colors.error, minWidth: 48, minHeight: 48 }}
                      className="p-3 rounded-xl active:opacity-80 items-center justify-center"
                      accessibilityRole="button"
                      accessibilityLabel="Delete contact"
                    >
                      <Ionicons name="trash" size={20} color="white" />
                    </Pressable>
                  </View>
                </View>
              </SwipeableRow>
            ))}
          </View>
        )}

        {/* Add Contact Button */}
        <Button
          title="Add Trusted Contact"
          onPress={handleAddContact}
          variant="primary"
          size="large"
          fullWidth
          icon={<Ionicons name="person-add" size={28} color="white" />}
          accessibilityLabel="Add trusted contact"
          style={{ marginBottom: 16, minHeight: 56 }}
        />

        {/* Import from Phone Button */}
        <Button
          title="Import from Phone Contacts"
          onPress={() => setShowImportModal(true)}
          variant="primary"
          size="large"
          fullWidth
          icon={<Ionicons name="phone-portrait" size={28} color="white" />}
          style={{ backgroundColor: colors.success, minHeight: 56 }}
          accessibilityLabel="Import from phone contacts"
        />
      </RefreshableScrollView>

      {/* Contact Import Modal */}
      <ContactImportModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportContacts={handleImportContacts}
        mode="emergency"
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="flex-1">
            {/* Modal Header */}
            <View className="px-8 py-6 border-b flex-row items-center justify-between" style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }}>
              <Text className="text-3xl font-semibold" style={{ color: colors.textPrimary }}>
                {editingContact ? "Edit Contact" : "Add Contact"}
              </Text>
              <Pressable
                onPress={() => setShowModal(false)}
                className="w-12 h-12 rounded-full items-center justify-center active:opacity-60"
                style={{ backgroundColor: colors.divider, minWidth: 48, minHeight: 48 }}
              >
                <Ionicons name="close" size={32} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-8 py-8">
              <Text className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                className="px-6 py-5 rounded-2xl text-xl mb-6 border"
                style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.divider, minHeight: 52 }}
                placeholderTextColor={colors.textSecondary}
              />

              <Text className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
                Relationship
              </Text>
              <TextInput
                value={relationship}
                onChangeText={setRelationship}
                placeholder="Son, Daughter, Friend, etc."
                className="px-6 py-5 rounded-2xl text-xl mb-6 border"
                style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.divider, minHeight: 52 }}
                placeholderTextColor={colors.textSecondary}
              />

              <Text className="text-xl font-semibold mb-3" style={{ color: colors.textPrimary }}>
                Phone Number
              </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                className="px-6 py-5 rounded-2xl text-xl mb-8 border"
                style={{ backgroundColor: colors.cardBackground, color: colors.textPrimary, borderColor: colors.divider, minHeight: 52 }}
                placeholderTextColor={colors.textSecondary}
              />

              <Button
                title={editingContact ? "Save Changes" : "Add Contact"}
                onPress={handleSaveContact}
                variant="primary"
                size="large"
                fullWidth
                style={{ backgroundColor: colors.success, marginBottom: 16, minHeight: 56 }}
                accessibilityLabel={editingContact ? "Save contact changes" : "Add trusted contact"}
              />

              <Button
                title="Cancel"
                onPress={() => setShowModal(false)}
                variant="secondary"
                size="large"
                fullWidth
                style={{ minHeight: 56 }}
                accessibilityLabel="Cancel"
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* v1.0: Premium upgrade prompt disabled — IAP removed */}
      {false && (<PremiumUpgradePrompt
        visible={showUpgradePrompt}
        onClose={closeUpgradePrompt}
        onPurchase={async (tier) => {
          const result = await handlePurchase(tier);
          if (result.success) {
            showSuccess(result.message);
            closeUpgradePrompt();
          } else {
            showError(result.message);
          }
        }}
        onRestore={async () => {
          const result = await handleRestore();
          if (result.success) {
            showSuccess(result.message);
            closeUpgradePrompt();
          } else {
            showError(result.message);
          }
        }}
        featureId={triggeredFeature}
        isLoading={isPurchaseLoading}
      />)}

      {/* Toast notifications */}
      {ToastComponent}
    </Screen>
  );
}
