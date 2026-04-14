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
const fetchWithTimeout: typeof fetch = (input, init = {}) => {
  const controller = new AbortController();
  const upstreamSignal = init.signal;
  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort(upstreamSignal.reason);
    else upstreamSignal.addEventListener('abort', () => controller.abort(upstreamSignal.reason));
  }
  const timer = setTimeout(() => controller.abort(new Error('supabase fetch timeout')), REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

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
