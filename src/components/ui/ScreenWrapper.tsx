import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface Props {
  children: ReactNode;
}

export function ScreenWrapper({ children }: Props) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
});
