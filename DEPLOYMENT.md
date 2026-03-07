# Step-by-Step: Therapy Binder -> TestFlight

## Prerequisites

- Apple Developer Account ($99/yr at developer.apple.com)
- EAS CLI: `npm install -g eas-cli`
- Login: `eas login` (use Apple Developer email)

## One-Time Setup

### 1. Create App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) -> My Apps -> + -> New App
2. Fill in:
   - **Platform:** iOS
   - **Name:** The Therapy Binder
   - **Bundle ID:** com.briancobb.therapybinder
   - **SKU:** therapy-binder-001
3. After creating, copy the **Apple ID** number from the App Information page

### 2. Configure eas.json

Open `eas.json` and fill in the `submit.production.ios` section:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-developer@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123DEF4"
      }
    }
  }
}
```

Where to find each value:
- **appleId** — your Apple Developer email address
- **ascAppId** — the Apple ID number from App Store Connect (step 1 above)
- **appleTeamId** — go to [developer.apple.com/account](https://developer.apple.com/account) -> Membership -> Team ID

## Build & Submit

```bash
# Build for App Store
eas build --platform ios --profile production

# After build completes (~10 min), submit to TestFlight
eas submit --platform ios --latest
```

## After Submission

1. Wait 15-30 min for TestFlight processing
2. In App Store Connect, go to your app -> TestFlight
3. Add yourself as an internal tester
4. Open TestFlight on your physical iPhone to install and test
5. When ready for public release: App Store Connect -> App Store -> Submit for Review

## App Store Review Checklist

Before submitting for App Store review, make sure you have:

- [ ] Screenshots uploaded (see `app-store/SCREENSHOTS.md`)
- [ ] Description pasted (see `app-store/METADATA.md`)
- [ ] Privacy Policy URL: https://therapybinder.app/privacy
- [ ] Support URL: https://therapybinder.app/support
- [ ] Review notes added (see `app-store/REVIEW_NOTES.md`)
