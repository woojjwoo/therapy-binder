# TestFlight Deployment Guide

## Prerequisites

1. **Apple Developer Account** ($99/year) — https://developer.apple.com/programs/
2. **EAS CLI** installed globally: `npm install -g eas-cli`
3. **Log in to EAS**: `eas login`

## Fill in eas.json

Open `eas.json` and fill in the three empty fields under `submit.production.ios`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC1234DEF"
      }
    }
  }
}
```

### Where to find each value

| Field | Where to find it |
|-------|-----------------|
| `appleId` | Your Apple ID email (the one you use to sign in to App Store Connect) |
| `ascAppId` | App Store Connect → My Apps → your app → App Information → "Apple ID" (numeric, e.g. `6744553210`) |
| `appleTeamId` | https://developer.apple.com/account → Membership Details → Team ID (e.g. `ABC1234DEF`) |

> **Note:** You must first create the app in App Store Connect before you have an `ascAppId`. Go to https://appstoreconnect.apple.com → My Apps → "+" → New App. Use bundle ID `com.briancobb.therapybinder`.

## Build & Submit

### 1. Build for production

```bash
eas build --platform ios --profile production
```

This takes ~15–20 minutes. EAS handles code signing automatically.

### 2. Submit to TestFlight

```bash
eas submit --platform ios --profile production
```

### 3. Or build + submit in one step

```bash
eas build --platform ios --profile production --auto-submit
```

## After Submission

1. Go to App Store Connect → TestFlight
2. Wait for Apple's automated processing (~10–30 min)
3. Fill in the "What to Test" field
4. Add internal testers (up to 100, no Apple review needed)
5. For external testers, submit for Beta App Review first

## Encryption Compliance

`ITSAppUsesNonExemptEncryption` is set to `false` in `app.json`. The app uses standard iOS encryption APIs and AES-256-GCM via JavaScript libraries (not custom/proprietary encryption hardware), which qualifies for the encryption exemption.

## App Store Submission (after TestFlight)

1. Upload screenshots (6.7" and 6.5" required, 6.1" optional)
2. Fill in App Store metadata (see `store-metadata/ios/en-US/`)
3. Set age rating (likely 4+, no objectionable content)
4. Submit for App Review via App Store Connect
