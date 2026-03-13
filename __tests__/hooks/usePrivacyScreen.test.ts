/**
 * @jest-environment jsdom
 *
 * Tests for usePrivacyScreen hook
 */

// Enable React act() environment
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { renderHook, act } from '@testing-library/react-hooks';
import { Platform, Linking } from 'react-native';

// ── Mocks ──────────────────────────────────────────────────────────

const mockIsSupported = jest.fn<Promise<boolean>, []>();
const mockIsEnabled = jest.fn<Promise<boolean>, []>();
const mockSetEnabled = jest.fn<Promise<void>, [boolean]>();

jest.mock('../../modules/privacy-screen', () => ({
  __esModule: true,
  default: {
    isSupported: () => mockIsSupported(),
    isEnabled: () => mockIsEnabled(),
    setEnabled: (v: boolean) => mockSetEnabled(v),
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Linking: {
    openURL: jest.fn(),
    openSettings: jest.fn(),
    sendIntent: jest.fn(),
  },
}));

const mockSetPrivacyScreenEnabled = jest.fn();
let storeState = { privacyScreenEnabled: false };

jest.mock('../../src/stores/settings-store', () => ({
  useSettingsStore: () => ({
    ...storeState,
    setPrivacyScreenEnabled: mockSetPrivacyScreenEnabled,
  }),
}));

// Import hook after mocks are set up
import { usePrivacyScreen } from '../../src/hooks/usePrivacyScreen';

// ── Helpers ────────────────────────────────────────────────────────

function setPlatform(os: string) {
  (Platform as any).OS = os;
}

/** Flush all pending microtasks / promises */
const flushPromises = () => new Promise<void>((r) => setTimeout(r, 0));

beforeEach(() => {
  jest.clearAllMocks();
  setPlatform('android');
  storeState = { privacyScreenEnabled: false };
  mockIsSupported.mockResolvedValue(true);
  mockIsEnabled.mockResolvedValue(false);
  mockSetEnabled.mockResolvedValue(undefined);
});

// ── Tests ──────────────────────────────────────────────────────────

describe('usePrivacyScreen', () => {
  describe('supported Samsung device', () => {
    beforeEach(() => {
      mockIsSupported.mockResolvedValue(true);
      mockIsEnabled.mockResolvedValue(false);
    });

    it('isSupported returns true', async () => {
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });
      expect(result.current.isSupported).toBe(true);
    });

    it('isEnabled returns current state', async () => {
      mockIsEnabled.mockResolvedValue(true);
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });
      expect(result.current.isEnabled).toBe(true);
    });

    it('toggle() calls setEnabled(!current) and updates state', async () => {
      mockIsEnabled.mockResolvedValue(false);
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });

      await act(async () => {
        await result.current.toggle();
      });

      expect(mockSetEnabled).toHaveBeenCalledWith(true);
      expect(result.current.isEnabled).toBe(true);
    });

    it('toggle() when WRITE_SETTINGS not granted opens system settings', async () => {
      mockIsEnabled.mockResolvedValue(false);
      mockSetEnabled.mockRejectedValue({ code: 'WRITE_SETTINGS_NOT_GRANTED', message: 'WRITE_SETTINGS permission not granted' });
      (Linking.sendIntent as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });

      await act(async () => {
        await result.current.toggle();
      });

      expect(Linking.sendIntent).toHaveBeenCalledWith(
        'android.settings.action.MANAGE_WRITE_SETTINGS',
        [{ key: 'uri', value: 'package:com.therapybinder.app' }],
      );
      expect(result.current.error).toBe('Permission required');
    });

    it('toggle() falls back to openSettings if sendIntent throws', async () => {
      mockIsEnabled.mockResolvedValue(false);
      mockSetEnabled.mockRejectedValue({ code: 'WRITE_SETTINGS_NOT_GRANTED', message: 'WRITE_SETTINGS' });
      (Linking.sendIntent as jest.Mock).mockRejectedValue(new Error('not available'));
      (Linking.openSettings as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });

      await act(async () => {
        await result.current.toggle();
      });

      expect(Linking.openSettings).toHaveBeenCalled();
    });
  });

  describe('unsupported / non-Samsung device', () => {
    it('isSupported is false when native module says unsupported', async () => {
      mockIsSupported.mockResolvedValue(false);
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });
      expect(result.current.isSupported).toBe(false);
    });

    it('toggle() is a no-op when not supported', async () => {
      mockIsSupported.mockResolvedValue(false);
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });

      await act(async () => {
        await result.current.toggle();
      });

      expect(mockSetEnabled).not.toHaveBeenCalled();
    });

    it('isEnabled is always false on non-Android', async () => {
      setPlatform('ios');
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });
      expect(result.current.isSupported).toBe(false);
      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('error handling', () => {
    it('setEnabled() throws → error state is set', async () => {
      mockSetEnabled.mockRejectedValue(new Error('Hardware failure'));

      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });

      await act(async () => {
        await result.current.toggle();
      });

      expect(result.current.error).toBe('Hardware failure');
    });

    it('isSupported() throws → graceful fallback to false', async () => {
      mockIsSupported.mockRejectedValue(new Error('crash'));
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });

      expect(result.current.isSupported).toBe(false);
      expect(result.current.error).toBe('crash');
    });
  });

  describe('settings store persistence', () => {
    it('toggle to true → setPrivacyScreenEnabled(true)', async () => {
      mockIsEnabled.mockResolvedValue(false);
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });

      await act(async () => {
        await result.current.toggle();
      });

      expect(mockSetPrivacyScreenEnabled).toHaveBeenCalledWith(true);
    });

    it('toggle to false → setPrivacyScreenEnabled(false)', async () => {
      mockIsEnabled.mockResolvedValue(true);
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });

      await act(async () => {
        await result.current.toggle();
      });

      expect(mockSetPrivacyScreenEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('loading states', () => {
    it('loading is true initially and false after init completes', async () => {
      let resolveSupported!: (v: boolean) => void;
      mockIsSupported.mockImplementation(() => new Promise((r) => { resolveSupported = r; }));

      const { result } = renderHook(() => usePrivacyScreen());
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveSupported(false);
        await flushPromises();
      });

      expect(result.current.loading).toBe(false);
    });

    it('loading is false after init on non-Android', async () => {
      setPlatform('ios');
      const { result } = renderHook(() => usePrivacyScreen());
      await act(async () => { await flushPromises(); });
      expect(result.current.loading).toBe(false);
    });
  });
});
