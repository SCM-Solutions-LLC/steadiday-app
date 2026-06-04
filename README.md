# SteadiDay App

iOS wellness app for adults 50+ focused on balance and fall prevention. Live on the [App Store](https://apps.apple.com) since March 14, 2025.

Built with Expo (React Native) and a Node/PostgreSQL backend. Managed and submitted via EAS.

## Repo structure

```
steadiday-app/
├── mobile/          # Expo/React Native iOS app (TypeScript)
├── backend/         # API server (Node.js + PostgreSQL)
├── .gitignore       # Active — git reads this one
├── gitignore        # ⚠️ Inactive — missing dot prefix, git ignores it
├── CHANGES.md       # Changelog
├── changelog.txt    # Legacy changelog (duplicate — consider removing)
└── package-lock.json
```

## Tech stack

| Layer | Tool |
|-------|------|
| Mobile framework | Expo SDK 54 / React Native |
| Language | TypeScript |
| Navigation | Expo Router |
| Health data | Apple HealthKit |
| Subscriptions | RevenueCat |
| Auth | Google Sign-In |
| Backend | Node.js + PostgreSQL |
| Build & submit | EAS (Expo Application Services) |
| IDE | Cursor |

## Prerequisites

- Node.js v18+
- EAS CLI: `npm install -g eas-cli`
- Xcode (for iOS simulator)
- Active Apple Developer account
- RevenueCat iOS API key
- Google Sign-In iOS client ID
- `mobile/GoogleService-Info.plist` (Firebase config — gitignored, do not commit)

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
REVENUECAT_IOS_API_KEY=your_key_here
GOOGLE_IOS_CLIENT_ID=your_client_id_here
```

Place `GoogleService-Info.plist` inside `mobile/`. This file is gitignored — get it from Firebase console → Project Settings → iOS app.

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
```

## Building for TestFlight

```bash
cd mobile
eas build --platform ios --profile preview
```

## Submitting to the App Store

```bash
eas submit --platform ios
```

Always use the CLI — do not use the Expo web dashboard. It causes session expiration mid-submit.

## App Store assets

| Asset | Location |
|-------|---------|
| Screenshots | `mobile/assets/screenshots/` |
| Preview video | Google Drive → SteadiDay → App Store |
| App icon | `mobile/assets/icon.png` |
| Splash screen | `mobile/assets/splash.png` |

Screenshot specs: 6.9" display required. No device frames. iOS status bar only — no Android status bars.

## HealthKit

Uses HealthKit for balance and activity data. `HKWorkoutSession` is explicitly excluded — do not add it (triggers App Store rejection). Use `HKWorkoutBuilder` or passive queries instead.

Required `Info.plist` keys:

```
NSHealthShareUsageDescription
NSHealthUpdateUsageDescription
```

## Caregiver feature

The app includes a caregiver summary screen that generates a shareable report of a user's balance activity. This supports a caregiver-first marketing angle — adult children installing the app for a 50+ parent.

## Permissions

On first launch the app requests HealthKit access and notifications. Notifications can be skipped. HealthKit is required for core functionality.

Before each App Store submission: confirm the Contacts permission is not in the manifest. The app does not use contacts, and Apple will flag it if the permission appears.

## Known issues

- **SDK upgrades:** After any Expo SDK bump, check `metro.config.js` — breaking changes have caused build failures before (SDK 53→54).
- **EAS submit session expiry:** Always run `eas submit --platform ios` from CLI. The web dashboard drops sessions mid-submit.
- **App name limit:** 30 characters max for the App Store display name.

## ⚠️ Housekeeping needed

Two issues in this repo that should be fixed:

**1. `gitignore` file is inactive.** The file named `gitignore` (no dot) is never read by git. It contains important exclusions (`.env` files, Firebase configs, `mobile/eas.json`). Merge its contents into `.gitignore`, then delete it:

```bash
cat gitignore >> .gitignore
git rm gitignore
git commit -m "Merge gitignore into .gitignore"
git push
```

**2. Two changelog files.** Both `CHANGES.md` and `changelog.txt` exist. Pick one and delete the other to avoid split history.

## Related

- **Website:** [SCM-Solutions-LLC/steadiday](https://github.com/SCM-Solutions-LLC/steadiday)
- **Marketing assets:** Google Drive → SteadiDay → Marketing
- **App Store Connect:** [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
