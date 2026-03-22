/**
 * Auth store — onboarding + unlock state.
 * The master CryptoKey NEVER touches disk.
 */

import { create } from 'zustand';
import { getMeta, setMeta, deleteAllSessions, deleteAllMetadata } from '../db';
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
  resetApp: () => Promise<void>;
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

    if (saltHex) {
      await setMeta(METADATA_KEYS.SALT, saltHex);
    }

    if (onboarding?.passphrase) {
      const { storePassphraseSecurely } = await import('../crypto/secure-key');
      await storePassphraseSecurely(onboarding.passphrase);
    }

    await setMeta(METADATA_KEYS.SCHEMA_VERSION, '1');
    await setMeta(METADATA_KEYS.ONBOARDING_COMPLETE, 'true');
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

  resetApp: async () => {
    const { clearSecureKeys } = await import('../crypto/secure-key');
    await deleteAllSessions();
    await deleteAllMetadata();
    await clearSecureKeys();
    set({
      masterKey: null,
      isUnlocked: false,
      onboarding: null,
      onboardingComplete: false,
    });
  },
}));
