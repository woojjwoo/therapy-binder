# The Therapy Binder

Private, encrypted therapy session journaling for iOS. Built with Expo SDK 54.

## Features

- AES-256-GCM on-device encryption — zero cloud storage
- Session notes with rich text blocks
- Voice memo recording
- Mood tracking (1–10 scale) with visual trends
- Tag-based session organization
- Pattern recognition across sessions
- Face ID / passphrase protection
- Recovery key backup (BIP-39 mnemonic)

## Getting Started

```bash
npm install
npx expo start
```

Press `i` to open in the iOS Simulator.

## Project Structure

```
app/              Expo Router screens
  (auth)/         Welcome, passphrase, biometrics, unlock
  (main)/         Home, new session, patterns, settings
src/
  components/     UI components and blocks
  hooks/          Custom hooks
  models/         TypeScript types
  storage/        Encrypted local storage (SQLite)
  stores/         Zustand state management
  theme/          Colors, typography
```

## Deploying to App Store

### 1. Prerequisites

- Apple Developer account ($99/year)
- Install EAS CLI: `npm install -g eas-cli`
- Log in: `eas login`

### 2. Configure eas.json

Fill in the three empty fields in `eas.json` under `submit.production.ios`:

- **`appleId`** — your Apple ID email
- **`ascAppId`** — App Store Connect → My Apps → your app → App Information → Apple ID (numeric)
- **`appleTeamId`** — https://developer.apple.com/account → Membership Details → Team ID

> You must first create the app in [App Store Connect](https://appstoreconnect.apple.com) with bundle ID `com.briancobb.therapybinder`.

### 3. Build & Submit

```bash
# Build for production
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --profile production

# Or both at once
eas build --platform ios --profile production --auto-submit
```

### 4. App Store Review

1. Add screenshots in App Store Connect (6.7" and 6.5" sizes required)
2. Copy metadata from `store-metadata/ios/en-US/` into App Store Connect
3. Set age rating and submit for review

See [TESTFLIGHT_GUIDE.md](./TESTFLIGHT_GUIDE.md) for the full deployment walkthrough.

## Tech Stack

- **Framework:** Expo SDK 54 / React Native 0.81
- **Navigation:** Expo Router v6
- **State:** Zustand
- **Encryption:** @noble/ciphers (AES-256-GCM), @noble/hashes (Argon2)
- **Storage:** expo-sqlite with FTS5 full-text search
- **Key derivation:** Argon2id via react-native-argon2
