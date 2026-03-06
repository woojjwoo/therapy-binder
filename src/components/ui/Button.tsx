import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.earthBrown}
        />
      ) : (
        <Text style={[styles.text, variantTextStyles[variant]]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
  },
});

const variantStyles: Record<string, ViewStyle> = {
  primary: {
    backgroundColor: Colors.earthBrown,
  },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  danger: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.terracotta,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const variantTextStyles: Record<string, TextStyle> = {
  primary: { color: Colors.white },
  secondary: { color: Colors.earthBrown },
  danger: { color: Colors.terracotta },
  ghost: { color: Colors.barkBrown },
};
