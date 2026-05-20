# Apple HealthKit Configuration Guide

Complete guide to enable Apple Health integration in SteadiDay app.

## ✅ Step 1: Install react-native-health Package

```bash
bun add react-native-health
```

## ✅ Step 2: app.json Configuration (ALREADY DONE)

The app.json has been updated with the necessary permissions and entitlements:

```json
"ios": {
  "infoPlist": {
    "NSHealthShareUsageDescription": "SteadiDay needs access to read your health data including activity, heart rate, sleep, exercise, and medical information to help you track your wellness.",
    "NSHealthUpdateUsageDescription": "SteadiDay needs access to save health data to your Apple Health app.",
    "UIBackgroundModes": ["fetch"]
  },
  "entitlements": {
    "com.apple.developer.healthkit": true,
    "com.apple.developer.healthkit.access": []
  }
}
```

## Step 3: Run Expo Prebuild

Since HealthKit requires native code, you must prebuild your app:

```bash
npx expo prebuild --clean
```

This creates the native iOS project with HealthKit capabilities enabled.

## Step 4: Uncomment Code in appleHealthSync.ts

Open `/src/utils/appleHealthSync.ts` and uncomment these sections:

### A. Import Statement (Line 27-30)
```typescript
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
```

### B. Permission Request (Lines 58-87)
Remove the `/*` and `*/` around the permission request code.

### C. All Helper Functions
Uncomment the implementation code in:
- `fetchTodayHealthData()` (lines 96-133)
- `getSteps()` (lines 144-161)
- `getHeartRate()` (lines 167-192)
- `getSleepHours()` (lines 197-230)
- `getExerciseMinutes()` (lines 235-268)
- `getWeight()` (lines 273-298)
- `getBloodPressure()` (lines 303-326)
- `fetchMedicalIDFromAppleHealth()` (lines 420-519)

## Step 5: Build the App

### For Development:
```bash
npx expo run:ios
```

### For Production (TestFlight/App Store):
```bash
eas build --platform ios
```

## Step 6: Test on Physical Device

⚠️ **IMPORTANT**: Apple HealthKit does NOT work in the iOS Simulator. You MUST test on a real iPhone or iPad.

### Testing Medical ID Sync:
1. Open Apple Health app on your device
2. Tap your profile picture → Medical ID
3. Add blood type, height, and weight
4. Open SteadiDay app
5. Navigate to Medical ID setup during onboarding
6. Tap "Sync from Apple Health" button
7. Accept the permissions prompt
8. Your data should auto-fill

## Important Limitations

### What CAN Be Synced from Apple Health:
- ✅ Blood Type
- ✅ Height
- ✅ Weight
- ✅ Steps
- ✅ Heart Rate
- ✅ Sleep Hours
- ✅ Exercise Minutes
- ✅ Blood Pressure

### What CANNOT Be Synced (Privacy Restrictions):
- ❌ Allergies (must be entered manually)
- ❌ Medical Conditions (must be entered manually)
- ❌ Organ Donor Status (must be entered manually)
- ❌ Emergency Contacts (must be entered manually)

These fields are protected by Apple for privacy and cannot be read programmatically.

## Troubleshooting

### Problem: "Package not installed" alert
**Solution**: Make sure you ran `bun add react-native-health` and `npx expo prebuild`

### Problem: Permissions not appearing
**Solution**: Check that app.json has the correct `infoPlist` entries and rebuild the app

### Problem: Can't test in simulator
**Solution**: Use a physical iOS device - HealthKit doesn't work in simulators

### Problem: No data syncing
**Solution**:
1. Make sure you have data in Apple Health app
2. Check that permissions were granted
3. Look at console logs for error messages

## App Store Submission Notes

When submitting to the App Store:

1. **Privacy Policy**: Must mention health data collection and usage
2. **Permission Descriptions**: The NSHealthShareUsageDescription will be shown to users - make sure it's clear
3. **HealthKit Entitlement**: Apple will review your HealthKit usage - be prepared to explain why you need each permission
4. **Screenshots**: Consider adding screenshots showing the Health integration

## Need Help?

Check the following files:
- `/src/utils/appleHealthSync.ts` - All HealthKit integration code
- `/src/screens/MedicalIDSetupScreen.tsx` - Medical ID sync implementation
- `/src/screens/HealthScreen.tsx` - Daily health metrics sync
- `/home/user/workspace/app.json` - iOS permissions configuration

For more information, see Apple's HealthKit documentation:
https://developer.apple.com/documentation/healthkit
