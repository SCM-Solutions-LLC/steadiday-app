import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Modal, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Keep for modal internal styling only
import { Screen } from "../../components/Screen";
import { Ionicons } from "@expo/vector-icons";
import { useTaskStore } from "../../state/stores/taskStore";
import { useUIStore } from "../../state/stores/uiStore";
import { useTipStore } from "../../state/stores/tipStore";
import { useSettingsStore } from "../../state/stores/settingsStore";
import { getTextSizeClasses } from "../../utils/textSizes";
import { format } from "date-fns";
import { useTheme } from "../../utils/useTheme";
import { useConfirmModal } from "../../components/ConfirmModal";
import { ScreenErrorBoundary } from "../../components/ui";
import { logger } from "../../utils/logger";

export default function NotesScreen() {
  const { colors, primary } = useTheme();
  const { alert, destructive } = useConfirmModal();

  // Notes from useTaskStore
  const notes = useTaskStore((s) => s.notes);
  const addNote = useTaskStore((s) => s.addNote);
  const updateNote = useTaskStore((s) => s.updateNote);
  const removeNote = useTaskStore((s) => s.removeNote);

  // Settings from useSettingsStore
  const textSize = useSettingsStore((s) => s.textSize);

  // Tip state from useTipStore
  const dismissedInfoCards = useTipStore((s) => s.dismissedInfoCards || []);
  const dismissInfoCard = useTipStore((s) => s.dismissInfoCard);

  const textClasses = getTextSizeClasses(textSize);

  // Helper function for checking if card is dismissed
  const isCardDismissed = (cardId: string) => dismissedInfoCards.includes(cardId);

  const [showModal, setShowModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

  const handleNewNote = () => {
    setEditingNoteId(null);
    setNoteContent("");
    setShowModal(true);
  };

  const handleEditNote = (id: string, content: string) => {
    setEditingNoteId(id);
    setNoteContent(content);
    setShowModal(true);
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    if (editingNoteId) {
      updateNote(editingNoteId, noteContent.trim());
    } else {
      addNote({
        id: Date.now().toString(),
        content: noteContent.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setShowModal(false);
    setNoteContent("");
  };

  const handleDeleteNote = (id: string) => {
    destructive(
      "Delete Note",
      "Are you sure you want to delete this note?",
      "Delete",
      () => removeNote(id)
    );
  };

  const handleExportToNotes = async (content: string) => {
    try {
      const result = await Share.share({
        message: content,
      });

      if (result.action === Share.sharedAction) {
        alert(
          "Exported",
          "Note has been exported. You can now save it to your Notes app from the share menu."
        );
      }
    } catch (error) {
      logger.error("Error exporting note:", error);
      alert("Error", "Failed to export note. Please try again.");
    }
  };

  const handleExportAllNotes = async () => {
    if (notes.length === 0) {
      alert("No Notes", "You don't have any notes to export.");
      return;
    }

    try {
      const allNotesText = notes
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map((note) => {
          const date = format(new Date(note.updatedAt), "MMM d, yyyy h:mm a");
          return `${note.content}\n\n---\nCreated: ${date}\n`;
        })
        .join("\n\n");

      const result = await Share.share({
        message: `SteadiDay Notes\n\n${allNotesText}`,
      });

      if (result.action === Share.sharedAction) {
        alert(
          "Exported",
          "All notes have been exported. You can now save them to your Notes app from the share menu."
        );
      }
    } catch (error) {
      logger.error("Error exporting all notes:", error);
      alert("Error", "Failed to export notes. Please try again.");
    }
  };

  const getPreviewText = (content: string) => {
    const firstLine = content.split("\n")[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + "..." : firstLine;
  };

  return (
    <ScreenErrorBoundary screenName="NotesScreen">
      <Screen variant="static" edges={["bottom"]}>
        <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b" style={{ backgroundColor: colors.cardBackground, borderBottomColor: colors.divider }}>
          <View className="flex-row gap-3 mb-3">
            <Pressable
              onPress={handleNewNote}
              className="flex-1 bg-sage px-6 py-3 rounded-xl active:bg-[#5A9E7F] flex-row items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="New note"
            >
              <Ionicons name="add" size={24} color="white" />
              <Text className={`${textClasses.button} text-white ml-2`}>New Note</Text>
            </Pressable>

            {notes.length > 0 && (
              <Pressable
                onPress={handleExportAllNotes}
                className="bg-sage px-4 py-3 rounded-xl active:bg-[#5A9E7F] items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Export all notes to iOS Notes"
              >
                <Ionicons name="share-outline" size={24} color="white" />
              </Pressable>
            )}
          </View>

          {notes.length > 0 && !isCardDismissed("notes-export-info") && (
            <View
              className="rounded-xl p-3"
              style={{
                backgroundColor: colors.primaryLight,
                borderWidth: 2,
                borderColor: primary + "40"
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={20} color={primary} />
                <Text className={`${textClasses.small} ml-2 flex-1`} style={{ color: colors.textSecondary }}>
                  Tap the share icon to export all notes to your iOS Notes app
                </Text>
                <Pressable
                  onPress={() => dismissInfoCard("notes-export-info")}
                  className="p-1 ml-2 active:opacity-50"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={primary} />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Notes List */}
        <ScrollView className="flex-1 px-6 py-4">
          {notes.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
              <Text className={`${textClasses.body} text-center mt-4`} style={{ color: colors.textSecondary }}>
                No notes yet
              </Text>
              <Text className={`${textClasses.small} text-center mt-2`} style={{ color: colors.textSecondary }}>
                Tap New Note to create your first note
              </Text>
            </View>
          ) : (
            notes
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() => handleEditNote(note.id, note.content)}
                  className="rounded-2xl p-6 mb-3 shadow-sm"
                  style={{ backgroundColor: colors.cardBackground }}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit note: ${getPreviewText(note.content)}`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-3">
                      <Text className={`${textClasses.body} mb-2`} numberOfLines={2} style={{ color: colors.textPrimary }}>
                        {getPreviewText(note.content)}
                      </Text>
                      <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                        {format(new Date(note.updatedAt), "MMM d, yyyy h:mm a")}
                      </Text>
                    </View>
                    <View className="flex-row">
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleExportToNotes(note.content);
                        }}
                        className="p-2 rounded-full mr-1"
                        accessibilityRole="button"
                        accessibilityLabel="Export to iOS Notes"
                      >
                        <Ionicons name="share-outline" size={22} color={primary} />
                      </Pressable>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="p-2 rounded-full"
                        accessibilityRole="button"
                        accessibilityLabel="Delete note"
                      >
                        <Ionicons name="trash-outline" size={22} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))
          )}
        </ScrollView>
        </View>

        {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="flex-1">
              {/* Modal Header */}
              <View className="px-6 py-4 border-b flex-row justify-between items-center" style={{ borderBottomColor: colors.divider }}>
                <Pressable
                  onPress={() => setShowModal(false)}
                  className="py-2"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text className={`${textClasses.button}`} style={{ color: primary }}>Cancel</Text>
                </Pressable>
                <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
                  {editingNoteId ? "Edit Note" : "New Note"}
                </Text>
                <Pressable
                  onPress={handleSaveNote}
                  disabled={!noteContent.trim()}
                  className="py-2"
                  accessibilityRole="button"
                  accessibilityLabel="Save"
                >
                  <Text
                    className={`${textClasses.button}`}
                    style={{ color: noteContent.trim() ? primary : colors.textSecondary }}
                  >
                    Save
                  </Text>
                </Pressable>
              </View>

              <Pressable className="flex-1" onPress={Keyboard.dismiss}>
                <View className="flex-1 px-6 py-6">
                  <TextInput
                    value={noteContent}
                    onChangeText={setNoteContent}
                    placeholder="Type your note here..."
                    multiline
                    autoFocus
                    textAlignVertical="top"
                    className={`flex-1 ${textClasses.body}`}
                    style={{ color: colors.textPrimary }}
                    placeholderTextColor={colors.textSecondary}
                    accessibilityLabel="Note content"
                  />
                </View>
              </Pressable>

              {/* Export Button */}
              {noteContent.trim().length > 0 && (
                <View className="px-6 pb-4 border-t" style={{ borderTopColor: colors.divider }}>
                  <Pressable
                    onPress={() => handleExportToNotes(noteContent)}
                    className="bg-sage px-6 py-4 rounded-xl active:bg-[#5A9E7F] flex-row items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Export to iOS Notes"
                  >
                    <Ionicons name="share-outline" size={24} color="white" />
                    <Text className={`${textClasses.button} text-white ml-2`}>
                      Export to iOS Notes
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      </Screen>
    </ScreenErrorBoundary>
  );
}
