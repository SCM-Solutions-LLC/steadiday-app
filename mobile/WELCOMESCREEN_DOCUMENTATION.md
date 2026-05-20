# WelcomeScreen Documentation

## Overview
The WelcomeScreen is the entry point for new users of the SteadiDay app. It features a Lottie animation, responsive design for both iPhone and iPad, and handles user authentication state.

## File Location
`/home/user/workspace/src/screens/WelcomeScreen.tsx`

## Features Implemented

### ✅ Responsive Design
- **Automatic tablet detection**: Uses screen dimensions to detect tablets (minimum 600px)
- **Responsive sizing**: All elements scale proportionally based on device type
- **Dynamic spacing**: Adjusts padding and margins for phones vs tablets
- **Proportional animation**: 35% screen height on phones, 30% on tablets

### ✅ Lottie Animation
- **File path**: `assets/animations/welcome_checklist.json`
- **Behavior**:
  - Auto-plays when screen loads
  - Loops continuously
  - Maintains aspect ratio with `resizeMode="contain"`
  - Centered horizontally
  - Responsive height (percentage-based)

- **Background handling**:
  - Pauses when app goes to background/inactive
  - Resumes when app returns to foreground
  - Uses `AppState` listener for automatic management

### ✅ Layout Structure

```
SafeAreaView (background: #F7F8FA)
└── Vertical Stack Container
    ├── Lottie Animation (35% height on phone, 30% on tablet)
    ├── Title ("Welcome to SteadiDay")
    │   └── System Title 1 font size
    │   └── Bold weight
    │   └── Color: #2C2C2C
    ├── Subtitle ("A simple helper...")
    │   └── System Body font size
    │   └── Regular weight
    │   └── Color: #6E6E6E
    ├── Flexible Spacer (pushes buttons to bottom)
    └── Button Container
        ├── "Create account" button (Primary)
        └── "Log in" button (Secondary)
```

### ✅ Typography
- **Title**:
  - Phone: 28px font size, 34px line height
  - Tablet: 34px font size, 41px line height
  - Font weight: Bold
  - Color: #2C2C2C
  - Supports Dynamic Type with `maxFontSizeMultiplier={1.3}`

- **Subtitle**:
  - Phone: 17px font size, 22px line height
  - Tablet: 18px font size, 26px line height
  - Font weight: Regular
  - Color: #6E6E6E
  - Supports Dynamic Type with `maxFontSizeMultiplier={1.3}`

- **Button Text**:
  - Phone: 17px
  - Tablet: 18px
  - Font weight: Semibold
  - Supports Dynamic Type with `maxFontSizeMultiplier={1.2}`

### ✅ Buttons

#### Primary Button ("Create account")
- **Dimensions**: Full width, 50px height, minimum 44px touch target
- **Background**: #5A85F3 (pressed: #4A75E3)
- **Text Color**: White
- **Border Radius**: 12px
- **Padding**: 24-32px horizontal (responsive)
- **Action**: Navigates to `Authentication` screen

#### Secondary Button ("Log in")
- **Dimensions**: Full width, 50px height, minimum 44px touch target
- **Background**: White (pressed: #F0F4FF)
- **Border**: 2px solid #5A85F3
- **Text Color**: #5A85F3
- **Border Radius**: 12px
- **Padding**: 24-32px horizontal (responsive)
- **Action**: Navigates to `Authentication` screen

### ✅ Spacing
- **Animation to Title**: 32-40px (responsive)
- **Title to Subtitle**: 16-20px (responsive)
- **Subtitle to Buttons**: Flexible spacer (fills remaining space)
- **Between Buttons**: 16-20px gap (responsive)
- **Button Container Padding**:
  - Phone: 24px horizontal, 24px bottom
  - Tablet: 80px horizontal, 32px bottom

### ✅ Accessibility
- All buttons have proper `accessibilityRole="button"`
- Descriptive `accessibilityLabel` and `accessibilityHint`
- Minimum touch targets of 44x44 points
- Full Dynamic Type support with font scaling

### ✅ Authentication Logic
- Checks `userProfile.auth.isAuthenticated` on mount
- If user is logged in (`userLoggedIn = true`), RootNavigator handles redirect to Home
- If not logged in (`userLoggedIn = false`), displays WelcomeScreen
- Both buttons navigate to same `Authentication` screen (which handles signup/login)

## Responsive Breakpoints

### Phone (width < 600px)
- Animation: 35% screen height
- Title: 28px font, 32px top margin
- Subtitle: 17px font, 16px top margin, 24px horizontal padding
- Buttons: 24px horizontal padding, 24px bottom padding, 16px gap

### Tablet (width >= 600px)
- Animation: 30% screen height
- Title: 34px font, 40px top margin
- Subtitle: 18px font, 20px top margin, 48px horizontal padding
- Buttons: 80px horizontal padding, 32px bottom padding, 20px gap

## Color Scheme
- Background: `#F7F8FA` (light gray-blue)
- Primary Blue: `#5A85F3`
- Primary Blue Pressed: `#4A75E3`
- Title Text: `#2C2C2C` (dark gray)
- Subtitle Text: `#6E6E6E` (medium gray)
- Button Background Pressed: `#F0F4FF` (very light blue)
- White: `#FFFFFF`

## Animation File Format
The Lottie animation (`welcome_checklist.json`) is a valid Lottie JSON file with:
- 30 FPS frame rate
- 90 frames (3-second loop)
- 500x500 resolution
- Animated checklist with appearing checkmarks
- Smooth ease-in-out animations

**Note**: The placeholder animation provided is a simple checklist. You should replace this with the actual animation file showing a Black man and white woman in their fifties looking at a checklist and smiling.

## Navigation Integration
The WelcomeScreen is part of the `OnboardingStackParamList` and integrates with:
- `Authentication` screen (for both signup and login)
- `RootNavigator` (handles authenticated state routing)

## Performance Considerations
- Uses `useWindowDimensions()` for responsive calculations
- Animation pauses during background to save resources
- Minimal re-renders with proper React hooks
- Efficient AppState listener with cleanup

## Testing Checklist
- [ ] Animation plays on screen load
- [ ] Animation loops continuously
- [ ] Animation pauses when app goes to background
- [ ] Animation resumes when app returns to foreground
- [ ] Layout adapts correctly on iPhone SE (small)
- [ ] Layout adapts correctly on iPhone 14 Pro Max (large)
- [ ] Layout adapts correctly on iPad Mini
- [ ] Layout adapts correctly on iPad Pro 12.9"
- [ ] Buttons have proper touch targets (44x44 minimum)
- [ ] Text scales with Dynamic Type settings
- [ ] "Create account" button navigates correctly
- [ ] "Log in" button navigates correctly
- [ ] Logged-in users skip WelcomeScreen
- [ ] Portrait and landscape orientations work

## Future Enhancements
1. Replace placeholder animation with actual character animation
2. Add fade-in transitions for text elements
3. Add haptic feedback on button press
4. Support for additional languages
5. Add skip tutorial option
6. Animate button entrance from bottom

## Dependencies
- `react-native-safe-area-context`: Safe area handling
- `lottie-react-native`: Animation playback
- `@react-navigation/native-stack`: Navigation
- `zustand` (via useAppStore): State management
