/**
 * Edit Session Screen — mirrors new-session layout but pre-populates
 * from an existing encrypted session and overwrites on save.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, router } from 'expo-router';

import { VoiceRecorderModal } from '../../../src/components/blocks/VoiceRecorderModal';
import { InsightInput } from '../../../src/components/blocks/InsightInput';
import { AddBlockBar } from '../../../src/components/blocks/AddBlockBar';
import { BlockCard } from '../../../src/components/blocks/BlockCard';
import { TagChips } from '../../../src/components/blocks/TagChips';
import { Colors } from '../../../src/theme/colors';
import { Fonts, FontSizes } from '../../../src/theme/typography';

import { useAuthStore } from '../../../src/stores/auth-store';
import { useSessionStore } from '../../../src/stores/session-store';
import type { Block, BlockType, VoiceBlock, ImageBlock } from '../../../src/models/block';
import type { SessionEntry } from '../../../src/models/session';

const MOOD_EMOJIS = [
  { score: 1, emoji: '\uD83D\uDE1E', label: 'Rough' },
  { score: 2, emoji: '\uD83D\uDE15', label: 'Low' },
  { score: 3, emoji: '\uD83D\uDE10', label: 'Okay' },
  { score: 4, emoji: '\uD83D\uDE42', label: 'Good' },
  { score: 5, emoji: '\uD83D\uDE04', label: 'Great' },
] as const;

export default function EditSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const masterKey = useAuthStore((s) => s.masterKey);
  const { loadSession, currentSession, currentLoading, updateSession, clearCurrent } = useSessionStore();

  const [insight, setInsight] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Track original createdAt so we preserve it on save
  const createdAtRef = useRef<string>('');
  // Track whether user has made changes
  const dirtyRef = useRef(false);

  // Load the existing session
  useEffect(() => {
    if (masterKey && id) loadSession(id, masterKey);
    return () => clearCurrent();
  }, [id, masterKey]);

  // Populate form once session loads
  useEffect(() => {
    if (currentSession && !loaded) {
      const insightBlock = currentSession.blocks.find((b) => b.type === 'insight');
      const otherBlocks = currentSession.blocks
        .filter((b) => b.type !== 'insight')
        .sort((a, b) => a.order - b.order);

      setInsight(insightBlock && 'content' in insightBlock ? insightBlock.content : '');
      setBlocks(otherBlocks);
      setMoodScore(currentSession.moodScore);
      setTags(currentSession.tags);
      createdAtRef.current = currentSession.createdAt;
      setLoaded(true);
    }
  }, [currentSession, loaded]);

  // Mark dirty on any change after initial load
  const populatedRef = useRef(false);
  useEffect(() => {
    if (!loaded) return;
    // Skip the first trigger caused by initial population
    if (!populatedRef.current) {
      populatedRef.current = true;
      return;
    }
    dirtyRef.current = true;
  }, [insight, blocks, moodScore, tags]);

  // ─── Add block ──────────────────────────────────────────────────────────────

  const addBlock = useCallback(
    async (type: Exclude<BlockType, 'insight'>) => {
      const blockId = Crypto.randomUUID();
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
          { id: blockId, type: 'image', order, localUri: asset.uri } satisfies ImageBlock,
        ]);
        return;
      }

      if (type === 'voice') {
        setShowVoiceRecorder(true);
        return;
      }

      const newBlock: Block =
        type === 'text'
          ? { id: blockId, type: 'text', order, content: '' }
          : { id: blockId, type: 'action', order, content: '', completed: false };

      setBlocks((prev) => [...prev, newBlock]);
    },
    [blocks]
  );

  // ─── Update / delete block ──────────────────────────────────────────────────

  const updateBlock = useCallback((updated: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  const onDragEnd = useCallback(({ data }: { data: Block[] }) => {
    setBlocks(data.map((b, i) => ({ ...b, order: i })));
  }, []);

  // ─── Back with unsaved-changes warning ──────────────────────────────────────

  const handleBack = () => {
    if (dirtyRef.current) {
      Alert.alert(
        'Unsaved changes',
        'You have unsaved changes. Discard them?',
        [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  // ─── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!masterKey || !id) {
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
      const now = new Date().toISOString();

      const insightBlock: Block = {
        id: Crypto.randomUUID(),
        type: 'insight',
        order: -1,
        content: insight.trim(),
      };
      const allBlocks = [insightBlock, ...blocks];

      const session: SessionEntry = {
        id,
        blocks: allBlocks,
        moodScore,
        tags,
        createdAt: createdAtRef.current,
        updatedAt: now,
      };

      await updateSession(session, masterKey);
      dirtyRef.current = false;
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

  // Loading state
  if (currentLoading || !loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.earthBrown} />
      </View>
    );
  }

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
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Session</Text>
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
                    {saving ? 'Encrypting & saving\u2026' : '\uD83D\uDD12 Update Session'}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
