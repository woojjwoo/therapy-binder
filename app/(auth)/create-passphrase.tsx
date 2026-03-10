import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import zxcvbn from 'zxcvbn';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { generateSalt, deriveKey, generateMnemonic } from '../../src/crypto';
import { importRawKey } from '../../src/crypto/aes-gcm';
import { useAuthStore } from '../../src/stores/auth-store';

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const STRENGTH_COLORS = [Colors.terracotta, Colors.terracotta, Colors.blush, Colors.sageLight, Colors.sage];

export default function CreatePassphraseScreen() {
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const setOnboarding = useAuthStore((s) => s.setOnboarding);
  const unlock = useAuthStore((s) => s.unlock);

  const score = pass.length > 0 ? zxcvbn(pass).score : -1;
  const canProceed = pass.length >= 10 && score >= 2 && pass === confirm;

  async function handleCreate() {
    if (!canProceed || loading) return;
    setLoading(true);
    try {
      const saltHex = generateSalt();
      const mnemonic = generateMnemonic();
      const rawKey = await deriveKey(pass, saltHex);
      const key = await importRawKey(rawKey);
      unlock(key);
      setOnboarding({ saltHex, mnemonic, passphrase: pass });
      router.push('/(auth)/recovery-key');
    } catch (e: any) {
      console.error('[create-passphrase] ERROR:', e?.message, e?.stack);
      Alert.alert('Error', `Could not create account: ${e?.message ?? 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Create a passphrase</Text>
          <Text style={s.hint}>
            This unlocks your binder. Make it memorable — not a random string. If you forget it, only your recovery key can help.
          </Text>
        </View>

        <View style={s.fields}>
          <TextInput
            style={s.input} placeholder="Your passphrase"
            placeholderTextColor={Colors.border} secureTextEntry
            value={pass} onChangeText={setPass} autoCapitalize="none"
          />

          {pass.length > 0 && (
            <View style={s.strengthRow}>
              {[0,1,2,3,4].map((i) => (
                <View key={i} style={[s.bar, { backgroundColor: i <= score ? STRENGTH_COLORS[score] : Colors.border }]} />
              ))}
              <Text style={[s.strengthLabel, { color: score >= 0 ? STRENGTH_COLORS[score] : Colors.barkBrown }]}>
                {score >= 0 ? STRENGTH_LABELS[score] : ''}
              </Text>
            </View>
          )}

          <TextInput
            style={s.input} placeholder="Confirm passphrase"
            placeholderTextColor={Colors.border} secureTextEntry
            value={confirm} onChangeText={setConfirm} autoCapitalize="none"
          />
          {confirm.length > 0 && pass !== confirm && (
            <Text style={s.mismatch}>Passphrases don't match</Text>
          )}
        </View>

        <Pressable style={[s.btn, !canProceed && s.disabled]} onPress={handleCreate} disabled={!canProceed || loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={s.btnText}>Continue</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 40, justifyContent: 'space-between' },
  header: { gap: 12 },
  title: { fontFamily: Fonts.serifBold, fontSize: 32, color: Colors.earthBrown },
  hint: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.barkBrown, lineHeight: 22 },
  fields: { gap: 12 },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.earthBrown },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontFamily: Fonts.sans, fontSize: FontSizes.xs, minWidth: 60 },
  mismatch: { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.terracotta },
  btn: { backgroundColor: Colors.earthBrown, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
  disabled: { opacity: 0.4 },
});
