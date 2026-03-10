import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';

const DEFAULT_TAGS = [
  'boundaries', 'grief', 'family', 'anxiety', 'progress',
  'relationship', 'self-worth', 'trauma', 'work', 'goals',
];

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
  isPro?: boolean;
  onProTap?: () => void;
}

export function TagChips({ selected, onChange, isPro = true, onProTap }: Props) {
  const [custom, setCustom] = useState('');

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const addCustom = () => {
    if (!isPro) {
      onProTap?.();
      setCustom('');
      return;
    }
    const t = custom.trim().toLowerCase();
    if (t && !selected.includes(t)) {
      onChange([...selected, t]);
    }
    setCustom('');
  };

  const allTags = Array.from(new Set([...DEFAULT_TAGS, ...selected]));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>TAGS</Text>
        {!isPro && (
          <TouchableOpacity onPress={onProTap}>
            <Text style={styles.proBadge}>PRO</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.chips}>
        {allTags.map((tag) => {
          const active = selected.includes(tag);
          const isCustomTag = !DEFAULT_TAGS.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(tag)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={styles.customChip}
          onPress={!isPro ? onProTap : undefined}
          activeOpacity={isPro ? 1 : 0.7}
        >
          {isPro ? (
            <TextInput
              style={styles.customInput}
              value={custom}
              onChangeText={setCustom}
              onSubmitEditing={addCustom}
              placeholder="+ add tag"
              placeholderTextColor={Colors.barkBrown + '60'}
              returnKeyType="done"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.customInputLocked}>+ add tag (Pro)</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    letterSpacing: 1.5,
  },
  proBadge: {
    fontFamily: Fonts.sansBold,
    fontSize: 9,
    color: Colors.white,
    backgroundColor: Colors.sage,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.creamDark,
  },
  chipActive: {
    borderColor: Colors.earthBrown,
    backgroundColor: Colors.earthBrown,
  },
  chipText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown,
  },
  chipTextActive: {
    color: Colors.white,
  },
  customChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.cream,
  },
  customInput: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.earthBrown,
    minWidth: 80,
  },
  customInputLocked: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.barkBrown + '60',
    paddingVertical: 2,
  },
});
