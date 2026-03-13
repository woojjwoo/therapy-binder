import { Platform } from 'react-native';

let PrivacyScreenModule: {
  isSupported(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<void>;
};

if (Platform.OS === 'android') {
  PrivacyScreenModule = require('expo-modules-core').requireNativeModule('PrivacyScreen');
} else {
  // iOS no-op stub
  PrivacyScreenModule = {
    isSupported: async () => false,
    isEnabled: async () => false,
    setEnabled: async () => {},
  };
}

export default PrivacyScreenModule;
