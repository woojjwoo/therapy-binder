/**
 * Timeline Screen — chronological feed of session cards.
 * Uses the session store for decrypted data management.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  type ListRenderItem,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Colors, moodColor } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { useSessionStore, type SessionCard } from '../../src/stores/session-store';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

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

  const renderCard: ListRenderItem<SessionCard> = ({ item }) => {
    const color = moodColor(item.moodScore);
    const date = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/session/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={[styles.moodStripe, { backgroundColor: color }]} />
        <View style={styles.cardContent}>
          <Text style={styles.date}>{date}</Text>
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
            icon={'\uD83D\uDCD4'}
            title="Your therapy journey starts here"
            message="Log your first session after therapy to start tracking your progress and patterns."
            actionLabel="Log Your First Session"
            onAction={() => router.push('/new-session')}
          />
        )
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
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
    backgroundColor: Colors.earthBrown,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.earthBrown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  moodStripe: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  date: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    letterSpacing: 0.5,
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
