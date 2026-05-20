# Polish Pass 2 - Confirmation, Magnifier, Plain Language

## What changed

### Task 1: Magnifier autofocus
- `MagnifierScreen.tsx`: Added `autofocus="on"` to CameraView.
- Tap-to-focus: tapping the camera preview shows a transient 60px square focus indicator at the tap location, fading out over 600ms. Fires `Haptics.selectionAsync()`.
- Added `TIP_IDS.MAGNIFIER_TAP_FOCUS` with InlineTip: "Tap the screen to refocus on text." One-time dismissable.
- Existing freeze/zoom controls remain unchanged.

### Task 2: Stronger confirmation for food and water logging
- `FoodTrackerScreen.tsx`: After a successful food entry add, shows a non-blocking toast via `useToast.showSuccess`: "Added medium Chicken" (actual portion and food name).
- `WaterTrackerScreen.tsx`: After a successful water log tap, the "Add 1 Glass" button animates scale 1 -> 1.15 -> 1 over 250ms with a checkmark overlay fading out after 600ms. Daily total badge briefly scales up when updated.
- No modals or blocking UI added. All feedback is non-blocking.

### Task 3: Plain-language onboarding copy
- Replaced "HealthKit" with "Apple Health" in user-facing privacy policy text.
- "Health Connect" gets parenthetical "(Google's health data app)" on first mention.
- "Allow Apple Health" button changed to "Connect to Apple Health".
- "Notification Settings" onboarding title changed to "Turn on reminders".
- "notifications" replaced with "reminders" in onboarding notification description.
- Added one-line plain explainers to each permission prompt:
  - Notifications: "We send gentle reminders for your medications and tasks."
  - Location: "We only use your location for weather and emergency contacts."
  - Camera (Magnifier): "We use the camera only when you open the Magnifier."
  - Apple Health: "We read your activity. We never write or share it."
- No app behavior changed, only copy.

### Task 4: Home screen icon labels
- Weather widget edit icon: now shows visible "Edit" text label beside the icon.
- Weather widget GPS toggle: now shows visible "GPS on" / "GPS" text label beside the icon.
- All Navigation widgets: `accessibilityHint` updated to "Double tap to open <tool>".
- Tasks widget: Added `accessibilityHint` on both widget variants.
- Medications widget: Added `accessibilityHint`.
- Food/Water widget: Improved `accessibilityLabel` with current stats; added proper `accessibilityHint`.
- Home screen Edit button: Added `accessibilityHint`.
- No icon-only buttons remain on the Home screen.

## What was intentionally NOT changed (and why)

- **Guided walkthrough / coachmarks**: Out of scope (separate project).
- **Voice assistance**: Out of scope.
- **Health screen redesign**: Out of scope.
- **New illustrations or icon redraws**: Task 4 explicitly prohibits redesigning icon glyphs. All original icons preserved.
- **Android Health Connect changes**: Out of scope.
- **Variable names referencing "HealthKit"**: Task 3 specifies user-facing strings only; internal variable names like `healthKitNotAvailable` are unchanged to avoid unnecessary refactoring risk.
- **"Configure" in SocialSignInScreen**: This is developer/error messaging ("Google Sign-In Not Configured"), not user-facing onboarding copy.
- **Feature flag descriptions**: Internal developer-facing text, not user-facing.
- **WelcomeScreen / AllSetScreen copy**: These screens already use plain language ("Nothing is shared without your permission", "You're all set"). No jargon found to replace.
- **ConnectAppsIntroScreen copy**: Already uses plain language ("Bring in your calendars?", "Not right now"). No changes needed.
- **Toast for food entry edit (vs add)**: Only new adds show a toast. Edits are already confirmed by the modal Save flow and don't need additional confirmation feedback.
- **Water tracker modal confirmation**: The existing delete confirmation modal is appropriate for destructive actions and was not modified.
