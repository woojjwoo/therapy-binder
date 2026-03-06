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
import { unlockWithStoredKey } from '../../src/crypto/secure-key';

export default function UnlockScreen() {
  const unlock = useAuthStore((s) => s.unlock);

  useEffect(() => {
    (async () => {
      try {
        const key = await unlockWithStoredKey();
        if (key) {
          unlock(key);
          router.replace('/(main)/');
        } else {
          Alert.alert('Error', 'Could not retrieve your key. You may need to set up the app again.');
        }
      } catch (e) {
        console.error('Unlock failed', e);
        Alert.alert('Error', 'Something went wrong unlocking the app.');
      }
    })();
  }, []);

  return (
    <View style={s.container}>
      <Text style={s.title}>The Therapy Binder</Text>
      <ActivityIndicator color={Colors.earthBrown} size="large" style={s.spinner} />
      <Text style={s.hint}>Opening your binder…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', gap: 20 },
  title: { fontFamily: Fonts.serifBold, fontSize: 28, color: Colors.earthBrown },
  spinner: { marginTop: 8 },
  hint: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.barkBrown },
});
