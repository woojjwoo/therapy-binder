/**
 * Settings Screen
 * - Subscription status / paywall link
 * - Change passphrase (with full re-encryption)
 * - Daily reminders toggle + time picker + confirmation
 * - Export as JSON
 * - Generate Transition Report PDF (Pro-gated)
 * - Export my data (Coming soon)
 * - Double-confirmed full data deletion
 * - Lock app
 * - App version at bottom
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
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/auth-store';
import { useSessionStore } from '../../src/stores/session-store';
import { useSubscription } from '../../src/stores/subscription-store';
import { useEntitlement } from '../../src/hooks/useEntitlement';
import { UpgradeModal } from '../../src/components/UpgradeModal';
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

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

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
  const { isPro, canExportPDF, sessionCount } = useEntitlement();
  const activateLicense = useSubscription((s) => s.activateLicense);
  const [showChangePass, setShowChangePass] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const enableDevPro = async () => {
    const devKey = 'e139cf92-8569-413a-bac7-89767879fc5c';
    await activateLicense(devKey);
    Alert.alert('✅ Dev Pro Enabled', 'All Pro features unlocked for testing.');
  };

  // Reminders state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date(2000, 0, 1, 20, 0)); // default 8 PM
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderConfirm, setReminderConfirm] = useState('');

  useEffect(() => {
    (async () => {
      const enabled = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
      const time = await AsyncStorage.getItem(REMINDER_TIME_KEY);
      if (enabled === 'true') setReminderEnabled(true);
      if (time) {
        const [h, m] = time.split(':').map(Number);
        const t = new Date(2000, 0, 1, h, m);
        setReminderTime(t);
        if (enabled === 'true') {
          setReminderConfirm(formatReminderConfirm(t));
        }
      } else if (enabled === 'true') {
        setReminderConfirm(formatReminderConfirm(new Date(2000, 0, 1, 20, 0)));
      }
    })();
  }, []);

  function formatReminderConfirm(t: Date): string {
    const label = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `✓ We'll remind you at ${label} every day`;
  }

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Enable notifications in Settings to use reminders.');
        return;
      }
      await scheduleDaily(reminderTime.getHours(), reminderTime.getMinutes());
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(
        REMINDER_TIME_KEY,
        `${reminderTime.getHours()}:${reminderTime.getMinutes()}`
      );
      setReminderEnabled(true);
      setReminderConfirm(formatReminderConfirm(reminderTime));
    } else {
      await cancelReminders();
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false');
      setReminderEnabled(false);
      setReminderConfirm('');
    }
  };

  const handleTimeChange = async (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (!date) return;
    setReminderTime(date);
    if (reminderEnabled) {
      await scheduleDaily(date.getHours(), date.getMinutes());
      await AsyncStorage.setItem(
        REMINDER_TIME_KEY,
        `${date.getHours()}:${date.getMinutes()}`
      );
      setReminderConfirm(formatReminderConfirm(date));
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

        {/* Profile / Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROFILE</Text>
          {isPro ? (
            <View style={styles.proProfileRow}>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Pro Member</Text>
                <Text style={styles.rowSub}>All features unlocked</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/paywall')}>
                <Text style={styles.chevron}>{'\u203A'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.upgradeRow}
              onPress={() => setShowUpgrade(true)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Free Plan</Text>
                <Text style={styles.rowSub}>{sessionCount}/10 sessions used</Text>
              </View>
              <View style={styles.upgradeChip}>
                <Text style={styles.upgradeChipText}>Upgrade</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          <TouchableOpacity style={styles.row} onPress={() => setShowChangePass(true)}>
            <View style={styles.rowLeft}>
              <Ionicons name="key-outline" size={18} color={Colors.barkBrown} style={styles.rowIcon} />
              <View>
                <Text style={styles.rowLabel}>Change Passphrase</Text>
                <Text style={styles.rowSub}>Re-encrypts all sessions</Text>
              </View>
            </View>
            <Text style={styles.chevron}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={lock}>
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.barkBrown} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Lock App</Text>
            </View>
            <Text style={styles.chevron}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REMINDERS</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={18} color={Colors.barkBrown} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Daily reminder</Text>
            </View>
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
              <View style={styles.rowLeft}>
                <Ionicons name="time-outline" size={18} color={Colors.barkBrown} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Reminder time</Text>
              </View>
              <Text style={styles.rowValue}>{timeLabel}</Text>
            </TouchableOpacity>
          )}
          {reminderEnabled && showTimePicker && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
          {/* Confirmation message */}
          {reminderConfirm !== '' && (
            <View style={styles.confirmBanner}>
              <Text style={styles.confirmText}>{reminderConfirm}</Text>
            </View>
          )}
        </View>

        {/* Data / Export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR DATA</Text>
          <TouchableOpacity
            style={styles.row}
            onPress={handleExportJSON}
            disabled={exporting}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="download-outline" size={18} color={Colors.barkBrown} style={styles.rowIcon} />
              <View>
                <Text style={styles.rowLabel}>Export as JSON</Text>
                <Text style={styles.rowSub}>Full decrypted backup</Text>
              </View>
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
            <View style={styles.rowLeft}>
              <Ionicons name="document-text-outline" size={18} color={Colors.barkBrown} style={styles.rowIcon} />
              <View>
                <Text style={styles.rowLabel}>
                  Transition Report (PDF){!canExportPDF ? ' 🔒' : ''}
                </Text>
                <Text style={styles.rowSub}>Generated on-device · never sent to server</Text>
              </View>
            </View>
            {exporting ? (
              <ActivityIndicator color={Colors.earthBrown} />
            ) : (
              <Text style={styles.chevron}>{'\u203A'}</Text>
            )}
          </TouchableOpacity>
          {/* Coming soon export option */}
          <View style={[styles.row, styles.rowDisabled]}>
            <View style={styles.rowLeft}>
              <Ionicons name="share-outline" size={18} color={Colors.barkBrown + '80'} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowLabel, styles.textMuted]}>Export my data</Text>
                <Text style={styles.rowSub}>Cloud backup · Coming soon</Text>
              </View>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DANGER ZONE</Text>
          <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAll}>
            <Ionicons name="trash-outline" size={18} color={Colors.terracotta} style={{ marginRight: 8 }} />
            <Text style={styles.dangerText}>Delete All Data</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.trustNote}>
          Your data is yours — always. You can export everything regardless of subscription status.
        </Text>

        {/* App version */}
        <Text style={styles.versionNote}>Version {APP_VERSION}</Text>
      </ScrollView>

      <ChangePassphraseModal
        visible={showChangePass}
        onClose={() => setShowChangePass(false)}
      />
      <UpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* DEV ONLY: quick Pro toggle for testing */}
      {!isPro && __DEV__ && (
        <TouchableOpacity
          onPress={enableDevPro}
          style={{ padding: 16, alignItems: 'center', opacity: 0.4 }}
        >
          <Text style={{ fontSize: 11, color: '#999' }}>⚙️ [DEV] Enable Pro</Text>
        </TouchableOpacity>
      )}
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
  rowDisabled: {
    opacity: 0.65,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 10,
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
  rowValue: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.earthBrown,
  },
  textMuted: {
    color: Colors.barkBrown,
  },
  chevron: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.lg,
    color: Colors.barkBrown,
  },
  proProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  proBadge: {
    backgroundColor: Colors.sage,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  proBadgeText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.xs,
    color: Colors.white,
    letterSpacing: 1,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  upgradeChip: {
    backgroundColor: Colors.earthBrown,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeChipText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    color: Colors.white,
  },
  dangerRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  versionNote: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown + '60',
    textAlign: 'center',
    paddingBottom: 20,
    marginTop: 2,
  },
  // Reminder confirmation
  confirmBanner: {
    marginHorizontal: 16,
    marginBottom: 14,
    marginTop: 2,
    backgroundColor: Colors.sage + '20',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.sage,
  },
  confirmText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.earthBrown,
  },
  // Coming soon badge
  comingSoonBadge: {
    backgroundColor: Colors.creamDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  comingSoonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
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
