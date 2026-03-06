// Must be first import — polyfills crypto.getRandomValues for Hermes
import 'react-native-get-random-values';

import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
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
import { useAuthStore } from '../src/stores/auth-store';
import { Colors } from '../src/theme/colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const { onboardingComplete, isUnlocked, loadMeta } = useAuthStore();

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    if (!onboardingComplete) {
      router.replace('/(auth)/welcome');
    } else if (!isUnlocked) {
      router.replace('/(auth)/unlock');
    } else {
      router.replace('/(main)/');
    }
  }, [fontsLoaded, onboardingComplete, isUnlocked]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.cream }}>
        <ActivityIndicator color={Colors.earthBrown} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
}
