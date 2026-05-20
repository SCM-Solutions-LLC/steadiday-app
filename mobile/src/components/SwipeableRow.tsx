import React, { ReactNode, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";

interface SwipeableRowProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

const ACTION_WIDTH = 80;

export default function SwipeableRow({
  children,
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
}: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const { colors, primary } = useTheme();

  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const handleEdit = () => {
    closeSwipeable();
    if (onEdit) {
      setTimeout(onEdit, 150);
    }
  };

  const handleDelete = () => {
    closeSwipeable();
    setTimeout(onDelete, 150);
  };

  const renderRightActions = () => {
    const totalWidth = onEdit ? ACTION_WIDTH * 2 : ACTION_WIDTH;

    return (
      <View style={[styles.actionsContainer, { width: totalWidth }]}>
        {onEdit && (
          <Pressable
            onPress={handleEdit}
            style={[styles.actionButton, { backgroundColor: primary }]}
            accessibilityRole="button"
            accessibilityLabel={editLabel}
          >
            <Ionicons name="pencil" size={24} color={colors.onPrimary} />
            <Text style={[styles.actionText, { color: colors.onPrimary }]}>{editLabel}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleDelete}
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
        >
          <Ionicons name="trash" size={24} color={colors.onPrimary} />
          <Text style={[styles.actionText, { color: colors.onPrimary }]}>{deleteLabel}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        friction={2}
        overshootRight={false}
        rightThreshold={40}
        containerStyle={styles.swipeableContainer}
        childrenContainerStyle={styles.childrenContainer}
      >
        {children}
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  swipeableContainer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  childrenContainer: {},
  actionsContainer: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
