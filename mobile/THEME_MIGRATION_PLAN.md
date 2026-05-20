# Systematic Theme Migration Plan

## Overview
This document outlines the systematic approach to convert all screens in SteadiDay to use the centralized theme system (`useTheme` hook), ensuring consistent color themes across the entire app.

## Current State
- **Screens with theme support**: ~15 screens (HomeScreen, SettingsScreen, AboutScreen, LanguageSelectionScreen, etc.)
- **Screens without theme support**: ~45 screens (all using hardcoded colors)
- **Impact**: Color theme changes in Settings don't apply to most screens

## Theme System Architecture

### useTheme Hook
Located in: `/src/utils/useTheme.ts`

Returns:
```typescript
{
  theme: colorTheme,           // "blue" | "sage" | "purple" | "orange" | "pink" | "teal"
  colors: {
    primary: string,           // Main brand color
    primaryLight: string,      // Lighter variant
    primaryDark: string,       // Darker variant
    background: string,        // Screen background
    cardBackground: string,    // Card/container background
    textPrimary: string,       // Primary text color
    textSecondary: string,     // Secondary/muted text
    divider: string,          // Border/divider color
    border: string,           // Input border color
    error: string,            // Error state color
    success: string,          // Success state color
    warning: string,          // Warning state color
    info: string,             // Info state color
  },
  isDark: boolean,            // Whether dark mode is active
  appearanceMode: "light" | "dark" | "system",
  accessibilityMode: "default" | "high-contrast" | "color-blind-friendly",
  // Convenience properties
  primary: string,
  primaryLight: string,
  primaryDark: string,
  background: string,
  cardBackground: string,
  textPrimary: string,
  textSecondary: string,
}
```

## Migration Steps (Per Screen)

### Step 1: Import useTheme
```typescript
import { useTheme } from "../utils/useTheme";
```

### Step 2: Call useTheme Hook
```typescript
export default function YourScreen() {
  const { colors, primary } = useTheme();
  // ... rest of component
}
```

### Step 3: Replace Hardcoded Colors

#### Common Replacements:

| Hardcoded Value | Replace With | Use Case |
|----------------|--------------|----------|
| `#F7F7F7` or `#FFFFFF` | `colors.background` | Screen background |
| `#2F80ED` or blue variations | `primary` | Primary brand color |
| `bg-light-card` or `#FFFFFF` | `colors.cardBackground` | Card backgrounds |
| `text-light-heading` or `#000000` | `colors.textPrimary` | Primary text |
| `text-light-body` or `#666666` | `colors.textSecondary` | Secondary text |
| `border-light-divider` or `#E5E7EB` | `colors.divider` | Borders/dividers |
| `#E5F2FF` (light blue bg) | `primary + "20"` | Highlighted backgrounds |

#### NativeWind to Inline Style Conversion:

**Before:**
```jsx
<View className="bg-[#F7F7F7]">
  <Text className="text-[#2F80ED]">Hello</Text>
</View>
```

**After:**
```jsx
<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: primary }}>Hello</Text>
</View>
```

### Step 4: Update Complex Components

**Icons:**
```jsx
// Before
<Ionicons name="heart" size={24} color="#2F80ED" />

// After
<Ionicons name="heart" size={24} color={primary} />
```

**Pressables with dynamic colors:**
```jsx
// Before
<Pressable className="bg-[#2F80ED] active:bg-[#2570D5]">

// After
<Pressable
  style={({ pressed }) => ({
    backgroundColor: pressed ? primary + "CC" : primary
  })}
>
```

**Borders and dividers:**
```jsx
// Before
style={{ borderBottomColor: "#E5E7EB" }}

// After
style={{ borderBottomColor: colors.divider }}
```

## Priority Order for Migration

### Priority 1: User-Facing Core Screens (High Impact)
These screens are frequently used and should be converted first:
1. ✅ **HomeScreen** - Already done
2. ✅ **SettingsScreen** - Already done
3. **WelcomeScreen** - First screen users see
4. **AuthenticationScreen** - Login/signup
5. **CreateAccountScreen** - Account creation
6. **TasksScreen** - Main feature
7. **MedsScreen** - Main feature
8. **ToolsScreen** - Main feature
9. **HealthScreen** - Health tracking
10. **InsuranceScreen** - Important documents
11. **DoctorsScreen** - Medical contacts

### Priority 2: Onboarding Flow (Medium-High Impact)
Users see these during setup:
12. **TutorialScreen**
13. **UserNameScreen**
14. **EmergencyContactScreen**
15. **FavoriteContactsOnboardingScreen**
16. **FallDetectionSetupScreen**
17. **MultipleMedicationsScreen**
18. **MultipleTasksScreen**
19. **ExampleMedicationScreen**
20. **ExampleTaskScreen**
21. **NotificationSettingsScreen**

