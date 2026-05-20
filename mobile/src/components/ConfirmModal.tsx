import React, { useState, useCallback, createContext, useContext } from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../utils/useTheme";
import { getTextSizeClasses } from "../utils/textSizes";
import { useSettingsStore } from "../state/stores/settingsStore";

// ============================================================================
// TYPES
// ============================================================================

export type ConfirmModalType = "info" | "warning" | "error" | "success" | "destructive";

export interface ConfirmModalButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface ConfirmModalOptions {
  title: string;
  message: string;
  type?: ConfirmModalType;
  buttons?: ConfirmModalButton[];
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ConfirmModalState extends ConfirmModalOptions {
  visible: boolean;
}

interface ConfirmModalContextType {
  show: (options: ConfirmModalOptions) => void;
  confirm: (title: string, message: string, onConfirm: () => void, type?: ConfirmModalType) => void;
  alert: (title: string, message: string) => void;
  destructive: (title: string, message: string, actionText: string, onConfirm: () => void) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ConfirmModalContext = createContext<ConfirmModalContextType | null>(null);

export function useConfirmModal() {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error("useConfirmModal must be used within a ConfirmModalProvider");
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function ConfirmModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ConfirmModalState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  const hide = useCallback(() => {
    setModalState((prev) => ({ ...prev, visible: false }));
  }, []);

  const show = useCallback((options: ConfirmModalOptions) => {
    setModalState({
      visible: true,
      title: options.title,
      message: options.message,
      type: options.type || "info",
      buttons: options.buttons || [{ text: "OK", style: "default" }],
      icon: options.icon,
    });
  }, []);

  const confirm = useCallback(
    (title: string, message: string, onConfirm: () => void, type: ConfirmModalType = "info") => {
      show({
        title,
        message,
        type,
        buttons: [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", style: "default", onPress: onConfirm },
        ],
      });
    },
    [show]
  );

  const alert = useCallback(
    (title: string, message: string) => {
      show({
        title,
        message,
        type: "info",
        buttons: [{ text: "OK", style: "default" }],
      });
    },
    [show]
  );

  const destructive = useCallback(
    (title: string, message: string, actionText: string, onConfirm: () => void) => {
      show({
        title,
        message,
        type: "destructive",
        buttons: [
          { text: "Cancel", style: "cancel" },
          { text: actionText, style: "destructive", onPress: onConfirm },
        ],
      });
    },
    [show]
  );

  const handleButtonPress = useCallback(
    (button: ConfirmModalButton) => {
      hide();
      if (button.onPress) {
        // Small delay to allow modal to close first
        setTimeout(() => {
          button.onPress?.();
        }, 100);
      }
    },
    [hide]
  );

  return (
    <ConfirmModalContext.Provider value={{ show, confirm, alert, destructive }}>
      {children}
      <ConfirmModalComponent
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type || "info"}
        buttons={modalState.buttons || []}
        icon={modalState.icon}
        onButtonPress={handleButtonPress}
        onDismiss={hide}
      />
    </ConfirmModalContext.Provider>
  );
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================

interface ConfirmModalComponentProps {
  visible: boolean;
  title: string;
  message: string;
  type: ConfirmModalType;
  buttons: ConfirmModalButton[];
  icon?: keyof typeof Ionicons.glyphMap;
  onButtonPress: (button: ConfirmModalButton) => void;
  onDismiss: () => void;
}

function ConfirmModalComponent({
  visible,
  title,
  message,
  type,
  buttons,
  icon,
  onButtonPress,
  onDismiss,
}: ConfirmModalComponentProps) {
  const { colors, primary, primaryLight } = useTheme();
  const textSize = useSettingsStore((s) => s.textSize);
  const hapticEnabled = useSettingsStore((s) => s.soundSettings?.hapticFeedbackEnabled ?? true);
  const textClasses = getTextSizeClasses(textSize);

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          iconName: icon || ("checkmark-circle" as const),
          iconColor: "#16A34A",
          iconBg: "#DCFCE7",
        };
      case "warning":
        return {
          iconName: icon || ("warning" as const),
          iconColor: "#CA8A04",
          iconBg: "#FEF9C3",
        };
      case "error":
        return {
          iconName: icon || ("alert-circle" as const),
          iconColor: "#DC2626",
          iconBg: "#FEE2E2",
        };
      case "destructive":
        return {
          iconName: icon || ("trash" as const),
          iconColor: "#DC2626",
          iconBg: "#FEE2E2",
        };
      case "info":
      default:
        return {
          iconName: icon || ("information-circle" as const),
          iconColor: primary,
          iconBg: primaryLight,
        };
    }
  };

  const typeStyles = getTypeStyles();

  const getButtonStyles = (buttonStyle?: "default" | "cancel" | "destructive") => {
    switch (buttonStyle) {
      case "destructive":
        return {
          bg: "#DC2626",
          textColor: "#FFFFFF",
        };
      case "cancel":
        return {
          bg: colors.cardBackground,
          textColor: colors.textPrimary,
          border: colors.inputBorder,
        };
      case "default":
      default:
        return {
          bg: primary,
          textColor: "#FFFFFF",
        };
    }
  };

  const handlePress = (button: ConfirmModalButton) => {
    if (hapticEnabled) {
      if (button.style === "destructive") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    onButtonPress(button);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onDismiss}
      >
        <Pressable
          className="w-full max-w-sm rounded-3xl p-6"
          style={{
            backgroundColor: colors.cardBackground,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View className="items-center mb-5">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: typeStyles.iconBg }}
            >
              <Ionicons
                name={typeStyles.iconName}
                size={36}
                color={typeStyles.iconColor}
              />
            </View>
          </View>

          {/* Title */}
          <Text
            className={`${textClasses.subtitle} font-semibold text-center mb-3`}
            style={{ color: colors.textPrimary }}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            className={`${textClasses.body} text-center mb-6 leading-relaxed`}
            style={{ color: colors.textSecondary }}
          >
            {message}
          </Text>

          {/* Buttons */}
          <View className={buttons.length > 2 ? "space-y-3" : "flex-row space-x-3"}>
            {buttons.map((button, index) => {
              const buttonStyles = getButtonStyles(button.style);
              const isFullWidth = buttons.length > 2;

              return (
                <Pressable
                  key={index}
                  onPress={() => handlePress(button)}
                  className={`py-4 rounded-2xl items-center justify-center ${
                    isFullWidth ? "w-full mb-3" : "flex-1"
                  }`}
                  style={{
                    backgroundColor: buttonStyles.bg,
                    borderWidth: buttonStyles.border ? 1.5 : 0,
                    borderColor: buttonStyles.border,
                    minHeight: 52,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                >
                  <Text
                    className={`${textClasses.button} font-semibold`}
                    style={{ color: buttonStyles.textColor }}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// STANDALONE MODAL (for screens that don't use provider)
// ============================================================================

interface StandaloneConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: ConfirmModalType;
  buttons?: ConfirmModalButton[];
  icon?: keyof typeof Ionicons.glyphMap;
  onClose: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  type = "info",
  buttons = [{ text: "OK", style: "default" }],
  icon,
  onClose,
}: StandaloneConfirmModalProps) {
  const handleButtonPress = (button: ConfirmModalButton) => {
    onClose();
    if (button.onPress) {
      setTimeout(() => {
        button.onPress?.();
      }, 100);
    }
  };

  return (
    <ConfirmModalComponent
      visible={visible}
      title={title}
      message={message}
      type={type}
      buttons={buttons}
      icon={icon}
      onButtonPress={handleButtonPress}
      onDismiss={onClose}
    />
  );
}

export default ConfirmModal;
