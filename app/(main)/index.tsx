/**
 * Timeline Screen — chronological feed of session cards.
 * Uses the session store for decrypted data management.
 * Groups sessions by relative date: Today, Yesterday, This Week, Earlier.
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

import { Colors, moodColor } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { useSessionStore, type SessionCard, SCREENSHOT_SEED_CARDS } from '../../src/stores/session-store';

const SCREENSHOT_MODE = false; // Set false before production build
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { SampleSessionCards } from '../../src/components/SampleSessionCard';
import { useEntitlement, FREE_SESSION_LIMIT } from '../../src/hooks/useEntitlement';

const CONVERSION_BANNER_DISMISSED_KEY = 'tb_conversion_banner_dismissed';
const CONVERSION_TRIGGER_COUNT = 8;

// ─── Conversion Banner ───────────────────────────────────────────────────────

function ConversionBanner({ sessionCount, onDismiss, onUpgrade }: {
  sessionCount: number;
  onDismiss: () => void;
  onUpgrade: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[bannerStyles.container, { opacity }]}>
      <View style={bannerStyles.textWrap}>
        <Text style={bannerStyles.text}>
          You've used {sessionCount} of {FREE_SESSION_LIMIT} free sessions.
        </Text>
        <TouchableOpacity onPress={onUpgrade}>
          <Text style={bannerStyles.cta}>Upgrade to Pro for unlimited journaling →</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={bannerStyles.dismiss}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFF8EE',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8C980',
    gap: 8,
  },
  textWrap: { flex: 1, gap: 2 },
  text: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#5C4A1A',
  },
  cta: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: '#2D4A3E',
  },
  dismiss: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#6B6B6B',
  },
});

type SessionSection = {
  title: string;
  data: SessionCard[];
};

function getRelativeDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'This Week';
  return 'Earlier';
}

function groupSessionsByDate(sessions: SessionCard[]): SessionSection[] {
  const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  const groups: Record<string, SessionCard[]> = {};

  for (const session of sessions) {
    const group = getRelativeDateGroup(session.createdAt);
    if (!groups[group]) groups[group] = [];
    groups[group].push(session);
  }

  return order
    .filter((key) => groups[key]?.length)
    .map((key) => ({ title: key, data: groups[key] }));
}

function estimateWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function TimelineScreenInner() {
  const masterKey = useAuthStore((s) => s.masterKey);
  const { cards, loading, searchResults, searching, loadTimeline, searchTimeline, clearSearch } = useSessionStore();
  const { isPro, sessionCount } = useEntitlement();
  const [query, setQuery] = useState('');
  const [showConversionBanner, setShowConversionBanner] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (SCREENSHOT_MODE) {
        useSessionStore.setState({ cards: SCREENSHOT_SEED_CARDS, loading: false });
      } else if (masterKey) {
        loadTimeline(masterKey);
      }
    }, [masterKey])
  );

  // Conversion banner: show at 8 sessions for free users
  useEffect(() => {
    if (isPro || sessionCount < CONVERSION_TRIGGER_COUNT) return;
    AsyncStorage.getItem(CONVERSION_BANNER_DISMISSED_KEY).then((val) => {
      if (!val) setShowConversionBanner(true);
    });
  }, [isPro, sessionCount]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      clearSearch();
      return;
    }
    debounceRef.current = setTimeout(() => {
      if (masterKey) searchTimeline(trimmed, masterKey);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, masterKey]);

  const filtered = query.trim() ? (searchResults ?? []) : cards;

  const sections = useMemo(() => groupSessionsByDate(filtered), [filtered]);

  const renderCard = ({ item }: { item: SessionCard }) => {
    const color = moodColor(item.moodScore);
    const date = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const wordCount = estimateWordCount(item.insight);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/session/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.moodStripe, { backgroundColor: color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardMeta}>
            <Text style={styles.date}>{date}</Text>
            {wordCount > 0 && (
              <Text style={styles.wordCount}>{wordCount} words</Text>
            )}
          </View>
          <Text style={styles.insight} numberOfLines={2}>
            {item.insight}
          </Text>

          {item.blockTypes.length > 0 && (
            <View style={styles.chipRow}>
              {item.blockTypes.map((t) => (
                <View key={t} style={styles.chip}>
                  <Text style={styles.chipText}>{t}</Text>
                </View>
              ))}
            </View>
          )}

          {item.tags.length > 0 && (
            <Text style={styles.tags}>{item.tags.map((t) => `#${t}`).join(' ')}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: SessionSection }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/new-session')}
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by mood, tag, or insight..."
          placeholderTextColor={Colors.barkBrown + '60'}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Conversion banner */}
      {showConversionBanner && !isPro && (
        <ConversionBanner
          sessionCount={sessionCount}
          onDismiss={async () => {
            await AsyncStorage.setItem(CONVERSION_BANNER_DISMISSED_KEY, 'true');
            setShowConversionBanner(false);
          }}
          onUpgrade={() => {
            router.push('/paywall');
          }}
        />
      )}

      {/* List */}
      {loading || searching ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.earthBrown} />
        </View>
      ) : filtered.length === 0 ? (
        query ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No matching sessions.</Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyHeading}>Your therapy journey starts here</Text>
            <Text style={styles.emptySubtext}>Here's what your sessions will look like:</Text>
            <SampleSessionCards />
            <TouchableOpacity
              style={styles.firstSessionBtn}
              onPress={() => router.push('/new-session')}
              activeOpacity={0.85}
            >
              <Text style={styles.firstSessionBtnText}>Add your first session →</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

export default function TimelineScreen() {
  return (
    <ErrorBoundary>
      <TimelineScreenInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.xxl,
    color: Colors.earthBrown,
  },
  newButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newButtonText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    color: Colors.white,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  search: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 12,
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
  wordCount: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown + '80',
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
    color: Colors.barkBrown,
  },
  tags: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.sage,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.barkBrown,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  emptyHeading: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.lg,
    color: Colors.earthBrown,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
    textAlign: 'center',
    marginBottom: 16,
  },
  firstSessionBtn: {
    backgroundColor: Colors.earthBrown,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  firstSessionBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
});
