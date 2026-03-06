/**
 * VoicePlayer — inline playback for voice blocks in session detail.
 * Uses expo-av Sound API.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';

interface Props {
  localUri: string;
  durationMs: number;
  label?: string;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function VoicePlayer({ localUri, durationMs, label }: Props) {
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const toggle = async () => {
    if (playing) {
      await soundRef.current?.pauseAsync();
      setPlaying(false);
      return;
    }

    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPositionMs(status.positionMillis ?? 0);
            if (status.didJustFinish) {
              setPlaying(false);
              setPositionMs(0);
              soundRef.current?.unloadAsync();
              soundRef.current = null;
            }
          }
        }
      );
      soundRef.current = sound;
    } else {
      await soundRef.current.playAsync();
    }
    setPlaying(true);
  };

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggle} style={styles.playBtn}>
        <Text style={styles.playIcon}>{playing ? '⏸' : '▶️'}</Text>
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={styles.label}>{label ?? 'Voice memo'}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.time}>
          {fmt(positionMs)} / {fmt(durationMs)}
        </Text>
      </View>
      <Text style={styles.deviceOnly}>📱 Device only</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.creamDark,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.earthBrown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 18 },
  info: { flex: 1, gap: 6 },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.earthBrown,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.earthBrown,
    borderRadius: 2,
  },
  time: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
  },
  deviceOnly: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown + '80',
  },
});
