import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'tb_license';

// UUID v4 format check — necessary but not sufficient; server validates ownership
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Server-side license validation endpoint
const LICENSE_VALIDATE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'https://therapybinder.app') + '/api/validate';

/**
 * Validate a license key against the server.
 * Returns true only if the server confirms the key is active.
 * Falls back to false on network error so users aren't silently granted Pro.
 */
async function validateLicenseWithServer(key: string): Promise<boolean> {
  try {
    const res = await fetch(LICENSE_VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.valid === true;
  } catch {
    // Network unavailable — reject rather than silently grant Pro
    return false;
  }
}

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
    const trimmed = key.trim();
    // Client-side format check first (fast fail for obvious garbage)
    if (!UUID_V4_RE.test(trimmed)) return false;
    // Server-side validation — confirms key was actually purchased
    const valid = await validateLicenseWithServer(trimmed);
    if (!valid) return false;
    const state = { isPro: true, licenseKey: trimmed, activatedAt: new Date().toISOString() };
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
