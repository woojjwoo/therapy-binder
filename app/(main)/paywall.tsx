import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Fonts, FontSizes } from '../../src/theme/typography';
import { useSubscription } from '../../src/stores/subscription-store';
import { useIAP } from '../../src/hooks/useIAP';
import { PRODUCT_IDS, type ProductId } from '../../src/stores/iap-store';

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
  const {
    isAvailable,
    loading: iapLoading,
    purchasing,
    restoring,
    error: iapError,
    monthlyProduct,
    annualProduct,
    purchase,
    restore,
  } = useIAP();

  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const [key, setKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Derive display prices from StoreKit (fall back to hardcoded if not loaded yet)
  const monthlyPrice = monthlyProduct?.price ?? '$9.99';
  const annualPrice = annualProduct?.price ?? '$59.99';

  const handleGetPro = async () => {
    if (!isAvailable) {
      Alert.alert(
        'IAP not available in Expo Go',
        'In-app purchases require a dev build or production build. Please use a dev build to test purchases.',
        [{ text: 'OK' }]
      );
      return;
    }

    const productId: ProductId =
      selectedPlan === 'annual' ? PRODUCT_IDS.annual : PRODUCT_IDS.monthly;

    try {
      await purchase(productId);
      // Purchase result is async — listener in iap-store will update subscription state
    } catch {
      Alert.alert(
        'Purchase failed',
        'Something went wrong with your purchase. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRestorePurchases = async () => {
    if (!isAvailable) {
      Alert.alert(
        'IAP not available in Expo Go',
        'Restore purchases requires a dev build or production build.',
        [{ text: 'OK' }]
      );
      return;
    }

    const restored = await restore();
    if (restored) {
      Alert.alert('Purchases Restored', 'Welcome back to Pro! All features are now unlocked.');
    } else if (!iapError) {
      Alert.alert(
        'No Purchases Found',
        'We couldn\'t find any previous purchases for this Apple ID. If you believe this is an error, please contact support.'
      );
    } else {
      Alert.alert(
        'Restore Failed',
        'We couldn\'t restore your purchases. Please check your internet connection and try again.'
      );
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

  // Determine CTA button label with real prices
  const getCtaLabel = () => {
    if (purchasing) return 'Processing...';
    if (iapLoading) return 'Loading prices...';
    if (selectedPlan === 'annual') {
      return `Get Pro — ${annualPrice}/yr`;
    }
    return `Get Pro — ${monthlyPrice}/mo`;
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
          {/* Expo Go dev notice */}
          {!isAvailable && (
            <View style={styles.devNotice}>
              <Text style={styles.devNoticeText}>
                ⚠️ IAP not available in Expo Go — use a dev build to test purchases
              </Text>
            </View>
          )}

          {/* Pricing toggle */}
          <View style={styles.pricingRow}>
            {/* Monthly card */}
            <TouchableOpacity
              style={[styles.priceCard, selectedPlan === 'monthly' && styles.priceCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
            >
              {iapLoading ? (
                <ActivityIndicator size="small" color={Colors.earthBrown} style={{ marginVertical: 6 }} />
              ) : (
                <Text style={styles.priceAmount}>{monthlyPrice}</Text>
              )}
              <Text style={styles.pricePeriod}>per month</Text>
            </TouchableOpacity>

            {/* Annual card */}
            <TouchableOpacity
              style={[styles.priceCard, selectedPlan === 'annual' && styles.priceCardSelected]}
              onPress={() => setSelectedPlan('annual')}
            >
              {iapLoading ? (
                <ActivityIndicator size="small" color={Colors.earthBrown} style={{ marginVertical: 6 }} />
              ) : (
                <Text style={styles.priceAmount}>{annualPrice}</Text>
              )}
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

          {/* Primary CTA — StoreKit purchase */}
          <TouchableOpacity
            style={[styles.getProBtn, (purchasing || iapLoading) && styles.btnDim]}
            onPress={handleGetPro}
            disabled={purchasing || iapLoading}
          >
            {purchasing ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={[styles.getProBtnText, { marginLeft: 8 }]}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.getProBtnText}>{getCtaLabel()}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.checkoutNote}>
            Payment processed securely by Apple. Subscriptions auto-renew unless cancelled.
          </Text>

          {/* Restore Purchases */}
          <TouchableOpacity
            style={[styles.restoreBtn, restoring && styles.btnDim]}
            onPress={handleRestorePurchases}
            disabled={restoring}
          >
            {restoring ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator size="small" color={Colors.earthBrown} />
                <Text style={[styles.restoreBtnText, { marginLeft: 6 }]}>Restoring...</Text>
              </View>
            ) : (
              <Text style={styles.restoreBtnText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          {/* Already have a license key (web purchase) */}
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
              <Text style={styles.licenseNote}>
                For users who purchased via therapybinder.app — enter your license key below.
              </Text>
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

  devNotice: {
    backgroundColor: '#FFF3CD', borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#FBBF24',
  },
  devNoticeText: {
    fontFamily: Fonts.sans, fontSize: FontSizes.sm, color: '#92400E', textAlign: 'center',
  },

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
  btnLoadingRow: { flexDirection: 'row', alignItems: 'center' },

  checkoutNote: {
    fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.barkBrown,
    textAlign: 'center', lineHeight: 18, marginBottom: 12, paddingHorizontal: 10,
  },

  restoreBtn: { alignItems: 'center', paddingVertical: 12, marginBottom: 16 },
  restoreBtnText: {
    fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.earthBrown,
    textDecorationLine: 'underline',
  },

  alreadyHaveKeyBtn: { alignItems: 'center', marginBottom: 12 },
  alreadyHaveKeyText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.barkBrown },

  licenseSection: { gap: 12, marginTop: 4 },
  licenseNote: {
    fontFamily: Fonts.sans, fontSize: FontSizes.xs, color: Colors.barkBrown,
    textAlign: 'center', lineHeight: 18,
  },
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
