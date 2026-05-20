# OAuth Setup Guide for Google & Facebook Sign-In

This guide will help you configure Google and Facebook OAuth authentication for SteadiDay so they work in TestFlight and production.

## Bundle Identifier
Your app bundle identifier: `com.vibecode.dailycompanion`

---

## Part 1: Google Sign-In Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Select a project" dropdown at the top
   - Click "New Project"
   - Project name: "SteadiDay" (or your preferred name)
   - Click "Create"

### Step 2: Enable Google Sign-In API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" → "Library"

2. **Enable Required APIs**
   - Search for "Google+ API" and enable it
   - Search for "Google Sign-In API" and enable it

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Left sidebar → "APIs & Services" → "OAuth consent screen"

2. **Choose User Type**
   - Select "External" (unless you have a Google Workspace)
   - Click "Create"

3. **Fill in App Information**
   - App name: `SteadiDay`
   - User support email: Your email
   - App logo: (Optional) Upload your app icon
   - App domain: Leave blank for now
   - Developer contact: Your email
   - Click "Save and Continue"

4. **Scopes**
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click "Update" → "Save and Continue"

5. **Test Users** (for development)
   - Add your email and any test users
   - Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. **Go to Credentials**
   - Left sidebar → "APIs & Services" → "Credentials"
   - Click "+ Create Credentials" → "OAuth client ID"

2. **Create iOS Client ID**
   - Application type: Select "iOS"
   - Name: `SteadiDay iOS`
   - Bundle ID: `com.vibecode.dailycompanion`
   - Click "Create"
   - **SAVE THIS CLIENT ID** - you'll need it later

3. **Create Web Client ID**
   - Click "+ Create Credentials" → "OAuth client ID" again
   - Application type: Select "Web application"
   - Name: `SteadiDay Web`
   - No need to add redirect URIs for now
   - Click "Create"
   - **SAVE THIS CLIENT ID** - you'll need it later

### Step 5: Update Your Code

You'll have two client IDs that look like this:
- iOS Client ID: `123456789-abcdefg.apps.googleusercontent.com`
- Web Client ID: `987654321-hijklmn.apps.googleusercontent.com`

---

## Part 2: Facebook Login Setup

### Step 1: Create Facebook App

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com
   - Sign in with your Facebook account

2. **Create App**
   - Click "My Apps" → "Create App"
   - Use case: Select "Other"
   - Click "Next"
   - App type: Select "Consumer"
   - Click "Next"

3. **App Details**
   - App name: `SteadiDay`
   - App contact email: Your email
   - Click "Create App"

### Step 2: Add Facebook Login

1. **Add Facebook Login Product**
   - In your app dashboard, find "Add Products to Your App"
   - Find "Facebook Login" and click "Set Up"

2. **Choose Platform**
   - Select "iOS"
   - Skip the quickstart guide for now

### Step 3: Configure iOS Settings

1. **Go to Settings**
   - Left sidebar → "Settings" → "Basic"
   - Scroll down to find your App ID
   - **SAVE YOUR APP ID** - you'll need it

2. **Add iOS Platform**
   - Scroll down to "Add Platform"
   - Select "iOS"
   - Bundle ID: `com.vibecode.dailycompanion`
   - Click "Save Changes"

3. **Configure Facebook Login Settings**
   - Left sidebar → "Facebook Login" → "Settings"
   - Add these OAuth Redirect URIs:
     ```
     fb[YOUR_APP_ID]://authorize
     ```
   - Replace `[YOUR_APP_ID]` with your actual App ID
   - Click "Save Changes"

### Step 4: App Review (Important!)

⚠️ **For production use, you'll need to submit your app for review:**

1. Go to "App Review" in left sidebar
2. Make your app public (Development mode → Live mode)
3. Submit required permissions for review:
   - `email`
   - `public_profile`

**Note:** While in Development Mode, only users you add as Test Users can log in.

---

## Part 3: Update Your App Code

Now that you have all the credentials, I'll update your code with the configuration structure. You'll need to replace the placeholder values with your actual credentials.

### Required Credentials Summary:

**Google:**
- ✅ iOS Client ID: `______________.apps.googleusercontent.com`
- ✅ Web Client ID: `______________.apps.googleusercontent.com`

**Facebook:**
- ✅ App ID: `______________`
- ✅ Client Token: (found in Settings → Advanced)
- ✅ App Secret: (found in Settings → Basic, click "Show")

---

## Part 4: Testing

### Development Testing

1. **Add Test Users**
   - Google: Add emails in OAuth consent screen → Test users
   - Facebook: Add users in Roles → Test Users

2. **Test on Physical Device**
   - Social auth requires a real device (won't work in simulator)
   - Build and install on your iPhone

### TestFlight Testing

1. **Before uploading to TestFlight:**
   - Make sure all credentials are updated in the code
   - Test on physical device first
   - Verify both Google and Facebook login work

2. **For TestFlight Users:**
   - Google: No additional setup needed if using production credentials
   - Facebook: Add TestFlight testers as Test Users in Facebook App Dashboard

---

## Part 5: Production Checklist

Before releasing to App Store:

- [ ] Google OAuth consent screen verified
- [ ] Facebook app reviewed and approved
- [ ] Test on multiple devices
- [ ] Verify error handling works
- [ ] Privacy Policy URL added to both Google and Facebook dashboards
- [ ] Terms of Service URL added
- [ ] Data deletion instructions provided

---

## Troubleshooting

### Google Sign-In Issues

**"Sign in was cancelled"**
- Make sure iOS Client ID matches your bundle identifier exactly
- Verify you're using the correct Web Client ID

**"Invalid client"**
- Double-check both client IDs are correct
- Make sure the app bundle ID matches Google Console settings

### Facebook Login Issues

**"App Not Setup"**
- Verify Facebook App ID is correct
- Check that iOS platform is configured with correct bundle ID

**"Login Failed"**
- Make sure user is added as Test User (in Development Mode)
- Verify OAuth redirect URIs are configured

---

## Security Notes

⚠️ **Important:**
- Never commit OAuth secrets to git
- Store client IDs in environment variables or secure config
- Use different OAuth apps for development and production
- Regularly rotate OAuth secrets

---

## Need Help?

- Google OAuth: https://developers.google.com/identity/sign-in/ios
- Facebook Login: https://developers.facebook.com/docs/facebook-login/ios
- Expo Auth Session: https://docs.expo.dev/versions/latest/sdk/auth-session/

---

## Next Steps

After completing this setup:
1. I'll update your code with the configuration structure
2. You'll add your actual credentials to the .env file
3. Test on a physical device
4. Deploy to TestFlight
