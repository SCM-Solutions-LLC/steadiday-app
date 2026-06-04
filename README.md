# SteadiDay App

Wellness app for adults 50+ focused on balance and fall prevention. Live on the [App Store](https://apps.apple.com) since March 14, 2025. Android version in active development.

Built with Expo (React Native) and a Node/PostgreSQL backend. Managed and submitted via EAS.

## Repo structure

```
steadiday-app/
├── mobile/          # Expo/React Native app (TypeScript) — iOS + Android
├── backend/         # API server (Node.js + PostgreSQL)
├── .gitignore       # Active — git reads this one
├── gitignore        # ⚠️ Inactive — missing dot prefix, git ignores it (see Housekeeping)
├── CHANGES.md       # Changelog
└── package-lock.json
```

## Tech stack

| Layer | Tool |
|-------|------|
| Mobile framework | Expo SDK 54 / React Native |
| Language | TypeScript |
| Navigation | Expo Router |
| Health data (iOS) | Apple HealthKit |
| Health data (Android) | Health Connect |
| Subscriptions | RevenueCat |
| Auth | Google Sign-In |
| Backend | Node.js + PostgreSQL |
| Build & submit | EAS (Expo Application Services) |
| IDE | Cursor |

## Platform status

| Feature | iOS | Android |
|---------|-----|---------|
| Core app | ✅ Live on App Store | 🔧 In development |
| HealthKit / Health Connect | ✅ | ✅ Implemented, needs physical device QA |
| Dark mode | ✅ | ✅ (`automatic` in app.json) |
| Voice guidance (TTS) | ✅ | ✅ Timeout fallback added |
| Health permission onboarding | ✅ | ✅ Platform-aware copy |
| First-run health UX | ✅ | ✅ Platform-aware |
| Medication icons | ✅ | ✅ (`medical-outline` — consistent cross-platform) |
| SOS card | ✅ | ✅ Responsive layout (tested on 360dp) |
| Physical device QA | ✅ | ❌ Needs QA on real Android device |

## Prerequisites

- Node.js v18+
- EAS CLI: `npm install -g eas-cli`
- Xcode (for iOS simulator)
- Android Studio (for Android emulator)
- Active Apple Developer account
- Google Play Developer account (for Android release)
- RevenueCat iOS API key
- RevenueCat Android API key
- Google Sign-In iOS client ID
- `mobile/GoogleService-Info.plist` (iOS Firebase config — gitignored)
- `mobile/google-services.json` (Android Firebase config — gitignored)

## Setup

```bash
git clone https://github.com/SCM-Solutions-LLC/steadiday-app.git
cd steadiday-app
```

### Mobile app

```bash
cd mobile
npm install
```

Create `mobile/.env` from the example:

```
REVENUECAT_IOS_API_KEY=your_ios_key_here
REVENUECAT_ANDROID_API_KEY=your_android_key_here
GOOGLE_IOS_CLIENT_ID=your_client_id_here
```

Place `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) inside `mobile/`. Both are gitignored — get them from Firebase console → Project Settings.

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in DATABASE_URL and other vars
```

## Running locally

```bash
cd mobile
npx expo start
# Press i for iOS simulator
# Press a for Android emulator (requires Android Studio)
```

## Building for TestFlight / Play Store internal track

```bash
# iOS
eas build --platform ios --profile preview

# Android
eas build --platform android --profile preview
```

## Submitting to the App Store / Play Store

```bash
# iOS — always use CLI, not the web dashboard (session expiration issue)
eas submit --platform ios

# Android
eas submit --platform android
```

## Health integration

The app uses platform-specific health APIs via a shared `healthSync.ts` interface:

| Platform | API | Permission flow |
|----------|-----|----------------|
| iOS | Apple HealthKit | `requestHealthPermissions()` → `Linking.openSettings()` on denial |
| Android | Health Connect | `requestHealthPermissions()` → `openHealthConnectSettings()` on denial |

Both platforms call the same `requestHealthPermissions()` function — the branching is internal to `healthSync.ts`.

**iOS only:** Health Records sync (clinical medications) — not available on Android.

**Do not use `HKWorkoutSession`** — triggers App Store rejection. Use `HKWorkoutBuilder` or passive queries instead.

Required `Info.plist` keys (iOS):
```
NSHealthShareUsageDescription
NSHealthUpdateUsageDescription
```

## Platform-aware UI

Several components adapt their copy and behavior by platform. When editing these, test both platforms:

- `ConnectedAppsScreen` — "Apple Health" (iOS) vs "Health Connect" (Android)
- Health permission onboarding — platform-specific step wording and button labels
- First-run empty states — platform-specific health source references
- Voice guidance TTS — 2-second timeout fallback covers silent failures on Android TTS engines

## Caregiver feature

The app includes a caregiver summary screen that generates a shareable report of a user's balance activity. This supports a caregiver-first marketing angle — adult children installing the app for a 50+ parent.

## App Store assets

| Asset | Location |
|-------|---------|
| Screenshots | `mobile/assets/screenshots/` |
| Preview video | Google Drive → SteadiDay → App Store |
| App icon | `mobile/assets/icon.png` |
| Splash screen | `mobile/assets/splash.png` |

Screenshot specs: 6.9" display required. No device frames. iOS status bar only — no Android status bars.

## Known issues and QA gaps

- **Android physical device QA not done** — Health Connect, TTS (Samsung/Google engines), and SOS card layout need testing on a real Android device before release.
- **Android tablet not tested** — SOS card and modal layouts tested on phone only.
- **Dark mode requires new EAS build** — the `userInterfaceStyle: "automatic"` change is not OTA-deliverable.
- **SDK upgrades** — after any Expo SDK bump, check `metro.config.js` for breaking changes (has caused failures before).
- **EAS submit session expiry** — always use `eas submit --platform ios` from CLI, not the web dashboard.
- **App name limit** — 30 characters max for the App Store display name.

## ⚠️ Housekeeping needed

**`gitignore` file is inactive.** The file named `gitignore` (no dot) is never read by git. It contains important exclusions (`.env` files, Firebase configs, `mobile/eas.json`). Merge its contents into `.gitignore` and delete it:

```bash
cat gitignore >> .gitignore
git rm gitignore
git commit -m "Merge gitignore into .gitignore"
git push
```

## Related

- **Website:** [SCM-Solutions-LLC/steadiday](https://github.com/SCM-Solutions-LLC/steadiday)
- **Marketing assets:** Google Drive → SteadiDay → Marketing
- **App Store Connect:** [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- **Changelog:** [CHANGES.md](./CHANGES.md)
