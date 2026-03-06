import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';

interface Props {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  onBack?: () => void;
}

export function Header({ title, left, right, onBack }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.back}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        ) : (
          left ?? <View style={styles.spacer} />
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.side, styles.rightSide]}>
        {right ?? <View style={styles.spacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  side: {
    minWidth: 60,
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  spacer: {
    width: 60,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.serifBold,
    fontSize: FontSizes.lg,
    color: Colors.earthBrown,
    textAlign: 'center',
  },
  back: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
  },
});
