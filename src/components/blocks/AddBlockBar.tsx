/**
 * AddBlockBar — row of buttons to add new blocks to the session.
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import type { BlockType } from '../../models/block';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const BLOCK_BUTTONS: { type: Exclude<BlockType, 'insight'>; icon: IoniconsName; label: string }[] = [
  { type: 'voice',  icon: 'mic-outline',      label: 'Voice'  },
  { type: 'text',   icon: 'document-text-outline', label: 'Notes'  },
  { type: 'action', icon: 'checkmark-circle-outline', label: 'Action' },
  { type: 'image',  icon: 'camera-outline',   label: 'Photo'  },
];

interface Props {
  onAdd: (type: Exclude<BlockType, 'insight'>) => void;
}

export function AddBlockBar({ onAdd }: Props) {
  return (
    <View style={styles.bar}>
      {BLOCK_BUTTONS.map(({ type, icon, label }) => (
        <TouchableOpacity
          key={type}
          style={styles.button}
          onPress={() => onAdd(type)}
          activeOpacity={0.7}
        >
          <Ionicons name={icon} size={24} color={Colors.barkBrown} />
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.creamDark,
    marginVertical: 8,
  },
  button: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 10,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    letterSpacing: 0.5,
  },
});
