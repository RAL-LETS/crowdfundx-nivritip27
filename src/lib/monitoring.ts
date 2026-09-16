/**
 * monitoring.ts
 * Centralised error tracking (Sentry) and product analytics (PostHog).
 * Both are loaded from environment variables only — no keys are hardcoded.
 * When env vars are absent the helpers are safe no-ops.
 */

// ---------- Sentry ----------
let sentryLoaded = false;

async function loadSentry() {
  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN;
  if (!dsn || sentryLoaded) return;
  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn,
      environment: (import.meta as any).env?.MODE ?? 'production',
      tracesSampleRate: 0.2,
    });
    sentryLoaded = true;
  } catch {
    // Sentry package not installed — silently ignore
  }
}

// ---------- PostHog ----------
let posthogLoaded = false;

async function loadPostHog() {
  const key = (import.meta as any).env?.VITE_POSTHOG_KEY;
  const host = (import.meta as any).env?.VITE_POSTHOG_HOST ?? 'https://app.posthog.com';
  if (!key || posthogLoaded) return;
  try {
    const { default: posthog } = await import('posthog-js');
    posthog.init(key, { api_host: host, autocapture: false });
    posthogLoaded = true;
  } catch {
    // PostHog package not installed — silently ignore
  }
}

/** Call once at application start in main.tsx */
export async function initMonitoring() {
  await Promise.allSettled([loadSentry(), loadPostHog()]);
}

/**
 * Track a named product event (page views, button clicks, transactions).
 * No-ops when PostHog is not configured.
 */
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  try {
    // PostHog
    if (posthogLoaded) {
      import('posthog-js').then(({ default: posthog }) => {
        posthog.capture(name, properties);
      }).catch(() => {});
    }
  } catch {
    // Never crash the app because of analytics
  }
}

/**
 * Capture an exception and send it to Sentry.
 * No-ops when Sentry is not configured.
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  try {
    if (sentryLoaded) {
      import('@sentry/react').then((Sentry) => {
        Sentry.withScope((scope) => {
          if (context) {
            Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
          }
          Sentry.captureException(error);
        });
      }).catch(() => {});
    }
  } catch {
    // Never crash the app because of monitoring
  }
}
