/**
 * Unlock screen — auto-retrieves stored key from SecureStore.
 * No passphrase needed; key was generated on first setup.
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { unlockWithBiometrics } from '../../src/crypto/secure-key';

export default function UnlockScreen() {
  const unlock = useAuthStore((s) => s.unlock);
  const [status, setStatus] = useState<'pending' | 'failed'>('pending');

  const attemptUnlock = async () => {
    setStatus('pending');
    try {
      const key = await unlockWithBiometrics('Unlock The Therapy Binder');
      if (key) {
        unlock(key);
        router.replace('/(main)/');
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    }
  };

  // Auto-trigger biometric auth on mount
  useEffect(() => {
    attemptUnlock();
  }, []);

  return (
    <View style={s.container}>
      <Text style={s.title}>The Therapy Binder</Text>
      {status === 'pending' ? (
        <>
          <ActivityIndicator color={Colors.accent} size="large" style={s.spinner} />
          <Text style={s.hint}>Opening your binder…</Text>
        </>
      ) : (
        <>
          <Text style={s.hint}>Authentication failed or was cancelled.</Text>
          <Pressable style={s.retryBtn} onPress={attemptUnlock}>
            <Text style={s.retryText}>Try Again</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', gap: 20 },
  title: { fontFamily: Fonts.serifBold, fontSize: 28, color: Colors.accent },
  spinner: { marginTop: 8 },
  hint: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.textSecondary },
  retryBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 8,
  },
  retryText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
});
