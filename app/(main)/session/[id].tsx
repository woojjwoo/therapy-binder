/**
 * Session Detail Screen
 * - Full block display with voice player
 * - Readable notes, tappable action items
 * - Mood visualization stripe
 * - Uses session store for load + delete
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
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
import { useSessionStore } from '../../../src/stores/session-store';
import { VoicePlayer } from '../../../src/components/blocks/VoicePlayer';
import { Card } from '../../../src/components/ui/Card';
import type { Block } from '../../../src/models/block';

const MOOD_EMOJI_MAP: Record<number, string> = {
  1: '\uD83D\uDE1E',
  2: '\uD83D\uDE15',
  3: '\uD83D\uDE10',
  4: '\uD83D\uDE42',
  5: '\uD83D\uDE04',
};

function scoreToEmoji(score: number): string {
  const mapped = Math.max(1, Math.min(5, Math.round(score / 2)));
  return MOOD_EMOJI_MAP[mapped] ?? '\uD83D\uDE10';
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const masterKey = useAuthStore((s) => s.masterKey);
  const { currentSession: session, currentLoading: loading, loadSession, removeSession, clearCurrent } = useSessionStore();

  useEffect(() => {
    if (masterKey && id) loadSession(id, masterKey);
    return () => clearCurrent();
  }, [id, masterKey]);

  const handleDelete = () => {
    Alert.alert('Delete session', 'Remove this session permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await removeSession(id);
            router.back();
          }
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
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.back}>{'\u2039'} Back</Text>
        </TouchableOpacity>
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
      {/* Mood banner */}
      <View style={[styles.moodBanner, { backgroundColor: color + '20' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.back}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <View style={styles.moodRow}>
          <Text style={styles.moodEmoji}>{scoreToEmoji(session.moodScore)}</Text>
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

      {/* Edit */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push(`/session/edit-${id}`)}
        activeOpacity={0.8}
      >
        <Text style={styles.editBtnText}>Edit Session</Text>
      </TouchableOpacity>

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
        <Card style={styles.blockCard}>
          <Text style={styles.blockTypeLabel}>NOTES</Text>
          <Text style={styles.blockText}>{block.content}</Text>
        </Card>
      );
    case 'action':
      return (
        <Card style={styles.blockCard}>
          <Text style={styles.blockTypeLabel}>ACTION</Text>
          <View style={styles.actionRow}>
            <Text style={styles.actionCheck}>{block.completed ? '\u2705' : '\u2B1C\uFE0F'}</Text>
            <Text style={[styles.blockText, block.completed && styles.strikethrough]}>
              {block.content}
            </Text>
          </View>
        </Card>
      );
    case 'voice':
      return (
        <Card style={styles.blockCard}>
          <Text style={styles.blockTypeLabel}>VOICE MEMO</Text>
          <VoicePlayer
            localUri={block.localUri}
            durationMs={block.durationMs}
            label={block.label}
          />
        </Card>
      );
    case 'image':
      return (
        <Card style={styles.blockCard}>
          <Text style={styles.blockTypeLabel}>PHOTO</Text>
          {block.localUri && block.localUri !== '[local-ref]' ? (
            <Image
              source={{ uri: block.localUri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : null}
          {block.caption ? (
            <Text style={styles.blockText}>{block.caption}</Text>
          ) : null}
        </Card>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
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
  moodEmoji: {
    fontSize: 24,
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
    gap: 8,
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
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },

  editBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.earthBrown,
    borderRadius: 30,
  },
  editBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
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
