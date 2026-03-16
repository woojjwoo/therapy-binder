/**
 * Replaces "create passphrase" — sets up Face ID / Touch ID / passcode auth.
 * No passphrase typed. Key is generated randomly and stored in secure enclave.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { generateAndStoreKey, getBiometricType } from '../../src/crypto/secure-key';
import { useAuthStore } from '../../src/stores/auth-store';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = { faceid: 'scan-outline', touchid: 'finger-print-outline', passcode: 'keypad-outline', none: 'lock-closed-outline' };
const LABELS = { faceid: 'Face ID', touchid: 'Touch ID', passcode: 'Device Passcode', none: 'Authentication' };
const DESCRIPTIONS = {
  faceid: 'Your binder will be locked with Face ID. No passphrase to remember.',
  touchid: 'Your binder will be locked with Touch ID. No passphrase to remember.',
  passcode: 'Your binder will be locked with your device passcode.',
  none: 'Set up Face ID or a passcode in Settings first, then come back.',
};

export default function SetupBiometricsScreen() {
  const [biometricType, setBiometricType] = useState<'faceid' | 'touchid' | 'passcode' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const setOnboarding = useAuthStore(s => s.setOnboarding);
  const completeOnboarding = useAuthStore(s => s.completeOnboarding);
  const unlock = useAuthStore(s => s.unlock);

  useEffect(() => {
    getBiometricType().then(setBiometricType);
  }, []);

  async function handleSetup() {
    if (biometricType === 'none' || loading) return;
    setLoading(true);
    try {
      const { key } = await generateAndStoreKey();
      unlock(key);
      setOnboarding({ saltHex: '', mnemonic: '' });
      await completeOnboarding('');
      router.replace('/(main)/');
    } catch (e: any) {
      if (e?.message?.includes('cancel') || e?.message?.includes('dismiss')) {
        Alert.alert('Cancelled', 'Authentication was cancelled. Please try again.');
      } else {
        Alert.alert('Setup failed', 'Could not set up secure storage. Check that Face ID is enabled in Settings.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.hero}>
          <Ionicons name={ICONS[biometricType]} size={64} color={Colors.accent} />
          <Text style={s.title}>{LABELS[biometricType]}</Text>
          <Text style={s.description}>{DESCRIPTIONS[biometricType]}</Text>
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoTitle}>How your data stays private</Text>
          <View style={s.infoRow}><Text style={s.bullet}>•</Text><Text style={s.infoText}>A unique encryption key is generated for your device</Text></View>
          <View style={s.infoRow}><Text style={s.bullet}>•</Text><Text style={s.infoText}>It's stored in your phone's secure enclave — not in our servers</Text></View>
          <View style={s.infoRow}><Text style={s.bullet}>•</Text><Text style={s.infoText}>Only Face ID / passcode can access it</Text></View>
          <View style={s.infoRow}><Text style={s.bullet}>•</Text><Text style={s.infoText}>If you lose access to this device, your encrypted data cannot be recovered — back up your device regularly</Text></View>
        </View>

        <Pressable
          style={[s.btn, (biometricType === 'none' || loading) && s.disabled]}
          onPress={handleSetup}
          disabled={biometricType === 'none' || loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={s.btnText}>Set Up {LABELS[biometricType]}</Text>
          }
        </Pressable>

        {biometricType === 'none' && (
          <Text style={s.note}>Go to Settings → Face ID & Passcode to enable authentication first.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 40, justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: 12, marginTop: 24 },
  title: { fontFamily: Fonts.serifBold, fontSize: 32, color: Colors.accent, textAlign: 'center' },
  description: { fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  infoBox: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, gap: 12, borderWidth: 1, borderColor: Colors.border },
  infoTitle: { fontFamily: Fonts.sansBold, fontSize: FontSizes.sm, color: Colors.earthBrown, marginBottom: 4 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.sage, marginTop: 1 },
  infoText: { flex: 1, fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.earthBrown, lineHeight: 20 },
  btn: { backgroundColor: Colors.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
  disabled: { opacity: 0.4 },
  note: { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'center' },
});
