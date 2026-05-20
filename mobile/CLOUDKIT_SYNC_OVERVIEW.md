# CloudKit Sync Overview - SteadiDay

**For adults 50+** | **Written in plain language**

---

## What is CloudKit Sync?

CloudKit sync lets your SteadiDay data automatically stay in sync between your iPhone and iPad using your iCloud account. When you add a medication on your iPhone, it appears on your iPad. When you complete a task on your iPad, it shows as done on your iPhone.

**The best part**: SteadiDay does not run its own servers for this. Everything uses Apple's iCloud system that you already have.

---

## What Data Syncs Between Your Devices?

SteadiDay syncs these types of information through your iCloud account:

| What Syncs | Details |
|------------|---------|
| **Tasks and reminders** | All your to-do items, due dates, and completion status |
| **Medications** | Your medication list, dosages, schedules, and pharmacy info |
| **Health metrics** | Step counts, heart rate, sleep hours (that you track in SteadiDay) |
| **Insurance cards** | Provider name, member ID, group number, phone numbers (text only) |
| **Doctors** | Your doctor list with names, specialties, phone numbers, addresses |
| **Emergency contacts** | Names, relationships, and phone numbers |
| **Favorite contacts** | Quick-dial contacts you have set up |
| **App settings** | Text size, color theme, notification preferences |

### What Does NOT Sync?

These items stay only on your device for security:

- **Your PIN code** - Each device has its own PIN
- **Biometric settings** - Face ID/Touch ID stays on each device
- **Photos** - Insurance card photos and prescription photos are never stored or synced (they are deleted after reading)
- **Auth tokens** - Your login information stays on each device
- **Google Calendar tokens** - These stay only on your device in secure storage

---

## How Does CloudKit Sync Work?

### Simple Explanation

1. **You make a change** - Add a task, mark medication as taken, update a doctor's phone number
2. **SteadiDay saves it locally first** - The app works even without internet
3. **The change goes to iCloud** - When you have internet, SteadiDay copies the change to your private iCloud space
4. **Your other devices get the update** - Your iPad (or other device) downloads the change from iCloud
5. **Everything stays in sync** - Both devices now show the same information

### Technical Details

- **Local storage is primary**: All your data lives on your device first. The app works fully offline.
- **iCloud is a backup copy**: CloudKit stores a copy of your records in your private iCloud container.
- **Automatic sync**: SteadiDay syncs every 15 minutes and when you open the app.
- **Conflict resolution**: If you change the same thing on both devices while offline, the most recent change wins.
- **Private database only**: Your data goes into YOUR private iCloud space. It is not shared publicly or with other users.

---

## Apple Reminders Integration

### What It Does

You can link SteadiDay tasks to Apple Reminders. This is a two-way connection:

- **SteadiDay → Reminders**: When you create or edit a task in SteadiDay and link it to Reminders, the reminder updates in the Reminders app
- **Reminders → SteadiDay**: When you check off or edit a reminder in the Reminders app, SteadiDay updates the linked task

### How to Link a Task to Apple Reminders

1. Open a task in SteadiDay
2. Tap the "Link to Apple Reminders" button
3. Choose which reminder list to use (SteadiDay creates a default list)
4. The task and reminder stay connected

### Privacy Protection

- **Generic titles for health tasks**: If your task mentions medication or doctor appointments, the Reminder title will say "SteadiDay reminder" instead of showing sensitive details
- **You can edit it**: Open the Reminders app and change the title to add more detail if you want
- **On-device only**: All reminder data stays on your device and in your iCloud through Apple's Reminders system

### How to Unlink

If you don't want a task connected to Reminders anymore:
1. Open the task
2. Tap "Unlink from Reminders"
3. Both the task and reminder still exist, but changes to one won't affect the other

---

## Apple Calendar Integration

### What It Does

You can create Apple Calendar events from SteadiDay tasks that have a date and time. This is a two-way connection:

