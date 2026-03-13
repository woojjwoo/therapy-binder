import { useState, useEffect, useCallback } from 'react';
import { Platform, Linking } from 'react-native';
import PrivacyScreen from '../../modules/privacy-screen';
import { useSettingsStore } from '../stores/settings-store';

interface UsePrivacyScreenResult {
  isSupported: boolean;
  isEnabled: boolean;
  toggle: () => Promise<void>;
  requestPermission: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function usePrivacyScreen(): UsePrivacyScreenResult {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { privacyScreenEnabled, setPrivacyScreenEnabled } = useSettingsStore();

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const supported = await PrivacyScreen.isSupported();
        if (!mounted) return;
        setIsSupported(supported);

        if (supported) {
          const enabled = await PrivacyScreen.isEnabled();
          if (!mounted) return;
          setIsEnabled(enabled);
        }
      } catch (e: any) {
        if (mounted) setError(e.message ?? 'Failed to check privacy screen');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      await Linking.openURL('package:com.therapybinder.app');
    } catch {
      // Fallback: open general settings
      await Linking.openSettings();
    }
  }, []);

  const toggle = useCallback(async () => {
    if (!isSupported) return;
    setError(null);

    try {
      const newValue = !isEnabled;
      await PrivacyScreen.setEnabled(newValue);
      setIsEnabled(newValue);
      setPrivacyScreenEnabled(newValue);
    } catch (e: any) {
      if (e.code === 'WRITE_SETTINGS_NOT_GRANTED' || e.message?.includes('WRITE_SETTINGS')) {
        setError('Permission required');
        // Open system settings for WRITE_SETTINGS
        try {
          await Linking.sendIntent('android.settings.action.MANAGE_WRITE_SETTINGS', [
            { key: 'uri', value: 'package:com.therapybinder.app' },
          ]);
        } catch {
          await Linking.openSettings();
        }
      } else {
        setError(e.message ?? 'Failed to toggle privacy screen');
      }
    }
  }, [isSupported, isEnabled, setPrivacyScreenEnabled]);

  return { isSupported, isEnabled, toggle, requestPermission, loading, error };
}
