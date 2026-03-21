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
  searchSessionsFts,
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
  searchResults: SessionCard[] | null;
  searching: boolean;

  loadTimeline: (key: CryptoKey) => Promise<void>;
  searchTimeline: (query: string, key: CryptoKey) => Promise<void>;
  clearSearch: () => void;
  loadSession: (id: string, key: CryptoKey) => Promise<void>;
  saveSession: (session: SessionEntry, key: CryptoKey) => Promise<void>;
  updateSession: (session: SessionEntry, key: CryptoKey) => Promise<void>;
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
  searchResults: null,
  searching: false,

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

  searchTimeline: async (query, key) => {
    set({ searching: true });
    try {
      // Sanitize for FTS5: wrap each term with quotes to avoid syntax errors
      const sanitized = query.trim().replace(/"/g, '');
      if (!sanitized) {
        set({ searchResults: null, searching: false });
        return;
      }
      const ftsQuery = sanitized
        .split(/\s+/)
        .map((term) => `"${term}"`)
        .join(' OR ');

      const matchingIds = await searchSessionsFts(ftsQuery);
      const rows = await listSessions();
      const matchedRows = rows.filter((r) => matchingIds.includes(r.id));
      const decrypted = await Promise.all(
        matchedRows.map((row) => decryptSession(row, key)),
      );
      const cards = decrypted
        .filter((s): s is DecryptedSession => s !== null)
        .map(toCard);
      set({ searchResults: cards, searching: false });
    } catch {
      set({ searching: false, searchResults: [] });
    }
  },

  clearSearch: () => set({ searchResults: null }),

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

  updateSession: async (session, key) => {
    await saveEncryptedSession(session, key);
    const card = toCard({
      id: session.id,
      moodScore: session.moodScore,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      blocks: session.blocks,
      tags: session.tags,
    });
    set((state) => ({
      cards: state.cards.map((c) => (c.id === session.id ? card : c)),
      currentSession: state.currentSession?.id === session.id
        ? { id: session.id, moodScore: session.moodScore, createdAt: session.createdAt, updatedAt: session.updatedAt, blocks: session.blocks, tags: session.tags }
        : state.currentSession,
    }));
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

// ─── Screenshot seed data (dev only) ─────────────────────────────────────────
export const SCREENSHOT_SEED_CARDS: SessionCard[] = [
  { id:'s1', moodScore:4, createdAt:new Date(Date.now()-1*86400000).toISOString(), insight:"Talked about my relationship with my mom. Starting to see patterns in how I respond to criticism — I shut down instead of communicating.", blockTypes:['insight','voice'], tags:['family','communication','patterns'] },
  { id:'s2', moodScore:3, createdAt:new Date(Date.now()-4*86400000).toISOString(), insight:"Explored my anxiety around work deadlines. Therapist suggested mindfulness before big meetings. Practiced box breathing.", blockTypes:['insight','text'], tags:['anxiety','work','mindfulness'] },
  { id:'s3', moodScore:5, createdAt:new Date(Date.now()-8*86400000).toISOString(), insight:"Best session yet. Breakthrough on understanding my avoidance behaviors. The journaling has been helping me see my own patterns.", blockTypes:['insight','text','voice'], tags:['breakthrough','patterns','growth'] },
  { id:'s4', moodScore:2, createdAt:new Date(Date.now()-12*86400000).toISOString(), insight:"Rough week. Discussed the panic attack I had on Monday. We traced it back to a conflict avoidance pattern from childhood.", blockTypes:['insight'], tags:['anxiety','panic','childhood'] },
  { id:'s5', moodScore:4, createdAt:new Date(Date.now()-18*86400000).toISOString(), insight:"Working on setting boundaries at work. Practiced saying no in role play. Feels uncomfortable but necessary.", blockTypes:['insight','text'], tags:['boundaries','work','assertiveness'] },
  { id:'s6', moodScore:3, createdAt:new Date(Date.now()-25*86400000).toISOString(), insight:"Processing grief around my dad. First time I cried in a session. Feels like progress even though it was hard.", blockTypes:['insight','voice'], tags:['grief','family','emotions'] },
  { id:'s7', moodScore:4, createdAt:new Date(Date.now()-32*86400000).toISOString(), insight:"Discussed sleep hygiene and how it connects to my mood. Making a plan to improve my routine.", blockTypes:['insight'], tags:['sleep','routine','mood'] },
];
