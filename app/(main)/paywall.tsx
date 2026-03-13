import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useSubscription } from '../../src/stores/subscription-store';

const CHECKOUT_BASE = 'https://therapy-binder-k7hbcj927-brians-projects-bbc5c312.vercel.app/checkout';

const FEATURES = [
  { icon: '\u221E', label: 'Unlimited sessions', desc: 'No 10-session cap' },
  { icon: '\uD83D\uDCC8', label: 'Mood trends', desc: 'Weekly & monthly mood visualization' },
  { icon: '\uD83D\uDCC4', label: 'Export sessions', desc: 'Share as plain text' },
  { icon: '\uD83C\uDFF7\uFE0F', label: 'Custom tags', desc: 'Organize with your own categories' },
  { icon: '\uD83D\uDCC8', label: 'Pattern tracking', desc: 'See tag themes and insights' },
];

export default function PaywallScreen() {
  const { isPro, activateLicense, deactivateLicense } = useSubscription();
  const [key, setKey] = useState('');
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    setActivating(true);
    const ok = await activateLicense(key);
    setActivating(false);
    if (ok) {
      Alert.alert('Welcome to Pro!', 'All features are now unlocked.');
    } else {
      Alert.alert('Invalid key', 'Please enter a valid license key (UUID format).');
    }
  };

  const handleDeactivate = () => {
    Alert.alert('Deactivate Pro?', 'You will lose access to Pro features.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          await deactivateLicense();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.back}>{'\u2039'} Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {isPro ? 'Pro \u2014 Active' : 'Upgrade to Pro'}
      </Text>
      <Text style={styles.subtitle}>
        {isPro
          ? 'You have full access to all features.'
          : 'Unlock everything with a license key.'}
      </Text>

      {/* Features */}
      <View style={styles.featureList}>
        {FEATURES.map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
            {isPro && <Text style={styles.checkmark}>{'\u2713'}</Text>}
          </View>
        ))}
      </View>

      {/* Privacy trust block */}
      {!isPro && (
        <View style={styles.privacyBlock}>
          <Ionicons name="lock-closed" size={18} color={Colors.sage} style={styles.privacyIcon} />
          <View style={styles.privacyText}>
            <Text style={styles.privacyTitle}>Your data never leaves your device</Text>
            <Text style={styles.privacyDesc}>
              All sessions are encrypted with your passphrase.{'\n'}Not even we can read them.
            </Text>
          </View>
        </View>
      )}

      {/* Checkout CTA buttons */}
      {!isPro && (
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.ctaMonthly}
            onPress={() => Linking.openURL(`${CHECKOUT_BASE}?plan=monthly`)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaMonthlyText}>Get Pro — $9.99/mo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaAnnual}
            onPress={() => Linking.openURL(`${CHECKOUT_BASE}?plan=annual`)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaAnnualText}>Best value — $59.99/yr</Text>
            <Text style={styles.ctaAnnualSub}>Save 30%</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* License input */}
      {!isPro ? (
        <View style={styles.licenseSection}>
          <Text style={styles.licenseLabel}>Already have a key? Enter it below.</Text>
          <TextInput
            style={styles.licenseInput}
            value={key}
            onChangeText={setKey}
            placeholder="xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"
            placeholderTextColor={Colors.barkBrown + '60'}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.activateBtn, (!key.trim() || activating) && styles.btnDim]}
            onPress={handleActivate}
            disabled={!key.trim() || activating}
          >
            <Text style={styles.activateBtnText}>
              {activating ? 'Activating...' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.deactivateBtn} onPress={handleDeactivate}>
          <Text style={styles.deactivateText}>Deactivate License</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  backBtn: { marginBottom: 16 },
  back: { fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.earthBrown },
  title: { fontFamily: Fonts.serifBold, fontSize: FontSizes.xxl, color: Colors.earthBrown },
  subtitle: {
    fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.barkBrown, marginTop: 4, marginBottom: 24,
  },

  featureList: { gap: 16, marginBottom: 28 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 14, padding: 16, gap: 14,
    shadowColor: Colors.earthBrown, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  featureIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  featureText: { flex: 1 },
  featureLabel: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.earthBrown },
  featureDesc: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.barkBrown, marginTop: 2 },
  checkmark: { fontFamily: Fonts.sansBold, fontSize: FontSizes.lg, color: Colors.sage },

  pricingRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  priceCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  priceCardHighlight: { borderColor: Colors.earthBrown, borderWidth: 2 },
  priceAmount: { fontFamily: Fonts.serifBold, fontSize: FontSizes.xl, color: Colors.earthBrown },
  pricePeriod: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.barkBrown },
  priceHighlight: { color: Colors.earthBrown },
  saveBadge: {
    fontFamily: Fonts.sansBold, fontSize: FontSizes.xs, color: Colors.sage,
    marginTop: 4,
  },

  licenseSection: { gap: 12 },
  licenseLabel: { fontFamily: Fonts.sansBold, fontSize: FontSizes.sm, color: Colors.earthBrown },
  licenseInput: {
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: Fonts.sans, fontSize: FontSizes.md, color: Colors.earthBrown,
    borderWidth: 1, borderColor: Colors.border,
  },
  activateBtn: {
    backgroundColor: Colors.earthBrown, paddingVertical: 16, borderRadius: 30, alignItems: 'center',
  },
  activateBtnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white },
  btnDim: { opacity: 0.5 },

  // Privacy trust block
  privacyBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.sage + '18',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.sage + '40',
  },
  privacyIcon: { marginTop: 2 },
  privacyText: { flex: 1 },
  privacyTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    color: Colors.earthBrown,
    marginBottom: 3,
  },
  privacyDesc: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    lineHeight: 18,
  },

  // Checkout CTA
  ctaSection: { gap: 10, marginBottom: 24 },
  ctaMonthly: {
    backgroundColor: Colors.earthBrown,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  ctaMonthlyText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  ctaAnnual: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    gap: 2,
  },
  ctaAnnualText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  ctaAnnualSub: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.white + 'CC',
  },

  deactivateBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 20 },
  deactivateText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.terracotta },
});
