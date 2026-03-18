/**
 * useIAP.ts
 * React hook wrapping the IAP store with loading/error states.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initIAP,
  getProducts,
  purchaseProduct,
  restorePurchases,
  PRODUCT_IDS,
  type IAPProduct,
  type ProductId,
} from '../stores/iap-store';

export type IAPError =
  | 'IAP_NOT_AVAILABLE_IN_EXPO_GO'
  | 'LOAD_FAILED'
  | 'PURCHASE_FAILED'
  | 'RESTORE_FAILED'
  | 'USER_CANCELED'
  | null;

export interface UseIAPResult {
  /** Whether IAP is available in the current environment */
  isAvailable: boolean;
  /** Whether products are currently loading */
  loading: boolean;
  /** Whether a purchase is in progress */
  purchasing: boolean;
  /** Whether restore is in progress */
  restoring: boolean;
  /** Loaded StoreKit products */
  products: IAPProduct[];
  /** Current error state */
  error: IAPError;
  /** Monthly product (convenience accessor) */
  monthlyProduct: IAPProduct | null;
  /** Annual product (convenience accessor) */
  annualProduct: IAPProduct | null;
  /** Trigger a purchase for a product ID */
  purchase: (productId: ProductId) => Promise<void>;
  /** Restore previous purchases */
  restore: () => Promise<boolean>;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Detect Expo Go environment where IAP is unavailable.
 */
function checkIsExpoGo(): boolean {
  try {
    const Constants = require('expo-constants').default;
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
}

export function useIAP(): UseIAPResult {
  const isAvailable = !checkIsExpoGo();
  const [loading, setLoading] = useState(isAvailable);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [error, setError] = useState<IAPError>(
    isAvailable ? null : 'IAP_NOT_AVAILABLE_IN_EXPO_GO'
  );

  // Load products on mount
  useEffect(() => {
    if (!isAvailable) return;

    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        const prods = await getProducts();
        if (!cancelled) {
          setProducts(prods);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === 'IAP_NOT_AVAILABLE_IN_EXPO_GO') {
            setError('IAP_NOT_AVAILABLE_IN_EXPO_GO');
          } else {
            setError('LOAD_FAILED');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [isAvailable]);

  const purchase = useCallback(async (productId: ProductId) => {
    try {
      setPurchasing(true);
      setError(null);
      await purchaseProduct(productId);
      // Purchase result handled asynchronously by the listener in iap-store
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancel') || msg.includes('USER_CANCELED')) {
        setError('USER_CANCELED');
      } else if (msg === 'IAP_NOT_AVAILABLE_IN_EXPO_GO') {
        setError('IAP_NOT_AVAILABLE_IN_EXPO_GO');
      } else {
        setError('PURCHASE_FAILED');
        throw err; // Re-throw so callers can show alerts
      }
    } finally {
      setPurchasing(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      setRestoring(true);
      setError(null);
      const restored = await restorePurchases();
      return restored;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'IAP_NOT_AVAILABLE_IN_EXPO_GO') {
        setError('IAP_NOT_AVAILABLE_IN_EXPO_GO');
      } else {
        setError('RESTORE_FAILED');
      }
      return false;
    } finally {
      setRestoring(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const monthlyProduct =
    products.find((p) => p.productId === PRODUCT_IDS.monthly) ?? null;
  const annualProduct =
    products.find((p) => p.productId === PRODUCT_IDS.annual) ?? null;

  return {
    isAvailable,
    loading,
    purchasing,
    restoring,
    products,
    error,
    monthlyProduct,
    annualProduct,
    purchase,
    restore,
    clearError,
  };
}
