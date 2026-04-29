/**
 * Statsig integration — STRIPPED.
 *
 * All third-party analytics have been removed for privacy.
 * This file remains as a no-op shim so existing imports don't break.
 * The real analytics flow goes through `useAnalytics()` → local Umami.
 */

export function logEvent(
  _eventName: string,
  _rawMetadata?: any,
  _options?: {lake?: boolean},
) {}

export function useGate(): (_gateName: string, _options?: any) => boolean {
  return () => false
}

export function Provider({children}: {children: React.ReactNode}) {
  return children
}
