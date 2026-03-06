import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import zxcvbn from 'zxcvbn';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  showStrength?: boolean;
  placeholder?: string;
}

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const STRENGTH_COLORS = [
  Colors.terracotta,
  Colors.terracotta,
  Colors.blush,
  Colors.sageLight,
  Colors.sage,
];

export function PassphraseInput({
  value,
  onChange,
  label = 'Passphrase',
  showStrength = true,
  placeholder = 'Enter passphrase...',
}: Props) {
  const [visible, setVisible] = useState(false);
  const result = showStrength && value ? zxcvbn(value) : null;
  const score = result?.score ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.barkBrown + '60'}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setVisible((v) => !v)} style={styles.eye}>
          <Text style={styles.eyeIcon}>{visible ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>

      {showStrength && value.length > 0 && (
        <View style={styles.strength}>
          <View style={styles.bars}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    backgroundColor:
                      i <= score ? STRENGTH_COLORS[score] : Colors.border,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[score] }]}>
            {STRENGTH_LABELS[score]}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    letterSpacing: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
    paddingVertical: 14,
  },
  eye: { padding: 8 },
  eyeIcon: { fontSize: 18 },
  strength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    width: 80,
    textAlign: 'right',
  },
});
