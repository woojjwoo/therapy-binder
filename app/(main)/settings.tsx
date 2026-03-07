/**
 * Settings Screen
 * - Subscription status / paywall link
 * - Change passphrase (with full re-encryption)
 * - Daily reminders toggle + time picker
 * - Export as JSON
 * - Generate Transition Report PDF (Pro-gated)
 * - Double-confirmed full data deletion
 * - Lock app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { useSessionStore } from '../../src/stores/session-store';
import { useSubscription } from '../../src/stores/subscription-store';
import { useEntitlement } from '../../src/hooks/useEntitlement';
import { exportAsJSON, exportAsPDF } from '../../src/storage/export';
import { deriveKey } from '../../src/crypto/kdf';
import { importRawKey } from '../../src/crypto/aes-gcm';
import { reEncryptAllSessions } from '../../src/crypto/reencrypt-all';
import { getMeta, setMeta } from '../../src/db';
import { METADATA_KEYS } from '../../src/db/schema';
import { PassphraseInput } from '../../src/components/onboarding/PassphraseInput';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import {
  requestPermission,
  scheduleDaily,
  cancelReminders,
} from '../../src/hooks/useNotifications';

const REMINDER_ENABLED_KEY = 'tb_reminder_enabled';
const REMINDER_TIME_KEY = 'tb_reminder_time';

// ─── Change Passphrase Modal ──────────────────────────────────────────────────

function ChangePassphraseModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const masterKey = useAuthStore((s) => s.masterKey);
  const unlock = useAuthStore((s) => s.unlock);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [working, setWorking] = useState(false);

  const handleChange = async () => {
    if (!masterKey) return;
    if (next !== confirm) {
      Alert.alert('Mismatch', 'New passphrase and confirmation do not match.');
      return;
    }
    if (next.length < 8) {
      Alert.alert('Too short', 'Passphrase must be at least 8 characters.');
      return;
    }

    setWorking(true);
    try {
      const salt = await getMeta(METADATA_KEYS.SALT);
      if (!salt) throw new Error('No salt found');

      const currentRaw = await deriveKey(current, salt);
      const currentKey = await importRawKey(currentRaw);

      const newRaw = await deriveKey(next, salt);
      const newKey = await importRawKey(newRaw);

      const result = await reEncryptAllSessions(currentKey, newKey);

      if (result.skipped > 0) {
        Alert.alert(
          'Partial success',
          `${result.succeeded} sessions re-encrypted. ${result.skipped} could not be decrypted with your current passphrase and were skipped.`
        );
      }

      unlock(newKey);
      onClose();
      Alert.alert('Done', 'Passphrase changed. All sessions re-encrypted.');
    } catch (err) {
      Alert.alert('Error', 'Could not change passphrase. Check your current passphrase and try again.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
        <Text style={styles.modalTitle}>Change Passphrase</Text>
        <Text style={styles.modalSub}>
          All your sessions will be re-encrypted with the new passphrase. This cannot be undone.
        </Text>

        <View style={styles.formGroup}>
          <PassphraseInput
            value={current}
            onChange={setCurrent}
            label="Current passphrase"
            showStrength={false}
            placeholder="Your current passphrase"
          />
        </View>
        <View style={styles.formGroup}>
          <PassphraseInput
            value={next}
            onChange={setNext}
            label="New passphrase"
            showStrength
            placeholder="Choose a strong passphrase"
          />
        </View>
        <View style={styles.formGroup}>
          <PassphraseInput
            value={confirm}
            onChange={setConfirm}
            label="Confirm new passphrase"
            showStrength={false}
            placeholder="Repeat new passphrase"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, working && styles.btnDim]}
          onPress={handleChange}
          disabled={working}
        >
          {working ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Change Passphrase</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelLink} onPress={onClose} disabled={working}>
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function SettingsScreenInner() {
  const lock = useAuthStore((s) => s.lock);
  const masterKey = useAuthStore((s) => s.masterKey);
  const removeAll = useSessionStore((s) => s.removeAll);
  const { isPro, canExportPDF } = useEntitlement();
  const [showChangePass, setShowChangePass] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Reminders state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(2000, 0, 1, 20, 0)); // default 8pm
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const enabled = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
      const time = await AsyncStorage.getItem(REMINDER_TIME_KEY);
      if (enabled === 'true') setReminderEnabled(true);
      if (time) {
        const [h, m] = time.split(':').map(Number);
        setReminderTime(new Date(2000, 0, 1, h, m));
      }
    })();
  }, []);

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Enable notifications in Settings to use reminders.');
        return;
      }
      await scheduleDaily(reminderTime.getHours(), reminderTime.getMinutes());
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(REMINDER_TIME_KEY, `${reminderTime.getHours()}:${reminderTime.getMinutes()}`);
      setReminderEnabled(true);
    } else {
      await cancelReminders();
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false');
      setReminderEnabled(false);
    }
  };

  const handleTimeChange = async (_: unknown, date?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (!date) return;
    setReminderTime(date);
    if (reminderEnabled) {
      await scheduleDaily(date.getHours(), date.getMinutes());
      await AsyncStorage.setItem(REMINDER_TIME_KEY, `${date.getHours()}:${date.getMinutes()}`);
    }
  };

  const handleExportJSON = async () => {
    if (!masterKey) return;
    setExporting(true);
    try {
      await exportAsJSON(masterKey);
    } catch {
      Alert.alert('Export failed', 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!masterKey) return;
    if (!canExportPDF) {
      router.push('/paywall');
      return;
    }
    setExporting(true);
    try {
      await exportAsPDF(masterKey);
    } catch {
      Alert.alert('Export failed', 'PDF generation failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Data',
      'This permanently deletes all your therapy sessions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Your entire therapy binder will be wiped. Export first if you want a copy.',
              [
                { text: 'No, keep my data', style: 'cancel' },
                {
                  text: 'Yes, delete all',
                  style: 'destructive',
                  onPress: async () => {
                    await removeAll();
                    lock();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const timeLabel = reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.rowLabel}>
              {isPro ? 'Pro \u2014 Active \u2713' : 'Subscription'}
            </Text>
            <Text style={styles.chevron}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          <TouchableOpacity style={styles.row} onPress={() => setShowChangePass(true)}>
            <View>
              <Text style={styles.rowLabel}>Change Passphrase</Text>
              <Text style={styles.rowSub}>Re-encrypts all sessions</Text>
            </View>
            <Text style={styles.chevron}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={lock}>
            <Text style={styles.rowLabel}>Lock App</Text>
            <Text style={styles.chevron}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REMINDERS</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Daily reminder</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ true: Colors.sage }}
              thumbColor={Colors.white}
            />
          </View>
          {reminderEnabled && (
            <TouchableOpacity
              style={styles.row}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.rowLabel}>Reminder time</Text>
              <Text style={styles.rowSub}>{timeLabel}</Text>
            </TouchableOpacity>
          )}
          {showTimePicker && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR DATA</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={handleExportJSON}
            disabled={exporting}
          >
            <View>
              <Text style={styles.rowLabel}>Export as JSON</Text>
              <Text style={styles.rowSub}>Full decrypted backup</Text>
            </View>
            {exporting ? (
              <ActivityIndicator color={Colors.earthBrown} />
            ) : (
              <Text style={styles.chevron}>{'\u203A'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={handleExportPDF}
            disabled={exporting}
          >
            <View>
              <Text style={styles.rowLabel}>
                Transition Report (PDF){!canExportPDF ? ' \uD83D\uDD12' : ''}
              </Text>
              <Text style={styles.rowSub}>Generated on-device {'\u00B7'} never sent to server</Text>
            </View>
            {exporting ? (
              <ActivityIndicator color={Colors.earthBrown} />
            ) : (
              <Text style={styles.chevron}>{'\u203A'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DANGER ZONE</Text>
          <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAll}>
            <Text style={styles.dangerText}>Delete All Data</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.trustNote}>
          Your data is yours {'\u2014'} always. You can export everything regardless of subscription status.
        </Text>
      </ScrollView>

      <ChangePassphraseModal
        visible={showChangePass}
        onClose={() => setShowChangePass(false)}
      />
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <ErrorBoundary>
      <SettingsScreenInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 60 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.xxl,
    color: Colors.earthBrown,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.earthBrown,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
  },
  rowSub: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    marginTop: 2,
  },
  chevron: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.lg,
    color: Colors.barkBrown,
  },
  dangerRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dangerText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.terracotta,
  },
  trustNote: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown + '80',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 18,
    marginTop: 8,
  },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.cream },
  modalContent: { padding: 24, paddingTop: 40, gap: 20 },
  modalTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.xxl,
    color: Colors.earthBrown,
  },
  modalSub: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
    lineHeight: 20,
  },
  formGroup: { gap: 0 },
  primaryBtn: {
    backgroundColor: Colors.earthBrown,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDim: { opacity: 0.5 },
  primaryBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  cancelLink: { alignItems: 'center', paddingVertical: 12 },
  cancelLinkText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.barkBrown,
  },
});
