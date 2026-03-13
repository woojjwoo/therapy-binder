/**
 * SampleSessionCard — ghost card shown to new users in the empty state.
 * Mirrors the real session card's visual style with a muted "SAMPLE" badge.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors, moodColor } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';

interface SampleSession {
  date: string;
  moodScore: number;
  moodLabel: string;
  insight: string;
  tags: string[];
}

const SAMPLES: SampleSession[] = [
  {
    date: 'Mar 10, 2026',
    moodScore: 4,
    moodLabel: 'Good',
    insight: 'Talked through the anxiety around work deadlines. Therapist helped me see the pattern.',
    tags: ['anxiety', 'work'],
  },
  {
    date: 'Mar 3, 2026',
    moodScore: 3,
    moodLabel: 'Okay',
    insight: 'Explored childhood patterns. Hard session but felt productive.',
    tags: ['patterns', 'growth'],
  },
];

function SampleCard({ session }: { session: SampleSession }) {
  const color = moodColor(session.moodScore);

  const handlePress = () => {
    Alert.alert('', 'Start your first session to see yours here');
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={[styles.moodStripe, { backgroundColor: color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardMeta}>
          <Text style={styles.date}>{session.date}</Text>
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleBadgeText}>SAMPLE</Text>
          </View>
        </View>
        <Text style={styles.insight} numberOfLines={2}>
          {session.insight}
        </Text>
        <View style={styles.chipRow}>
          {session.tags.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>#{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function SampleSessionCards() {
  return (
    <>
      {SAMPLES.map((s) => (
        <SampleCard key={s.date} session={s} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 12,
    opacity: 0.72,
  },
  moodStripe: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    letterSpacing: 0.5,
  },
  sampleBadge: {
    backgroundColor: Colors.creamDark,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sampleBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    color: Colors.barkBrown,
    letterSpacing: 0.8,
  },
  insight: {
    fontFamily: Fonts.serif,
    fontSize: FontSizes.lg,
    color: Colors.earthBrown,
    lineHeight: 26,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: Colors.creamDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.sage,
  },
});
