import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, moodColor } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';

interface Props {
  value: number;
  onChange: (score: number) => void;
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Very low', 2: 'Low', 3: 'Struggling',
  4: 'Difficult', 5: 'Neutral',
  6: 'Okay', 7: 'Good',
  8: 'Great', 9: 'Excellent', 10: 'Thriving',
};

export function MoodSlider({ value, onChange }: Props) {
  const color = moodColor(value);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>MOOD</Text>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{value} · {MOOD_LABELS[value]}</Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumTrackTintColor={color}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={color}
      />
      <View style={styles.ticks}>
        <Text style={styles.tick}>1</Text>
        <Text style={styles.tick}>5</Text>
        <Text style={styles.tick}>10</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    letterSpacing: 1.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.white,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  tick: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown + '80',
  },
});