- **SteadiDay → Calendar**: When you change a task's date or time in SteadiDay, the linked Calendar event updates
- **Calendar → SteadiDay**: When you move an event in the Calendar app, SteadiDay updates the linked task

### How to Link a Task to Apple Calendar

1. Open a task that has a date and time
2. Tap the "Add to Apple Calendar" button
3. Choose which calendar to use (you can pick your default calendar or another one)
4. The task and calendar event stay connected

### Privacy Protection

- **Generic event titles for health tasks**: If your task is medical-related, the Calendar event will say "SteadiDay appointment" instead of showing medication names or health details
- **You can edit it**: Open the Calendar app and change the event title if you want more information
- **On-device only**: All calendar data stays on your device and in your iCloud through Apple's Calendar system

### How to Unlink

If you don't want a task connected to Calendar anymore:
1. Open the task
2. Tap "Remove from Calendar"
3. Both the task and event still exist, but changes to one won't affect the other

---

## Google Calendar Integration

### What It Does

SteadiDay can sync your tasks with Google Calendar if you use Google Calendar instead of (or in addition to) Apple Calendar. This is a two-way connection:

- **SteadiDay → Google Calendar**: When you link a task to Google Calendar, changes in SteadiDay update the Google event
- **Google Calendar → SteadiDay**: When you edit an event in Google Calendar on your computer or phone, SteadiDay updates the linked task

### How to Connect Google Calendar

1. Go to Settings → Data Sync
2. Tap "Connect Google Calendar"
3. Sign in with your Google account
4. Grant permission for SteadiDay to manage calendar events (this is the only permission requested)
5. Choose which Google calendar to use (you can have multiple calendars)

### Where Tokens Are Stored

**IMPORTANT for your privacy**:
- Your Google login tokens are stored **ONLY in secure storage on your device**
- They are **NEVER stored in regular AsyncStorage** (insecure)
- They are **NEVER sent to CloudKit or iCloud**
- They are **NEVER logged or tracked**
- They stay only on your device

SteadiDay connects **directly to Google** - there is no SteadiDay server in the middle.

### How to Disconnect Google Calendar

1. Go to Settings → Data Sync
2. Tap "Disconnect Google Calendar"
3. All Google tokens are immediately deleted from your device
4. Your linked tasks stay in SteadiDay, but they are no longer connected to Google Calendar events

---

## Notification Options

You can choose where your task and medication notifications come from. This gives you control over which apps send you reminders.

### Three Options

#### 1. SteadiDay Only (Default)
- SteadiDay sends notifications for your tasks and medications
- Connected apps (Apple Reminders, Apple Calendar, Google Calendar) do NOT send notifications for things you link
- **Best for**: People who want all notifications to come from one app

#### 2. Connected Apps Only
- SteadiDay does NOT send its own notifications
- Only Apple Reminders, Apple Calendar, and Google Calendar send notifications
- **Best for**: People who prefer to get reminders from the Calendar or Reminders app

#### 3. Both SteadiDay and Connected Apps
- SteadiDay sends notifications
- Connected apps also send notifications
- **Warning**: You may get two notifications for the same thing
- **Best for**: People who want extra reminders and don't mind duplicates

### How to Change Notification Source

1. Go to Settings → Notifications
2. Look for "Notification Source"
3. Choose one of the three options above
4. Changes take effect immediately

### Apple Watch Notifications

If you have an Apple Watch with "Mirror iPhone" turned on in the Watch app:
- SteadiDay notifications will appear on your watch
- Apple Reminders and Calendar notifications will also appear on your watch
- This works automatically - no setup needed in SteadiDay

To see notifications on your watch:
1. Open the Watch app on your iPhone
2. Go to Notifications
3. Make sure "Mirror iPhone" is turned on
4. Make sure SteadiDay is allowed to send notifications

---

## How to Turn Sync On or Off

### CloudKit Sync (iPhone ↔ iPad)

1. Go to Settings → Data Sync
2. Look for "Sync with iCloud"
3. Turn the switch on or off

