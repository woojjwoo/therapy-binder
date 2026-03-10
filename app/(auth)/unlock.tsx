/**
 * Unlock screen — auto-retrieves stored key from SecureStore.
 * No passphrase needed; key was generated on first setup.
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { unlockWithBiometrics } from '../../src/crypto/secure-key';

export default function UnlockScreen() {
  const unlock = useAuthStore((s) => s.unlock);

  const attemptUnlock = async () => {
    try {
      const key = await unlockWithBiometrics('Unlock The Therapy Binder');
      if (key) {
        unlock(key);
        router.replace('/(main)/');
      } else {
        Alert.alert('Authentication required', 'Please authenticate to access your binder.');
      }
    } catch (e) {
      console.error('Unlock failed', e);
      Alert.alert('Error', 'Something went wrong unlocking the app.');
    }
  };

  // Auto-trigger biometric auth on mount
  useEffect(() => {
    attemptUnlock();
  }, []);

  return (
    <View style={s.container}>
      <Text style={s.title}>The Therapy Binder</Text>
      <ActivityIndicator color={Colors.accent} size="large" style={s.spinner} />
      <Text style={s.hint}>Opening your binder…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', gap: 20 },
  title: { fontFamily: Fonts.serifBold, fontSize: 28, color: Colors.accent },
  spinner: { marginTop: 8 },
  hint: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textSecondary },
});
