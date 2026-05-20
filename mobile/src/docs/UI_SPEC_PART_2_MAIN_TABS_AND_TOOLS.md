# SteadiDay - UI Specification Part 2: Main Tabs & Tools

## Overview
This document covers all main tab screens and Tools stack screens.

---

## MAIN TAB SCREENS

### 26. HomeScreen
**File:** `src/screens/HomeScreen.tsx`
**Navigator:** MainTabs, Tab name="Home", Icon: home
**How User Reaches:** Default tab after onboarding or tap "Home" in bottom tab bar
**Main UI Sections:** Header with greeting and date + settings icon, quick stats card (tasks, meds, steps, water), today's schedule section (time-sorted tasks/medications/appointments), upcoming section with "View All" link, quick action buttons (+ Add Task, + Log Medication, Emergency, Track Water), optional weather widget
**Key Actions:** View schedule, complete tasks, log medications, add new tasks/meds, access settings, view quick stats, tap items for details
**Data:** Reads userProfile.name, tasks (by date), medications (scheduled today), medicationLogs (today), healthMetrics (today), waterEntries; writes toggleTaskComplete(id), logMedication(entry)
**Permissions:** Location (weather - optional), Health data (steps - optional)
**Navigation:** Settings icon → SettingsScreen modal; + Add Task → AddTaskModal; + Log Med → AddMedicationModal or MedsScreen; Emergency → emergency flow; task/med tap → detail view; tab bar to other tabs

---

### 27. TasksScreen
**File:** `src/screens/TasksScreen.tsx`
**Navigator:** MainTabs, Tab name="Tasks", Icon: checkbox
**How User Reaches:** Tap "Tasks" in bottom tab bar
**Main UI Sections:** Header with title and "+ Add Task" button, filter toggle buttons (All, Today, Upcoming, Completed), category filter chips, task list grouped by date (Today, Tomorrow, This Week, Later) with each task showing checkbox, title, category icon/color, date/time, notes preview, recurring indicator, collapsible completed section with "Clear Completed" button, sorting menu (Date, Priority, Category), FAB "+" button
**Key Actions:** View/filter/sort tasks, complete task (checkbox), uncomplete task, add new task, edit task (swipe or tap), delete task (swipe), clear completed tasks
**Data:** Reads tasks array, filter/sort preferences; writes toggleTaskComplete(id), addTask(task), updateTask(id, updates), removeTask(id)
**Permissions:** Calendar (if sync enabled), Notifications (for reminders)
**Navigation:** "+ Add Task" → AddTaskModal; task tap → edit mode (AddTaskModal); swipe edit → AddTaskModal; swipe delete → confirmation → removes

---

### 28. MedsScreen
**File:** `src/screens/MedsScreen.tsx`
**Navigator:** MainTabs, Tab name="Meds", Icon: medical
**How User Reaches:** Tap "Meds" in bottom tab bar
**Main UI Sections:** Header with title and "+ Add Medication" button, Today's Doses section (time-sorted list with each showing time, name, dosage, pill icon, status indicator: Upcoming/Take Now/Taken/Missed, action buttons: Take Now/Snooze), This Week calendar-style view (days across top, medications down side, grid with color-coded status), All Medications section (list of active meds with icon, name, dosage, frequency, Active/Paused badge, swipe actions: Edit/Pause/Delete), adherence card (percentage, mini bar chart, "View Full History" link), FAB "+" button
**Key Actions:** View schedule, log medication as taken, snooze reminder, view week calendar, add new medication, edit medication, pause/resume medication, delete medication, view history, track adherence
**Data:** Reads medications array, medicationLogs array, getTodaysMedications(), getWeeklyAdherence(); writes addMedication(), updateMedication(id, updates), removeMedication(id), logMedication(log), pauseMedication(id)
**Permissions:** Notifications (for reminders)
**Navigation:** "+ Add" → AddMedicationModal; "Take Now" → logs + confirmation; Edit → AddMedicationModal (edit mode); "View History" → HistoryScreen (filtered for meds)

---