**When OFF**:
- SteadiDay works normally on each device
- Changes do NOT sync between devices
- Each device has its own separate data

**When ON**:
- Changes sync between your iPhone and iPad
- Last sync time is shown (e.g., "2 minutes ago")
- If iCloud is unavailable, status shows "Waiting for iCloud"

### Apple Reminders Sync

You control this task-by-task:
- Open a task
- Tap "Link to Apple Reminders" or "Unlink from Reminders"
- Only the tasks you link will sync with Reminders app

### Apple Calendar Sync

You control this task-by-task:
- Open a task with a date and time
- Tap "Add to Apple Calendar" or "Remove from Calendar"
- Only the tasks you link will sync with Calendar app

### Google Calendar Sync

You control this in Settings:
- Go to Settings → Data Sync
- Tap "Connect Google Calendar" or "Disconnect Google Calendar"
- When connected, you can link individual tasks to Google Calendar

---

## Offline Behavior

### How SteadiDay Works Offline

SteadiDay is designed to work **fully offline**. You do not need internet to use the app.

**When you're offline**:
1. All features work normally (add tasks, log medications, view insurance cards)
2. Changes are saved to your device immediately
3. Changes are queued for sync
4. Status shows "Changes pending" or "Waiting for iCloud"

**When you're back online**:
1. SteadiDay automatically syncs queued changes to iCloud
2. Your other devices get the updates
3. Status shows "Last sync: Just now"

**No data is lost** - SteadiDay keeps trying to sync until it succeeds.

---

## Privacy and Security

### What SteadiDay Does

✅ **Syncs through your iCloud account** - Uses Apple's secure CloudKit system
✅ **Uses your Google account directly** - No SteadiDay servers involved
✅ **Stores Google tokens in secure storage** - Hardware-backed encryption on iOS
✅ **Removes sensitive details from sync** - Calendar events and reminders get generic titles for health tasks
✅ **Keeps photos local only** - No photos go to CloudKit or any calendar
✅ **Works offline first** - Your device is the primary storage

### What SteadiDay Does NOT Do

❌ **NO custom backend servers** - SteadiDay does not run its own servers
❌ **NO third-party data sharing** - Your data stays in YOUR iCloud and YOUR Google account
❌ **NO photos in CloudKit** - Insurance and prescription photos are deleted after reading (they never sync)
❌ **NO passwords in CloudKit** - Your PIN and biometric settings stay on each device
❌ **NO Google tokens in CloudKit** - Google tokens stay only in secure storage on your device

---

## How Two-Way Sync Works

### Summary

| Integration | Creates | Updates | Deletes | Conflict Resolution |
|-------------|---------|---------|---------|---------------------|
| **CloudKit** | ✅ Syncs new items to all devices | ✅ Updates sync to all devices | ✅ Deletes sync to all devices | Latest timestamp wins |
| **Apple Reminders** | ✅ Task creates Reminder | ✅ Changes sync both ways | ✅ Deleting Reminder unlinks task | Last change wins |
| **Apple Calendar** | ✅ Task creates Calendar event | ✅ Changes sync both ways | ✅ Deleting event unlinks task | Last change wins |
| **Google Calendar** | ✅ Task creates Google event | ✅ Changes sync both ways | ✅ Deleting event unlinks task | Last change wins |

### Examples

**Example 1: Add a Task on iPhone**
1. You add a task on your iPhone
2. SteadiDay saves it locally
3. The task syncs to iCloud
4. Your iPad downloads the task
5. The task appears on your iPad

**Example 2: Link Task to Apple Reminders**
1. You link a task to Apple Reminders
2. A reminder is created in the Reminders app
3. You check off the reminder in the Reminders app
4. SteadiDay sees the change and marks the task as complete

**Example 3: Change Event Time in Google Calendar**
1. You open Google Calendar on your computer
2. You move an event to a different time
3. SteadiDay syncs with Google Calendar
4. The linked task updates to the new time

