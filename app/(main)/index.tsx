/**
 * Timeline Screen — chronological feed of session cards.
 * Searches only decrypted local data.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { router } from 'expo-router';

import { Colors, moodColor } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { listSessions } from '../../src/storage/local';
import { decrypt } from '../../src/crypto/aes-gcm';
import type { StoredSession } from '../../src/storage/local';
import type { Block } from '../../src/models/block';

interface DecryptedCard {
  id: string;
  moodScore: number;
  createdAt: string;
  insight: string;
  blockTypes: string[];
  tags: string[];
}

export default function TimelineScreen() {
  const masterKey = useAuthStore((s) => s.masterKey);
  const [cards, setCards] = useState<DecryptedCard[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    if (!masterKey) return;
    setLoading(true);
    try {
      const rows = await listSessions();
      const decrypted = await Promise.all(
        rows.map(async (row): Promise<DecryptedCard | null> => {
          const plaintext = await decrypt(
            { ciphertext: row.ciphertext, iv: row.iv, version: row.schema_ver },
            masterKey
          );
          if (!plaintext) return null;
          const data = JSON.parse(plaintext);
          const blocks: Block[] = data.blocks ?? [];
          const insightBlock = blocks.find((b) => b.type === 'insight');
          return {
            id: row.id,
            moodScore: row.mood_score,
            createdAt: row.created_at,
            insight:
              insightBlock && 'content' in insightBlock
                ? insightBlock.content
                : '(no insight)',
            blockTypes: [...new Set(blocks.map((b) => b.type).filter((t) => t !== 'insight'))],
            tags: data.tags ?? [],
          };
        })
      );
      setCards(decrypted.filter((c): c is DecryptedCard => c !== null));
    } finally {
      setLoading(false);
    }
  }, [masterKey]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filtered = query.trim()
    ? cards.filter(
        (c) =>
          c.insight.toLowerCase().includes(query.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : cards;

  const renderCard: ListRenderItem<DecryptedCard> = ({ item }) => {
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
        {/* Mood stripe */}
        <View style={[styles.moodStripe, { backgroundColor: color }]} />

        <View style={styles.cardContent}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.insight} numberOfLines={2}>
            {item.insight}
          </Text>

          {/* Block type chips */}
          {item.blockTypes.length > 0 && (
            <View style={styles.chipRow}>
              {item.blockTypes.map((t) => (
                <View key={t} style={styles.chip}>
                  <Text style={styles.chipText}>{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
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
      {loading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {query ? 'No matching sessions.' : 'No sessions yet.\nTap + New to start.'}
          </Text>
        </View>
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
