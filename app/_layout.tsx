// Must be first import — polyfills crypto.getRandomValues for Hermes
import 'react-native-get-random-values';

import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, AppState } from 'react-native';
import { usePreventScreenCapture } from 'expo-screen-capture';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/stores/auth-store';
import { useSubscription } from '../src/stores/subscription-store';
import { Colors } from '../src/theme/colors';
import { scheduleDaily } from '../src/hooks/useNotifications';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { useSettingsStore } from '../src/stores/settings-store';
import PrivacyScreen from '../modules/privacy-screen';

const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes

export default function RootLayout() {
  usePreventScreenCapture();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const { onboardingComplete, isUnlocked, metaLoaded, loadMeta, lock } = useAuthStore();
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    loadMeta();
    useSubscription.getState().checkSubscription();

    // Re-schedule daily reminder if previously enabled (notifications clear on reinstall)
    (async () => {
      const enabled = await AsyncStorage.getItem('tb_reminder_enabled');
      if (enabled === 'true') {
        const time = await AsyncStorage.getItem('tb_reminder_time');
        const [h, m] = time ? time.split(':').map(Number) : [20, 0];
        await scheduleDaily(h, m);
      }
    })();
  }, []);

  // Auto-lock after 5 minutes in background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active' && backgroundedAt.current) {
        if (Date.now() - backgroundedAt.current > AUTO_LOCK_MS) {
          lock();
        }
        backgroundedAt.current = null;

        // Re-enable privacy screen on foreground if user preference is set
        const { privacyScreenEnabled } = useSettingsStore.getState();
        if (privacyScreenEnabled) {
          PrivacyScreen.setEnabled(true).catch(() => {});
        }
      }
    });
    return () => sub.remove();
  }, [lock]);

  useEffect(() => {
    // Wait for both fonts AND DB meta before routing — prevents flash to /welcome
    if (!fontsLoaded || !metaLoaded) return;
    if (!onboardingComplete) {
      router.replace('/(auth)/welcome');
    } else if (!isUnlocked) {
      router.replace('/(auth)/unlock');
    } else {
      router.replace('/(main)/');
    }
  }, [fontsLoaded, metaLoaded, onboardingComplete, isUnlocked]);

  if (!fontsLoaded || !metaLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.cream }}>
        <ActivityIndicator color={Colors.earthBrown} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </ErrorBoundary>
  );
}
