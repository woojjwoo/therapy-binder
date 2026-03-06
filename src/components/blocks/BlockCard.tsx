/**
 * BlockCard — draggable card wrapper for all block types.
 * Long-press to drag (handled by DraggableFlatList parent).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import type { Block } from '../../models/block';

interface Props {
  block: Block;
  onDelete: (id: string) => void;
  onUpdate: (block: Block) => void;
  drag?: () => void;
  isActive?: boolean;
}

export function BlockCard({ block, onDelete, onUpdate, drag, isActive }: Props) {
  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      {/* Drag handle */}
      <TouchableOpacity onLongPress={drag} style={styles.handle}>
        <Text style={styles.handleIcon}>⠿</Text>
      </TouchableOpacity>

      {/* Block content by type */}
      <View style={styles.content}>
        {block.type === 'text' && (
          <TextBlockContent block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'action' && (
          <ActionBlockContent block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'voice' && (
          <VoiceBlockContent block={block} />
        )}
        {block.type === 'image' && (
          <ImageBlockContent block={block} />
        )}
      </View>

      {/* Delete */}
      <TouchableOpacity onPress={() => onDelete(block.id)} style={styles.delete}>
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

import { TextInput } from 'react-native';
import type { TextBlock, ActionBlock, VoiceBlock, ImageBlock } from '../../models/block';

function TextBlockContent({
  block,
  onUpdate,
}: {
  block: TextBlock;
  onUpdate: (b: Block) => void;
}) {
  return (
    <TextInput
      style={styles.textInput}
      value={block.content}
      onChangeText={(t) => onUpdate({ ...block, content: t })}
      placeholder="Notes from this session..."
      placeholderTextColor={Colors.barkBrown + '60'}
      multiline
    />
  );
}

function ActionBlockContent({
  block,
  onUpdate,
}: {
  block: ActionBlock;
  onUpdate: (b: Block) => void;
}) {
  return (
    <View style={styles.actionRow}>
      <Switch
        value={block.completed}
        onValueChange={(v) => onUpdate({ ...block, completed: v })}
        trackColor={{ true: Colors.sage, false: Colors.border }}
        thumbColor={Colors.white}
      />
      <TextInput
        style={[styles.textInput, styles.actionText, block.completed && styles.strikethrough]}
        value={block.content}
        onChangeText={(t) => onUpdate({ ...block, content: t })}
        placeholder="Action item..."
        placeholderTextColor={Colors.barkBrown + '60'}
      />
    </View>
  );
}

function VoiceBlockContent({ block }: { block: VoiceBlock }) {
  const secs = Math.round(block.durationMs / 1000);
  return (
    <View style={styles.voiceRow}>
      <Text style={styles.voiceIcon}>🎙</Text>
      <View>
        <Text style={styles.voiceLabel}>{block.label ?? 'Voice memo'}</Text>
        <Text style={styles.voiceMeta}>{secs}s · stored on this device only</Text>
      </View>
    </View>
  );
}

function ImageBlockContent({ block }: { block: ImageBlock }) {
  return (
    <View style={styles.voiceRow}>
      <Text style={styles.voiceIcon}>🖼</Text>
      <Text style={styles.voiceLabel}>{block.caption ?? 'Photo'}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    shadowColor: Colors.earthBrown,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    shadowOpacity: 0.18,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  handle: {
    paddingRight: 10,
    paddingTop: 2,
  },
  handleIcon: {
    fontSize: 18,
    color: Colors.barkBrown + '60',
  },
  content: {
    flex: 1,
  },
  delete: {
    paddingLeft: 10,
  },
  deleteIcon: {
    fontSize: 22,
    color: Colors.barkBrown + '60',
  },
  textInput: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
    lineHeight: 22,
    minHeight: 40,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voiceIcon: {
    fontSize: 24,
  },
  voiceLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: Colors.earthBrown,
  },
  voiceMeta: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.barkBrown,
    marginTop: 2,
  },
});
