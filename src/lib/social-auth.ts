import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Apple Sign-In via Supabase. iOS only.
 * Requires:
 *  - expo-apple-authentication plugin in app.json
 *  - "Sign in with Apple" capability on the bundle ID
 *  - Apple provider enabled in Supabase Auth dashboard with the same Service ID
 */
export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS.');
  }
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token.');
  }
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
  return data;
}

/**
 * Google Sign-In via Supabase OAuth + Expo AuthSession.
 * Uses Supabase's OAuth start endpoint and a deep link redirect back to the app.
 *
 * Setup:
 *  - Supabase dashboard → Authentication → Providers → Google → enable, fill client id/secret
 *  - Add "angelica://auth-callback" to the allowed redirect URLs in Supabase
 */
export async function signInWithGoogle() {
  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'angelica',
    path: 'auth-callback',
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Supabase did not return an OAuth URL.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Google sign-in was cancelled.');
  }

  // Supabase returns either a code (PKCE) or a hash with access/refresh tokens.
  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return;
  }
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    const { error: setError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (setError) throw setError;
    return;
  }
  throw new Error('OAuth callback did not return tokens.');
}

// Re-export for places that want to noop-import to keep tree-shaking happy.
export const _appleAuthAvailable = AppleAuthentication.isAvailableAsync;
export { Crypto };
