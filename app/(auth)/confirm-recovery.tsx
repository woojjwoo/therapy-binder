import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { mnemonicToWords, pickChallengeIndices, verifyChallengeAnswers } from '../../src/crypto';

export default function ConfirmRecoveryScreen() {
  const { mnemonic, saltHex } = useAuthStore((s) => s.onboarding!);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const words = mnemonicToWords(mnemonic);

  const challengeIndices = useMemo(() => pickChallengeIndices(), []);

  const wordPool = useMemo(() => {
    const correct = challengeIndices.map((i) => words[i]);
    const decoys = words.filter((_, i) => !challengeIndices.includes(i)).sort(() => Math.random() - 0.5).slice(0, 9);
    return [...correct, ...decoys].sort(() => Math.random() - 0.5);
  }, []);

  const [selected, setSelected] = useState<string[]>([]);

  function tap(word: string) {
    if (selected.includes(word)) {
      setSelected(s => s.filter(w => w !== word));
    } else if (selected.length < 3) {
      setSelected(s => [...s, word]);
    }
  }

  async function handleConfirm() {
    if (!verifyChallengeAnswers(mnemonic, challengeIndices, selected)) {
      Alert.alert('Not quite right', 'Those words don\'t match. Go back and check your recovery key.', [{ text: 'Try again', onPress: () => setSelected([]) }]);
      return;
    }
    await completeOnboarding(saltHex);
    router.replace('/(main)/new-session');
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View>
          <Text style={s.title}>Confirm your key</Text>
          <Text style={s.subtitle}>
            Tap words{' '}
            {challengeIndices.map((idx, pos) => (
              <Text key={idx} style={s.bold}>#{idx + 1}{pos < 2 ? ', ' : ''}</Text>
            ))}
            {' '}in order.
          </Text>
        </View>

        <View style={s.slots}>
          {challengeIndices.map((idx, pos) => (
            <View key={idx} style={[s.slot, selected[pos] && s.slotFilled]}>
              <Text style={s.slotNum}>#{idx + 1}</Text>
              <Text style={s.slotWord}>{selected[pos] ?? ''}</Text>
            </View>
          ))}
        </View>

        <View style={s.pool}>
          {wordPool.map((word) => {
            const isSel = selected.includes(word);
            return (
              <Pressable key={word} style={[s.chip, isSel && s.chipSel]} onPress={() => tap(word)}>
                <Text style={[s.chipText, isSel && s.chipTextSel]}>{word}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={[s.btn, selected.length < 3 && s.disabled]} onPress={handleConfirm} disabled={selected.length < 3}>
          <Text style={s.btnText}>Confirm</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  container: { flex: 1, paddingHorizontal: 28, paddingVertical: 40, gap: 28 },
  title: { fontFamily: Fonts.serifBold, fontSize: 32, color: Colors.earthBrown },
  subtitle: { fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.barkBrown, marginTop: 8, lineHeight: 24 },
  bold: { fontFamily: Fonts.sansBold, color: Colors.earthBrown },
  slots: { flexDirection: 'row', gap: 10 },
  slot: { flex: 1, minHeight: 64, borderWidth: 2, borderColor: Colors.border, borderRadius: 12, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
  slotFilled: { borderStyle: 'solid', borderColor: Colors.earthBrown, backgroundColor: Colors.white },
  slotNum: { fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.barkBrown },
  slotWord: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.earthBrown },
  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  chipSel: { backgroundColor: Colors.earthBrown, borderColor: Colors.earthBrown },
  chipText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.earthBrown },
  chipTextSel: { color: Colors.white },
  btn: { marginTop: 'auto', backgroundColor: Colors.earthBrown, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
  disabled: { opacity: 0.4 },
});
