# Cross-Platform Bug Fixes (2026-05-08)

## Bug 3 — SOS card overflow on wide screens

- SOSWidget: Added `useWindowDimensions`-driven max-width of 600pt; card centers on screens wider than 600pt instead of stretching full-bleed
- SOSModal: Replaced fixed `max-w-md` with dynamic maxWidth capped at 600pt (or viewport - 48px), ensuring the modal stays readable on iPad landscape and Split View

**Tested on:** iPhone SE (375pt), iPhone 16 Pro Max (430pt portrait), iPad landscape, Android phone (360dp)
**Not tested on:** Physical Android tablet — needs QA before release

## Bug 4 — Health toggle Android parity

- Integration store now exposes the health integration on both `ios` and `android` platforms
- Integration name is platform-aware: "Apple Health" on iOS, "Health Connect" on Android
- ConnectedAppsScreen uses platform-agnostic `requestHealthPermissions()` from `healthSync.ts` (already branches by platform)
- On permission denial: iOS opens `Linking.openSettings()`, Android opens `openHealthConnectSettings()`
- Health records sync (clinical medications) only triggers on iOS where it is available
- "About Connected Apps" info text is platform-aware

**Tested on:** iPhone (iOS), Expo Go (Android equivalent via platform checks)
**Not tested on:** Physical Android device with Health Connect installed — needs QA before release

## Bug 5 — Dark mode (iOS + Android)

- Changed `expo.userInterfaceStyle` from `"light"` to `"automatic"` in app.json (covers iOS)
- Added `expo.android.userInterfaceStyle: "automatic"` to the android block (covers Android explicitly)
- Note: If built with EAS, this requires a new build (not OTA)

**Tested on:** Config change only — requires new EAS build to take effect

## Bug 6 — Voice guidance TTS timeout

- Added 2-second timeout fallback in `speak()` function — if neither `onDone` nor `onError` fires within 2 seconds, the timeout fires `onDone` as a fallback
- Prevents UI from getting stuck in "Playing..." state when Android TTS engines fail silently
- Added `onStopped` callback handler for completeness
- Timeout is guarded to never double-fire (first callback wins)

**Tested on:** iPhone (iOS TTS), Expo Go
**Not tested on:** Physical Android device (Samsung TTS, Google TTS) — needs QA before release

## Bug 8 — Medication icon cross-platform

- Replaced all `"medkit"` and `"medkit-outline"` icon references with `"medical-outline"` for consistent rendering across iOS and Android
- Files updated: RootNavigator (Care Team tab), TabTooltip, NavigationWidgets, home/types, CustomizeAppSettingsScreen, taskTemplates, SteadiDayOffersScreen
- `"medical-outline"` is a well-supported Ionicons glyph that renders consistently on both platforms

**Tested on:** iPhone (iOS), Expo Go
**Not tested on:** Physical Android device — needs QA before release

---

# First-Run Health UX Fixes

## Changes

All user-facing copy is platform-aware: shows "Apple Health" / "Apple Watch" on iOS
and "Health Connect" / "your fitness tracker" on Android.

### Task 1 — First-run empty state on Health screen
- Metric cards show contextual placeholder copy instead of `0` or `--` based on sync state
- "Connect [health source] to see your data" when not connected
- Skeleton shimmer when syncing but no data yet
- Metric-specific hints when data is genuinely missing post-sync
- Values fade in when data arrives
- Dismissable first-run banner: "Your insights will improve..."

### Task 2 — Better sync progress indicator
- Animated "Importing from [health source]..." banner with spinner during sync
- First-run note about taking up to a minute
- Toast "Synced. Welcome to SteadiDay." on first sync completion
- Inline error retry card on sync failure (replaces blocking Alerts)

### Task 3 — Clearer health permission step in onboarding
- "What we'll read" card with icon rows (Steps, Sleep, Heart rate)
- "After you allow access" numbered steps (platform-specific wording)
- Dynamic button: "Allow [health source]" / "Done"

### Task 4 — Home tab guidance pointing to Health/Today
- Dismissable info card on Home screen pointing to Health tab
- Auto-hides once initial sync completes

## Manual Test Plan

### iOS — Fresh install (no Apple Health connection)
- [ ] Open Health tab: all metric cards show "Connect Apple Health to see your data"
- [ ] First-run banner: "...Apple Watch and Apple Health collect data..."
- [ ] First-run banner is dismissable via X button and stays dismissed
- [ ] Home tab shows info card: "Your health insights live in the Health tab..."
- [ ] Home info card is dismissable via X button
- [ ] Tapping any metric card still opens the manual entry modal

### Android — Fresh install (no Health Connect connection)
- [ ] Open Health tab: all metric cards show "Connect Health Connect to see your data"
- [ ] First-run banner: "...your fitness tracker and Health Connect collect data..."
- [ ] Error card says "Check that Health Connect permissions are enabled in phone Settings"

### Permissions denied
- [ ] Tap Sync button on Health screen
- [ ] Deny health permissions when prompted
- [ ] Toast error appears (not a blocking Alert)
- [ ] Inline error retry card appears: "Could not sync with [health source]"
- [ ] "Try again" button triggers a new sync attempt

### Permissions granted but no wearable
- [ ] Grant health permissions
- [ ] During sync: animated banner "Importing from [health source]..." with spinner
- [ ] Cards show skeleton shimmer while syncing
- [ ] After sync completes: toast "Synced. Welcome to SteadiDay."
- [ ] Steps card: shows actual step count or "No steps recorded yet today"
- [ ] Heart rate card: "No data yet — [wearable] will fill this in"
- [ ] Sleep card: "No sleep data yet — wear [wearable] to bed"
- [ ] Home tab info card auto-hides (hasInitialHealthSync is now true)

### Permissions granted with wearable data
- [ ] All metric cards show actual data with smooth fade-in
- [ ] Progress bars visible for Steps, Sleep, Exercise
- [ ] 7-day charts display correctly
- [ ] First-run banner hidden (hasInitialHealthSync is true)

### Onboarding (ConnectAppsHealthScreen)
- [ ] iOS: "What we'll read from Apple Health" with 3 icon rows
- [ ] Android: "What we'll read from Health Connect" with 3 icon rows
- [ ] "After you allow access" — step 1 says "Turn On All" (iOS) / "Allow All" (Android)
- [ ] Step 2 says "Wear your Apple Watch" (iOS) / "Wear your fitness tracker" (Android)
- [ ] iOS: Button shows "Allow Apple Health" before connection
- [ ] Android: Button shows "Allow Health Connect" before connection
- [ ] After connecting, button text changes to "Done" on both platforms
- [ ] Privacy text mentions correct settings path per platform

### Regression checks
- [ ] Pull-to-refresh still works on Health screen
- [ ] Manual data entry modal saves data correctly
- [ ] Health Screenings Guide card still navigates correctly
- [ ] Home screen widgets render normally
- [ ] Existing tip system still works (one tip per session)
- [ ] Android Health Connect setup flow unchanged
