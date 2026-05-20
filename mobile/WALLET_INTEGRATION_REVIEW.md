# Apple Wallet Integration Review - SteadiDay

**Review Date**: December 1, 2025
**Status**: ❌ **NOT IMPLEMENTED**

## Executive Summary

SteadiDay **does not currently have any Apple Wallet or PassKit integration**. This review was conducted to assess and harden existing Wallet integration, but no such functionality exists in the codebase.

## Current State

### What Was Found

1. **No PassKit Dependencies**: The `package.json` file does not include any PassKit or Apple Wallet libraries
2. **No Wallet Code**: Comprehensive code search found zero mentions of:
   - PassKit APIs
   - Wallet-related imports
   - PKPass handling
   - Apple Wallet integration logic
3. **No Wallet UI**: No user interface elements for importing insurance data from Apple Wallet
4. **Existing Insurance Flow**: Insurance cards are added via:
   - Manual text entry
   - Photo OCR (camera or gallery)
   - No third-party data source integration

### Current Insurance Data Sources

The app currently supports these methods for adding insurance cards (`src/components/AddInsuranceModal.tsx`):

1. **Manual Entry**: User types all fields
2. **Camera OCR**: Take photo of physical card → AI extracts text → fields auto-filled
3. **Gallery OCR**: Choose existing photo → AI extracts text → fields auto-filled

**Privacy Status**: Photos are immediately deleted after text extraction (implemented as of December 2025)

## Findings Summary

| Security Requirement | Status | Notes |
|---------------------|--------|-------|
| Read only minimum fields from Wallet | ❌ N/A | No Wallet integration exists |
| Do not store Wallet card images | ✅ Compliant | No Wallet images - feature not implemented |
| One-way use only (no cloning) | ✅ Compliant | No pass creation - feature not implemented |
| User consent before reading Wallet | ❌ N/A | No Wallet integration exists |
| Documentation of Wallet privacy | ❌ N/A | No Wallet integration exists |

**Result**: There is nothing to harden because Apple Wallet integration is not implemented.

---

## Recommendations for Future Implementation

If SteadiDay decides to add Apple Wallet integration in the future, the following guidelines should be followed to maintain privacy and security standards:

### 1. Read-Only Text Fields

**Implement**: Use PassKit framework to read ONLY these fields from insurance passes:
- Provider/Plan Name
- Member ID
- Group Number
- Customer Service Phone Number

**Do NOT**:
- Store any pass images, logos, or visual assets
- Access barcode/QR code images
- Store full pass data structures
- Create local copies of the pass file (.pkpass)

### 2. Data Flow Architecture

```
Apple Wallet → PassKit API → Extract Text Fields → Prefill Form → Save to SecureStore
                   ↓
            (No image storage at any step)
```

**Storage Rules**:
- ✅ Text fields → Encrypted storage (existing flow)
- ❌ Pass images → Never stored
- ❌ Pass files → Never cached
- ❌ Visual assets → Never extracted

### 3. User Consent Flow

**UI Design** (senior-friendly, 50+ audience):

```
┌─────────────────────────────────────────┐
│  Add Insurance Card                     │
├─────────────────────────────────────────┤
│                                         │
│  Choose how to add your card:           │
│                                         │
│  📷 [Take Photo]     🖼️ [Gallery]      │
│                                         │
│  🔷 [Use Apple Wallet]  ← NEW           │
│                                         │
│  ✏️ [Type Manually]                     │
│                                         │
└─────────────────────────────────────────┘
```

**When user taps "Use Apple Wallet", show consent message**:

```
┌─────────────────────────────────────────┐
│  🛡️ Privacy Notice                      │
├─────────────────────────────────────────┤
│                                         │
│  SteadiDay will read basic        │
│  insurance details from your Apple      │
│  Wallet to help fill this form.         │
│                                         │
│  • The card stays in Wallet             │
│  • Only typed details are saved         │
│  • No images are stored                 │
│                                         │
│  [Continue]  [Cancel]                   │
└─────────────────────────────────────────┘
```

**Text Guidelines**:
- Use large, readable fonts (textSize setting from app state)
- Simple language for adults 50-70 years old
- Shield icon for security reassurance
- Clear opt-in (no automatic reading)

### 4. Implementation Code Pattern

**Recommended React Native library**: `react-native-passkit` (if adding this feature)

