import { ConfigPlugin, AndroidConfig, withAndroidManifest } from '@expo/config-plugins';

const withPrivacyScreenPermission: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure uses-permission array exists
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const hasPermission = manifest['uses-permission'].some(
      (p) => p.$?.['android:name'] === 'android.permission.WRITE_SETTINGS'
    );

    if (!hasPermission) {
      manifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.WRITE_SETTINGS',
        },
      } as AndroidConfig.Manifest.ManifestUsesPermission);
    }

    return config;
  });
};

export default withPrivacyScreenPermission;
