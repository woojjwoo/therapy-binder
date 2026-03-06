import type { Block } from './block';

export interface SessionEntry {
  id: string;
  blocks: Block[];
  moodScore: number;      // 1–10
  tags: string[];
  createdAt: string;      // ISO timestamp
  updatedAt: string;
}

/** What gets encrypted and stored/synced — text fields only */
export interface SessionEncryptedPayload {
  blocks: Block[];        // voice/image localUri fields are stripped before encrypt
  tags: string[];
  moodScore: number;
}