```typescript
// Example secure implementation (FUTURE)
import PassKit from 'react-native-passkit';

async function importFromWallet() {
  try {
    // 1. Request user to select a pass
    const pass = await PassKit.selectPass({
      passTypeIdentifier: 'pass.com.insurance.health' // Filter to insurance only
    });

    // 2. Extract ONLY text fields (no images)
    const textFields = {
      providerName: pass.fields.find(f => f.key === 'provider')?.value,
      memberId: pass.fields.find(f => f.key === 'memberId')?.value,
      groupNumber: pass.fields.find(f => f.key === 'groupNumber')?.value,
      phoneNumber: pass.fields.find(f => f.key === 'phone')?.value,
    };

    // 3. Prefill form (existing flow)
    setProviderName(textFields.providerName || '');
    setMemberId(textFields.memberId || '');
    setGroupNumber(textFields.groupNumber || '');
    setPhoneNumber(textFields.phoneNumber || '');

    // 4. DO NOT store pass object, images, or any binary data
    // Only store text fields via existing handleSave() function

  } catch (error) {
    // User cancelled or no suitable pass found
    console.log('Wallet import cancelled');
  }
}
```

### 5. Security Checklist for Future Implementation

Before deploying Apple Wallet integration, verify:

- [ ] **No image storage**: Confirm no pass images in AsyncStorage, SecureStore, FileSystem, or CloudKit
- [ ] **No pass cloning**: Confirm app never calls PassKit pass creation APIs
- [ ] **No automatic reading**: Confirm user must explicitly tap "Use Apple Wallet" button
- [ ] **Text-only extraction**: Confirm only string fields are extracted (no binary data)
- [ ] **Secure logging**: Confirm secureLogger.ts redacts member IDs and group numbers
- [ ] **Consent UI tested**: Confirm seniors (50+) understand the privacy message
- [ ] **Documentation updated**: Update PHOTO_PRIVACY_POLICY.md and DATA_STORAGE_OVERVIEW.md

### 6. Privacy Documentation Updates (When Implementing)

**Update these files**:

1. **PHOTO_PRIVACY_POLICY.md**: Add section explaining Wallet integration
2. **DATA_STORAGE_OVERVIEW.md**: Add row for "Apple Wallet Data Source"
3. **WALLET_INTEGRATION_POLICY.md** (new): Create dedicated Wallet privacy policy

**Key messaging** (for seniors):
- "Your insurance card stays in Apple Wallet"
- "SteadiDay only reads the typed details (name, ID numbers)"
- "No photos or images from Wallet are saved in SteadiDay"
- "You choose when to use Wallet - the app never reads it automatically"

### 7. Testing Requirements (Future)

When implementing Wallet integration:

1. **Privacy Testing**:
   - Verify no images stored after Wallet import
   - Check AsyncStorage, SecureStore, FileSystem, tmp directories
   - Confirm no pass files cached

2. **UI Testing with Seniors**:
   - Test consent message clarity with adults 50-70
   - Verify button labels are clear ("Use Apple Wallet" not "Import Pass")
   - Confirm error messages are friendly

3. **Edge Case Testing**:
   - Pass without required fields
   - Pass with non-standard field names
   - User cancels Wallet picker
   - No suitable passes in Wallet

---

## Current Data Flow (No Wallet)

**How insurance cards are currently added**:

```
Method 1: Manual Entry
User types → Form fields → handleSave() → Zustand store → AsyncStorage (encrypted)

Method 2: Photo OCR
Camera/Gallery → Photo (temp file) → AI OCR → Extract text → Prefill form →
Delete photo → handleSave() → Zustand store → AsyncStorage (encrypted)
```

**Privacy status**: ✅ Compliant
- Photos deleted after 2-5 seconds (as of December 2025)
- Only text fields stored
- No images in any storage location

---

## Conclusion

**Current Status**: ✅ **COMPLIANT BY DEFAULT**

SteadiDay does not have Apple Wallet integration, which means:
- ✅ No Wallet images are stored (because feature doesn't exist)
- ✅ No pass cloning occurs (because feature doesn't exist)
- ✅ No privacy concerns with Wallet data (because feature doesn't exist)

**Recommendation**: If Wallet integration is desired in the future, follow the guidelines in this document to ensure privacy-preserving, senior-friendly implementation that maintains the app's high security standards.

---

## Contact

For questions about this review or future Wallet integration plans, contact the SteadiDay development team.

**Review Conducted By**: Claude Code (Vibecode AI Agent)
**Review Method**: Comprehensive codebase search and security analysis
**Next Review**: When/if Wallet integration is implemented
