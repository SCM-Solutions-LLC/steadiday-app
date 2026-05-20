# Biometric Authentication Implementation Guide

## Overview

This guide explains how to implement Face ID / Touch ID biometric authentication for the SteadiDay app once the `expo-local-authentication` package is installed.

**Current Status:** Not implemented (requires installing `expo-local-authentication` which has native code)

**Priority:** Medium (Nice-to-have for improved UX, not security-critical)

**Estimated Time:** 2-3 hours

---

## Why Biometric Authentication?

**Benefits:**
- Faster session unlock for users
- Better UX for seniors (no PIN typing)
- Still secure (device controls biometric access)
- Reduces friction for frequent app access

**Security Notes:**
- Biometrics are for **convenience only**, not primary security
- PIN/password remains the primary authentication method
- Biometrics only unlock existing sessions, never replace passwords
- Device handles all biometric data (never stored in app)

---

## Implementation Requirements

### 1. Install Package

```bash
bun add expo-local-authentication
```

**Note:** This package includes native code and requires:
- iOS: Automatic (Expo handles it)
- Android: Automatic (Expo handles it)
- Rebuild required after installation

### 2. Update app.json

Add biometric permissions:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSFaceIDUsageDescription": "We use Face ID to help you quickly and securely unlock the app."
      }
    },
    "android": {
      "permissions": [
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ]
    }
  }
}
```

---

## Code Implementation

### Step 1: Create Biometric Auth Utility

Create `src/utils/biometricAuth.ts`:

```typescript
import * as LocalAuthentication from "expo-local-authentication";
import { secureLog } from "./secureLogger";

/**
 * Check if device supports biometric authentication
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    return compatible && enrolled;
  } catch (error) {
    secureLog("Biometric check failed", { error });
    return false;
  }
}

/**
 * Get available biometric types
 * Returns: "FaceID", "TouchID", "Fingerprint", or "None"
 */
export async function getBiometricType(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return "FaceID";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "TouchID";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return "Iris";
    }

    return "None";
  } catch (error) {
    return "None";
  }
}

/**
 * Prompt user for biometric authentication
 *
 * SECURITY NOTE: This should ONLY be used for:
 * - Unlocking existing session
 * - Quick access to app
 *
 * NEVER use for:
 * - Initial login/registration
 * - Password reset
 * - Account deletion
 * - Sensitive actions (those require PIN/password)
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock SteadiDay",
      fallbackLabel: "Use PIN Instead",
      disableDeviceFallback: false, // Allow device PIN as fallback
      cancelLabel: "Cancel",
    });

    return result.success;
  } catch (error) {
    secureLog("Biometric auth failed", { error });
    return false;
  }
}
```

---

### Step 2: Update LockScreen.tsx

Add biometric prompt to lock screen:

```typescript
import { authenticateWithBiometric, isBiometricAvailable, getBiometricType } from "../utils/biometricAuth";
import { useSettingsStore } from "../state/stores/settingsStore";

export default function LockScreen() {
  // ... existing code ...

  const [biometricType, setBiometricType] = useState<string>("None");
  const biometricEnabled = useSettingsStore((s) => s.biometricEnabled);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);

      // Auto-prompt if enabled
      if (biometricEnabled) {
        handleBiometricAuth();
      }
    }
  };

  const handleBiometricAuth = async () => {
    const success = await authenticateWithBiometric();

    if (success) {
      // Unlock session
      await SessionManager.unlock();
      setIsLocked(false);

      // Navigate to main app
      // ... existing unlock code ...
    } else {
      // User failed biometric or cancelled
      // They can still use PIN
    }
  };

  return (
    <SafeAreaView>
      {/* ... existing PIN UI ... */}

      {/* Biometric Button (show if enabled and available) */}
      {biometricEnabled && biometricType !== "None" && (
        <Pressable
          onPress={handleBiometricAuth}
          className="mt-6 items-center"
        >
          <View className="bg-primary rounded-full p-6 mb-3">
            <Ionicons
              name={biometricType === "FaceID" ? "scan" : "finger-print"}
              size={48}
              color="white"
            />
          </View>
          <Text className="text-lg text-primary font-semibold">
            Use {biometricType}
          </Text>
        </Pressable>
      )}

      {/* PIN remains available as fallback */}
      <Text className="text-base text-light-body text-center mt-4">
        Or enter your PIN above
      </Text>
    </SafeAreaView>
  );
}
```

---

### Step 3: Add Biometric Toggle in Settings

Update `SecuritySettingsScreen.tsx`:

```typescript
import { isBiometricAvailable, getBiometricType } from "../utils/biometricAuth";
import { useSettingsStore } from "../state/stores/settingsStore";

