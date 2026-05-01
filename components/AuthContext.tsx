'use client';

import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { isAdminEmail } from '@/lib/admin';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

function cleanAuthUrl() {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const authKeys = ['error', 'error_code', 'error_description', 'code', 'state', 'sb'];
  let changed = false;

  for (const key of authKeys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    let hashChanged = false;

    for (const key of authKeys) {
      if (hashParams.has(key)) {
        hashParams.delete(key);
        hashChanged = true;
      }
    }

    if (hashChanged) {
      const nextHash = hashParams.toString();
      url.hash = nextHash ? `#${nextHash}` : '';
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  }
}

export function useAuth() {
  const value = React.useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    cleanAuthUrl();

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = React.useCallback(async () => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  }, []);

  const signOut = React.useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    cleanAuthUrl();
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const email = user?.email?.toLowerCase() ?? null;
  const displayName =
    (user?.user_metadata?.name as string | undefined)
    ?? (user?.user_metadata?.full_name as string | undefined)
    ?? email;
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined)
    ?? (user?.user_metadata?.picture as string | undefined)
    ?? null;
  const isAdmin = isAdminEmail(email);

  const value = React.useMemo<AuthContextValue>(() => ({
    user,
    session,
    email,
    displayName,
    avatarUrl,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut,
  }), [user, session, email, displayName, avatarUrl, loading, isAdmin, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
