/**
 * Session store — manages the list of decrypted session cards for the timeline,
 * individual session loading, and save/delete operations.
 *
 * All crypto operations go through storage/local encrypt/decrypt helpers.
 * The master key comes from the auth store — never stored here.
 */

import { create } from 'zustand';
import {
  listSessions,
  decryptSession,
  saveEncryptedSession,
  loadDecryptedSession,
  deleteSession,
  deleteAllSessions,
} from '../storage/local';
import type { DecryptedSession } from '../storage/local';
import type { CryptoKey } from '../crypto/aes-gcm';
import type { SessionEntry } from '../models/session';
import type { Block } from '../models/block';

export interface SessionCard {
  id: string;
  moodScore: number;
  createdAt: string;
  insight: string;
  blockTypes: string[];
  tags: string[];
}

interface SessionState {
  cards: SessionCard[];
  loading: boolean;
  currentSession: DecryptedSession | null;
  currentLoading: boolean;

  loadTimeline: (key: CryptoKey) => Promise<void>;
  loadSession: (id: string, key: CryptoKey) => Promise<void>;
  saveSession: (session: SessionEntry, key: CryptoKey) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  removeAll: () => Promise<void>;
  clearCurrent: () => void;
}

function toCard(s: DecryptedSession): SessionCard {
  const insightBlock = s.blocks.find((b) => b.type === 'insight');
  return {
    id: s.id,
    moodScore: s.moodScore,
    createdAt: s.createdAt,
    insight:
      insightBlock && 'content' in insightBlock
        ? insightBlock.content
        : '(no insight)',
    blockTypes: [
      ...new Set(
        s.blocks.map((b) => b.type).filter((t) => t !== 'insight'),
      ),
    ],
    tags: s.tags,
  };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  cards: [],
  loading: false,
  currentSession: null,
  currentLoading: false,

  loadTimeline: async (key) => {
    set({ loading: true });
    try {
      const rows = await listSessions();
      const decrypted = await Promise.all(
        rows.map((row) => decryptSession(row, key)),
      );
      const cards = decrypted
        .filter((s): s is DecryptedSession => s !== null)
        .map(toCard);
      set({ cards, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  loadSession: async (id, key) => {
    set({ currentLoading: true, currentSession: null });
    try {
      const session = await loadDecryptedSession(id, key);
      set({ currentSession: session, currentLoading: false });
    } catch {
      set({ currentLoading: false });
    }
  },

  saveSession: async (session, key) => {
    await saveEncryptedSession(session, key);
    // Optimistically add to timeline
    const card = toCard({
      id: session.id,
      moodScore: session.moodScore,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      blocks: session.blocks,
      tags: session.tags,
    });
    set((state) => ({ cards: [card, ...state.cards] }));
  },

  removeSession: async (id) => {
    await deleteSession(id);
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
      currentSession:
        state.currentSession?.id === id ? null : state.currentSession,
    }));
  },

  removeAll: async () => {
    await deleteAllSessions();
    set({ cards: [], currentSession: null });
  },

  clearCurrent: () => set({ currentSession: null }),
}));
