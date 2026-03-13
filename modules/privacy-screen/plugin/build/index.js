"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withPrivacyScreenPermission = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        const manifest = config.modResults.manifest;
        // Ensure uses-permission array exists
        if (!manifest['uses-permission']) {
            manifest['uses-permission'] = [];
        }
        const hasPermission = manifest['uses-permission'].some((p) => p.$?.['android:name'] === 'android.permission.WRITE_SETTINGS');
        if (!hasPermission) {
            manifest['uses-permission'].push({
                $: {
                    'android:name': 'android.permission.WRITE_SETTINGS',
                },
            });
        }
        return config;
    });
};
exports.default = withPrivacyScreenPermission;
