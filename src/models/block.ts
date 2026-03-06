/**
 * Block union type — the building blocks of a session entry.
 * Order within a session is tracked by the `order` field.
 */

export type BlockType = 'insight' | 'text' | 'voice' | 'action' | 'image';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

/** Bold one-sentence summary — the north star of the session */
export interface InsightBlock extends BaseBlock {
  type: 'insight';
  content: string; // encrypted at rest
}

/** Free-form notes */
export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string; // encrypted at rest
}

/** Voice memo — local device only, never synced */
export interface VoiceBlock extends BaseBlock {
  type: 'voice';
  localUri: string;       // file:// path, never encrypted, never uploaded
  durationMs: number;
  label?: string;
}

/** Action item with completion toggle */
export interface ActionBlock extends BaseBlock {
  type: 'action';
  content: string;  // encrypted at rest
  completed: boolean;
}

/** Photo with optional caption */
export interface ImageBlock extends BaseBlock {
  type: 'image';
  localUri: string;   // local image, not synced
  caption?: string;   // encrypted at rest
}

export type Block =
  | InsightBlock
  | TextBlock
  | VoiceBlock
  | ActionBlock
  | ImageBlock;
