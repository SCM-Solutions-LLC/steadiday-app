# SteadiDay App

iOS wellness app for adults 50+ focused on balance and fall prevention. Live on the [App Store](https://apps.apple.com) since March 14, 2025.

Built with Expo (React Native). Managed and submitted via EAS.

## Tech stack

| Layer | Tool |
|-------|------|
| Framework | Expo SDK 54 / React Native |
| Language | JavaScript |
| Navigation | Expo Router |
| Health data | Apple HealthKit |
| Subscriptions | RevenueCat |
| Auth | Google Sign-In |
| Build & submit | EAS (Expo Application Services) |
| IDE | Cursor |

## Prerequisites

- Node.js v18+
- Expo CLI (`npm install -g expo`)
- EAS CLI (`npm install -g eas-cli`)
- Xcode (for iOS simulator)
- Active Apple Developer account
- RevenueCat API key (iOS)
- Google Sign-In iOS client ID
- `GoogleService-Info.plist` (Firebase config — do not commit)

## Setup

```bash
git clone https://github.com/SCM-Solutions-LLC/steadiday-app.git
cd steadiday-app
npm install
```

Create a `.env` file at the project root with your keys (see `.env.example`):

```
REVENUECAT_IOS_API_KEY=your_key_here
GOOGLE_IOS_CLIENT_ID=your_client_id_here
```

Place `GoogleService-Info.plist` in the project root. This file is gitignored — get it from the team vault or Firebase console.

## Running locally

```bash
npx expo start
# Press i for iOS simulator
```

For a physical device, use Expo Go or a development build via EAS.

## Building for TestFlight

```bash
eas build --platform ios --profile preview
```

## Submitting to the App Store

```bash
eas submit --platform ios
```

Do not use the Expo web dashboard for submission — use the CLI directly to avoid session expiration issues.

## App Store metadata

Current version: **1.2.x** (pending review)

Key assets location:
- Screenshots: `assets/screenshots/`
- Preview video: stored in Google Drive → SteadiDay → App Store
- App icon: `assets/icon.png`
- Splash screen: `assets/splash.png`

App Store screenshot specs: 6.9" display required. No device frames. iOS status bar only (no Android).

## HealthKit

The app uses HealthKit for balance and activity data. `HKWorkoutSession` is not in use — do not add it (rejected by App Store review). Use `HKWorkoutBuilder` or passive queries instead.

Required `Info.plist` keys:

```
NSHealthShareUsageDescription
NSHealthUpdateUsageDescription
```

## Caregiver feature

The app includes a caregiver summary screen that generates a shareable report of a user's balance activity. This feature supports a caregiver-first marketing angle — adult children installing the app for a 50+ parent.

## Permissions

On first launch, the app requests:
1. HealthKit access
2. Notifications

The user can skip notifications. HealthKit is required for core functionality. If Apple Review asks about the Contacts permission, the app does not request contacts — confirm this is not present in the manifest before each submission.

## Known issues / watch list

- SDK 53→54 Metro config: if build fails after an SDK upgrade, check `metro.config.js` for breaking changes
- Session expiration during EAS submit: always use `eas submit --platform ios` via CLI, not the web dashboard
- App name character limit: 30 characters max for App Store display name

## Related

- **Website:** [SCM-Solutions-LLC/steadiday](https://github.com/SCM-Solutions-LLC/steadiday)
- **Marketing assets:** Google Drive → SteadiDay → Marketing
- **App Store Connect:** [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
