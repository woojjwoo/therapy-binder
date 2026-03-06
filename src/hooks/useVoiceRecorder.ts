/**
 * Voice recorder hook using expo-av.
 * - Max 3 minutes
 * - AAC format, compressed
 * - Local device only — never synced
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const MAX_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export type RecorderState = 'idle' | 'recording' | 'stopped';

export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [durationMs, setDurationMs] = useState(0);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ─── Start ──────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync({
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 64000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.MEDIUM,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 64000,
      },
      web: {},
    });

    recordingRef.current = recording;
    startTimeRef.current = Date.now();
    setState('recording');

    // Timer + auto-stop at 3 min
    intervalRef.current = setInterval(async () => {
      const elapsed = Date.now() - startTimeRef.current;
      setDurationMs(elapsed);
      if (elapsed >= MAX_DURATION_MS) {
        await stop();
      }
    }, 500);
  }, []);

  // ─── Stop ───────────────────────────────────────────────────────────────────
  const stop = useCallback(async () => {
    if (!recordingRef.current) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();
    recordingRef.current = null;
    setState('stopped');
    if (uri) setLocalUri(uri);

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  }, []);

  // ─── Discard ─────────────────────────────────────────────────────────────────
  const discard = useCallback(async () => {
    if (localUri) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    }
    setLocalUri(null);
    setDurationMs(0);
    setState('idle');
  }, [localUri]);

  // ─── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setLocalUri(null);
    setDurationMs(0);
    setState('idle');
  }, []);

  return { state, durationMs, localUri, start, stop, discard, reset };
}
