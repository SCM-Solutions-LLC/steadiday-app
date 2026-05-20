# Photo Privacy Policy - Insurance Cards and Prescriptions

**Last Updated:** December 1, 2025
**For:** SteadiDay App Users

---

## Overview

This document explains how the SteadiDay app handles photos of your insurance cards and prescription labels.

**Key Point:** Photos are used only temporarily to read text and fill in forms. They are immediately deleted and never stored.

---

## What Happens When You Take a Photo

### Insurance Cards

When you photograph your insurance card:

1. **Capture:** You take a photo using your camera or choose one from your gallery
2. **Extract:** The app reads the card to find:
   - Insurance provider name
   - Member ID
   - Group number
   - Policy holder name
3. **Fill:** The app automatically fills these fields in the form
4. **Delete:** The photo is immediately removed from the app and device
5. **Save:** Only the typed text fields are saved to your device storage

**Result:** Your insurance card photo never leaves the app and is deleted within seconds.

### Prescription Labels

When you photograph a prescription label:

1. **Capture:** You take a photo using your camera or choose one from your gallery
2. **Extract:** The app reads the label to find:
   - Medication name
   - Dosage/strength
   - Frequency (if visible)
3. **Fill:** The app automatically fills these fields in the form
4. **Delete:** The photo is immediately discarded from memory
5. **Save:** Only the typed text fields are saved to your device storage

**Result:** Your prescription photo never leaves the app and exists only in memory during processing (typically 2-5 seconds).

---

## Privacy Guarantees

### ✅ What We DO

- **Process photos on your device** - All photo analysis happens locally on your iPhone
- **Delete photos immediately** - Photos are removed as soon as text extraction finishes
- **Store only typed details** - Only insurance numbers, medication names, and similar text fields are kept
- **Encrypt stored data** - The text fields are stored in encrypted device storage
- **Keep data local** - Nothing is sent to SteadiDay servers (no backend exists yet)

### ❌ What We DON'T DO

- **Never save photos** - Insurance card and prescription photos are never written to AsyncStorage, encrypted storage, or any permanent storage
- **Never send photos to servers** - Photos are not transmitted anywhere
- **Never send photos to third parties** - No analytics, crash reports, or other services receive photos
- **Never show photos in notifications** - Notifications only show generic text like "Medication Reminder"
- **Never save to Photos library** - Photos are not saved unless you explicitly choose a photo from your library (in which case you already saved it)
- **Never include photos in backups** - Since photos aren't stored, they can't be in iCloud or iTunes backups

---

## Technical Details

### Photo Lifecycle

**Insurance Cards:**
```
1. Camera captures photo → Temporary file created (file://)
2. App reads file → Converts to base64 for AI analysis
3. AI extracts text → Fills form fields
4. Temporary file deleted → FileSystem.deleteAsync()
5. Photo URI cleared from memory → setPhotoUri(undefined)
```

**Prescription Labels:**
```
1. Camera/gallery provides photo → base64 string in memory
2. AI analyzes image → Extracts medication info
3. Form fields filled → Function completes
4. base64 string garbage collected → Memory automatically freed
5. No file ever written to disk
```

### Storage Locations Checked

We verified that photos are NOT stored in:
- ❌ AsyncStorage (local key-value storage)
- ❌ Expo SecureStore (encrypted keychain)
- ❌ File system (DocumentDirectory or CacheDirectory)
- ❌ CloudKit or iCloud
- ❌ App state (zustand store)
- ❌ Photo library (unless user explicitly chooses from library)

### What IS Stored

Only these text fields are stored locally on your device:

**Insurance Cards:**
- Provider name (e.g., "Blue Cross Blue Shield")
- Member ID (e.g., "ABC123456789")
- Group number (e.g., "GRP987654")
- Policy holder name (e.g., "John Smith")
- Customer service phone (optional)
- Notes (optional)

**Medications:**
- Medication name (e.g., "Aspirin")
- Dosage (e.g., "100mg")
- Frequency (e.g., "daily")
- Times to take (e.g., "09:00, 21:00")
- Pharmacy name (optional)
- Pharmacy phone (optional)

---

## User Interface Privacy Features

### Senior-Friendly Privacy Notices

Both the insurance card and medication screens show a clear privacy notice:

> **Your Privacy:** The photo is only used to read your card and fill in the form below. The app removes the image right after and only keeps the typed details.

This notice:
- Appears above the camera buttons
- Uses large, readable text
- Is written in plain language for adults 50-70
- Has a shield icon for easy recognition
- Explains exactly what happens to the photo

---

## Compliance

### HIPAA Privacy (Health Insurance)

Insurance card photos are considered **Protected Health Information (PHI)**. By immediately deleting photos and storing only necessary text fields:

- ✅ Meets "minimum necessary" standard
- ✅ No photo storage reduces breach risk
- ✅ Local processing protects transmission security
- ✅ No third-party exposure

### Data Minimization (GDPR/CCPA)

By not storing photos:
- ✅ Collects only essential data (text fields)
- ✅ Reduces privacy exposure
- ✅ Easier data export (Download My Data feature)
- ✅ Easier account deletion (no photos to purge)

---

## Verification

You can verify that photos are not stored by:

1. **Check App Storage:**
   - iOS Settings → General → iPhone Storage → SteadiDay
   - Should show minimal storage usage (only text data)

2. **Check iCloud Backup:**
   - Photos are never included in backups because they're never stored

3. **Review Code:**
   - `src/components/AddInsuranceModal.tsx` - Line 230-250: Photo deletion code
   - `src/components/AddMedicationModal.tsx` - Line 331-334: Memory-only processing
   - `src/types/app.ts` - Line 69, 111: Photo URI marked as "not saved"

---

## Questions?

**Q: What if I choose a photo from my gallery?**
A: The app only reads the photo you selected. It does not modify or delete your original photo in your Photos library. The app processes the photo and discards it, keeping only the extracted text.

**Q: Can I see the photo after I take it?**
A: Yes, briefly. The photo appears in the form while processing (2-5 seconds), then disappears once the fields are filled.

**Q: What if the photo doesn't read correctly?**
A: You can retake the photo or manually type the information. Either way, only the final text you save is stored.

**Q: Are photos sent to Claude AI or OpenAI?**
A: No. All photo processing happens locally on your device. The AI runs on your iPhone using on-device processing.

**Q: Will photos ever be stored in the future?**
A: No. This is a permanent privacy design decision. Photos will never be stored, even when we add cloud features.

---

## Summary

**Photos Are:**
- ✅ Processed on your device
- ✅ Used only to extract text
- ✅ Deleted within seconds
- ✅ Never sent anywhere
- ✅ Never stored permanently

**Only These Are Stored:**
- ✅ Typed text fields (member ID, medication name, etc.)
- ✅ Encrypted on your device
- ✅ Never leave your phone (until we add optional cloud backup)

Your medical and insurance information is private and secure. Photos are a convenience feature to save you typing, nothing more.
