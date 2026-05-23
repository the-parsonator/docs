import posthog from "posthog-js";

let initialised = false;

export function initPostHog() {
  if (initialised || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  if (!key) return;
  posthog.init(key, { api_host: host, capture_pageview: false });
  initialised = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}
