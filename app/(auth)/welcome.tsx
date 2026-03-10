import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';

const PROPS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'lock-closed-outline', text: 'Your notes stay on your device' },
  { icon: 'mic-outline', text: 'Voice, notes, and insights in one place' },
  { icon: 'trending-up-outline', text: 'Find patterns across your therapy journey' },
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
              <Ionicons name={p.icon} size={22} color={Colors.accent} />
              <Text style={s.propText}>{p.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={s.btn}
          onPress={() => router.push('/(auth)/create-passphrase')}
        >
          <Text style={s.btnText}>Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 40, justifyContent: 'space-between' },
  hero: { marginTop: 16, gap: 12 },
  title: { fontFamily: Fonts.serifBold, fontSize: 40, color: Colors.accent, lineHeight: 48 },
  subtitle: { fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 24 },
  props: { gap: 20 },
  propRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  propText: { flex: 1, fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.accent, lineHeight: 24 },
  btn: { backgroundColor: Colors.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
});
