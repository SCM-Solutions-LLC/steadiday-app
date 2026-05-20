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
}

const ContactCard = memo(function ContactCard({
  contact,
  index,
  isSelected,
  onToggle,
  getInitials,
  getAvatarColor,
}: ContactCardProps) {
  return (
    <View
      className="bg-light-card rounded-3xl p-5 mb-5 border-2 border-light-divider"
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
          <Text className="text-2xl font-semibold text-light-heading mb-1">
            {contact.name}
          </Text>
          <Text className="text-lg text-light-body">
            {formatPhoneNumber(contact.phoneNumber)}
          </Text>
        </View>
      </View>

      {/* Selection Button - Only Trusted Contact option */}
      <Pressable
        onPress={() => onToggle(contact)}
        className={`w-full px-4 py-4 rounded-2xl items-center justify-center ${
          isSelected
            ? "bg-sage"
            : "bg-[#E8F5EF] active:bg-[#D4EBE2]"
        }`}
      >
        <View className="flex-row items-center">
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="white" style={{ marginRight: 8 }} />
          )}
          <Text
            className={`text-lg font-semibold ${
              isSelected ? "text-white" : "text-sage"
            }`}
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
      <SafeAreaView className="flex-1 bg-[#F7F7F7]">
        <View className="flex-1">
          {/* Header */}
          <View className="px-8 py-6 bg-light-card border-b border-light-divider">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-3xl font-semibold text-light-heading">
                Import Contacts
              </Text>
              <Pressable
                onPress={onClose}
                className="w-12 h-12 rounded-full items-center justify-center active:bg-[#E5E5E5]"
              >
                <Ionicons name="close" size={32} color="#1A1A1A" />
              </Pressable>
            </View>

            <Text className="text-lg text-light-body mb-2 leading-relaxed">
              Select contacts to add as trusted contacts
            </Text>

            {/* Info Note */}
            <View className="bg-[#E8F5EF] border border-[#6DB193] rounded-2xl p-4 mb-4">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#6DB193" style={{ marginTop: 2 }} />
                <Text className="text-base text-[#1A1A1A] ml-2 leading-relaxed flex-1">
                  Trusted contacts will be notified when you use the SOS button in an emergency.
                </Text>
              </View>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center bg-[#F7F7F7] rounded-2xl px-4 py-3 border border-light-divider">
              <Ionicons name="search" size={24} color="#666666" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search contacts..."
                className="flex-1 ml-3 text-xl text-light-heading"
                placeholderTextColor="#999999"
              />
            </View>
          </View>

          {/* Contacts List */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#6DB193" />
              <Text className="text-xl text-light-body mt-4">Loading contacts...</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <Ionicons name="people-outline" size={64} color="#6DB193" />
              <Text className="text-xl text-light-body text-center mt-4">
                {searchQuery ? "No contacts found" : "No contacts available"}
              </Text>
              {!searchQuery && (
                <Text className="text-lg text-[#666666] text-center mt-2 leading-relaxed">
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
                />
              ))}
            </ScrollView>
          )}

          {/* Footer with Import Button */}
          {!loading && filteredContacts.length > 0 && (
            <View className="px-8 py-6 bg-light-card border-t border-light-divider">
              <Pressable
                onPress={handleImport}
                disabled={selectedContacts.size === 0}
                className={`px-8 py-6 rounded-2xl min-h-[70px] items-center justify-center ${
                  selectedContacts.size === 0
                    ? "bg-[#CCCCCC]"
                    : "bg-sage active:bg-[#5C9A7F]"
                }`}
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
