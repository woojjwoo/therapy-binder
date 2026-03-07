# App Store Review Notes

## Notes for App Review Team

### About the App
The Therapy Binder is a local-only, privacy-first journaling app for therapy sessions. All data is stored on-device with encryption. There is no server component, no user accounts, and no network requests for data storage.

### Encryption Details
- All journal entries are encrypted locally on the device using a key generated at first launch
- The encryption key is stored in the iOS Keychain via Expo SecureStore
- There is no server-side component — data never leaves the device unless the user explicitly exports to PDF
- We have declared `ITSAppUsesNonExemptEncryption: false` because the encryption is used solely for protecting user data stored on the device, which qualifies for the encryption exemption

### Demo Account / Login
This app does not have user accounts, login, or any server-side authentication. There is no demo account to provide. The app works entirely offline and stores all data locally on the device. Simply launch the app and tap "Get Started" to begin using it.

### Face ID Usage
The app uses Face ID (LocalAuthentication) to lock and unlock access to the journal. This is optional and can be enabled by the user in Settings. The app functions fully without Face ID enabled.

### Special Configuration
No special configuration, hardware, or entitlements are required beyond:
- Face ID capability (optional, for biometric lock feature)
- No push notifications
- No in-app purchases
- No background processing
- No location services

### Content
The app is a personal journaling tool. All content is user-generated and stored locally. The app does not include any pre-populated content, community features, or user-to-user communication.