### 29. MedicalScreen
**File:** `src/screens/MedicalScreen.tsx`
**Navigator:** MainTabs, Tab name="Medical", Icon: medkit
**How User Reaches:** Tap "Medical" in bottom tab bar
**Main UI Sections:** Header with title, quick access cards grid (Insurance Cards with count + chevron, My Doctors with count + chevron, Health Records "View documents", Pharmacies with count), Medical Profile section with Edit button, profile cards (Allergies list with "+ Add Allergy", Conditions list with "+ Add Condition", Blood Type with edit button, Emergency Info with "Manage" button), Recent Activity section (timeline of recent changes)
**Key Actions:** View insurance cards, add/edit insurance, view doctors list, add/edit doctor info, manage allergies, manage conditions, set blood type, view emergency contacts, access health records, manage pharmacies
**Data:** Reads insuranceCards array, doctors array, userProfile.medicalInfo, emergencyContacts; writes addInsuranceCard(), addDoctor(), updateMedicalInfo()
**Permissions:** None
**Navigation:** Insurance → InsuranceScreen modal; Doctors → DoctorsScreen modal; Emergency Info → EmergencyContactsScreen modal; + Add buttons → respective modals

---

### 30. HealthScreen
**File:** `src/screens/HealthScreen.tsx`
**Navigator:** MainTabs, Tab name="Health", Icon: heart
**How User Reaches:** Tap "Health" in bottom tab bar
**Main UI Sections:** Header with title and sync button (if enabled), Today's Summary card (date, steps with circular progress, heart rate BPM, sleep hours, exercise minutes, mini charts), Activity section (steps card with goal progress bar + weekly average + 7-day chart, exercise card with minutes + type + calories), Vitals section (heart rate card with current/latest + resting + range + timeline chart, blood pressure card with latest reading + "Log BP" button), Sleep section (hours last night + quality + bedtime/wake time + 7-day chart), Body section (weight card with current + change + goal + progress chart + "Log Weight" button), Apple Health sync status (badge, last synced time, "Sync Now" button OR "Connect Apple Health" card), manual entry section ("Quick Log" buttons for Weight, BP, Exercise, Sleep), Trends section (cards showing improvements with "View All" link)
**Key Actions:** View health metrics, sync with Apple Health, log metrics manually, view detailed charts, set health goals, view trends/history, refresh data
**Data:** Reads healthMetrics array, getTodaysMetrics(), getWeeklyMetrics(), Apple Health data (if synced); writes addHealthMetric(metric), syncAppleHealth()
**Permissions:** Apple Health access (required for sync)
**Navigation:** "Connect Apple Health" → permission flow → Settings; "View Trends" → detailed health history; manual log buttons → quick entry modals; metric cards → detailed view

---

### 31. ToolsScreen (ToolsHomeScreen)
**File:** `src/screens/ToolsScreen.tsx` (contains ToolsStack navigator)
**Navigator:** MainTabs, Tab name="Tools", Icon: construct; nested navigator: ToolsStack.Screen name="ToolsHome"
**How User Reaches:** Tap "Tools" in bottom tab bar
**Main UI Sections:** Header with title "Tools" and "Edit" button (toggles to "Done" in edit mode), Favorites section (if any favorited, with star icon), tool categories (Health & Wellness: Food Tracker/Water Tracker/History, Daily Essentials: Magnifier/Flashlight/Notes, Brain & Learning: Brain Refresh/Learning Bites, Phone Helpers: Find Phone/Share Location/Parking), each tool card shows colored icon bg, name, description, favorite star (edit mode), chevron (view mode), edit mode features (star to favorite, up/down arrows for reordering, "Done" button, tutorial tooltip on first use)
**Key Actions:** Tap tool to open it, enter edit mode, favorite/unfavorite tools, reorder tools within categories, exit edit mode, view tool descriptions
**Data:** Reads favoriteToolIds array, tool categories config, hasSeenTooltip("tools-edit"); writes toggleFavoriteTool(id), tool order (in state)
**Permissions:** None (permissions per tool)
**Navigation:** Tool taps navigate to ToolsStack screens: Magnifier/Flashlight/Food Tracker/Water Tracker/History/Notes/Find Phone/Share Location/Parking/Brain Refresh/Learning Bites

