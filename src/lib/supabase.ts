import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env',
  );
}

// Wrap fetch with a hard timeout so a silently-hung socket surfaces as a
// real error instead of leaving every UI awaiting it forever. React Native's
// fetch doesn't honour the default request timeout in all network conditions,
// so we enforce one via AbortController.
const REQUEST_TIMEOUT_MS = 10_000;
// [diag] Process-relative clock so events from different files share an origin.
const DIAG_T0 = Date.now();
const tag = () => `+${Date.now() - DIAG_T0}ms`;
const fetchWithTimeout: typeof fetch = (input, init = {}) => {
  const controller = new AbortController();
  const upstreamSignal = init.signal;
  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort(upstreamSignal.reason);
    else upstreamSignal.addEventListener('abort', () => controller.abort(upstreamSignal.reason));
  }
  const timer = setTimeout(() => controller.abort(new Error('supabase fetch timeout')), REQUEST_TIMEOUT_MS);

  // [diag] Log every supabase HTTP request with timing + path so we can
  // correlate auth refresh, getSession, refreshProfile, fetchFeed on cold-start.
  const t0 = Date.now();
  const rawUrl =
    typeof input === 'string'
      ? input
      : input instanceof Request
        ? input.url
        : (input as URL).toString();
  let path = rawUrl;
  try {
    path = new URL(rawUrl).pathname;
  } catch {}
  console.log(`[diag] ${tag()} fetch START ${path}`);

  return fetch(input, { ...init, signal: controller.signal })
    .then((res) => {
      console.log(`[diag] ${tag()} fetch OK    ${path} ${res.status} (${Date.now() - t0}ms)`);
      return res;
    })
    .catch((err) => {
      console.warn(
        `[diag] ${tag()} fetch FAIL  ${path} (${Date.now() - t0}ms) ${err?.message ?? err}`,
      );
      throw err;
    })
    .finally(() => clearTimeout(timer));
};

export const __diagTag = tag;

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

// Supabase RN guidance: pause auto-refresh while backgrounded so the refresh
// timer doesn't race with the OS suspending the JS thread (which is a common
// cause of subsequent requests hanging on the auth lock).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
