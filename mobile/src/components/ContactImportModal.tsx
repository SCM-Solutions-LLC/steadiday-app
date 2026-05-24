import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchPhoneContacts, PhoneContact } from "../utils/contactImporter";
import { formatPhoneNumber } from "../utils/phoneFormatter";
import { useTheme } from "../utils/useTheme";

interface ContactImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportContacts: (contacts: Array<{ contact: PhoneContact; type: "emergency"; relationship?: string }>) => void;
  // Note: Only trusted contacts import is supported now
  mode?: "emergency";
}

// Memoized Contact Card Component - Only shows Trusted Contact option
interface ContactCardProps {
  contact: PhoneContact;
  index: number;
  isSelected: boolean;
  onToggle: (contact: PhoneContact) => void;
  getInitials: (name: string) => string;
  getAvatarColor: (index: number) => string;
  themeColors: any;
  primaryColor: string;
}

const ContactCard = memo(function ContactCard({
  contact,
  index,
  isSelected,
  onToggle,
  getInitials,
  getAvatarColor,
  themeColors,
  primaryColor,
}: ContactCardProps) {
  return (
    <View
      className="rounded-3xl p-5 mb-5"
      style={{ backgroundColor: themeColors.cardBackground, borderWidth: 2, borderColor: themeColors.border }}
    >
      <View className="flex-row items-center mb-4">
        {contact.imageUri ? (
          <Image
            source={{ uri: contact.imageUri }}
            className="w-16 h-16 rounded-full mr-4"
            style={{ width: 64, height: 64, borderRadius: 32 }}
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
          <Text className="text-2xl font-semibold mb-1" style={{ color: themeColors.textPrimary }}>
            {contact.name}
          </Text>
          <Text className="text-lg" style={{ color: themeColors.textSecondary }}>
            {formatPhoneNumber(contact.phoneNumber)}
          </Text>
        </View>
      </View>

      {/* Selection Button - Only Trusted Contact option */}
      <Pressable
        onPress={() => onToggle(contact)}
        className="w-full px-4 py-4 rounded-2xl items-center justify-center active:opacity-80"
        style={{ backgroundColor: isSelected ? primaryColor : themeColors.primaryLight }}
      >
        <View className="flex-row items-center">
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="white" style={{ marginRight: 8 }} />
          )}
          <Text
            className="text-lg font-semibold"
            style={{ color: isSelected ? "white" : primaryColor }}
          >
            {isSelected ? "Selected as Trusted Contact" : "Add as Trusted Contact"}
          </Text>
        </View>
      </Pressable>
    </View>
  );
});

export default function ContactImportModal({
  visible,
  onClose,
  onImportContacts,
}: ContactImportModalProps) {
  const { colors, primary } = useTheme();
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      loadContacts();
    } else {
      // Reset state when modal closes
      setPhoneContacts([]);
      setSearchQuery("");
      setSelectedContacts(new Set());
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    const contacts = await fetchPhoneContacts();
    setPhoneContacts(contacts);
    setLoading(false);
  };

  const filteredContacts = useMemo(() => {
    return phoneContacts.filter((contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [phoneContacts, searchQuery]);

  const toggleContactSelection = useCallback((contact: PhoneContact) => {
    setSelectedContacts((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(contact.id)) {
        newSelected.delete(contact.id);
      } else {
        newSelected.add(contact.id);
      }
      return newSelected;
    });
  }, []);

  const handleImport = () => {
    const contactsToImport = Array.from(selectedContacts).map((id) => {
      const contact = phoneContacts.find((c) => c.id === id)!;
      return {
        contact,
        type: "emergency" as const,
        relationship: "Contact",
      };
    });

    onImportContacts(contactsToImport);
    onClose();
  };

  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, []);

  const getAvatarColor = useCallback((index: number) => {
    const colors = ["#2F80ED", "#6DB193", "#8B5CF6", "#F59E0B", "#EC4899"];
    return colors[index % colors.length];
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1">
          {/* Header */}
          <View className="px-8 py-6" style={{ backgroundColor: colors.cardBackground, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-3xl font-semibold" style={{ color: colors.textPrimary }}>
                Import Contacts
              </Text>
              <Pressable
                onPress={onClose}
                className="w-12 h-12 rounded-full items-center justify-center active:opacity-70"
              >
                <Ionicons name="close" size={32} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text className="text-lg mb-2 leading-relaxed" style={{ color: colors.textSecondary }}>
              Select contacts to add as trusted contacts
            </Text>

            {/* Info Note */}
            <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: primary }}>
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color={primary} style={{ marginTop: 2 }} />
                <Text className="text-base ml-2 leading-relaxed flex-1" style={{ color: colors.textPrimary }}>
                  Trusted contacts will be notified when you use the SOS button in an emergency.
                </Text>
              </View>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center rounded-2xl px-4 py-3" style={{ backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="search" size={24} color={colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search contacts..."
                className="flex-1 ml-3 text-xl"
                style={{ color: colors.textPrimary }}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          {/* Contacts List */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={primary} />
              <Text className="text-xl mt-4" style={{ color: colors.textSecondary }}>Loading contacts...</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <Ionicons name="people-outline" size={64} color={primary} />
              <Text className="text-xl text-center mt-4" style={{ color: colors.textSecondary }}>
                {searchQuery ? "No contacts found" : "No contacts available"}
              </Text>
              {!searchQuery && (
                <Text className="text-lg text-center mt-2 leading-relaxed" style={{ color: colors.textTertiary }}>
                  Make sure you have granted contact permissions
                </Text>
              )}
            </View>
          ) : (
            <ScrollView className="flex-1 px-8 py-6">
              {filteredContacts.map((contact, index) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  index={index}
                  isSelected={selectedContacts.has(contact.id)}
                  onToggle={toggleContactSelection}
                  getInitials={getInitials}
                  getAvatarColor={getAvatarColor}
                  themeColors={colors}
                  primaryColor={primary}
                />
              ))}
            </ScrollView>
          )}

          {/* Footer with Import Button */}
          {!loading && filteredContacts.length > 0 && (
            <View className="px-8 py-6" style={{ backgroundColor: colors.cardBackground, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Pressable
                onPress={handleImport}
                disabled={selectedContacts.size === 0}
                className="px-8 py-6 rounded-2xl min-h-[70px] items-center justify-center active:opacity-80"
                style={{ backgroundColor: selectedContacts.size === 0 ? colors.buttonDisabled : primary }}
              >
                <Text className="text-white text-xl font-semibold">
                  Import {selectedContacts.size > 0 ? `${selectedContacts.size} Contact${selectedContacts.size !== 1 ? "s" : ""}` : "Contacts"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
