import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';

const PROPS = [
  { icon: '🔒', text: 'Zero-knowledge — we never see your words' },
  { icon: '🎙️', text: 'Voice, notes, and insights in one place' },
  { icon: '📈', text: 'Find patterns across your therapy journey' },
];

export default function WelcomeScreen() {
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

        <View style={s.footer}>
          <Pressable style={s.btn} onPress={() => router.push('/(auth)/create-passphrase')}>
            <Text style={s.btnText}>Get Started</Text>
          </Pressable>
          <Text style={s.trial}>Free for 14 days · $4.99/month · Cancel anytime</Text>
        </View>
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
  footer: { gap: 12 },
  btn: { backgroundColor: Colors.earthBrown, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
  trial: { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.barkBrown, textAlign: 'center' },
});