### Priority 3: Settings-Related Screens (Medium Impact)
22. ✅ **LanguageSelectionScreen** - Already done
23. ✅ **SoundsAndHapticsScreen** - Already done
24. **SecuritySettingsScreen**
25. **ConnectedAppsScreen**
26. **CalendarSyncScreen**
27. **FontSizeSelectionScreen**

### Priority 4: Legal/Information Screens (Lower Impact)
28. ✅ **AboutScreen** - Already done
29. **LegalPrivacyScreen**
30. **PrivacyPolicyScreen**
31. **TermsOfServiceScreen**
32. **LiabilityWaiverScreen**
33. **SecurityStatementScreen**
34. **DataRetentionPolicyScreen**
35. **DataBreachResponseScreen**
36. **PrivacySecurityScreen**

### Priority 5: Connect Apps Flow (Lower Impact)
37. **ConnectAppsIntroScreen**
38. **ConnectAppsChoiceScreen**
39. **ConnectAppsAutoDetectScreen**
40. **ConnectAppsHealthScreen**
41. **ConnectAppsMedicationScreen**
42. **ConnectAppsCalendarScreen**
43. **ConnectAppsAddScreen**
44. **ConnectAppsDetailScreen**
45. **ConnectAppsConfirmationScreen**

### Priority 6: Miscellaneous (Lowest Impact)
46. **FeedbackScreen**
47. **LoginScreen**
48. **SocialSignInScreen**
49. **WelcomeEmailScreen**
50. **LegalConsentScreen**
51. **LockScreen**
52. **MedicalScreen**
53. **MedsScreenOld** (deprecated)

## Testing Checklist (Per Screen)

After converting each screen:
- [ ] Import useTheme hook
- [ ] Replace all hardcoded colors
- [ ] Test with all 6 color themes (blue, sage, purple, orange, pink, teal)
- [ ] Test with light mode
- [ ] Test with dark mode
- [ ] Test with system mode
- [ ] Test with high contrast mode
- [ ] Test with color-blind friendly mode
- [ ] Verify no visual regressions
- [ ] Verify proper contrast ratios

## Automation Helper Script

```bash
# Find all screens without useTheme
grep -L "useTheme" src/screens/*.tsx

# Count remaining screens
grep -L "useTheme" src/screens/*.tsx | wc -l

# Find hardcoded colors in a file
grep -n "#[0-9A-Fa-f]\{6\}" src/screens/YourScreen.tsx
```

## Common Patterns to Watch For

### Pattern 1: SafeAreaView Backgrounds
```jsx
// Before
<SafeAreaView className="flex-1 bg-[#F7F7F7]">

// After
<SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
```

### Pattern 2: Conditional Styling
```jsx
// Before
className={`${selected ? "bg-[#E5F2FF] border-primary" : "bg-light-card border-light-divider"}`}

// After
style={{
  backgroundColor: selected ? primary + "20" : colors.cardBackground,
  borderColor: selected ? primary : colors.divider,
}}
```

### Pattern 3: Gradient Backgrounds
```jsx
// Before
<LinearGradient colors={["#2F80ED", "#1E40AF"]}>

// After (gradients may need manual color selection)
<LinearGradient colors={[primary, primary + "DD"]}>
```

## Known Issues & Solutions

### Issue 1: TailwindCSS color classes
**Problem**: Can't use dynamic colors with NativeWind
**Solution**: Convert to inline `style` prop

### Issue 2: Opacity/transparency
**Problem**: Need to add transparency to colors
**Solution**: Use hex transparency suffix (e.g., `primary + "20"` for 20% opacity)

### Issue 3: LinearGradient components
**Problem**: Cannot use className with LinearGradient
**Solution**: Always use inline `style` prop with colors array

## Batch Conversion Strategy

### Week 1: Priority 1 (Core Screens)
- Convert 11 core user-facing screens
- Test thoroughly with all themes

### Week 2: Priority 2 (Onboarding)
- Convert 10 onboarding screens
- Ensure smooth onboarding experience

### Week 3: Priority 3 (Settings)
- Convert 5 settings-related screens
- Verify settings changes apply everywhere

### Week 4: Priority 4-6 (Remaining)
- Convert all remaining screens
- Final testing and polish

## Success Metrics

- [ ] 100% of screens use `useTheme` hook
- [ ] 0 hardcoded color values in screen files
- [ ] All 6 color themes work across entire app
- [ ] Dark mode works across entire app
- [ ] High contrast mode works across entire app
- [ ] Color-blind friendly mode works across entire app

## Maintenance

After migration is complete:
1. Add ESLint rule to prevent hardcoded colors
2. Update contribution guidelines
3. Document theme system for new developers
4. Create theme testing checklist for PR reviews
