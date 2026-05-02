import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { withTimeout } from '@/src/lib/async';
import { supabase, __diagTag as tag } from '@/src/lib/supabase';
import type { UserProfile } from '@/src/types/db';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
  refreshProfile: async () => {
    const userId = get().user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) set({ profile: data as UserProfile });
  },
}));

export type AuthBootstrapStatus =
  | 'idle'
  | 'session'
  | 'profile'
  | 'done'
  | 'timeout'
  | 'error';

const SESSION_TIMEOUT_MS = 6000;
const PROFILE_TIMEOUT_MS = 4000;

/**
 * Bootstrap auth on app start: read persisted session, subscribe to changes,
 * fetch profile. Returns `ready` once initial state is settled so the splash
 * screen can hide without flashing the wrong route, plus a `status` flag the
 * splash UI can surface to the user.
 *
 * The function never leaves `ready` false — on network/timeout failure it
 * resolves to a logged-out state so the app always reaches the main tree.
 */
export function useAuthBootstrap() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<AuthBootstrapStatus>('idle');

  useEffect(() => {
    let cancelled = false;

    const finish = (next: AuthBootstrapStatus) => {
      if (cancelled) return;
      setStatus(next);
      setReady(true);
    };

    const init = async () => {
      setStatus('session');
      let session: Session | null = null;
      const t0 = Date.now();
      console.log(`[diag] ${tag()} bootstrap.getSession START`);
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          'getSession',
        );
        console.log(
          `[diag] ${tag()} bootstrap.getSession OK (${Date.now() - t0}ms) hasSession=${!!data.session}`,
        );
        session = data.session ?? null;
      } catch (err) {
        console.warn(
          `[diag] ${tag()} bootstrap.getSession FAIL (${Date.now() - t0}ms)`,
          err,
        );
        console.warn('[auth] getSession failed, continuing as signed-out', err);
        if (!cancelled) {
          useAuthStore.setState({ session: null, user: null, loading: false });
          finish('timeout');
        }
        return;
      }

      if (cancelled) return;
      useAuthStore.setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });

      if (session?.user) {
        setStatus('profile');
        const t1 = Date.now();
        console.log(`[diag] ${tag()} bootstrap.refreshProfile START`);
        try {
          await withTimeout(
            useAuthStore.getState().refreshProfile(),
            PROFILE_TIMEOUT_MS,
            'refreshProfile',
          );
          console.log(
            `[diag] ${tag()} bootstrap.refreshProfile OK (${Date.now() - t1}ms)`,
          );
        } catch (err) {
          console.warn(
            `[diag] ${tag()} bootstrap.refreshProfile FAIL (${Date.now() - t1}ms)`,
            err,
          );
          // Profile fetch is non-critical; let the app start and retry later.
          console.warn('[auth] refreshProfile failed, continuing without profile', err);
        }
      }

      finish('done');
    };

    init().catch((err) => {
      console.error('[auth] bootstrap unexpected error', err);
      finish('error');
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        `[diag] ${tag()} onAuthStateChange event=${event} hasSession=${!!session}`,
      );
      useAuthStore.setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
      if (!session?.user) {
        useAuthStore.setState({ profile: null });
        return;
      }
      // INITIAL_SESSION is already covered by init() above; TOKEN_REFRESHED
      // doesn't change profile data. Refreshing here on cold-start used to
      // race init()'s refreshProfile and queue a duplicate request behind the
      // supabase-auth-js lock, which is the cold-start hang we hit when JWT
      // refresh got involved.
      if (event !== 'SIGNED_IN' && event !== 'USER_UPDATED') return;
      const t = Date.now();
      console.log(`[diag] ${tag()} onAuth.refreshProfile START (event=${event})`);
      try {
        await useAuthStore.getState().refreshProfile();
        console.log(`[diag] ${tag()} onAuth.refreshProfile OK (${Date.now() - t}ms)`);
      } catch (err) {
        console.warn(
          `[diag] ${tag()} onAuth.refreshProfile FAIL (${Date.now() - t}ms)`,
          err,
        );
        console.warn('[auth] refreshProfile on auth change failed', err);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { ready, status };
}