---

### 32. ConnectScreen
**File:** `src/screens/ConnectScreen.tsx`
**Navigator:** MainTabs, Tab name="Connect", Icon: people
**How User Reaches:** Tap "Contacts" in bottom tab bar
**Main UI Sections:** Header "Contacts", Emergency Contacts section (header with alert icon + "Emergency Contacts" + collapse/expand chevron + red "+ Add" button, content: empty state with red/pink box OR contact cards with profile pic/initials, name, PRIMARY badge, relationship, phone, Call/Text action buttons, swipeable Edit/Delete, collapsed: "[X] contacts (collapsed)" text), Favorite Contacts section (header with collapse/expand + blue "+ Add", content: empty state OR contact cards with profile pic/initials, name, relationship, phone, Call/Video/Text buttons, swipeable Edit/Delete, collapsed text), Messages from Contacts section (header with collapse/expand, content: empty state OR message cards with photo/text, sender info, date, "Open Messages App" button with mail icon), ContactImportModal on "+ Add", edit contact modal, messaging app selector modal (iMessage, WhatsApp, Messenger, Telegram options)
**Key Actions:** Add emergency/favorite contact, import from device contacts, edit/delete contact (swipe), call/video call/text contact, view messages, open messages app, collapse/expand sections, choose messaging app
**Data:** Reads emergencyContacts array, favoriteContacts array, familyMessages array, device contacts (if importing); writes addEmergencyContact(), addFavoriteContact(), updateEmergencyContact(), updateFavoriteContact(), removeEmergencyContact(), removeFavoriteContact()
**Permissions:** Contacts access (for import), Phone/calling, SMS/messaging
**Navigation:** "+ Add" → ContactImportModal; Call/Video/Text buttons → native apps; "Open Messages App" → messaging app selector → selected app; Edit → edit modal; Delete → confirmation → removes

---

### 33. SettingsScreen
**File:** `src/screens/SettingsScreen.tsx`
**Navigator:** MainTabs, Tab name="Settings", Icon: settings
**How User Reaches:** Tap "Settings" in bottom tab bar
**Main UI Sections:** Header "Settings", profile section (profile circle, user name, email, "Edit Profile" button), settings categories with cards: Personal (Profile & Account, Emergency Contacts with count, Favorite Contacts with count), App Settings (Notifications, Security & Privacy, Language with current shown, Text Size with current shown, Theme with current shown), Data & Sync (Connected Apps with count, Health Sync with status, Calendar Sync with toggle, Import/Export Data), Support & Info (Help & Support, Send Feedback, Legal & Privacy, About with version), Account Actions (Sign Out, Delete Account in red), optional Developer Options (toggle, reset buttons)
**Key Actions:** Edit profile, manage emergency/favorite contacts, configure notifications, set security (PIN/Face ID), change language, adjust text size, change theme, manage connected apps, toggle syncs, import/export data, get help, send feedback, view legal docs, view app info, sign out, delete account
**Data:** Reads userProfile, settings object, connected apps status, sync statuses; writes updateSettings(), updateProfile()
**Permissions:** None (options lead to permission requests)
**Navigation:** Each setting → respective screen: Emergency Contacts/Favorite Contacts/Notifications/Security/Connected Apps → modals; Health → HealthScreen; Feedback → FeedbackScreen modal; Legal → LegalPrivacyScreen modal; Sign Out → confirmation → logs out → Welcome; Delete Account → multiple confirmations → deletes → Welcome

---

## TOOLS STACK SCREENS

