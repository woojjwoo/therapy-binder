/**
 * Patterns Screen
 * - Mood trend: last 7 session emojis
 * - Emotional river bar chart (mood over time, colored by score)
 * - Tag cluster cards (session count + avg mood per theme)
 * - Last 10 insight sentences as quotable lines
 * - Pro-gated: free users see locked state
 */

import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

import { Ionicons } from '@expo/vector-icons';

import { Colors, moodColor } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { listSessions, decryptSession } from '../../src/storage/local';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useEntitlement } from '../../src/hooks/useEntitlement';
import type { Block } from '../../src/models/block';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

interface SessionData {
  id: string;
  moodScore: number;
  createdAt: string;
  insight: string;
  tags: string[];
}

// ─── Mood Trend ──────────────────────────────────────────────────────────────

function MoodTrend({ sessions }: { sessions: SessionData[] }) {
  const recent = sessions.slice(0, 7);
  if (recent.length === 0) return null;

  return (
    <View style={styles.trendCard}>
      <Text style={styles.trendTitle}>Your recent mood</Text>
      <View style={styles.trendRow}>
        {recent.map((s) => (
          <View key={s.id} style={[styles.trendDot, { backgroundColor: moodColor(s.moodScore) }]} />
        ))}
      </View>
    </View>
  );
}

// ─── Emotional River Chart ────────────────────────────────────────────────────

function EmotionalRiver({ sessions }: { sessions: SessionData[] }) {
  const recent = sessions.slice(0, 30).reverse();
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

      <View style={styles.legend}>
        {[
          { color: Colors.terracotta, label: 'Low (1\u20133)' },
          { color: Colors.blush, label: 'Difficult (4\u20135)' },
          { color: Colors.sageLight, label: 'Good (6\u20137)' },
          { color: Colors.sage, label: 'Thriving (8\u201310)' },
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
          <Text style={styles.quoteMarker}>{'\u201C'}</Text>
          <Text style={styles.quoteText}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function PatternsScreenInner() {
  const masterKey = useAuthStore((s) => s.masterKey);
  const { isPro } = useEntitlement();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!masterKey) return;
    setLoading(true);
    try {
      const rows = await listSessions();
      const decrypted = await Promise.all(
        rows.map(async (row) => {
          const result = await decryptSession(row, masterKey);
          if (!result) return null;
          const insightBlock = result.blocks.find((b) => b.type === 'insight');
          return {
            id: result.id,
            moodScore: result.moodScore,
            createdAt: result.createdAt,
            insight:
              insightBlock && 'content' in insightBlock ? insightBlock.content : '',
            tags: result.tags,
          } satisfies SessionData;
        })
      );
      setSessions(decrypted.filter((s): s is SessionData => s !== null));
    } finally {
      setLoading(false);
    }
  }, [masterKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

      {!isPro ? (
        <View>
          {/* Teaser: mock patterns preview with overlay */}
          <View style={styles.teaserWrapper}>
            {/* Mock content */}
            <View style={styles.teaserContent}>
              {/* Mock mood dots */}
              <View style={styles.teaserCard}>
                <Text style={styles.teaserCardTitle}>Recent Mood</Text>
                <View style={styles.teaserDotRow}>
                  {[Colors.terracotta, Colors.blush, Colors.sage, Colors.sageLight, Colors.sage, Colors.sage, Colors.blush].map((c, i) => (
                    <View key={i} style={[styles.teaserDot, { backgroundColor: c }]} />
                  ))}
                </View>
              </View>
              {/* Mock tag clusters */}
              <View style={styles.teaserCard}>
                <Text style={styles.teaserCardTitle}>Tag Themes</Text>
                <View style={styles.teaserTagGrid}>
                  {['#anxiety', '#work', '#growth', '#relationships'].map((t) => (
                    <View key={t} style={styles.teaserTagChip}>
                      <Text style={styles.teaserTagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {/* Mock insight */}
              <View style={styles.teaserCard}>
                <Text style={styles.teaserCardTitle}>Recent Insights</Text>
                {['Explored childhood patterns.', 'Talked through work anxiety.'].map((ins, i) => (
                  <View key={i} style={styles.teaserQuote}>
                    <View style={styles.teaserSkeletonLine} />
                  </View>
                ))}
              </View>
            </View>

            {/* Overlay */}
            <View style={styles.teaserOverlay}>
              <Ionicons name="lock-closed" size={32} color={Colors.white} />
              <Text style={styles.teaserOverlayTitle}>Unlock Patterns</Text>
              <Text style={styles.teaserOverlayMsg}>
                See tag themes, emotional trends, and your most insightful moments.
              </Text>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => router.push('/paywall')}
                activeOpacity={0.85}
              >
                <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={'leaf-outline'}
            title="No patterns yet"
            message="Save a few sessions to start seeing patterns here."
          />
        </View>
      ) : (
        <>
          <MoodTrend sessions={sessions} />
          <EmotionalRiver sessions={sessions} />
          <TagClusters sessions={sessions} />
          <InsightQuotes sessions={sessions} />
        </>
      )}
    </ScrollView>
  );
}

export default function PatternsScreen() {
  return (
    <ErrorBoundary>
      <PatternsScreenInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
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

  // Teaser styles
  teaserWrapper: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  teaserContent: {
    opacity: 0.18,
    gap: 12,
  },
  teaserCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  teaserCardTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
  },
  teaserDotRow: {
    flexDirection: 'row',
    gap: 10,
  },
  teaserDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  teaserTagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teaserTagChip: {
    backgroundColor: Colors.creamDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  teaserTagText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
  },
  teaserQuote: {
    paddingVertical: 4,
  },
  teaserSkeletonLine: {
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 6,
    width: '80%',
  },
  teaserOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.accent + 'E8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 32,
    borderRadius: 16,
  },
  teaserOverlayTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.xl,
    color: Colors.white,
    textAlign: 'center',
  },
  teaserOverlayMsg: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.white + 'CC',
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeBtn: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginTop: 4,
  },
  upgradeBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.accent,
  },

  // Mood trend
  trendCard: {
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
  trendTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.lg,
    color: Colors.earthBrown,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  trendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trendDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  trendEmoji: {
    fontSize: 28,
  },

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

  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.lg,
    color: Colors.earthBrown,
    marginBottom: 12,
  },

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

  emptyContainer: {
    flex: 1,
    marginTop: 40,
  },
});
