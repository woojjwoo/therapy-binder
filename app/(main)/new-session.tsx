/**
 * New Session Screen — the heart of the product.
 *
 * Layout:
 *   - Large serif insight input (top)
 *   - Add-block buttons row
 *   - Draggable block cards
 *   - Mood emoji selector (1-5)
 *   - Tag chips
 *   - Save button (encrypts text content via saveEncryptedSession)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';

import { VoiceRecorderModal } from '../../src/components/blocks/VoiceRecorderModal';
import { InsightInput } from '../../src/components/blocks/InsightInput';
import { AddBlockBar } from '../../src/components/blocks/AddBlockBar';
import { BlockCard } from '../../src/components/blocks/BlockCard';
import { TagChips } from '../../src/components/blocks/TagChips';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';

import { useAuthStore } from '../../src/stores/auth-store';
import { useSessionStore } from '../../src/stores/session-store';
import { useEntitlement } from '../../src/hooks/useEntitlement';
import type { Block, BlockType, VoiceBlock, ImageBlock } from '../../src/models/block';
import type { SessionEntry } from '../../src/models/session';

const MOOD_EMOJIS = [
  { score: 1, emoji: '\uD83D\uDE1E', label: 'Rough' },
  { score: 2, emoji: '\uD83D\uDE15', label: 'Low' },
  { score: 3, emoji: '\uD83D\uDE10', label: 'Okay' },
  { score: 4, emoji: '\uD83D\uDE42', label: 'Good' },
  { score: 5, emoji: '\uD83D\uDE04', label: 'Great' },
] as const;

export default function NewSessionScreen() {
  const masterKey = useAuthStore((s) => s.masterKey);
  const { saveSession } = useSessionStore();
  const { canAddSession } = useEntitlement();

  // Redirect to paywall if free limit reached
  useEffect(() => {
    if (!canAddSession) {
      router.replace('/paywall');
    }
  }, [canAddSession]);

  const [insight, setInsight] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // ─── Add block ──────────────────────────────────────────────────────────────

  const addBlock = useCallback(
    async (type: Exclude<BlockType, 'insight'>) => {
      const id = Crypto.randomUUID();
      const order = blocks.length;

      if (type === 'image') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        setBlocks((prev) => [
          ...prev,
          { id, type: 'image', order, localUri: asset.uri } satisfies ImageBlock,
        ]);
        return;
      }

      if (type === 'voice') {
        setShowVoiceRecorder(true);
        return;
      }

      const newBlock: Block =
        type === 'text'
          ? { id, type: 'text', order, content: '' }
          : { id, type: 'action', order, content: '', completed: false };

      setBlocks((prev) => [...prev, newBlock]);
    },
    [blocks]
  );

  // ─── Update / delete block ──────────────────────────────────────────────────

  const updateBlock = useCallback((updated: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const onDragEnd = useCallback(({ data }: { data: Block[] }) => {
    setBlocks(data.map((b, i) => ({ ...b, order: i })));
  }, []);

  // ─── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!masterKey) {
      Alert.alert('Locked', 'App is locked. Please re-enter your passphrase.');
      return;
    }
    if (!insight.trim()) {
      Alert.alert('Missing insight', 'Add your one-sentence insight before saving.');
      return;
    }
    if (moodScore === null) {
      Alert.alert('Missing mood', 'Select how you feel before saving.');
      return;
    }

    setSaving(true);
    try {
      const sessionId = Crypto.randomUUID();
      const now = new Date().toISOString();

      const insightBlock: Block = {
        id: Crypto.randomUUID(),
        type: 'insight',
        order: -1,
        content: insight.trim(),
      };
      const allBlocks = [insightBlock, ...blocks];

      const session: SessionEntry = {
        id: sessionId,
        blocks: allBlocks,
        moodScore,
        tags,
        createdAt: now,
        updatedAt: now,
      };

      await saveSession(session, masterKey);
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to save session. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const renderBlock = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Block>) => (
      <BlockCard
        block={item}
        onDelete={deleteBlock}
        onUpdate={updateBlock}
        drag={drag}
        isActive={isActive}
      />
    ),
    [deleteBlock, updateBlock]
  );

  const handleVoiceSave = useCallback((voiceBlock: VoiceBlock) => {
    setBlocks((prev) => [...prev, { ...voiceBlock, order: prev.length }]);
    setShowVoiceRecorder(false);
  }, []);

  const selectedMood = MOOD_EMOJIS.find((m) => m.score === moodScore);

  return (
    <GestureHandlerRootView style={styles.root}>
      <VoiceRecorderModal
        visible={showVoiceRecorder}
        onSave={handleVoiceSave}
        onCancel={() => setShowVoiceRecorder(false)}
        blockOrder={blocks.length}
      />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Session</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.save, saving && styles.saveDim]}>
              {saving ? 'Saving\u2026' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Insight input */}
        <InsightInput value={insight} onChange={setInsight} />

        {/* Add-block buttons */}
        <AddBlockBar onAdd={addBlock} />

        {/* Draggable blocks */}
        <DraggableFlatList
          data={blocks}
          keyExtractor={(item) => item.id}
          renderItem={renderBlock}
          onDragEnd={onDragEnd}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <View>
              {/* Mood emoji selector */}
              <View style={styles.moodSection}>
                <Text style={styles.moodTitle}>How do you feel?</Text>
                <View style={styles.moodRow}>
                  {MOOD_EMOJIS.map((m) => (
                    <TouchableOpacity
                      key={m.score}
                      style={[
                        styles.moodBtn,
                        moodScore === m.score && styles.moodBtnSelected,
                      ]}
                      onPress={() => setMoodScore(m.score)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedMood && (
                  <Text style={styles.moodLabel}>{selectedMood.label}</Text>
                )}
              </View>

              <TagChips selected={tags} onChange={setTags} />
              <View style={styles.saveFooter}>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDim]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Encrypting & saving\u2026' : '\uD83D\uDD12 Save Session'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.encryptNote}>
                  Text is encrypted on-device before saving
                </Text>
              </View>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.lg,
    color: Colors.earthBrown,
  },
  cancel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.barkBrown,
  },
  save: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
  },
  saveDim: {
    opacity: 0.4,
  },
  listContent: {
    paddingBottom: 40,
  },

  // Mood selector
  moodSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  moodTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.lg,
    color: Colors.earthBrown,
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moodBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  moodBtnSelected: {
    backgroundColor: Colors.earthBrown + '15',
    borderColor: Colors.earthBrown,
  },
  moodEmoji: {
    fontSize: 26,
  },
  moodLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
    marginTop: 8,
  },

  saveFooter: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.earthBrown,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonDim: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  encryptNote: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown + '80',
    marginTop: 10,
  },
});
