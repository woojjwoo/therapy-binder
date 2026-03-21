# Store Submission Checklist

## Before You Build

### Apple App Store (iOS)
- [ ] Create app in [App Store Connect](https://appstoreconnect.apple.com)
- [ ] Copy the numeric **Apple ID** from App Store Connect and paste it into `eas.json` → `submit.production.ios.ascAppId`
- [ ] Ensure your Apple Developer account is active and enrolled ($99/year)
- [ ] Verify signing certificates are valid in your Apple Developer account

### Google Play Store (Android)
- [ ] Create app in [Google Play Console](https://play.google.com/console)
- [ ] Create a Google Play service account with API access ([docs](https://expo.dev/accounts/[account]/settings/google-service-accounts))
- [ ] Download the service account JSON key and save it as `google-play-service-account.json` in the project root
- [ ] Complete the Data Safety questionnaire (see `store-metadata/android/DATA_SAFETY.md` for answers)
- [ ] Complete the Content Rating questionnaire (see `store-metadata/android/DATA_SAFETY.md`)
- [ ] Set up your app's store listing in Google Play Console

---

## Build & Submit

### iOS
```bash
# Build production binary
npm run build:ios

# Submit to App Store Connect
npm run submit:ios
```

### Android
```bash
# Build production AAB (Android App Bundle)
npm run build:android

# Submit to Google Play (internal track, draft)
npm run submit:android
```

### Both platforms at once
```bash
npm run build:all
```

---

## App Store Connect Checklist
- [ ] Upload screenshots (5 screenshots, 6.9" iPhone Pro Max — already in `store-metadata/ios/screenshots/`)
- [ ] Fill in app description (copy from `store-metadata/ios/en-US/description.txt`)
- [ ] Set subtitle: "Private Therapy Journal"
- [ ] Set keywords (copy from `store-metadata/ios/en-US/keywords.txt`)
- [ ] Set promotional text (copy from `store-metadata/ios/en-US/promotional_text.txt`)
- [ ] Set privacy policy URL: https://therapybinder.app/privacy
- [ ] Set support URL: https://therapybinder.app/support
- [ ] Set category: Primary — Medical, Secondary — Lifestyle
- [ ] Set age rating: 12+ (Medical/Treatment Information)
- [ ] Set copyright: 2026 Brian Cobb
- [ ] Add review notes (copy from `app-store/REVIEW_NOTES.md`)
- [ ] Set pricing (free with in-app purchases)
- [ ] Configure in-app purchases in App Store Connect
  - `com.briancobb.therapybinder.monthly` — Monthly subscription
  - `com.briancobb.therapybinder.annual` — Annual subscription

## Google Play Console Checklist
- [ ] Upload screenshots (reuse iOS screenshots or create 16:9 Android versions)
- [ ] Set app title: "The Therapy Binder"
- [ ] Set short description (copy from `store-metadata/android/en-US/short_description.txt`)
- [ ] Set full description (copy from `store-metadata/android/en-US/full_description.txt`)
- [ ] Upload feature graphic (1024x500px — you will need to create this)
- [ ] Set privacy policy URL: https://therapybinder.app/privacy
- [ ] Set app category: Medical
- [ ] Complete content rating questionnaire
- [ ] Complete Data Safety form
- [ ] Set pricing: Free (with in-app purchases)
- [ ] Configure in-app purchases in Google Play Console
  - `com.briancobb.therapybinder.monthly` — Monthly subscription
  - `com.briancobb.therapybinder.annual` — Annual subscription
- [ ] Set target audience: 13+ (not designed for children)

---

## Required Assets Still Needed

| Asset | Platform | Size | Status |
|-------|----------|------|--------|
| iOS Screenshots (6.9") | iOS | 1320×2868 | Done (5 screenshots) |
| iOS Screenshots (6.7") | iOS | 1290×2796 | Optional but recommended |
| iOS Screenshots (6.5") | iOS | 1284×2778 | Optional but recommended |
| Android Screenshots | Android | min 320px, max 3840px | Reuse iOS or create new |
| Android Feature Graphic | Android | 1024×500 | **Needed** |
| Privacy Policy page | Both | — | Needs to be live at therapybinder.app/privacy |
| Support page | Both | — | Needs to be live at therapybinder.app/support |

---

## Post-Submission

- [ ] Monitor App Store review (typically 24-48 hours)
- [ ] Monitor Google Play review (typically a few hours to a few days)
- [ ] Respond to any reviewer questions promptly
- [ ] Once approved, set release date or release immediately
