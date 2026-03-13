import { useSubscription } from '../stores/subscription-store';
import { useSessionStore } from '../stores/session-store';

export const FREE_SESSION_LIMIT = 10;

export function useEntitlement() {
  const isPro = useSubscription((s) => s.isPro);
  const sessionCount = useSessionStore((s) => s.cards.length);
  const canAddSession = isPro || sessionCount < FREE_SESSION_LIMIT;
  const canExportPDF = isPro;
  const canViewPatterns = isPro;
  const canUseCustomTags = isPro;
  const canExport = isPro;

  return { isPro, sessionCount, canAddSession, canExportPDF, canViewPatterns, canUseCustomTags, canExport };
}
