import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'tb_license';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface SubscriptionState {
  isPro: boolean;
  licenseKey: string | null;
  activatedAt: string | null;
  loaded: boolean;

  activateLicense: (key: string) => Promise<boolean>;
  deactivateLicense: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

// In-memory fallback for Expo Go
const mem = new Map<string, string>();

async function persist(state: { isPro: boolean; licenseKey: string | null; activatedAt: string | null }) {
  const json = JSON.stringify(state);
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, json);
  } catch {
    mem.set(STORAGE_KEY, json);
  }
}

async function load(): Promise<{ isPro: boolean; licenseKey: string | null; activatedAt: string | null }> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    const raw = mem.get(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  }
  return { isPro: false, licenseKey: null, activatedAt: null };
}

export const useSubscription = create<SubscriptionState>((set) => ({
  isPro: false,
  licenseKey: null,
  activatedAt: null,
  loaded: false,

  activateLicense: async (key: string) => {
    if (!UUID_V4_RE.test(key.trim())) return false;
    const state = { isPro: true, licenseKey: key.trim(), activatedAt: new Date().toISOString() };
    await persist(state);
    set({ ...state, loaded: true });
    return true;
  },

  deactivateLicense: async () => {
    const state = { isPro: false, licenseKey: null, activatedAt: null };
    await persist(state);
    set({ ...state, loaded: true });
  },

  checkSubscription: async () => {
    const state = await load();
    set({ ...state, loaded: true });
  },
}));
