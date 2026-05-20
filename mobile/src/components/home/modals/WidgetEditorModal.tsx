import React, { useMemo } from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { HomeScreenWidget } from "../../../types/app";
import { WIDGET_OPTIONS, getAvailableWidgetOptions, type WidgetEditorModalProps } from "../types";

const layoutTransition = LinearTransition.springify().damping(18).stiffness(140);

export function WidgetEditorModal({
  visible,
  onClose,
  homeScreenWidgets,
  movingWidgetIndex,
  onMoveWidgetUp,
  onMoveWidgetDown,
  onToggleWidget,
  textClasses,
  colors,
  primary,
  shouldReduceMotion,
  isPremiumUnlocked,
}: WidgetEditorModalProps) {
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style);
  };

  const handleToggleWidget = (widgetType: HomeScreenWidget) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    onToggleWidget(widgetType);
  };

  const availableWidgetOptions = useMemo(() => {
    return getAvailableWidgetOptions(isPremiumUnlocked);
  }, [isPremiumUnlocked]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
          <View
            className="flex-1 mt-20 rounded-t-3xl"
            style={{ backgroundColor: colors.cardBackground }}
          >
            {/* Header */}
            <View
              className="flex-row items-center justify-between px-6 py-4 border-b"
              style={{ borderBottomColor: colors.divider }}
            >
              <Text
                className={`${textClasses.title}`}
                style={{ color: colors.textPrimary }}
              >
                Edit Home Screen
              </Text>
              <Pressable
                onPress={onClose}
                className="px-5 py-3 rounded-2xl"
                style={{ backgroundColor: primary }}
                accessibilityRole="button"
                accessibilityLabel="Done editing"
              >
                <Text className="text-lg font-semibold" style={{ color: colors.onPrimary }}>
                  Done
                </Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              {/* Helper text */}
              <Text
                className={`${textClasses.small} mb-4`}
                style={{ color: colors.textSecondary }}
              >
                Tap arrows to reorder. Changes animate slowly so you can see them.
              </Text>

              {/* Active Widgets Section */}
              <View className="mb-6">
                <Text
                  className={`${textClasses.subtitle} mb-3`}
                  style={{ color: colors.textPrimary }}
                >
                  Active Widgets
                </Text>
                {homeScreenWidgets.length === 0 ? (
                  <Text
                    className={`${textClasses.body}`}
                    style={{ color: colors.textSecondary }}
                  >
                    No widgets enabled. Add some below!
                  </Text>
                ) : (
                  homeScreenWidgets.map((widgetType, index) => {
                    const option = availableWidgetOptions.find((opt) => opt.value === widgetType);
                    if (!option) return null;
                    const isMoving = movingWidgetIndex === index;

                    return (
                      <Animated.View
                        key={widgetType}
                        layout={shouldReduceMotion ? undefined : layoutTransition}
                        entering={shouldReduceMotion ? undefined : FadeIn.duration(350)}
                        exiting={shouldReduceMotion ? undefined : FadeOut.duration(300)}
                        className="rounded-2xl p-4 mb-3"
                        style={{
                          backgroundColor: isMoving ? primary + "12" : colors.background,
                          borderColor: isMoving ? primary : colors.divider,
                          borderWidth: isMoving ? 2 : 1,
                          transform: [{ scale: isMoving ? 1.02 : 1 }],
                        }}
                      >
                        <View className="flex-row items-center">
                          <View
                            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: colors.cardBackground }}
                          >
                            <Ionicons
                              name={option.icon as any}
                              size={24}
                              color={primary}
                            />
                          </View>
                          <View className="flex-1">
                            <Text
                              className={`${textClasses.body} font-semibold`}
                              style={{ color: colors.textPrimary }}
                            >
                              {option.label}
                            </Text>
                            <Text
                              className={`${textClasses.small} mt-0.5`}
                              style={{ color: colors.textSecondary }}
                            >
                              {option.description}
                            </Text>
                          </View>
                          <View className="flex-row items-center ml-2">
                            {/* Move up button */}
                            <Pressable
                              onPress={() => onMoveWidgetUp(index)}
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: index > 0 ? primary : colors.divider,
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: 4,
                              }}
                              disabled={index === 0 || movingWidgetIndex !== null}
                              accessibilityRole="button"
                              accessibilityLabel={`Move ${option.label} up`}
                            >
                              <Ionicons
                                name="arrow-up"
                                size={22}
                                color={index > 0 ? colors.onPrimary : colors.buttonDisabledText}
                              />
                            </Pressable>
                            {/* Move down button */}
                            <Pressable
                              onPress={() => onMoveWidgetDown(index)}
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor:
                                  index < homeScreenWidgets.length - 1
                                    ? primary
                                    : colors.divider,
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: 8,
                              }}
                              disabled={
                                index === homeScreenWidgets.length - 1 ||
                                movingWidgetIndex !== null
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`Move ${option.label} down`}
                            >
                              <Ionicons
                                name="arrow-down"
                                size={22}
                                color={
                                  index < homeScreenWidgets.length - 1
                                    ? colors.onPrimary
                                    : colors.buttonDisabledText
                                }
                              />
                            </Pressable>
                            {/* Remove button (disabled for SOS widget) */}
                            {widgetType === "sos" ? (
                              <View
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 24,
                                  backgroundColor: colors.divider,
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
                              </View>
                            ) : (
                              <Pressable
                                onPress={() => handleToggleWidget(widgetType)}
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 24,
                                  backgroundColor: colors.errorBackground,
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                                disabled={movingWidgetIndex !== null}
                                accessibilityRole="button"
                                accessibilityLabel={`Remove ${option.label}`}
                              >
                                <Ionicons name="close" size={22} color={colors.error} />
                              </Pressable>
                            )}
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })
                )}
              </View>

              {/* Available Widgets Section */}
              <View className="mb-6">
                <Text
                  className={`${textClasses.subtitle} mb-3`}
                  style={{ color: colors.textPrimary }}
                >
                  Add Widgets
                </Text>
                {availableWidgetOptions.filter(
                  (option) => !homeScreenWidgets.includes(option.value)
                ).map((option) => (
                  <Animated.View
                    key={option.value}
                    layout={shouldReduceMotion ? undefined : layoutTransition}
                    entering={shouldReduceMotion ? undefined : FadeIn.duration(350)}
                    exiting={shouldReduceMotion ? undefined : FadeOut.duration(300)}
                  >
                    <Pressable
                      onPress={() => handleToggleWidget(option.value)}
                      className="rounded-2xl p-4 mb-3 border"
                      style={{
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.divider,
                        minHeight: 72,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${option.label} widget`}
                      disabled={movingWidgetIndex !== null}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: colors.background }}
                        >
                          <Ionicons
                            name={option.icon as any}
                            size={24}
                            color={colors.textSecondary}
                          />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text
                              className={`${textClasses.body} font-semibold`}
                              style={{ color: colors.textPrimary }}
                            >
                              {option.label}
                            </Text>
                          </View>
                          <Text
                            className={`${textClasses.small} mt-0.5`}
                            style={{ color: colors.textSecondary }}
                          >
                            {option.description}
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: primary + "20",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons name="add" size={24} color={primary} />
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
