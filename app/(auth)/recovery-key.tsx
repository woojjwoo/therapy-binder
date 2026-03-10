import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { mnemonicToWords } from '../../src/crypto';

export default function RecoveryKeyScreen() {
  const mnemonic = useAuthStore((s) => s.onboarding?.mnemonic ?? '');
  const words = mnemonicToWords(mnemonic);
  const [acked, setAcked] = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} bounces={false}>
        <View style={s.header}>
          <Text style={s.title}>Your Recovery Key</Text>
          <View style={s.warning}>
            <Text style={s.warnTitle}>Write this down now</Text>
            <Text style={s.warnText}>
              These 24 words are the only way to recover your data if you forget your passphrase. We cannot recover them for you. If you lose this, your data is gone forever.
            </Text>
          </View>
        </View>

        <View style={s.grid}>
          {words.map((word, i) => (
            <View key={i} style={s.wordCell}>
              <Text style={s.wordNum}>{i + 1}</Text>
              <Text style={s.word}>{word}</Text>
            </View>
          ))}
        </View>

        <Pressable style={s.checkRow} onPress={() => setAcked(a => !a)}>
          <View style={[s.checkbox, acked && s.checked]}>
            {acked && <Text style={s.tick}>✓</Text>}
          </View>
          <Text style={s.checkLabel}>I've written down all 24 words in order and stored them safely.</Text>
        </Pressable>

        <Pressable style={[s.btn, !acked && s.disabled]} onPress={() => router.push('/(auth)/confirm-recovery')} disabled={!acked}>
          <Text style={s.btnText}>I've saved my recovery key</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  container: { paddingHorizontal: 28, paddingVertical: 40, gap: 28 },
  header: { gap: 16 },
  title: { fontFamily: Fonts.serifBold, fontSize: 32, color: Colors.earthBrown },
  warning: { backgroundColor: '#FDF0EA', borderLeftWidth: 4, borderLeftColor: Colors.destructive, borderRadius: 10, padding: 16, gap: 8 },
  warnTitle: { fontFamily: Fonts.sansBold, fontSize: FontSizes.sm, color: Colors.terracotta },
  warnText: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.earthBrown, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordCell: { width: '23%', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 8, alignItems: 'center', gap: 2 },
  wordNum: { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.barkBrown },
  word: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.earthBrown, textAlign: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: Colors.earthBrown, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checked: { backgroundColor: Colors.earthBrown },
  tick: { color: Colors.white, fontSize: 13, fontWeight: 'bold' },
  checkLabel: { flex: 1, fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.earthBrown, lineHeight: 20 },
  btn: { backgroundColor: Colors.earthBrown, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
  disabled: { opacity: 0.4 },
});
