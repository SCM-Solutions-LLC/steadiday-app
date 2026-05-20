# Task/Calendar Features - Full Calendar App Compatibility

The Tasks feature now includes all standard Apple Calendar and Google Calendar fields to ensure seamless synchronization between apps.

## New Task Interface Fields

### Date and Time Fields
- **`date`**: Start date/time (ISO string)
- **`endDate`**: End date/time (ISO string) - for multi-day events
- **`time`**: Start time (HH:MM format)
- **`endTime`**: End time (HH:MM format)
- **`isAllDay`**: Boolean flag for all-day events

### Location and Navigation
- **`location`**: Location address or place name (string)
- **`latitude`**: GPS latitude coordinate (number)
- **`longitude`**: GPS longitude coordinate (number)

**Location Features:**
- Manual text entry for location/address
- "Use Current Location" button to automatically get GPS coordinates and address
- "Open in Maps" button that opens the location in:
  - Apple Maps (iOS)
  - Google Maps (Android or fallback)
- Tapping the location in the task view will open navigation

### Repeat/Recurrence Options
- **`frequency`**: How often the event repeats
  - `"once"` - One-time event (Never repeats)
  - `"daily"` - Every day
  - `"weekly"` - Every week
  - `"monthly"` - Every month
  - `"yearly"` - Every year
  - `"custom"` - Custom recurrence pattern

- **`repeatEnding`**: How the recurrence ends
  - `"never"` - Repeats indefinitely
  - `"on-date"` - Stops repeating on a specific date
  - `"after-count"` - Stops after a certain number of occurrences

- **`repeatEndDate`**: The date when repeating ends (if `repeatEnding` is "on-date")
- **`repeatCount`**: Number of occurrences before ending (if `repeatEnding` is "after-count")

### Reminder Options
- **`reminderEnabled`**: Boolean to enable/disable reminders
- **`reminderMinutes`**: Minutes before event for first reminder
  - 0 - At time of event
  - 5 - 5 minutes before
  - 15 - 15 minutes before
  - 30 - 30 minutes before
  - 60 - 1 hour before
  - 120 - 2 hours before
  - 1440 - 1 day before
  - 10080 - 1 week before

- **`secondReminderMinutes`**: Optional second reminder (same options as above)
- **`soundReminderEnabled`**: Boolean to play sound with reminder

### Collaboration and Links
- **`url`**: Web link or video conference URL (Zoom, Teams, Meet, etc.)
- **`attendees`**: Array of email addresses for invitees
  - Entered as comma-separated emails in the UI
  - Stored as array of strings

### Visual Organization
- **`color`**: Color tag/label for the event (hex color code)
- **`category`**: Event category (medical, errand, personal)

### Additional Fields
- **`notes`**: Detailed notes or description for the event
- **`completed`**: Boolean for task completion status
- **`completedAt`**: ISO string timestamp of when completed
- **`notificationId`**: Notification ID for scheduled reminders
- **`calendarEventId`**: Calendar event ID for syncing with device calendar
- **`syncSource`**: Source of the task ("calendar", "reminders", or "daily-companion")

## UI Components

### AddTaskModal Component
Location: `/home/user/workspace/src/components/AddTaskModal.tsx`

A comprehensive modal for creating and editing tasks/events with all calendar app features:

**Sections:**
1. **Title** - Event name
2. **All-Day Toggle** - Convert between timed and all-day events
3. **Start Date/Time** - Inline date picker with optional time picker
4. **End Date/Time** - Separate end date/time for multi-day events
5. **Repeat** - Full recurrence options with end conditions
6. **Location** - Address with GPS navigation support
7. **Category** - Visual categorization (Medical, Errand, Personal)
8. **URL** - Video call links or web URLs
9. **Notes** - Detailed description
10. **Reminder** - Dual reminder system with sound option
11. **Invitees** - Email list for attendees

### Location Features in Detail

When a user adds a location:

1. **Manual Entry**: Type any address or place name
2. **Use Current Location**:
   - Requests location permission
   - Gets GPS coordinates
   - Reverse geocodes to human-readable address
   - Stores both address string and coordinates

3. **Open in Maps**:
   - Only appears when GPS coordinates are available
   - Opens native Maps app with the location
   - Shows directions and navigation options
   - iOS: Opens Apple Maps
   - Android: Opens Google Maps
   - Fallback: Opens web Google Maps

4. **Tapping Location in Task View**:
   - Any task with `latitude` and `longitude` will show as a tappable link
   - Tapping opens the location in the default maps app
   - Provides instant navigation access

## Calendar Sync Compatibility

All fields are designed to map directly to calendar event fields:

| App Field | Apple Calendar | Google Calendar |
|-----------|----------------|-----------------|
| title | Title | Summary |
| date/endDate | Start/End Date | dtstart/dtend |
| isAllDay | All Day | All-day event |
| location | Location | Location |
| latitude/longitude | Geolocation | Coordinates |
| frequency | Repeat | Recurrence Rule |
| repeatEnding | End Repeat | Until/Count |
| reminderMinutes | Alert | Reminder |
| notes | Notes | Description |
| url | URL | Conference Data |
| attendees | Invitees | Attendees |
| color | Calendar Color | Color ID |

## Usage Example

```typescript
// Creating a task with full calendar features
const task: Task = {
  id: "123",
  title: "Doctor Appointment",
  date: "2024-01-15T14:00:00.000Z",
  endDate: "2024-01-15T15:00:00.000Z",
  time: "14:00",
  endTime: "15:00",
  isAllDay: false,
  location: "123 Medical Center Dr, City, ST 12345",
  latitude: 37.7749,
  longitude: -122.4194,
  category: "medical",
  frequency: "monthly",
  repeatEnding: "after-count",
  repeatCount: 6,
  reminderEnabled: true,
  reminderMinutes: 60,
  secondReminderMinutes: 15,
  soundReminderEnabled: true,
  notes: "Bring insurance card and medication list",
  url: "https://zoom.us/j/123456789",
  attendees: ["caregiver@example.com"],
  completed: false,
  calendarEventId: "cal-event-123",
  syncSource: "daily-companion",
};
```

## Integration Points

### To Use the New Modal in TasksScreen.tsx:

```typescript
import AddTaskModal from "../components/AddTaskModal";

// In your component:
const [showAddModal, setShowAddModal] = useState(false);
const [editingTask, setEditingTask] = useState<Task | null>(null);

<AddTaskModal
  visible={showAddModal}
  onClose={() => {
    setShowAddModal(false);
    setEditingTask(null);
  }}
  onSave={(taskData) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask({
        ...taskData,
        id: Date.now().toString(),
        completed: false,
      } as Task);
    }
  }}
  editingTask={editingTask}
/>
```

### Displaying Location in Task List:

```typescript
{task.location && (
  <Pressable
    onPress={() => {
      if (task.latitude && task.longitude) {
        const url = Platform.select({
          ios: `maps:?q=${task.latitude},${task.longitude}`,
          android: `geo:${task.latitude},${task.longitude}`,
        });
        Linking.openURL(url);
      }
    }}
    className="flex-row items-center mt-1"
  >
    <Ionicons name="location" size={14} color="#666" />
    <Text className="text-sm text-blue-600 underline ml-1">
      {task.location}
    </Text>
  </Pressable>
)}
```

## Benefits for Calendar Synchronization

1. **Complete Field Mapping**: All Apple Calendar and Google Calendar fields are supported
2. **No Data Loss**: When syncing between apps, all event details are preserved
3. **Native Navigation**: Location fields automatically work with device GPS apps
4. **Professional Features**: Video conference links, invitees, and dual reminders
5. **Flexible Recurrence**: Full control over repeating events with multiple end conditions
6. **Seamless UX**: Familiar interface matching native calendar apps

This implementation ensures that your app can fully synchronize with device calendars without losing any data or functionality.
