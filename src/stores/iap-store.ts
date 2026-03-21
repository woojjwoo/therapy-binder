/**
 * iap-store.ts
 * Apple In-App Purchase (StoreKit) integration via expo-in-app-purchases.
 * Gracefully stubs out in Expo Go / dev environments where the native module is unavailable.
 */

import { useSubscription } from './subscription-store';

export const PRODUCT_IDS = {
  monthly: 'com.briancobb.therapybinder.monthly',
  annual: 'com.briancobb.therapybinder.annual',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

const IAP_UNAVAILABLE = 'IAP_NOT_AVAILABLE_IN_EXPO_GO';

// Detect if native module is available
function isIAPAvailable(): boolean {
  try {
    const mod = require('expo-in-app-purchases');
    return !!mod?.connectAsync;
  } catch {
    return false;
  }
}

let _iap: typeof import('expo-in-app-purchases') | null = null;
function getIAP() {
  if (_iap) return _iap;
  try {
    _iap = require('expo-in-app-purchases');
    return _iap;
  } catch {
    return null;
  }
}

let purchaseListener: (() => void) | null = null;

export async function initIAP(): Promise<void> {
  const iap = getIAP();
  if (!iap) throw new Error(IAP_UNAVAILABLE);
  await iap.connectAsync();

  purchaseListener = iap.setPurchaseListener(async ({ responseCode, results }) => {
    if (responseCode === iap.IAPResponseCode.OK && results) {
      for (const purchase of results) {
        if (!purchase.acknowledged) {
          await iap.finishTransactionAsync(purchase, true);
          const { activateLicense } = useSubscription.getState();
          await activateLicense(purchase.productId);
        }
      }
    }
  });
}

export async function getProducts(): Promise<IAPProduct[]> {
  const iap = getIAP();
  if (!iap) throw new Error(IAP_UNAVAILABLE);
  const { responseCode, results } = await iap.getProductsAsync(Object.values(PRODUCT_IDS));
  if (responseCode !== iap.IAPResponseCode.OK || !results) return [];
  return results.map((p: any) => ({
    productId: p.productId,
    title: p.title,
    description: p.description,
    price: p.price,
    priceAmountMicros: p.priceAmountMicros,
    priceCurrencyCode: p.priceCurrencyCode,
  }));
}

export async function purchaseProduct(productId: ProductId): Promise<void> {
  const iap = getIAP();
  if (!iap) throw new Error(IAP_UNAVAILABLE);
  await iap.purchaseItemAsync(productId);
}

export async function restorePurchases(): Promise<void> {
  const iap = getIAP();
  if (!iap) throw new Error(IAP_UNAVAILABLE);
  const { responseCode, results } = await iap.getPurchaseHistoryAsync();
  if (responseCode === iap.IAPResponseCode.OK && results) {
    const { activateLicense } = useSubscription.getState();
    for (const purchase of results) {
      await activateLicense(purchase.productId);
    }
  }
}

export async function disconnectIAP(): Promise<void> {
  const iap = getIAP();
  if (!iap) return;
  if (purchaseListener) { purchaseListener(); purchaseListener = null; }
  try { await iap.disconnectAsync(); } catch {}
}
