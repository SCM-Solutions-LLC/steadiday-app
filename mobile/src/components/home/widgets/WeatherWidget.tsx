import React, { useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { WeatherWidgetProps } from "../types";

export function WeatherWidget({
  weather,
  userLocation,
  useDeviceLocation,
  loadingWeather,
  textClasses,
  colors,
  primary,
  onChangeLocation,
  onToggleDeviceLocation,
}: WeatherWidgetProps) {
  const weatherIcon = useMemo(() => {
    if (!weather) return "cloud";
    const condition = weather.condition?.toLowerCase() || "";
    if (condition.includes("sun") || condition.includes("clear")) return "sunny";
    if (condition.includes("cloud") || condition.includes("overcast")) return "cloud";
    if (condition.includes("rain") || condition.includes("drizzle")) return "rainy";
    if (condition.includes("snow")) return "snow";
    if (condition.includes("storm") || condition.includes("thunder")) return "thunderstorm";
    if (condition.includes("fog") || condition.includes("mist")) return "cloudy";
    return "partly-sunny";
  }, [weather]);

  return (
    <View
      className="rounded-3xl p-4 mb-6 border"
      style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className={`${textClasses.subtitle}`} style={{ color: colors.textPrimary }}>
          Weather
        </Text>
        <Pressable
          onPress={onChangeLocation}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="flex-row items-center px-3 py-2 rounded-xl"
          style={{ minHeight: 44, backgroundColor: colors.primaryLight }}
          accessibilityRole="button"
          accessibilityLabel="Change location"
          accessibilityHint="Double tap to change your weather location"
        >
          <Ionicons name="create-outline" size={18} color={primary} />
          <Text className={`${textClasses.small} ml-1 font-medium`} style={{ color: primary }}>
            Edit
          </Text>
        </Pressable>
      </View>

      {loadingWeather ? (
        <View className="items-center justify-center py-6">
          <ActivityIndicator size="large" color={primary} />
          <Text className={`${textClasses.small} mt-2`} style={{ color: colors.textSecondary }}>
            Loading weather...
          </Text>
        </View>
      ) : weather ? (
        <View className="flex-row items-center">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Ionicons name={weatherIcon as any} size={36} color={primary} />
          </View>
          <View className="ml-4 flex-1">
            <Text className={`${textClasses.title} font-bold`} style={{ color: colors.textPrimary }}>
              {Math.round(weather.temperature)}°F
            </Text>
            <Text className={`${textClasses.body}`} style={{ color: colors.textSecondary }}>
              {weather.condition}
            </Text>
            {weather.feelsLike && weather.feelsLike !== weather.temperature && (
              <Text className={`${textClasses.small}`} style={{ color: colors.textSecondary }}>
                Feels like {Math.round(weather.feelsLike)}°F
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View className="items-center py-4">
          <Ionicons name="location-outline" size={32} color={colors.textSecondary} />
          <Text className={`${textClasses.body} mt-2 text-center`} style={{ color: colors.textSecondary }}>
            {userLocation
              ? "Unable to load weather"
              : "Set your location to see weather"}
          </Text>
          <Pressable
            onPress={onChangeLocation}
            className="mt-3 px-6 py-3 rounded-xl"
            style={{ backgroundColor: primary, minHeight: 48 }}
            accessibilityRole="button"
            accessibilityLabel="Set location"
          >
            <Text className={`${textClasses.button} text-white font-semibold`}>Set Location</Text>
          </Pressable>
        </View>
      )}

      {/* Location display */}
      {(userLocation || useDeviceLocation) && (
        <View className="mt-3 pt-3 border-t flex-row items-center justify-between" style={{ borderTopColor: colors.divider }}>
          <View className="flex-row items-center flex-1">
            <Ionicons
              name={useDeviceLocation ? "navigate" : "location"}
              size={18}
              color={colors.textSecondary}
            />
            <Text className={`${textClasses.small} ml-2 flex-1`} style={{ color: colors.textSecondary }} numberOfLines={1}>
              {useDeviceLocation ? "Using device location" : userLocation}
            </Text>
          </View>
          <Pressable
            onPress={onToggleDeviceLocation}
            className="ml-2 flex-row items-center px-3 py-2 rounded-xl"
            style={{ minHeight: 44, backgroundColor: useDeviceLocation ? primary + "15" : "transparent" }}
            accessibilityRole="button"
            accessibilityLabel={useDeviceLocation ? "Stop using device location" : "Use device location"}
            accessibilityHint={useDeviceLocation ? "Double tap to stop using your device location" : "Double tap to use your device location for weather"}
          >
            <Ionicons
              name={useDeviceLocation ? "locate" : "locate-outline"}
              size={18}
              color={useDeviceLocation ? primary : colors.textSecondary}
            />
            <Text className={`${textClasses.small} ml-1`} style={{ color: useDeviceLocation ? primary : colors.textSecondary }}>
              {useDeviceLocation ? "GPS on" : "GPS"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