**Example 4: Offline Edit**
1. You're on an airplane (no internet)
2. You add medications and tasks in SteadiDay
3. Everything saves to your device
4. When you land and connect to Wi-Fi, everything syncs to iCloud and your other devices

---

## Troubleshooting

### "Waiting for iCloud" Message

This means SteadiDay cannot connect to iCloud right now.

**Check these things**:
1. Make sure you're signed in to iCloud on your iPhone (Settings → [Your Name])
2. Make sure you have internet connection (Wi-Fi or cellular data)
3. Make sure iCloud Drive is turned on (Settings → [Your Name] → iCloud → iCloud Drive)
4. Wait a few minutes - iCloud sometimes needs time to connect

**If the problem continues**:
- Your changes are safe on your device
- They will sync automatically when iCloud is available
- The app works normally in the meantime

### Google Calendar Not Connecting

**Check these things**:
1. Make sure you're using the correct Google account
2. Make sure you granted permission during sign-in
3. Try disconnecting and reconnecting (Settings → Data Sync → Disconnect Google Calendar, then connect again)

### Linked Task and Reminder Are Different

If you change a task and the reminder doesn't update:
1. Wait a minute - sync happens every few minutes
2. Close and reopen SteadiDay to force a sync
3. Check that the task is still linked (open the task and look for "Linked to Apple Reminders")

### Task Deleted But Reminder Still There

When you delete a task in SteadiDay:
- The linked reminder or calendar event is NOT automatically deleted
- You need to delete it manually in the Reminders or Calendar app
- This is by design so you don't lose things by accident

---

## Setup Steps for Developers

### Enable CloudKit in Xcode

To make CloudKit sync work, you need to enable it in your Apple Developer account and Xcode:

1. **Open Xcode** and open the SteadiDay project
2. **Select the project** in the Project Navigator
3. **Select the target** (SteadiDay)
4. **Go to Signing & Capabilities tab**
5. **Click "+ Capability"** and add "iCloud"
6. **Check "CloudKit"** in the iCloud section
7. **Create or select a CloudKit container**:
   - Container name: `iCloud.com.vibecode.dailycompanion`
   - This must match your bundle identifier

### Update app.json for CloudKit

Add CloudKit entitlement to `app.json`:

```json
"ios": {
  "bundleIdentifier": "com.vibecode.dailycompanion",
  "entitlements": {
    "com.apple.developer.icloud-container-identifiers": [
      "iCloud.com.vibecode.dailycompanion"
    ],
    "com.apple.developer.icloud-services": [
      "CloudKit"
    ]
  }
}
```

### Google Calendar OAuth Setup

To enable Google Calendar integration:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing project
3. **Enable Google Calendar API**:
   - Go to APIs & Services → Library
   - Search for "Google Calendar API"
   - Click Enable
4. **Create OAuth 2.0 credentials**:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: iOS
   - Bundle ID: `com.vibecode.dailycompanion`
   - Copy the Client ID
5. **Update the code**:
   - Open `src/sync/googleCalendarSync.ts`
   - Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
6. **Add URL scheme to app.json**:

```json
"expo": {
  "scheme": "vibecode",
  "ios": {
    "bundleIdentifier": "com.vibecode.dailycompanion"
  }
}
```

---

## Summary

SteadiDay keeps your data synced across devices while respecting your privacy:

✅ **iCloud syncs** tasks, medications, health metrics, insurance info, and settings between iPhone and iPad
✅ **Apple Reminders** and **Apple Calendar** sync task changes in both directions
✅ **Google Calendar** syncs task changes in both directions (tokens stay on device only)
✅ **Notification options** let you choose which apps send reminders
✅ **Works offline** and syncs changes when back online
✅ **No SteadiDay servers** - uses Apple's iCloud and Google's services directly
✅ **Private and secure** - no photos synced, no passwords synced, Google tokens in secure storage only

---

**Have questions?** Contact SteadiDay support or check the privacy policy for more details.