export default function SecuritySettingsScreen() {
  // ... existing code ...

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("None");
  const biometricEnabled = useSettingsStore((s) => s.biometricEnabled);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);

    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);
    }
  };

  const toggleBiometric = async () => {
    if (!biometricEnabled) {
      // Enabling - test first
      const success = await authenticateWithBiometric();

      if (success) {
        updateSettings({ biometricEnabled: true });
        Alert.alert(
          "Enabled!",
          `${biometricType} is now enabled for quick unlock.`
        );
      } else {
        Alert.alert(
          "Authentication Failed",
          `Unable to verify ${biometricType}. Please try again.`
        );
      }
    } else {
      // Disabling - no auth needed
      updateSettings({ biometricEnabled: false });
    }
  };

  return (
    <ScrollView>
      {/* ... existing settings ... */}

      {/* Biometric Setting */}
      {biometricAvailable && (
        <View className="bg-white rounded-2xl p-6 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-xl font-semibold text-light-heading mb-2">
                {biometricType} Unlock
              </Text>
              <Text className="text-base text-light-body leading-relaxed">
                Use {biometricType} to quickly unlock the app
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: "#DDDDDD", true: "#A3D4FF" }}
              thumbColor={biometricEnabled ? "#2F80ED" : "#F7F7F7"}
            />
          </View>
        </View>
      )}

      {/* Info: What biometrics are used for */}
      {biometricAvailable && (
        <View className="bg-blue-50 rounded-2xl p-5 mb-4 border border-blue-200">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color="#2F80ED" style={{ marginRight: 12 }} />
            <View className="flex-1">
              <Text className="text-base text-gray-700 leading-relaxed">
                {biometricType} is only used to unlock the app. You will still need your password for account changes and sensitive actions.
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
```

---

### Step 4: Update App State

Add biometric setting to `src/state/appStore.ts`:

```typescript
interface Settings {
  // ... existing settings ...
  biometricEnabled: boolean;
}

// Default settings
settings: {
  // ... existing defaults ...
  biometricEnabled: false,
}
```

---

## Security Considerations

### ✅ Safe Uses of Biometrics:
1. **Session unlock** - Quick access to already-authenticated session
2. **App foreground** - Resuming from background
3. **Convenience feature** - Faster than typing PIN

### ❌ NEVER Use Biometrics For:
1. **Initial login** - Always require password for first login
2. **Password reset** - Must use email verification
3. **Account deletion** - Requires explicit password confirmation
4. **Payment actions** - If app handles payments
5. **Sharing medical data** - Requires PIN/password confirmation
6. **Changing security settings** - Changing PIN requires current password

### Implementation Rules:
1. ✅ **Biometrics unlock session** - Device verified → session valid
2. ✅ **PIN is always available** - Never hide PIN option
3. ✅ **Auto-prompt is optional** - User can disable auto-prompt
4. ✅ **Graceful fallback** - If biometric fails, show PIN
5. ✅ **Device security required** - Only works if device has biometrics enrolled

---

## User Experience Guidelines

### For Seniors:
1. **Clear language**: "Use Face ID" not "Biometric Authentication"
2. **Large buttons**: 60x60pt minimum tap target
3. **Visual feedback**: Show face/fingerprint icon based on device
4. **Fallback always visible**: "Or enter your PIN" always shown
5. **Optional feature**: Never force biometrics

### Error Handling:
- **Biometric failed**: Show friendly message, offer PIN
- **Too many attempts**: Fall back to PIN automatically
- **No biometrics enrolled**: Don't show biometric option
- **Hardware unavailable**: Gracefully hide feature

---

## Testing Checklist

Once implemented, test:

### Functional Testing:
- [ ] Enable biometric in settings
- [ ] Biometric unlocks app successfully
- [ ] Biometric failure falls back to PIN
- [ ] Cancel biometric prompt shows PIN
- [ ] Disable biometric in settings works
- [ ] App remembers biometric preference
- [ ] Biometric works after app restart
- [ ] Biometric works after device restart

### Security Testing:
- [ ] Cannot bypass PIN entirely
- [ ] Session still times out with biometric enabled
- [ ] Biometric doesn't work if session expired
- [ ] Wrong face/finger doesn't unlock
- [ ] Device security required (can't unlock with no device security)

### Edge Cases:
- [ ] Device with no biometric hardware
- [ ] User removed biometric enrollment
- [ ] Multiple users on device
- [ ] Biometric hardware failure
- [ ] App killed during biometric prompt

---

## Backend Requirements

**None** - Biometric authentication is entirely client-side:
- Device handles all biometric verification
- App never sees biometric data
- Backend only sees normal session tokens
- No backend changes required

---

## References

- [Expo LocalAuthentication Docs](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Apple Face ID Guidelines](https://developer.apple.com/design/human-interface-guidelines/face-id-and-touch-id)
- [Android BiometricPrompt Guidelines](https://developer.android.com/training/sign-in/biometric-auth)

---

## Summary

**Pros:**
- ✅ Better UX for seniors
- ✅ Faster app access
- ✅ Reduces PIN fatigue
- ✅ No backend changes needed
- ✅ Device-managed security

**Cons:**
- ❌ Requires native package installation
- ❌ Not all devices support it
- ❌ Adds complexity to unlock flow

**Recommendation:** Implement after all critical security features are complete. This is a UX enhancement, not a security requirement.
