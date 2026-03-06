import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';

interface Props {
  value: string;
  onChange: (text: string) => void;
}

export function InsightInput({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>TODAY'S INSIGHT</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="One bold sentence about what you learned today..."
        placeholderTextColor={Colors.barkBrown + '80'}
        multiline
        maxLength={300}
        returnKeyType="done"
        blurOnSubmit
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 8,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  input: {
    fontFamily: Fonts.serif,
    fontSize: FontSizes.xl,
    color: Colors.earthBrown,
    lineHeight: 32,
    minHeight: 80,
  },
});
