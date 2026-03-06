import { useSubscription } from '../stores/subscription-store';
import { useSessionStore } from '../stores/session-store';

const FREE_SESSION_LIMIT = 10;

export function useEntitlement() {
  const isPro = useSubscription((s) => s.isPro);
  const sessionCount = useSessionStore((s) => s.cards.length);
  const canAddSession = isPro || sessionCount < FREE_SESSION_LIMIT;
  const canExportPDF = isPro;
  const canViewPatterns = isPro;

  return { isPro, sessionCount, canAddSession, canExportPDF, canViewPatterns };
}
