/**
 * Unlock screen — passphrase entry.
 * Re-derives the master key from passphrase + stored salt.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { deriveKey } from '../../src/crypto/kdf';
import { importRawKey } from '../../src/crypto/aes-gcm';
import { getMeta } from '../../src/db';
import { METADATA_KEYS } from '../../src/db/schema';
import { PassphraseInput } from '../../src/components/onboarding/PassphraseInput';

export default function UnlockScreen() {
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const unlock = useAuthStore((s) => s.unlock);

  async function handleUnlock() {
    if (!passphrase.trim() || loading) return;
    setLoading(true);
    try {
      const salt = await getMeta(METADATA_KEYS.SALT);
      if (!salt) {
        Alert.alert('Error', 'No salt found. Your data may be corrupted.');
        return;
      }
      const rawKey = await deriveKey(passphrase, salt);
      const key = await importRawKey(rawKey);
      unlock(key);
      router.replace('/(main)/');
    } catch {
      Alert.alert('Wrong passphrase', 'Could not unlock. Please check your passphrase and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.hero}>
          <Text style={s.icon}>🔒</Text>
          <Text style={s.title}>The Therapy Binder</Text>
          <Text style={s.subtitle}>Enter your passphrase to open your binder</Text>
        </View>

        <View style={s.form}>
          <PassphraseInput
            value={passphrase}
            onChange={setPassphrase}
            label="Passphrase"
            showStrength={false}
            placeholder="Your passphrase..."
          />
        </View>

        <View style={s.actions}>
          <Pressable
            style={[s.btn, (!passphrase.trim() || loading) && s.disabled]}
            onPress={handleUnlock}
            disabled={!passphrase.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.btnText}>Unlock</Text>
            }
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/recover')}>
            <Text style={s.recover}>Forgot passphrase? Use recovery key →</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 60, justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center' },
  icon: { fontSize: 72 },
  title: { fontFamily: Fonts.serifBold, fontSize: 32, color: Colors.earthBrown, textAlign: 'center' },
  subtitle: { fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.barkBrown, textAlign: 'center' },
  form: { marginBottom: 24 },
  actions: { gap: 16 },
  btn: { backgroundColor: Colors.earthBrown, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
  disabled: { opacity: 0.4 },
  recover: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.barkBrown, textAlign: 'center' },
});
