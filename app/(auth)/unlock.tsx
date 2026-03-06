/**
 * Unlock screen — passphrase entry or recovery mnemonic.
 * Re-derives the master key from passphrase + stored salt,
 * or from the 24-word mnemonic recovery key.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { deriveKey, deriveKeyFromMnemonic } from '../../src/crypto/kdf';
import { importRawKey } from '../../src/crypto/aes-gcm';
import { validateMnemonic } from '../../src/crypto/mnemonic';
import { unlockWithBiometrics, getBiometricType } from '../../src/crypto/secure-key';
import { getMeta } from '../../src/db';
import { METADATA_KEYS } from '../../src/db/schema';
import { PassphraseInput } from '../../src/components/onboarding/PassphraseInput';
import { Button } from '../../src/components/ui/Button';
import { useEffect } from 'react';

export default function UnlockScreen() {
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const unlock = useAuthStore((s) => s.unlock);

  // Try biometric unlock on mount
  useEffect(() => {
    (async () => {
      try {
        const bioType = await getBiometricType();
        if (bioType === 'none') return;
        const key = await unlockWithBiometrics('Unlock your therapy binder');
        if (key) {
          unlock(key);
          router.replace('/(main)/');
        }
      } catch {
        // biometrics not available or failed — fall through to passphrase
      }
    })();
  }, []);

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

  async function handleRecovery() {
    const trimmed = mnemonic.trim().toLowerCase();
    if (!trimmed || loading) return;

    if (!validateMnemonic(trimmed)) {
      Alert.alert('Invalid recovery key', 'Please check that all 24 words are correct and in order.');
      return;
    }

    setLoading(true);
    try {
      const salt = await getMeta(METADATA_KEYS.SALT);
      if (!salt) {
        Alert.alert('Error', 'No salt found. Your data may be corrupted.');
        return;
      }
      const rawKey = await deriveKeyFromMnemonic(trimmed, salt);
      const key = await importRawKey(rawKey);
      unlock(key);
      router.replace('/(main)/');
    } catch {
      Alert.alert('Recovery failed', 'Could not unlock with this recovery key. Please check and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (showRecovery) {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={s.recoveryContainer} keyboardShouldPersistTaps="handled">
            <View style={s.header}>
              <Text style={s.title}>Recovery Key</Text>
              <Text style={s.hint}>
                Enter all 24 words from your recovery key, separated by spaces.
              </Text>
            </View>

            <TextInput
              style={s.mnemonicInput}
              value={mnemonic}
              onChangeText={setMnemonic}
              placeholder="word1 word2 word3 ..."
              placeholderTextColor={Colors.barkBrown + '60'}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              title="Recover"
              onPress={handleRecovery}
              loading={loading}
              disabled={!mnemonic.trim()}
            />

            <Pressable onPress={() => setShowRecovery(false)}>
              <Text style={s.recover}>Back to passphrase unlock</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.hero}>
          <Text style={s.icon}>{'\uD83D\uDD12'}</Text>
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
          <Button
            title="Unlock"
            onPress={handleUnlock}
            loading={loading}
            disabled={!passphrase.trim()}
          />

          <Pressable onPress={() => setShowRecovery(true)}>
            <Text style={s.recover}>Forgot passphrase? Use recovery key {'\u2192'}</Text>
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
  recover: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.barkBrown, textAlign: 'center' },

  // Recovery mode
  recoveryContainer: { paddingHorizontal: 28, paddingVertical: 40, gap: 24 },
  header: { gap: 12 },
  hint: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.barkBrown, lineHeight: 22 },
  mnemonicInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
