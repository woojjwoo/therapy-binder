/**
 * Tests for the privacy-screen module bridge
 */

import { Platform } from 'react-native';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn(() => ({
    isSupported: jest.fn(),
    isEnabled: jest.fn(),
    setEnabled: jest.fn(),
  })),
}));

describe('privacy-screen module', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('exports', () => {
    it('exports isSupported, isEnabled, setEnabled', () => {
      (Platform as any).OS = 'android';
      const mod = require('../../modules/privacy-screen').default;
      expect(mod).toHaveProperty('isSupported');
      expect(mod).toHaveProperty('isEnabled');
      expect(mod).toHaveProperty('setEnabled');
    });
  });

  describe('iOS stub', () => {
    it('isSupported returns false on iOS', async () => {
      (Platform as any).OS = 'ios';
      const mod = require('../../modules/privacy-screen').default;
      expect(await mod.isSupported()).toBe(false);
    });

    it('isEnabled returns false on iOS', async () => {
      (Platform as any).OS = 'ios';
      const mod = require('../../modules/privacy-screen').default;
      expect(await mod.isEnabled()).toBe(false);
    });

    it('setEnabled is a no-op on iOS', async () => {
      (Platform as any).OS = 'ios';
      const mod = require('../../modules/privacy-screen').default;
      await expect(mod.setEnabled(true)).resolves.toBeUndefined();
    });
  });
});