### 34. MagnifierScreen
**File:** `src/screens/tools/MagnifierScreen.tsx`
**Navigator:** ToolsStack.Screen name="Magnifier", Header: "Magnifier", Back: "Tools"
**How User Reaches:** Tap "Magnifier" tool card in ToolsScreen
**Main UI Sections:** Full-screen live camera preview (back camera), overlay controls (back button, zoom level indicator "2.5x", zoom slider 1x-5x, freeze frame button with camera/pause icon, flash/torch toggle), frozen frame mode (static image, pinch-to-zoom on frozen image, pan/drag, "Resume Live View" button)
**Key Actions:** View magnified live feed, pinch to zoom in/out, adjust zoom with slider, freeze current frame, pan around frozen image, toggle flashlight, resume live view, go back
**Data:** Reads camera permission status, zoom capabilities; no writes (doesn't save images)
**Permissions:** Camera access (required)
**Navigation:** Back button → ToolsScreen; alerts on permission denial

---

### 35. FlashlightScreen
**File:** `src/screens/tools/FlashlightScreen.tsx`
**Navigator:** ToolsStack.Screen name="Flashlight", Header: "Flashlight", Back: "Tools"
**How User Reaches:** Tap "Flashlight" tool card in ToolsScreen
**Main UI Sections:** Background changes (off: light gray, on: warm yellow tint with animation), central control (large flashlight icon 100-120px, changes from outline/gray to filled/yellow, glow effect when on with pulsing animation), large circular toggle button (100-120px diameter, gray off / amber on, tap target, press animation), status text below button ("Flashlight Off" / "Flashlight On", large bold), instruction text at bottom ("Tap to turn on/off", gray), hidden CameraView component (height 0) for torch control
**Key Actions:** Tap button/icon to toggle flashlight, view on/off state, back to tools
**Data:** None
**Permissions:** Camera (for torch access - required)
**Navigation:** Back → ToolsScreen; flashlight auto-turns off on exit; uses CameraView with enableTorch prop

---

### 36. NotesScreen
**File:** `src/screens/tools/NotesScreen.tsx`
**Navigator:** ToolsStack.Screen name="Notes", Header: "Notes", Back: "Tools"
**How User Reaches:** Tap "Notes" tool card in ToolsScreen
**Main UI Sections:** Header with title and "+ New Note" button, notes list (sorted most recent first, each card showing title truncated to 1 line bold, preview 2-3 lines gray, date small gray, tap action to open, swipe actions: Edit blue / Delete red), empty state (notes icon, "No notes yet", "Tap + to create"), add/edit note modal (slide up, title "Add Note" / "Edit Note", title input placeholder "Note Title" single-line auto-focus, content input placeholder "Start typing..." multiline auto-expanding scrollable, keyboard-aware, Cancel gray / Save primary blue buttons, Save disabled if title empty)
**Key Actions:** View all notes, add new note, tap note to view/edit, swipe to edit, swipe to delete, search/sort notes
**Data:** Reads notes array from appStore; writes addNote({ id, title, content, createdAt, updatedAt }), updateNote(id, { title, content, updatedAt }), removeNote(id)
**Permissions:** None
**Navigation:** Back → ToolsScreen; "+ New Note" → add modal; tap note → edit modal; swipe Edit → edit modal; swipe Delete → confirmation → deletes

---

### 37. FindMyCarScreen
**File:** `src/screens/tools/FindMyCarScreen.tsx`
**Navigator:** ToolsStack.Screen name="FindMyCar", Header: "Find My Car" (or "Parking"), Back: "Tools"
**How User Reaches:** Tap "Parking" / "Find My Car" tool card
**Main UI Sections:** State 1 No Location Saved (optional map or placeholder showing user's current location with blue dot, centered empty state with car icon, "No Parking Location Saved", explanation, "Save Current Location" button primary blue large), State 2 Location Saved (MapView full/partial screen showing user's blue dot and car marker red pin, line/route between points optional, info card overlay with car icon, distance "0.3 miles away", address, saved timestamp, action buttons: "Get Directions" primary blue large / "Update Location" secondary outlined / "Clear Location" text button red), State 3 Permission Required (location icon, "Location Access Required", explanation, "Grant Permission" button primary / "Not Now" secondary)
**Key Actions:** Grant location permission, save current location as parking spot, view saved location on map, get directions to car (opens Maps), update saved location, clear saved location, view distance from car
**Data:** Reads savedCarLocation from appStore { latitude, longitude, address, timestamp }, current device location via expo-location; writes saveCarLocation({ ... }), clearCarLocation()
**Permissions:** Location (foreground, required)
**Navigation:** "Get Directions" → opens native Maps app via Linking; Back → ToolsScreen; uses react-native-maps, geocoding for address, haversine for distance

---

### 38. FoodTrackerScreen
**File:** `src/screens/FoodTrackerScreen.tsx`
**Navigator:** ToolsStack.Screen name="FoodTracker", Header: Hidden (custom header)
**How User Reaches:** Tap "Food Tracker" tool card or from home widget
**Main UI Sections:** Custom header (back button, title "Food Tracker", date selector "< Today >" with date picker), daily summary card (meals logged count, total calories ~1200 cal estimated, circular progress donut chart showing goal 2000 cal), meal entries section "Today's Meals" (chronological list, each card: photo thumbnail if added left, meal info with name bold + time "8:30 AM" + calories "350 cal" if entered + category badge "Breakfast" color-coded, quick actions edit/delete icons, swipe actions: Edit blue / Delete red), add meal button (FAB large "+" icon blue/primary fixed bottom-right), empty state (plate/utensils icon, "No meals logged today", "Tap + to log your first meal")
**Key Actions:** View today's food log, navigate between dates, add new meal entry, add photo to meal, edit meal entry, delete meal entry, view calorie totals, view meal history
**Data:** Reads foodEntries array from appStore, getTodaysFoodEntries(), getTodaysCalories(), selected date; writes addFoodEntry({ id, name, time, calories, category, photo, notes, date }), updateFoodEntry(id, updates), removeFoodEntry(id)
**Permissions:** Camera (meal photos - optional), Photo library (selecting photos - optional)
**Navigation:** Back → ToolsScreen; date selector changes displayed date; FAB → add meal modal; Edit → modal in edit mode; modal has fields for name, time picker default current, calories number input optional, category dropdown Breakfast/Lunch/Dinner/Snack based on time, Add Photo button with camera icon, notes multiline, Cancel / Save buttons

---

### 39. WaterTrackerScreen
**File:** `src/screens/WaterTrackerScreen.tsx`
**Navigator:** ToolsStack.Screen name="WaterTracker", Header: Hidden (custom header)
**How User Reaches:** Tap "Water Tracker" tool card or from home widget
**Main UI Sections:** Custom header (back button, title "Water Tracker", date selector), daily goal display (large water glass vertical illustration with animated blue water fill based on progress, bubbles/ripple effect on add, progress counter large text "[5] / [8] glasses" or "[40] / [64] oz", subtext "63% of daily goal", visual progress bar), quick add section (prominent "+ Add 1 Glass" button large primary blue with glass icon, quick action row: "+1 glass" 8 oz / "+2 glasses" 16 oz / "Custom" opens input), history log "Today's Water Log" (list of entries: time "2:45 PM", amount "1 glass (8 oz)", water droplet icon, swipe to delete), goal settings section ("Daily Goal" header, current goal "8 glasses (64 oz)", "Adjust Goal" button opens bottom sheet with slider 4-16 glasses + Save), empty state (water droplet icon, "No water logged today", "Start tracking your hydration"), goal reached state (celebration animation confetti/checkmark, "Goal Reached! 🎉", "You drank [8] glasses today", encouragement message)
**Key Actions:** Quick add 1/2 glasses, add custom amount, view daily progress, view history log, delete log entry, adjust daily goal, navigate between dates
**Data:** Reads waterEntries array, getTodaysWaterEntries(), settings.waterGoal default 8 glasses / 64 oz; writes addWaterEntry({ id, amount, timestamp, date }), removeWaterEntry(id), updateSettings({ waterGoal })
**Permissions:** None
**Navigation:** Back → ToolsScreen; date selector changes date view; default goal 8 glasses, 1 glass = 8 oz, progress animation uses reanimated, water glass SVG with animated fill, streak tracking

---

### 40. FindPhoneScreen
**File:** `src/screens/tools/FindPhoneScreen.tsx`
**Navigator:** ToolsStack.Screen name="FindPhone", Header: "Find Phone", Back: "Tools"
**How User Reaches:** Tap "Find Phone" tool card
**Main UI Sections:** Central content (vertical center: large phone icon with sound waves 120-150px animated pulsing when ringing, title "Find Your Phone" or "Phone is Ringing!" when active, description "Play a loud sound..." or "Tap stop..." when ringing), main action button (large prominent full-width: before ringing "Start Ringing" with volume icon primary blue, while ringing "Stop Ringing" with stop icon red pulsing animation), status display ("Tap to start" / "Phone is ringing..." / duration "Ringing for 15s"), settings section (collapsed by default: volume slider with "Will play at maximum volume" warning + speaker icon, duration setting "Auto-stop after" 30s/1min/2min/Continuous picker, ringtone selection dropdown Default/Alert 1/Alert 2/Alarm with preview buttons), warning box (yellow/orange bg, warning icon, "Very loud sound! Use only when needed...")
**Key Actions:** Tap "Start Ringing" to play sound, tap "Stop Ringing" to silence, adjust volume, select ringtone, set auto-stop duration, back to tools
**Data:** None (ephemeral state)
**Permissions:** None (uses Audio API)
**Navigation:** Back → ToolsScreen; auto-stops sound on navigation away; uses expo-av Audio, plays at max volume overriding device, vibration accompanies sound, continues when backgrounded, auto-stops on unmount/user stop/timeout

---

### 41. ShareLocationScreen
**File:** `src/screens/tools/ShareLocationScreen.tsx`
**Navigator:** ToolsStack.Screen name="ShareLocation", Header: "Share Location", Back: "Tools"
**How User Reaches:** Tap "Share Location" tool card
**Main UI Sections:** State 1 Permission Required (location icon, "Location Access Required", explanation, "Grant Permission" button primary / "Not Now" secondary), State 2 Location Loaded (small map preview 1/3 screen height showing user's blue marker/dot with address overlay, location details card below map: address with location pin icon full street address geocoded, coordinates with globe icon lat/long, accuracy with target icon "±5 meters", timestamp with clock icon "Updated just now", share options section "Share Via" header with grid of buttons: Message with SMS icon "Send Message" opens contact picker then Messages with location, Copy Link with link icon "Copy Map Link" copies Google Maps URL shows "Copied!" toast, Open in Maps with maps icon "Open in Maps" launches Apple Maps, Emergency Share with alert icon red "Emergency Share" sends to all emergency contacts with message "This is my current location. I may need help.", refresh button small "Refresh Location" updates position with spinner)
**Key Actions:** Grant location permission, view current location on map, share via SMS, copy location link, open in Maps app, emergency share to contacts, refresh location
**Data:** Reads current device location expo-location, emergencyContacts from appStore, favoriteContacts for picker; no writes (sharing only)
**Permissions:** Location (foreground, required), SMS/Messages (for messaging)
**Navigation:** "Send Message" → contact picker → Messages app; "Open in Maps" → Apple Maps; Back → ToolsScreen; uses expo-location getCurrentPositionAsync high accuracy, geocoding for address, Google Maps URL format, SMS includes address + map link, emergency loops through contacts sending SMS with location link + message

---

### 42. BrainRefreshScreen
**File:** `src/screens/connect/BrainRefreshScreen.tsx`
**Navigator:** ToolsStack.Screen name="BrainRefresh", Header: "Daily Brain Refresh", Back: "Tools"
**How User Reaches:** Tap "Brain Refresh" tool card
**Main UI Sections:** Header (title "Brain Refresh", subtitle "Fun games to keep your mind sharp"), Today's Challenge card (prominent top: lightbulb/brain icon, "Today's Challenge" label, game name "Memory Match", difficulty "Easy" badge, "Play Now" button large primary, estimated time "~3 minutes"), game categories (Memory Games section: Memory Match cards/grid "Match pairs of cards" + Sequence Memory numbers "Remember the sequence", Word Games section: Word Search text/magnifying glass grid + Anagrams letters unscramble, Number Puzzles section: Sudoku Lite grid simplified + Number Sequences complete pattern, Visual Puzzles section: Spot the Difference two images + Pattern Matching shapes), stats section "Your Stats" (cards: Games Played Today count, Current Streak days, Favorite Game name with icon, Total Points score, "View Full Stats" link), How to Play collapsible info (instructions per game, tips)
**Key Actions:** Play today's challenge, select game category, choose specific game, select difficulty level, view game instructions, view statistics, continue streak
**Data:** Reads gameStats from appStore, gameHistory, currentStreak, lastPlayedDate; writes updates gameStats after completion, records history, updates streaks
**Permissions:** None
**Navigation:** "Play" button → navigates to specific game screen (each game is sub-screen), Back → Tools or Connect; games track time/score/accuracy, stats persist in appStore, streak logic increments if played today, resets if day skipped, one day grace period

---

### 43. LearningBitesScreen
**File:** `src/screens/connect/LearningBitesScreen.tsx`
**Navigator:** ToolsStack.Screen name="LearningBites", Header: "Learning Bites", Back: "Tools"
**How User Reaches:** Tap "Learning Bites" tool card
**Main UI Sections:** Header (title "Learning Bites", subtitle "Quick, interesting facts and tips", filter icon button top-right), Featured Content card ("Today's Pick" badge, large card: featured image/illustration, category badge, title, brief description, "Read" button, estimated time "2 min read"), content categories (horizontal scrollable tabs: All, Daily Facts, How-To Guides, Health Tips, Tech Tips, Lifestyle), content feed (vertical scrollable list of cards, each: thumbnail image left or top, category badge color-coded Health green/Tech blue, title bold 1-2 lines, preview text 2-3 lines, meta info: reading time "3 min" + bookmark icon outline/filled, tap target entire card), Bookmarked tab/category (saved content, "No bookmarks yet" empty state)
**Key Actions:** Browse content feed, filter by category, read content article, bookmark content, share content, mark as read, view bookmarked content, search content
**Data:** Reads learningContent array/database, bookmarkedContent array, readHistory array; writes addBookmark(contentId), removeBookmark(contentId), markAsRead(contentId), recordReadingTime(contentId, duration)
**Permissions:** None
**Navigation:** Content card tap → full article view modal/screen (full-screen: close button top-left, bookmark button top-right, share button, scrollable: title, category, featured image, full text, related articles bottom, "Mark as Read" automatically); category tabs filter content; Back → Tools/Connect; Share → system share sheet; content can be local JSON / remote API / cached offline, reading progress tracked, bookmarks persist AsyncStorage, content updates daily or on app update, images lazy-loaded, client-side text search

---

### 44. HistoryScreen
**File:** `src/screens/HistoryScreen.tsx`
**Navigator:** ToolsStack.Screen name="History", Header: Hidden (custom header)
**How User Reaches:** Tap "History" tool card or from various feature screens "view history" links
**Main UI Sections:** Custom header (back button, title "History" or "[Type] History" e.g. "Food & Water History", filter icon button), filter bar (horizontal scrollable chips: All default, Food, Water, Medications, Tasks, active filter highlighted), date range selector (segmented control/tabs: Today, This Week, This Month, Custom opens date range picker), statistics section (collapsible "Stats" card: Food total meals + avg calories + common times, Water avg glasses/day + goal achievement rate + current streak), timeline view (chronological list newest first, grouped by date: Today, Yesterday, Dec 1 2025, each entry varies by type: Food time + meal icon + name + calories + photo thumbnail, Water time + droplet icon + amount "1 glass 8 oz", Medication time + pill icon + name dosage + status Taken/Missed/Skipped, Task time + category icon + name + status Completed/Incomplete, tap to view details, swipe to delete with confirmation), export data section ("Export History" button, options: PDF report, CSV file, Email to self, date range for export)
**Key Actions:** Filter by type (food, water, etc.), change date range, view statistics, view entry details, delete entry, export history data, search history
**Data:** Reads foodEntries, waterEntries, medicationLogs, tasks (completed), filtered by date range; writes removeFoodEntry(id), removeWaterEntry(id) (deletion only)
**Permissions:** Storage (for export)
**Navigation:** Back → previous screen varies; entry tap → detail modal; Export → share sheet or save file; virtualized list, date grouping, stats calculated on-the-fly, export formats PDF formatted report with charts / CSV spreadsheet data, caching for faster load

---

## End of Part 2
Next: Part 3 will cover Modal Screens, Screen-like Modals, and Orphaned/Unused Screens.
