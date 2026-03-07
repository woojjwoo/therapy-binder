# Deployment: iOS TestFlight & App Store

## Prerequisites

- **Apple Developer account** ($99/year) enrolled at [developer.apple.com](https://developer.apple.com)
- **EAS CLI** installed globally: `npm install -g eas-cli`
- **Expo account** — create one at [expo.dev](https://expo.dev) if needed

## First-time setup

1. Log in to EAS:
   ```bash
   eas login
   ```

2. Link the project (if not already linked):
   ```bash
   eas init
   ```

3. Fill in your Apple credentials in `eas.json` under `submit.production.ios`:
   - `appleId` — your Apple ID email
   - `ascAppId` — your App Store Connect app ID (numeric)
   - `appleTeamId` — your Apple Developer Team ID

## Building for TestFlight / App Store

```bash
# Production build (App Store / TestFlight)
npm run build:ios

# Or directly:
eas build --platform ios --profile production
```

EAS will prompt you to sign in to your Apple Developer account and will manage provisioning profiles and certificates automatically.

## Submitting to TestFlight

After the build completes:

```bash
eas submit --platform ios --profile production
```

Or build and submit in one step:

```bash
eas build --platform ios --profile production --auto-submit
```

## Internal preview builds

For testing on physical devices before submitting to TestFlight:

```bash
eas build --platform ios --profile preview
```

This creates an ad-hoc build you can install via a QR code link from the EAS dashboard.

## Bumping the build number

Before each new TestFlight submission, increment `buildNumber` in `app.json`:

```json
"ios": {
  "buildNumber": "2"
}
```

The build number must increase with every upload to App Store Connect. The `version` field (e.g., `"1.0.0"`) only needs to change for new public releases.

## Quick reference

| Command | Purpose |
|---------|---------|
| `eas build --platform ios --profile development` | Dev client (simulator) |
| `eas build --platform ios --profile preview` | Internal ad-hoc testing |
| `eas build --platform ios --profile production` | App Store / TestFlight |
| `eas submit --platform ios` | Submit latest build to App Store Connect |
