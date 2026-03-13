/**
 * Settings store — persists user preferences via AsyncStorage.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVACY_SCREEN_KEY = 'tb_privacy_screen_enabled';

interface SettingsState {
  privacyScreenEnabled: boolean;

  setPrivacyScreenEnabled: (enabled: boolean) => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  privacyScreenEnabled: false,

  setPrivacyScreenEnabled: (enabled: boolean) => {
    AsyncStorage.setItem(PRIVACY_SCREEN_KEY, enabled ? 'true' : 'false');
    set({ privacyScreenEnabled: enabled });
  },

  loadSettings: async () => {
    const val = await AsyncStorage.getItem(PRIVACY_SCREEN_KEY);
    set({ privacyScreenEnabled: val === 'true' });
  },
}));
