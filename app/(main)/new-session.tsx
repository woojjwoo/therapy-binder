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

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
import { UpgradeModal } from '../../src/components/UpgradeModal';
import type { Block, BlockType, VoiceBlock, ImageBlock } from '../../src/models/block';
import type { SessionEntry } from '../../src/models/session';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { requestPermission } from '../../src/hooks/useNotifications';

const SESSION_TIP_KEY = 'tb_session_tip_shown';

// ─── Tip Banner ──────────────────────────────────────────────────────────────

function SessionTipBanner() {
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(SESSION_TIP_KEY).then((val) => {
      if (!val) setVisible(true);
    });
  }, []);

  const dismiss = async () => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setVisible(false)
    );
    await AsyncStorage.setItem(SESSION_TIP_KEY, 'true');
  };

  if (!visible) return null;

  return (
    <Animated.View style={[tipStyles.banner, { opacity }]}>
      <Text style={tipStyles.text}>
        💡 Start with your mood, then add notes, voice, or action items
      </Text>
      <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={tipStyles.dismiss}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const tipStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#EAF2EE',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#7DAF8F',
    gap: 8,
  },
  text: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 13,
    color: '#2D4A3E',
    lineHeight: 18,
  },
  dismiss: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#6B6B6B',
    paddingLeft: 4,
  },
});

const MOOD_OPTIONS = [
  { score: 1, label: 'Rough', color: Colors.terracotta },
  { score: 2, label: 'Low', color: Colors.terracotta },
  { score: 3, label: 'Okay', color: Colors.blush },
  { score: 4, label: 'Good', color: Colors.sageLight },
  { score: 5, label: 'Great', color: Colors.sage },
] as const;

/** Count words in a string */
const countWords = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

function NewSessionScreenInner() {
  const masterKey = useAuthStore((s) => s.masterKey);
  const { saveSession } = useSessionStore();
  const { canAddSession, canUseCustomTags, sessionCount } = useEntitlement();
  const [showUpgrade, setShowUpgrade] = useState(false);

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

      // First session — prompt for notification permission
      if (sessionCount === 0) {
        Alert.alert(
          'Want a daily reminder to journal?',
          '→ Enable notifications to build a consistent habit.',
          [
            { text: 'Not now', style: 'cancel', onPress: () => router.back() },
            {
              text: 'Enable',
              onPress: async () => {
                await requestPermission();
                router.back();
              },
            },
          ]
        );
        return;
      }

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

  const selectedMood = MOOD_OPTIONS.find((m) => m.score === moodScore);

  // Word count across insight + text blocks
  const totalWords = countWords(insight) +
    blocks.reduce((sum, b) => sum + ('content' in b ? countWords(b.content) : 0), 0);

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

        {/* First-visit tip */}
        <SessionTipBanner />

        {/* Mood selector — first interaction */}
        <View style={styles.moodSectionTop}>
          <Text style={styles.moodTitleTop}>How do you feel today?</Text>
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((m) => {
              const isSelected = moodScore === m.score;
              return (
                <TouchableOpacity
                  key={m.score}
                  style={[styles.moodBtn, isSelected && styles.moodBtnSelected]}
                  onPress={() => setMoodScore(m.score)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moodDot,
                      { backgroundColor: m.color },
                      isSelected && styles.moodDotSelected,
                    ]}
                  />
                  <Text style={[styles.moodOptionLabel, isSelected && styles.moodOptionLabelSelected]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
              <TagChips
                selected={tags}
                onChange={setTags}
                isPro={canUseCustomTags}
                onProTap={() => setShowUpgrade(true)}
              />

              {/* Word count */}
              <View style={styles.wordCount}>
                <Text style={styles.wordCountText}>
                  {totalWords} {totalWords === 1 ? 'word' : 'words'}
                </Text>
              </View>

              <View style={styles.saveFooter}>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDim]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Encrypting & saving\u2026' : 'Save Session'}
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
      <UpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </GestureHandlerRootView>
  );
}

export default function NewSessionScreen() {
  return (
    <ErrorBoundary>
      <NewSessionScreenInner />
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

  // Mood selector (top — primary interaction)
  moodSectionTop: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  moodTitleTop: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
    marginBottom: 10,
  },
  // Legacy (kept for compat if referenced elsewhere)
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodBtnSelected: {
    borderColor: Colors.earthBrown,
    backgroundColor: Colors.earthBrown + '10',
  },
  moodDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  moodDotSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  moodOptionLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
  },
  moodOptionLabelSelected: {
    fontFamily: Fonts.sansBold,
    color: Colors.earthBrown,
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
    borderRadius: 12,
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
  wordCount: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  wordCountText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown + '80',
  },
  encryptNote: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown + '80',
    marginTop: 10,
  },
});
