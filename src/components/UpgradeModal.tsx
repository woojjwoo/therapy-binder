import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';

const FEATURES = [
  'Unlimited sessions',
  'Mood trend charts',
  'Export sessions as text',
  'Custom tags & categories',
  'Pattern tracking & insights',
  'Priority support badge',
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function UpgradeModal({ visible, onClose }: Props) {
  const handlePurchase = () => {
    Linking.openURL('https://therapy-binder-k7hbcj927-brians-projects-bbc5c312.vercel.app');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.subtitle}>
            Unlock the full therapy binder experience
          </Text>

          <View style={styles.featureList}>
            {FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.check}>{'\u2713'}</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handlePurchase}>
            <Text style={styles.primaryBtnText}>$9.99/mo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handlePurchase}>
            <Text style={styles.secondaryBtnText}>
              $59.99/yr{' '}
              <Text style={styles.saveBadge}>(save 50%)</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.cream,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.xxl,
    color: Colors.earthBrown,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  featureList: {
    gap: 10,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.sage,
  },
  featureText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
  },
  primaryBtn: {
    backgroundColor: Colors.earthBrown,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  secondaryBtn: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.earthBrown,
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
  },
  saveBadge: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.sage,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
  },
});
