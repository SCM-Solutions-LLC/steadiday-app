import React, { useState, useEffect } from "react";
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Keyboard } from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "../state/stores/uiStore";
import { detectInstalledApps, sortByInstalled } from "../utils/appDetection";
import { ConnectedApp } from "../types/app";
import { fuzzyFilter } from "../utils/fuzzySearch";
import { useTheme } from "../utils/useTheme";
import { BackButton } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "ConnectAppsAdd">;
};

export default function ConnectAppsAddScreen({ navigation }: Props) {
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDetecting, setIsDetecting] = useState(true);
  const [appsWithInstallStatus, setAppsWithInstallStatus] = useState<ConnectedApp[]>([]);
  const { colors } = useTheme();

  // UI state from useUIStore
  const connectedApps = useUIStore((s) => s.connectedApps);

  useEffect(() => {
    const detectApps = async () => {
      setIsDetecting(true);
      const detected = await detectInstalledApps(connectedApps);
      setAppsWithInstallStatus(detected);
      setIsDetecting(false);
    };

    detectApps();
  }, []);

  // Filter and sort apps with fuzzy search - handles typos and misspellings
  const filteredApps = searchText.trim()
    ? sortByInstalled(
        fuzzyFilter(appsWithInstallStatus, searchText, (app) => app.name, 35)
      )
    : sortByInstalled(appsWithInstallStatus); // Show all apps when no search text

  const handleAppPress = (app: ConnectedApp) => {
    setSearchText(app.name);
    setShowDropdown(false);
    Keyboard.dismiss();
    // Navigate after a brief delay so user sees selection
    setTimeout(() => {
      navigation.navigate("ConnectAppsDetail", { appId: app.id });
    }, 150);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setShowDropdown(true);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding dropdown to allow tap on items
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <Screen variant="static" edges={["top", "bottom"]}>
      <View className="flex-1 px-10 py-12">
        {/* Back Button */}
        <BackButton label="Back" style={{ marginBottom: 24 }} />

        <Text style={{ fontSize: 36, fontWeight: "600", color: colors.textPrimary, textAlign: "center", marginBottom: 24, lineHeight: 40 }}>
          Add another app
        </Text>
        <Text style={{ fontSize: 24, color: colors.textPrimary, textAlign: "center", marginBottom: 40, lineHeight: 32 }}>
          Type the app name to search.
        </Text>

        <View className="mb-8">
          <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary, marginBottom: 16 }}>
            App name
          </Text>
          <View className="relative">
            <TextInput
              value={searchText}
              onChangeText={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholder="Enter app name"
              style={{ backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 20, fontSize: 20, color: colors.textPrimary }}
              placeholderTextColor={colors.textTertiary}
              autoFocus={true}
              returnKeyType="search"
              editable={!isDetecting}
            />
            {isDetecting && (
              <View className="absolute right-6 top-0 bottom-0 justify-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </View>
          {isDetecting && (
            <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 12, textAlign: "center" }}>
              Detecting apps on your device...
            </Text>
          )}

          {/* Autocomplete Dropdown */}
          {showDropdown && !isDetecting && filteredApps.length > 0 && (
            <View style={{ marginTop: 12, backgroundColor: colors.cardBackground, borderWidth: 2, borderColor: colors.primary, borderRadius: 16, maxHeight: 400 }}>
              <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.primary }}>
                <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "600" }}>
                  Tap to select ({filteredApps.length} {filteredApps.length === 1 ? "app" : "apps"})
                </Text>
              </View>
              <ScrollView
                className="flex-1"
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                bounces={true}
                scrollEnabled={true}
              >
                {filteredApps.map((app) => (
                  <Pressable
                    key={app.id}
                    onPress={() => handleAppPress(app)}
                    style={{ paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.divider }}
                    className="active:opacity-70 flex-row items-center"
                  >
                    <View style={{ backgroundColor: colors.primaryLight, width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                      <Ionicons name={app.icon as any} size={24} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontSize: 18, fontWeight: "600", color: colors.textPrimary }}>
                        {app.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        {app.isInstalled && (
                          <Text style={{ fontSize: 14, color: colors.success, marginRight: 12 }}>
                            Installed
                          </Text>
                        )}
                        {app.isConnected && (
                          <Text style={{ fontSize: 14, color: colors.primary }}>
                            Connected
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}
