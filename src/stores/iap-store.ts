/**
 * iap-store.ts
 * Apple In-App Purchase (StoreKit) integration via expo-in-app-purchases.
 * Replaces the Stripe web checkout flow for App Store 3.1.1 compliance.
 */

import * as InAppPurchases from 'expo-in-app-purchases';
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

let isConnected = false;
let purchaseListener: (() => void) | null = null;

/**
 * Detect if running in Expo Go (where expo-in-app-purchases doesn't work).
 * expo-in-app-purchases throws when connectAsync is called in Expo Go.
 */
function isExpoGo(): boolean {
  try {
    // expo-constants Application.applicationId is 'host.exp.exponent' in Expo Go
    const Constants = require('expo-constants').default;
    return Constants.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
}

/**
 * Initialize the IAP connection. Must be called before any purchase operations.
 * Safe to call multiple times — will no-op if already connected.
 */
export async function initIAP(): Promise<void> {
  if (isExpoGo()) {
    throw new Error('IAP_NOT_AVAILABLE_IN_EXPO_GO');
  }
  if (isConnected) return;

  await InAppPurchases.connectAsync();
  isConnected = true;

  // Set up a purchase update listener to handle transactions
  InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
      for (const purchase of results) {
        if (!purchase.acknowledged) {
          // Unlock Pro on successful purchase
          _handleSuccessfulPurchase(purchase).catch(console.error);
        }
      }
    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      // User cancelled — no action needed
    } else if (responseCode === InAppPurchases.IAPResponseCode.DEFERRED) {
      // Purchase is pending (e.g., Ask to Buy) — do nothing, wait for completion
    } else {
      console.warn('[IAP] Purchase listener error', { responseCode, errorCode });
    }
  });
}

/**
 * Handle a successful StoreKit purchase by unlocking Pro in the subscription store.
 * We activate via the iap path (not license key), so we bypass the license server.
 */
async function _handleSuccessfulPurchase(
  purchase: InAppPurchases.InAppPurchase
): Promise<void> {
  try {
    // Finish the transaction to avoid it being reprocessed
    await InAppPurchases.finishTransactionAsync(purchase, true);

    // Activate Pro directly in the subscription store
    // Since this is a real StoreKit purchase, we bypass license key validation
    const { activateLicense } = useSubscription.getState();
    await _activateProFromIAP();
  } catch (err) {
    console.error('[IAP] Failed to finalize purchase', err);
  }
}

/**
 * Activates Pro status from a successful IAP purchase (bypasses license key server).
 * Uses the subscription store's internal persist mechanism directly.
 */
async function _activateProFromIAP(): Promise<void> {
  const store = useSubscription.getState();
  // We use a special IAP marker key so we can distinguish IAP vs license key
  // The subscription store's activateLicense validates UUID format, so we call
  // the internal state directly instead.
  useSubscription.setState({
    isPro: true,
    licenseKey: 'iap-storekit',
    activatedAt: new Date().toISOString(),
    loaded: true,
  });

  // Persist via SecureStore
  const SecureStore = require('expo-secure-store');
  const json = JSON.stringify({
    isPro: true,
    licenseKey: 'iap-storekit',
    activatedAt: new Date().toISOString(),
  });
  try {
    await SecureStore.setItemAsync('tb_license', json);
  } catch {
    // Fallback silently — state is still updated in memory
  }
}

/**
 * Fetch product details from the App Store.
 * Returns formatted product info with real prices.
 */
export async function getProducts(): Promise<IAPProduct[]> {
  if (isExpoGo()) {
    throw new Error('IAP_NOT_AVAILABLE_IN_EXPO_GO');
  }

  await initIAP();

  const { responseCode, results } = await InAppPurchases.getProductsAsync([
    PRODUCT_IDS.monthly,
    PRODUCT_IDS.annual,
  ]);

  if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results) {
    throw new Error(`Failed to fetch products (code ${responseCode})`);
  }

  return results.map((p) => ({
    productId: p.productId,
    title: p.title,
    description: p.description,
    price: p.price,
    priceAmountMicros: p.priceAmountMicros,
    priceCurrencyCode: p.priceCurrencyCode,
  }));
}

/**
 * Initiate a purchase for the given product ID.
 * The purchase listener (set in initIAP) handles the result asynchronously.
 */
export async function purchaseProduct(productId: ProductId): Promise<void> {
  if (isExpoGo()) {
    throw new Error('IAP_NOT_AVAILABLE_IN_EXPO_GO');
  }

  await initIAP();
  await InAppPurchases.purchaseItemAsync(productId);
  // Result is handled asynchronously by the purchase listener
}

/**
 * Restore previously purchased subscriptions.
 * Useful when a user reinstalls the app or switches devices.
 */
export async function restorePurchases(): Promise<boolean> {
  if (isExpoGo()) {
    throw new Error('IAP_NOT_AVAILABLE_IN_EXPO_GO');
  }

  await initIAP();

  const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

  if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
    throw new Error(`Failed to restore purchases (code ${responseCode})`);
  }

  if (!results || results.length === 0) {
    return false; // No previous purchases found
  }

  // Check if any of our products were purchased
  const hasPro = results.some(
    (p) =>
      p.productId === PRODUCT_IDS.monthly || p.productId === PRODUCT_IDS.annual
  );

  if (hasPro) {
    await _activateProFromIAP();
    return true;
  }

  return false;
}

/**
 * Disconnect from StoreKit. Call when the app is backgrounded or unmounted
 * (optional — typically not needed unless you want to free resources).
 */
export async function disconnectIAP(): Promise<void> {
  if (isConnected) {
    try {
      await InAppPurchases.disconnectAsync();
    } catch {
      // Ignore disconnect errors
    }
    isConnected = false;
  }
}
