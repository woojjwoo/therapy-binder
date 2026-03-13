/**
 * Mood Trends Screen (Pro-gated)
 * - Bar chart of mood ratings over time
 * - Weekly and monthly view toggle
 * - Locked preview with upgrade CTA for free users
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
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { EmptyState } from '../../src/components/ui/EmptyState';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { Colors, moodColor } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { listSessions, decryptSession } from '../../src/storage/local';
import { useEntitlement } from '../../src/hooks/useEntitlement';
import { UpgradeModal } from '../../src/components/UpgradeModal';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

interface MoodPoint {
  id: string;
  moodScore: number;
  createdAt: string;
}

type ViewMode = 'weekly' | 'monthly';

function TrendsScreenInner() {
  const masterKey = useAuthStore((s) => s.masterKey);
  const { isPro } = useEntitlement();
  const [sessions, setSessions] = useState<MoodPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [showUpgrade, setShowUpgrade] = useState(false);

  const load = useCallback(async () => {
    if (!masterKey) return;
    setLoading(true);
    try {
      const rows = await listSessions();
      const decrypted = await Promise.all(
        rows.map(async (row) => {
          const result = await decryptSession(row, masterKey);
          if (!result) return null;
          return {
            id: result.id,
            moodScore: result.moodScore,
            createdAt: result.createdAt,
          } satisfies MoodPoint;
        })
      );
      setSessions(decrypted.filter((s): s is MoodPoint => s !== null));
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

  // Filter sessions by view mode
  const now = new Date();
  const cutoff = new Date();
  if (viewMode === 'weekly') {
    cutoff.setDate(now.getDate() - 7);
  } else {
    cutoff.setDate(now.getDate() - 30);
  }

  const filtered = sessions.filter((s) => new Date(s.createdAt) >= cutoff);
  const chartData = [...filtered].reverse(); // oldest first for chart

  const avgMood =
    chartData.length > 0
      ? (chartData.reduce((a, s) => a + s.moodScore, 0) / chartData.length).toFixed(1)
      : '--';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.subtitle}>Your mood over time</Text>
      </View>

      {!isPro ? (
        <View>
          {/* Teaser: mock chart dimmed with overlay */}
          <View style={styles.teaserWrapper}>
            {/* Mock bar chart */}
            <View style={styles.teaserChart}>
              <View style={styles.teaserToggleRow}>
                <View style={[styles.teaserToggleBtn, styles.teaserToggleBtnActive]}>
                  <Text style={styles.teaserToggleText}>Weekly</Text>
                </View>
                <View style={styles.teaserToggleBtn}>
                  <Text style={styles.teaserToggleText}>Monthly</Text>
                </View>
              </View>
              <View style={styles.teaserStatsRow}>
                {['Sessions', 'Avg Mood'].map((lbl) => (
                  <View key={lbl} style={styles.teaserStatCard}>
                    <View style={styles.teaserSkeleton} />
                    <Text style={styles.teaserStatLabel}>{lbl}</Text>
                  </View>
                ))}
              </View>
              {/* Mock bars */}
              <View style={styles.teaserBars}>
                {[60, 40, 80, 55, 70, 45, 90].map((h, i) => (
                  <View
                    key={i}
                    style={[styles.teaserBar, { height: h, backgroundColor: i % 2 === 0 ? Colors.sage : Colors.sageLight }]}
                  />
                ))}
              </View>
            </View>

            {/* Overlay */}
            <View style={styles.teaserOverlay}>
              <Ionicons name="lock-closed" size={32} color={Colors.white} />
              <Text style={styles.teaserOverlayTitle}>Unlock Mood Trends</Text>
              <Text style={styles.teaserOverlayMsg}>
                See how your mood evolves week by week and spot your patterns.
              </Text>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => setShowUpgrade(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            </View>
          </View>
          <UpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} />
        </View>
      ) : (
        <>
          {/* View mode toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'weekly' && styles.toggleBtnActive]}
              onPress={() => setViewMode('weekly')}
            >
              <Text style={[styles.toggleText, viewMode === 'weekly' && styles.toggleTextActive]}>
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]}
              onPress={() => setViewMode('monthly')}
            >
              <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{chartData.length}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{avgMood}</Text>
              <Text style={styles.statLabel}>Avg Mood</Text>
            </View>
          </View>

          {/* Bar chart */}
          {chartData.length === 0 ? (
            <View style={styles.emptyChart}>
              <EmptyState
                icon="bar-chart-outline"
                title="No mood data yet"
                message={`Log sessions to see your mood chart for the last ${viewMode === 'weekly' ? '7' : '30'} days.`}
                actionLabel="Log a Session"
                onAction={() => router.push('/new-session')}
              />
            </View>
          ) : (
            <MoodBarChart data={chartData} />
          )}

          {/* Legend */}
          <View style={styles.legend}>
            {[
              { color: Colors.terracotta, label: 'Rough (1\u20133)' },
              { color: Colors.blush, label: 'Okay (4\u20135)' },
              { color: Colors.sageLight, label: 'Good (6\u20137)' },
              { color: Colors.sage, label: 'Great (8\u201310)' },
            ].map(({ color, label }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function MoodBarChart({ data }: { data: MoodPoint[] }) {
  const W = 340;
  const H = 140;
  const maxBars = data.length;
  const barW = Math.min(28, (W - 16) / maxBars - 2);
  const gap = maxBars > 1 ? (W - 16 - barW * maxBars) / (maxBars - 1) : 0;

  return (
    <View style={styles.chartCard}>
      <Svg width={W} height={H + 30} viewBox={`0 0 ${W} ${H + 30}`}>
        {/* Baseline */}
        <Line x1="0" y1={H} x2={W} y2={H} stroke={Colors.border} strokeWidth="1" />

        {/* Grid lines */}
        {[2, 4, 6, 8, 10].map((v) => {
          const y = H - (v / 10) * H;
          return (
            <Line
              key={v}
              x1="0"
              y1={y}
              x2={W}
              y2={y}
              stroke={Colors.border}
              strokeWidth="0.5"
              strokeDasharray="4,4"
            />
          );
        })}

        {data.map((s, i) => {
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
                opacity={0.9}
              />
              {/* Score on top */}
              <SvgText
                x={x + barW / 2}
                y={y - 4}
                fontSize="9"
                fill={Colors.barkBrown}
                textAnchor="middle"
                fontFamily={Fonts.sans}
              >
                {s.moodScore}
              </SvgText>
              {/* Date label */}
              {(i % Math.max(1, Math.ceil(maxBars / 7)) === 0 || maxBars <= 10) && (
                <SvgText
                  x={x + barW / 2}
                  y={H + 18}
                  fontSize="8"
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
    </View>
  );
}

export default function TrendsScreen() {
  return (
    <ErrorBoundary>
      <TrendsScreenInner />
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

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.creamDark,
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.earthBrown,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  toggleText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
  },
  toggleTextActive: {
    fontFamily: Fonts.sansBold,
    color: Colors.earthBrown,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.earthBrown,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.xl,
    color: Colors.earthBrown,
  },
  statLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    marginTop: 2,
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
  emptyChart: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.barkBrown,
    textAlign: 'center',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 16,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
  },

  // Teaser (blurred mock preview for free users)
  teaserWrapper: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  teaserChart: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    opacity: 0.18,
  },
  teaserToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.creamDark,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  teaserToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  teaserToggleBtnActive: {
    backgroundColor: Colors.white,
  },
  teaserToggleText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
  },
  teaserStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  teaserStatCard: {
    flex: 1,
    backgroundColor: Colors.creamDark,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  teaserSkeleton: {
    width: 40,
    height: 24,
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
  teaserStatLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
  },
  teaserBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
    paddingHorizontal: 8,
  },
  teaserBar: {
    width: 28,
    borderRadius: 4,
  },
  teaserOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.accent + 'E0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 24,
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
});
