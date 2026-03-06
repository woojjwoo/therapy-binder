/**
 * VoiceRecorderModal — full-screen overlay for recording voice memos.
 * Waveform is simulated (animated bars). Real waveform requires native module.
 * Recording capped at 3 min. Audio stored locally, never synced.
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import type { VoiceBlock } from '../../models/block';
import * as Crypto from 'expo-crypto';

interface Props {
  visible: boolean;
  onSave: (block: VoiceBlock, order: number) => void;
  onCancel: () => void;
  blockOrder: number;
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function VoiceRecorderModal({ visible, onSave, onCancel, blockOrder }: Props) {
  const { state, durationMs, localUri, start, stop, discard, reset } = useVoiceRecorder();

  // Animated bars (faux waveform)
  const bars = useRef(Array.from({ length: 20 }, () => new Animated.Value(0.2))).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state === 'recording') {
      const animations = bars.map((bar) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 200 + Math.random() * 300,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 0.1 + Math.random() * 0.2,
              duration: 200 + Math.random() * 300,
              useNativeDriver: false,
            }),
          ])
        )
      );
      animRef.current = Animated.parallel(animations);
      animRef.current.start();
    } else {
      animRef.current?.stop();
      bars.forEach((b) => b.setValue(0.2));
    }
  }, [state]);

  const handleSave = () => {
    if (!localUri) return;
    const block: VoiceBlock = {
      id: Crypto.randomUUID(),
      type: 'voice',
      order: blockOrder,
      localUri,
      durationMs,
      label: 'Voice memo',
    };
    onSave(block, blockOrder);
    reset();
  };

  const handleCancel = async () => {
    await discard();
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Voice Memo</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Device-only notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>🔒 Stored on this device only · Never synced</Text>
        </View>

        {/* Waveform */}
        <View style={styles.waveform}>
          {bars.map((bar, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: bar.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 60],
                  }),
                  backgroundColor:
                    state === 'recording' ? Colors.terracotta : Colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Timer */}
        <Text style={styles.timer}>{formatDuration(durationMs)}</Text>
        <Text style={styles.maxLabel}>Max 3:00</Text>

        {/* Controls */}
        <View style={styles.controls}>
          {state === 'idle' && (
            <TouchableOpacity style={styles.recordButton} onPress={start}>
              <Text style={styles.recordIcon}>⏺</Text>
              <Text style={styles.recordLabel}>Start Recording</Text>
            </TouchableOpacity>
          )}

          {state === 'recording' && (
            <TouchableOpacity style={styles.stopButton} onPress={stop}>
              <Text style={styles.stopIcon}>⏹</Text>
              <Text style={styles.recordLabel}>Stop</Text>
            </TouchableOpacity>
          )}

          {state === 'stopped' && (
            <View style={styles.saveRow}>
              <TouchableOpacity style={styles.discardButton} onPress={discard}>
                <Text style={styles.discardText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Use Recording</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  headerRight: { width: 60 },
  notice: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.sageLight + '30',
    borderRadius: 20,
  },
  noticeText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.sage,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 80,
    marginTop: 60,
    paddingHorizontal: 20,
  },
  bar: {
    width: 4,
    borderRadius: 4,
    flex: 1,
  },
  timer: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.hero,
    color: Colors.earthBrown,
    marginTop: 40,
    letterSpacing: 2,
  },
  maxLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown + '80',
    marginTop: 6,
  },
  controls: {
    marginTop: 60,
    alignItems: 'center',
  },
  recordButton: {
    alignItems: 'center',
    gap: 10,
  },
  stopButton: {
    alignItems: 'center',
    gap: 10,
  },
  recordIcon: { fontSize: 64 },
  stopIcon: { fontSize: 64 },
  recordLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: Colors.barkBrown,
  },
  saveRow: {
    flexDirection: 'row',
    gap: 16,
  },
  discardButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discardText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.barkBrown,
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: Colors.earthBrown,
  },
  saveText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
});
