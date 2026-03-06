/**
 * Patterns Screen
 * - Emotional river bar chart (mood over time, colored by score)
 * - Tag cluster cards (session count + avg mood per theme)
 * - Last 10 insight sentences as quotable lines
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

import { Colors, moodColor } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { listSessions } from '../../src/storage/local';
import { decrypt } from '../../src/crypto/aes-gcm';
import type { Block } from '../../src/models/block';

interface SessionData {
  id: string;
  moodScore: number;
  createdAt: string;
  insight: string;
  tags: string[];
}

// ─── Emotional River Chart ────────────────────────────────────────────────────

function EmotionalRiver({ sessions }: { sessions: SessionData[] }) {
  const recent = sessions.slice(0, 30).reverse(); // oldest → newest
  if (recent.length === 0) return null;

  const W = 340;
  const H = 100;
  const barW = Math.min(20, (W - 16) / recent.length - 2);
  const gap = (W - 16 - barW * recent.length) / Math.max(recent.length - 1, 1);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Emotional River</Text>
      <Text style={styles.chartSub}>Last {recent.length} sessions</Text>
      <Svg width={W} height={H + 30} viewBox={`0 0 ${W} ${H + 30}`}>
        {/* Baseline */}
        <Line x1="0" y1={H} x2={W} y2={H} stroke={Colors.border} strokeWidth="1" />

        {recent.map((s, i) => {
          const barH = Math.max(8, (s.moodScore / 10) * H);
          const x = 8 + i * (barW + gap);
          const y = H - barH;
          const color = moodColor(s.moodScore);
          const label = new Date(s.createdAt).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          });
          return (
            <React.Fragment key={s.id}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill={color}
                opacity={0.85}
              />
              {i % Math.ceil(recent.length / 5) === 0 && (
                <SvgText
                  x={x + barW / 2}
                  y={H + 20}
                  fontSize="9"
                  fill={Colors.barkBrown}
                  textAnchor="middle"
                  fontFamily={Fonts.sans}
                >
                  {label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: Colors.terracotta, label: 'Low (1–3)' },
          { color: Colors.blush, label: 'Difficult (4–5)' },
          { color: Colors.sageLight, label: 'Good (6–7)' },
          { color: Colors.sage, label: 'Thriving (8–10)' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Tag Clusters ─────────────────────────────────────────────────────────────

interface TagCluster {
  tag: string;
  count: number;
  avgMood: number;
}

function TagClusters({ sessions }: { sessions: SessionData[] }) {
  const clusters = buildTagClusters(sessions);
  if (clusters.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tag Themes</Text>
      <View style={styles.clusterGrid}>
        {clusters.slice(0, 8).map((c) => {
          const color = moodColor(c.avgMood);
          return (
            <View key={c.tag} style={[styles.clusterCard, { borderLeftColor: color }]}>
              <Text style={styles.clusterTag}>#{c.tag}</Text>
              <Text style={styles.clusterCount}>{c.count} sessions</Text>
              <View style={[styles.clusterMoodBadge, { backgroundColor: color }]}>
                <Text style={styles.clusterMoodText}>avg {c.avgMood.toFixed(1)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function buildTagClusters(sessions: SessionData[]): TagCluster[] {
  const map: Record<string, { total: number; count: number }> = {};
  for (const s of sessions) {
    for (const tag of s.tags) {
      if (!map[tag]) map[tag] = { total: 0, count: 0 };
      map[tag].total += s.moodScore;
      map[tag].count += 1;
    }
  }
  return Object.entries(map)
    .map(([tag, { total, count }]) => ({
      tag,
      count,
      avgMood: total / count,
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── Insight Quotes ───────────────────────────────────────────────────────────

function InsightQuotes({ sessions }: { sessions: SessionData[] }) {
  const insights = sessions
    .slice(0, 10)
    .map((s) => s.insight)
    .filter(Boolean);
  if (insights.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Insights</Text>
      {insights.map((insight, i) => (
        <View key={i} style={styles.quoteCard}>
          <Text style={styles.quoteMarker}>"</Text>
          <Text style={styles.quoteText}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PatternsScreen() {
  const masterKey = useAuthStore((s) => s.masterKey);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!masterKey) return;
    setLoading(true);
    try {
      const rows = await listSessions();
      const decrypted = await Promise.all(
        rows.map(async (row) => {
          const plain = await decrypt(
            { ciphertext: row.ciphertext, iv: row.iv, version: row.schema_ver },
            masterKey
          );
          if (!plain) return null;
          const data = JSON.parse(plain);
          const blocks: Block[] = data.blocks ?? [];
          const insightBlock = blocks.find((b) => b.type === 'insight');
          return {
            id: row.id,
            moodScore: row.mood_score,
            createdAt: row.created_at,
            insight:
              insightBlock && 'content' in insightBlock ? insightBlock.content : '',
            tags: data.tags ?? [],
          } satisfies SessionData;
        })
      );
      setSessions(decrypted.filter((s): s is SessionData => s !== null));
    } finally {
      setLoading(false);
    }
  }, [masterKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.earthBrown} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Patterns</Text>
        <Text style={styles.subtitle}>Your emotional landscape over time</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyText}>
            Save a few sessions to start seeing patterns here.
          </Text>
        </View>
      ) : (
        <>
          <EmotionalRiver sessions={sessions} />
          <TagClusters sessions={sessions} />
          <InsightQuotes sessions={sessions} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.xxl,
    color: Colors.earthBrown,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
    marginTop: 4,
  },

  // Chart
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.earthBrown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.lg,
    color: Colors.earthBrown,
    alignSelf: 'flex-start',
  },
  chartSub: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
  },

  // Sections
  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.lg,
    color: Colors.earthBrown,
    marginBottom: 12,
  },

  // Tag clusters
  clusterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  clusterCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 12,
    minWidth: '45%',
    flex: 1,
    gap: 4,
    shadowColor: Colors.earthBrown,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  clusterTag: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
  },
  clusterCount: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
  },
  clusterMoodBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  clusterMoodText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.xs,
    color: Colors.white,
  },

  // Quotes
  quoteCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
    shadowColor: Colors.earthBrown,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quoteMarker: {
    fontFamily: Fonts.serifBold,
    fontSize: 40,
    color: Colors.border,
    lineHeight: 40,
    marginTop: -4,
  },
  quoteText: {
    flex: 1,
    fontFamily: Fonts.serif,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // Empty
  empty: {
    margin: 20,
    padding: 40,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.barkBrown,
    textAlign: 'center',
    lineHeight: 22,
  },
});
