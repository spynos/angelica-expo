import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/src/lib/supabase';
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

/**
 * Bootstrap auth on app start: read persisted session, subscribe to changes,
 * fetch profile. Returns true once initial state is settled so the splash
 * screen can hide without flashing the wrong route.
 */
export function useAuthBootstrap() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      useAuthStore.setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });
      if (data.session?.user) {
        await useAuthStore.getState().refreshProfile();
      }
      if (!cancelled) setReady(true);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      useAuthStore.setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
      if (session?.user) {
        await useAuthStore.getState().refreshProfile();
      } else {
        useAuthStore.setState({ profile: null });
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return ready;
}
