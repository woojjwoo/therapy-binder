# App Store Review Notes

## Notes for App Review Team

### 1. App Purpose

The Therapy Binder is a local-only, privacy-first journaling app designed for people in therapy. It solves the problem of having no secure, structured place to capture therapy session notes, track mood over time, and prepare for upcoming appointments — without sacrificing privacy. All data is encrypted on-device. There is no server component, no user accounts, and no network requests for data storage.

### 2. How to Access and Review Core Features

This app does not have user accounts, login, or any server-side authentication. There is no demo account to provide. The app works entirely offline and stores all data locally on the device.

**Step-by-step walkthrough:**

1. Launch the app and tap **"Get Started"**
2. Set a passphrase to create your encryption key — this protects all journal data
3. Optionally enable Face ID for convenient unlock (can be skipped)
4. You arrive at the **Home screen** showing your session list (empty on first launch)
5. Tap **"+"** to create a new journal entry
6. Add text notes, record a voice memo (microphone permission prompt), or attach an image (photo library permission prompt)
7. Tag the session with a date, therapist name, topics, and homework
8. Use the **mood tracker** to log how you're feeling
9. Navigate to **Patterns & Insights** to see mood trends, session frequency, and recurring themes
10. Open **Settings** to enable/disable Face ID lock, screenshot prevention, or export to PDF
11. Tap **"Pro"** to view subscription options (monthly or annual)

### 3. Screen Recording

A screen recording captured on a physical device demonstrating the full user flow (launch → onboarding → create entry → mood tracking → insights → settings → paywall) is attached separately in App Store Connect media.

### 4. Encryption Details

- All journal entries are encrypted locally on the device using AES-256-GCM with a key derived via Argon2id from the user's passphrase
- The encryption key is stored in the iOS Keychain via Expo SecureStore
- There is no server-side component — data never leaves the device unless the user explicitly exports to PDF
- We have declared `ITSAppUsesNonExemptEncryption: false` because the encryption is used solely for protecting user data stored on the device, which qualifies for the encryption exemption

### 5. External Services, Tools, and Platforms

The Therapy Binder uses **no external services** for its core functionality. Specifically:

- **No analytics services** (no Firebase, Amplitude, Mixpanel, etc.)
- **No crash reporting services** (no Sentry, Crashlytics, etc.)
- **No advertising SDKs**
- **No AI or machine learning services**
- **No data providers or APIs**
- **No authentication services** (no OAuth, no third-party login)
- **No cloud storage** (no iCloud, CloudKit, AWS, etc.)
- **Payment processing:** Apple StoreKit only (via expo-in-app-purchases) for in-app subscriptions
- **License validation:** A single HTTPS endpoint (https://therapybinder.app/api/validate) is used only for validating license keys purchased outside the App Store. This endpoint receives only the license key string and returns a validity status. No personal data is transmitted.

All encryption, storage, and processing happens locally using open-source libraries:
- `@noble/ciphers` and `@noble/hashes` for AES-256-GCM encryption
- `react-native-argon2` for key derivation
- `expo-sqlite` for local encrypted database

### 6. Subscriptions and In-App Purchases

The app offers a free tier (limited to 10 sessions) and a Pro tier via auto-renewable subscriptions:

- **Monthly:** $9.99/month (`com.briancobb.therapybinder.monthly`)
- **Annual:** $59.99/year (`com.briancobb.therapybinder.annual`)

Pro features include: unlimited sessions, mood trend visualization, text export, custom tags, and pattern tracking.

Subscription details (title, duration, and price) are displayed on the paywall screen before purchase. Links to the Terms of Use (https://therapybinder.app/terms) and Privacy Policy (https://therapybinder.app/privacy) are accessible from the paywall screen and the Settings screen.

### 7. Regional Differences

The app functions consistently across all regions. There are no regional differences in features, content, or functionality. The app is currently available in English only.

### 8. Regulated Industry

The Therapy Binder is categorized under Medical for discoverability, but it is **not a medical device** and does not provide medical advice, diagnosis, or treatment. It is a personal journaling and note-taking tool. It does not replace professional therapy or counseling. No medical credentials or regulatory authorization are required. The app includes no health claims and makes no therapeutic recommendations.

### 9. Face ID Usage

The app uses Face ID (LocalAuthentication) to lock and unlock access to the journal. This is optional and can be enabled by the user in Settings. The app functions fully without Face ID enabled.

### 10. Special Configuration

No special configuration or hardware is required beyond:
- Face ID capability (optional, for biometric lock feature)
- Microphone access (optional, for voice memo recording)
- Photo library access (optional, for image attachments)

### 11. Content

The app is a personal journaling tool. All content is user-generated and stored locally. The app does not include any pre-populated content, community features, or user-to-user communication. There is no user-generated content visible to other users, and therefore no content reporting or blocking mechanisms are needed.
