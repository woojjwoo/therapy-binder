/**
 * Auth store — onboarding + unlock state.
 * The master CryptoKey NEVER touches disk.
 */

import { create } from 'zustand';
import { getMeta, setMeta } from '../db';
import { METADATA_KEYS } from '../db/schema';
import type { CryptoKey } from '../crypto/aes-gcm';

interface OnboardingData {
  saltHex: string;
  mnemonic: string;
  passphrase?: string; // held briefly to store in SecureStore after confirm
}

interface AuthState {
  masterKey: CryptoKey | null; // Uint8Array
  isUnlocked: boolean;
  onboarding: OnboardingData | null;
  onboardingComplete: boolean;
  metaLoaded: boolean; // true once loadMeta() has resolved

  unlock: (key: CryptoKey) => void;
  lock: () => void;
  setOnboarding: (data: OnboardingData) => void;
  completeOnboarding: (saltHex: string) => Promise<void>;
  loadMeta: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  masterKey: null,
  isUnlocked: false,
  onboarding: null,
  onboardingComplete: false,
  metaLoaded: false,

  unlock: (key: CryptoKey) =>
    set({ masterKey: key, isUnlocked: true }),

  lock: () =>
    set({ masterKey: null, isUnlocked: false }),

  setOnboarding: (data: OnboardingData) =>
    set({ onboarding: data }),

  completeOnboarding: async (saltHex: string) => {
    const { onboarding } = get();

    // Persist salt if present (passphrase flow)
    if (saltHex) {
      await setMeta(METADATA_KEYS.SALT, saltHex);
    }

    // Persist passphrase securely if present
    if (onboarding?.passphrase) {
      const { storePassphraseSecurely } = await import('../crypto/secure-key');
      await storePassphraseSecurely(onboarding.passphrase);
    }

    await setMeta(METADATA_KEYS.SCHEMA_VERSION, '1');
    await setMeta('onboarding_complete', 'true');
    set({ onboardingComplete: true, onboarding: null });
  },

  loadMeta: async () => {
    try {
      const complete = await getMeta('onboarding_complete');
      set({ onboardingComplete: complete === 'true', metaLoaded: true });
    } catch {
      set({ onboardingComplete: false, metaLoaded: true });
    }
  },
}));
