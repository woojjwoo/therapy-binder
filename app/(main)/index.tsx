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
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Colors, moodColor } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { useSessionStore, type SessionCard } from '../../src/stores/session-store';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

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
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (masterKey) loadTimeline(masterKey);
    }, [masterKey])
  );

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
          placeholder="Search your sessions..."
          placeholderTextColor={Colors.barkBrown + '60'}
          clearButtonMode="while-editing"
        />
      </View>

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
          <EmptyState
            icon={'book-outline'}
            title="Your therapy journey starts here"
            message="Log your first session after therapy to start tracking your progress and patterns."
            actionLabel="Log Your First Session"
            onAction={() => router.push('/new-session')}
          />
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
});
