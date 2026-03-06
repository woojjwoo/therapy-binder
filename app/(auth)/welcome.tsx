import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { generateAndStoreKey, unlockWithStoredKey } from '../../src/crypto/secure-key';
import { setMeta } from '../../src/db';

const PROPS = [
  { icon: '🔒', text: 'Your notes stay on your device' },
  { icon: '🎙️', text: 'Voice, notes, and insights in one place' },
  { icon: '📈', text: 'Find patterns across your therapy journey' },
];

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(false);
  const { unlock, completeOnboarding } = useAuthStore();

  async function handleGetStarted() {
    setLoading(true);
    try {
      const { key } = await generateAndStoreKey();
      unlock(key);
      await setMeta('onboarding_complete', 'true');
      await completeOnboarding('');
      router.replace('/(main)/');
    } catch (e) {
      console.error('Setup failed', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.hero}>
          <Text style={s.title}>The Therapy{'\n'}Binder</Text>
          <Text style={s.subtitle}>
            Your sessions, your words,{'\n'}your patterns. Private by design.
          </Text>
        </View>

        <View style={s.props}>
          {PROPS.map((p, i) => (
            <View key={i} style={s.propRow}>
              <Text style={s.propIcon}>{p.icon}</Text>
              <Text style={s.propText}>{p.text}</Text>
            </View>
          ))}
        </View>

        <Pressable style={[s.btn, loading && s.btnDisabled]} onPress={handleGetStarted} disabled={loading}>
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={s.btnText}>Get Started</Text>
          }
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 40, justifyContent: 'space-between' },
  hero: { marginTop: 16, gap: 12 },
  title: { fontFamily: Fonts.serifBold, fontSize: 40, color: Colors.earthBrown, lineHeight: 48 },
  subtitle: { fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.barkBrown, lineHeight: 24 },
  props: { gap: 20 },
  propRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  propIcon: { fontSize: 22, marginTop: 1 },
  propText: { flex: 1, fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.earthBrown, lineHeight: 24 },
  btn: { backgroundColor: Colors.earthBrown, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
  btnDisabled: { opacity: 0.6 },
});
