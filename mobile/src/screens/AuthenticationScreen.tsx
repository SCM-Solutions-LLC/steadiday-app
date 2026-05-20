import React, { useEffect } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import CreateAccountScreen from "./CreateAccountScreen";
import LoginScreen from "./LoginScreen";
import { ScreenErrorBoundary } from "../components/ui";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "Authentication">;
  route: { params?: { mode?: "login" | "create" } };
};

export default function AuthenticationScreen({ navigation, route }: Props) {
  const mode = route.params?.mode || "create";

  if (mode === "login") {
    return (
      <ScreenErrorBoundary screenName="Authentication">
        <LoginScreen navigation={navigation} />
      </ScreenErrorBoundary>
    );
  }

  return (
    <ScreenErrorBoundary screenName="Authentication">
      <CreateAccountScreen navigation={navigation} />
    </ScreenErrorBoundary>
  );
}
