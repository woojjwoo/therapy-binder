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
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useSubscription } from '../../src/stores/subscription-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://therapybinder.app';

const MONTHLY_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRICE_MONTHLY ?? 'price_monthly';
const ANNUAL_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRICE_ANNUAL ?? 'price_annual';

const FEATURES = [
  { icon: '∞', label: 'Unlimited sessions', desc: 'No 10-session cap' },
  { icon: '📈', label: 'Mood trends', desc: 'Weekly & monthly mood visualization' },
  { icon: '📄', label: 'Export sessions', desc: 'Share as plain text' },
  { icon: '🏷️', label: 'Custom tags', desc: 'Organize with your own categories' },
  { icon: '📊', label: 'Pattern tracking', desc: 'See tag themes and insights' },
];

type Plan = 'monthly' | 'annual';

export default function PaywallScreen() {
  const { isPro, activateLicense, deactivateLicense } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const [key, setKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleGetPro = async () => {
    setLoadingCheckout(true);
    try {
      const priceId = selectedPlan === 'annual' ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
      const res = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) throw new Error('Failed to create checkout session');
      const data = await res.json();
      if (data.url) {
        await Linking.openURL(data.url);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch {
      // Fallback: open website directly
      await Linking.openURL(`${API_URL}?plan=${selectedPlan}`);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    const ok = await activateLicense(key);
    setActivating(false);
    if (ok) {
      Alert.alert('Welcome to Pro!', 'All features are now unlocked.');
    } else {
      Alert.alert(
        'Invalid key',
        'This license key could not be verified. Please check the key and try again, or visit therapybinder.app for support.'
      );
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
        <Text style={styles.back}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {isPro ? 'Pro — Active' : 'Upgrade to Pro'}
      </Text>
      <Text style={styles.subtitle}>
        {isPro
          ? 'You have full access to all features.'
          : 'Private, encrypted journaling — unlimited.'}
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
            {isPro && <Text style={styles.checkmark}>✓</Text>}
          </View>
        ))}
      </View>

      {!isPro && (
        <>
          {/* Pricing toggle */}
          <View style={styles.pricingRow}>
            <TouchableOpacity
              style={[styles.priceCard, selectedPlan === 'monthly' && styles.priceCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={styles.priceAmount}>$9.99</Text>
              <Text style={styles.pricePeriod}>per month</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.priceCard, selectedPlan === 'annual' && styles.priceCardSelected]}
              onPress={() => setSelectedPlan('annual')}
            >
              <Text style={styles.priceAmount}>$59.99</Text>
              <Text style={styles.pricePeriod}>per year</Text>
              <Text style={styles.saveBadge}>Save 50% ✦</Text>
            </TouchableOpacity>
          </View>

          {/* Testimonials */}
          <View style={styles.testimonialsSection}>
            <Text style={styles.testimonialsTitle}>What users are saying</Text>
            {[
              { text: 'Finally an app that takes privacy seriously.', name: 'Sarah M.' },
              { text: 'My therapist loves that I can track patterns.', name: 'James K.' },
              { text: 'Worth every penny for the peace of mind.', name: 'Anonymous' },
            ].map((t) => (
              <View key={t.name} style={styles.testimonialCard}>
                <Text style={styles.testimonialText}>"{t.text}"</Text>
                <Text style={styles.testimonialName}>— {t.name}</Text>
              </View>
            ))}
          </View>

          {/* Privacy line */}
          <View style={styles.privacyLine}>
            <Text style={styles.privacyLineText}>🔒 100% private — we never see your sessions</Text>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.getProBtn, loadingCheckout && styles.btnDim]}
            onPress={handleGetPro}
            disabled={loadingCheckout}
          >
            <Text style={styles.getProBtnText}>
              {loadingCheckout
                ? 'Opening checkout...'
                : selectedPlan === 'annual'
                ? 'Get Pro — $59.99/yr'
                : 'Get Pro — $9.99/mo'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.checkoutNote}>
            You'll be taken to a secure checkout. After payment, you'll receive a license key by email.
          </Text>

          {/* Already have a key */}
          <TouchableOpacity
            style={styles.alreadyHaveKeyBtn}
            onPress={() => setShowKeyInput((v) => !v)}
          >
            <Text style={styles.alreadyHaveKeyText}>
              {showKeyInput ? 'Hide key input ▲' : 'Already have a license key? ▼'}
            </Text>
          </TouchableOpacity>

          {showKeyInput && (
            <View style={styles.licenseSection}>
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
                  {activating ? 'Activating...' : 'Activate Key'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {isPro && (
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

  pricingRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  priceCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  priceCardSelected: { borderColor: Colors.earthBrown, borderWidth: 2 },
  priceAmount: { fontFamily: Fonts.serifBold, fontSize: FontSizes.xl, color: Colors.earthBrown },
  pricePeriod: { fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: Colors.barkBrown, marginTop: 2 },
  saveBadge: {
    fontFamily: Fonts.sansBold, fontSize: FontSizes.xs, color: Colors.sage, marginTop: 6,
  },

  testimonialsSection: { marginBottom: 20, gap: 10 },
  testimonialsTitle: {
    fontFamily: Fonts.sansBold, fontSize: FontSizes.sm, color: Colors.earthBrown,
    marginBottom: 4, letterSpacing: 0.3,
  },
  testimonialCard: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, gap: 4,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.earthBrown, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  testimonialText: {
    fontFamily: Fonts.serif, fontSize: FontSizes.md, color: Colors.earthBrown,
    lineHeight: 22, fontStyle: 'italic',
  },
  testimonialName: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.xs, color: Colors.barkBrown, marginTop: 2 },

  privacyLine: { alignItems: 'center', marginBottom: 16 },
  privacyLineText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.sage, textAlign: 'center' },

  getProBtn: {
    backgroundColor: Colors.earthBrown, paddingVertical: 18, borderRadius: 30,
    alignItems: 'center', marginBottom: 10,
    shadowColor: Colors.earthBrown, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  getProBtnText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.white, letterSpacing: 0.3 },

  checkoutNote: {
    fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.barkBrown,
    textAlign: 'center', lineHeight: 18, marginBottom: 20, paddingHorizontal: 10,
  },

  alreadyHaveKeyBtn: { alignItems: 'center', marginBottom: 12 },
  alreadyHaveKeyText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.earthBrown },

  licenseSection: { gap: 12, marginTop: 4 },
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

  deactivateBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 20 },
  deactivateText: { fontFamily: Fonts.sansBold, fontSize: FontSizes.md, color: Colors.terracotta },
});
