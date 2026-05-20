import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  Easing,
  Pressable,
} from "react-native";
import { Screen } from "../components/Screen";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useUserStore } from "../state/stores/userStore";
import { OnboardingStackParamList } from "../navigation/RootNavigator";
import { useAnimationDuration } from "../utils/useReduceMotion";
import { useTheme } from "../utils/useTheme";
import { useResponsive } from "../utils/useResponsive";
import Button from "../components/Button";
import { openPrivacyPolicy, openTermsOfService, openSecurity } from "../utils/openURL";

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, "Welcome">;
};

export default function WelcomeScreen({ navigation }: Props) {
  const userAuth = useUserStore((s) => s.userProfile.auth);
  const responsive = useResponsive();
  const { colors, primary, onPrimary } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const subtitleSlide = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  const animDuration = useAnimationDuration(800, 0);
  const buttonAnimDuration = useAnimationDuration(600, 0);
  const shouldAnimate = animDuration > 0;

  const isTablet = responsive.isTablet;

  useEffect(() => {
    if (userAuth?.isAuthenticated) {
      return;
    }
  }, [userAuth]);

  // Entrance animations
  useEffect(() => {
    // Initial entrance
    Animated.parallel([
      // Fade in everything
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animDuration,
        useNativeDriver: true,
      }),
      // Icon bounces in with scale
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      // Title slides up
      Animated.timing(titleSlide, {
        toValue: 0,
        duration: animDuration,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      // Subtitle slides up slightly delayed
      Animated.timing(subtitleSlide, {
        toValue: 0,
        duration: animDuration,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // Buttons fade in
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: buttonAnimDuration,
        delay: shouldAnimate ? 300 : 0,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous floating animation for icon (only if animations enabled)
    if (shouldAnimate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconFloat, {
            toValue: -8,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(iconFloat, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Subtle glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [fadeAnim, iconScale, iconFloat, titleSlide, subtitleSlide, buttonOpacity, glowOpacity, animDuration, buttonAnimDuration, shouldAnimate]);

  const handleGetStarted = () => {
    navigation.navigate("AccessibilitySetup");
  };

  const handleLogin = () => {
    navigation.navigate("Authentication", { mode: "login" });
  };

  return (
    <Screen
      variant="static"
      edges={["top", "bottom"]}
    >
      <View className="flex-1 justify-between py-12" style={{ paddingHorizontal: responsive.isTablet ? 48 : 32, maxWidth: responsive.contentMaxWidth, alignSelf: "center", width: "100%" }}>
        <View className="flex-1" />

        <Animated.View
          style={{
            alignItems: "center",
            opacity: fadeAnim,
          }}
        >
          {/* Glow effect behind icon */}
          <Animated.View
            style={{
              position: "absolute",
              top: isTablet ? -20 : -16,
              width: isTablet ? 180 : 150,
              height: isTablet ? 180 : 150,
              borderRadius: 100,
              backgroundColor: primary,
              opacity: glowOpacity,
              transform: [{ scale: 1.2 }],
            }}
          />

          {/* App Icon with float animation */}
          <Animated.View
            style={{
              marginBottom: isTablet ? 32 : 24,
              transform: [
                { scale: iconScale },
                { translateY: iconFloat },
              ],
            }}
          >
            <Image
              source={require("../../assets/steadiday-icon.png")}
              style={{
                width: isTablet ? 140 : 120,
                height: isTablet ? 140 : 120,
                borderRadius: isTablet ? 32 : 28,
              }}
              resizeMode="contain"
              accessible={true}
              accessibilityLabel="SteadiDay app icon"
            />
          </Animated.View>

          {/* App Name with slide animation */}
          <Animated.Text
            style={{
              fontSize: isTablet ? 48 : 40,
              fontWeight: "700",
              color: colors.textPrimary,
              letterSpacing: -0.5,
              marginBottom: isTablet ? 12 : 8,
              textAlign: "center",
              transform: [{ translateY: titleSlide }],
            }}
            maxFontSizeMultiplier={1.3}
          >
            SteadiDay
          </Animated.Text>

          {/* Tagline with slide animation */}
          <Animated.Text
            style={{
              fontSize: isTablet ? 26 : 23,
              fontWeight: "400",
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: isTablet ? 16 : 12,
              transform: [{ translateY: subtitleSlide }],
            }}
            maxFontSizeMultiplier={1.3}
          >
            Your day, made easier.
          </Animated.Text>

          {/* Promise statement - shown once during onboarding */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              marginBottom: isTablet ? 56 : 40,
              paddingHorizontal: isTablet ? 24 : 16,
            }}
          >
            <Text
              style={{
                fontSize: isTablet ? 20 : 18,
                fontWeight: "500",
                color: colors.textPrimary,
                textAlign: "center",
                lineHeight: isTablet ? 28 : 26,
              }}
              maxFontSizeMultiplier={1.3}
            >
              SteadiDay helps you stay organized, calm, and independent — at your own pace.
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={{
            opacity: buttonOpacity,
            gap: isTablet ? 16 : 12,
          }}
        >
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel="Get started with SteadiDay"
          />

          <Button
            title="Log In"
            onPress={handleLogin}
            variant="outline"
            size="large"
            fullWidth
            accessibilityLabel="Log in to existing account"
          />

          <Text
            style={{
              fontSize: isTablet ? 15 : 14,
              lineHeight: isTablet ? 22 : 20,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: isTablet ? 16 : 12,
              paddingHorizontal: isTablet ? 32 : 16,
            }}
            maxFontSizeMultiplier={1.2}
          >
            Nothing is shared without your permission. Your information stays private and secure on your device.
          </Text>

          {/* Terms and Privacy Links */}
          <Text
            style={{
              fontSize: isTablet ? 14 : 13,
              lineHeight: isTablet ? 20 : 18,
              color: colors.textTertiary || colors.textSecondary,
              textAlign: "center",
              marginTop: isTablet ? 8 : 6,
              paddingHorizontal: isTablet ? 32 : 16,
            }}
            maxFontSizeMultiplier={1.2}
          >
            By continuing, you agree to our{" "}
            <Text
              style={{
                color: primary,
                fontWeight: "500",
                textDecorationLine: "underline",
              }}
              onPress={openPrivacyPolicy}
              accessibilityRole="link"
              accessibilityLabel="Open Privacy Policy in browser"
              accessibilityHint="Opens the SteadiDay privacy policy on our website"
            >
              Privacy Policy
            </Text>
            {", "}
            <Text
              style={{
                color: primary,
                fontWeight: "500",
                textDecorationLine: "underline",
              }}
              onPress={openTermsOfService}
              accessibilityRole="link"
              accessibilityLabel="Open Terms of Service in browser"
              accessibilityHint="Opens the SteadiDay terms of service on our website"
            >
              Terms of Service
            </Text>
            {", and "}
            <Text
              style={{
                color: primary,
                fontWeight: "500",
                textDecorationLine: "underline",
              }}
              onPress={openSecurity}
              accessibilityRole="link"
              accessibilityLabel="Open Security Policy in browser"
              accessibilityHint="Opens the SteadiDay security policy on our website"
            >
              Security Policy
            </Text>
          </Text>
        </Animated.View>

        <View className="flex-1" />
      </View>
    </Screen>
  );
}
