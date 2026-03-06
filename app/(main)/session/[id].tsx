/**
 * Session Detail Screen
 * - Full block display with voice player
 * - Readable notes, tappable action items
 * - Mood visualization stripe
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, moodColor } from '../../../src/theme/colors';
import { Fonts, FontSizes } from '../../../src/theme/typography';
import { useAuthStore } from '../../../src/stores/auth-store';
import { getSession, deleteSession } from '../../../src/storage/local';
import { decrypt } from '../../../src/crypto/aes-gcm';
import { VoicePlayer } from '../../../src/components/blocks/VoicePlayer';
import type { Block } from '../../../src/models/block';

interface ParsedSession {
  moodScore: number;
  createdAt: string;
  blocks: Block[];
  tags: string[];
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const masterKey = useAuthStore((s) => s.masterKey);
  const [session, setSession] = useState<ParsedSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!masterKey || !id) return;
      const row = await getSession(id);
      if (!row) { setLoading(false); return; }

      const plain = await decrypt(
        { ciphertext: row.ciphertext, iv: row.iv, version: row.schema_ver },
        masterKey
      );
      if (!plain) { setLoading(false); return; }
      const data = JSON.parse(plain);
      setSession({
        moodScore: row.mood_score,
        createdAt: row.created_at,
        blocks: data.blocks ?? [],
        tags: data.tags ?? [],
      });
      setLoading(false);
    })();
  }, [id, masterKey]);

  const handleDelete = () => {
    Alert.alert('Delete session', 'Remove this session permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) await deleteSession(id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.earthBrown} /></View>;
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Session not found or could not be decrypted.</Text>
      </View>
    );
  }

  const color = moodColor(session.moodScore);
  const date = new Date(session.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const insightBlock = session.blocks.find((b) => b.type === 'insight');
  const otherBlocks = session.blocks
    .filter((b) => b.type !== 'insight')
    .sort((a, b) => a.order - b.order);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.moodBanner, { backgroundColor: color + '20' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.moodRow}>
          <View style={[styles.moodDot, { backgroundColor: color }]} />
          <Text style={styles.moodLabel}>{session.moodScore}/10</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>

      {/* Insight */}
      {insightBlock && 'content' in insightBlock && (
        <View style={styles.insightBlock}>
          <Text style={styles.insightText}>"{insightBlock.content}"</Text>
        </View>
      )}

      {/* Tags */}
      {session.tags.length > 0 && (
        <View style={styles.tagRow}>
          {session.tags.map((t) => (
            <View key={t} style={[styles.tag, { borderColor: color }]}>
              <Text style={[styles.tagText, { color }]}>#{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Other blocks */}
      {otherBlocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Delete Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return (
        <View style={styles.blockCard}>
          <Text style={styles.blockTypeLabel}>NOTES</Text>
          <Text style={styles.blockText}>{block.content}</Text>
        </View>
      );
    case 'action':
      return (
        <View style={styles.blockCard}>
          <Text style={styles.blockTypeLabel}>ACTION</Text>
          <View style={styles.actionRow}>
            <Text style={styles.actionCheck}>{block.completed ? '✅' : '⬜️'}</Text>
            <Text style={[styles.blockText, block.completed && styles.strikethrough]}>
              {block.content}
            </Text>
          </View>
        </View>
      );
    case 'voice':
      return (
        <View style={styles.blockCard}>
          <Text style={styles.blockTypeLabel}>VOICE MEMO</Text>
          <VoicePlayer
            localUri={block.localUri}
            durationMs={block.durationMs}
            label={block.label}
          />
        </View>
      );
    case 'image':
      return (
        <View style={styles.blockCard}>
          <Text style={styles.blockTypeLabel}>PHOTO</Text>
          <Text style={styles.blockText}>{block.caption ?? '(no caption)'}</Text>
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.barkBrown },

  moodBanner: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: { marginBottom: 12 },
  back: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  moodLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
  },
  date: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
    flex: 1,
    textAlign: 'right',
  },

  insightBlock: {
    margin: 20,
    marginBottom: 12,
  },
  insightText: {
    fontFamily: Fonts.serif,
    fontSize: FontSizes.xl,
    color: Colors.earthBrown,
    lineHeight: 32,
    fontStyle: 'italic',
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tag: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tagText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
  },

  blockCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: Colors.earthBrown,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  blockTypeLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    letterSpacing: 1.5,
  },
  blockText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionCheck: { fontSize: 18 },
  strikethrough: { textDecorationLine: 'line-through', opacity: 0.5 },

  deleteBtn: {
    margin: 20,
    alignItems: 'center',
    paddingVertical: 14,
  },
  deleteBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.terracotta,
  },
});
