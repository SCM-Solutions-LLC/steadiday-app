import { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { logger } from "../utils/logger";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error: string | null }>;
  signInWithAppleIdToken: (
    identityToken: string,
    fullName?: string
  ) => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isConfigured: false,
  signInWithEmail: async () => ({ error: "Auth not configured" }),
  signUpWithEmail: async () => ({ error: "Auth not configured" }),
  signInWithAppleIdToken: async () => ({ error: "Auth not configured" }),
  sendPasswordReset: async () => ({ error: "Auth not configured" }),
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) logger.error("[AuthContext] getSession error:", error.message);
        setSession(data.session ?? null);
      })
      .catch((error) => {
        logger.error("[AuthContext] getSession threw:", error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: "Sign-in is not available yet." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!isSupabaseConfigured)
        return { error: "Sign-up is not available yet." };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { full_name: displayName } : undefined,
        },
      });
      return { error: error?.message ?? null };
    },
    []
  );

  const signInWithAppleIdToken = useCallback(
    async (identityToken: string, fullName?: string) => {
      if (!isSupabaseConfigured)
        return { error: "Sign-in is not available yet." };
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
        options: fullName ? { data: { full_name: fullName } } : undefined,
      } as Parameters<typeof supabase.auth.signInWithIdToken>[0]);
      return { error: error?.message ?? null };
    },
    []
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!isSupabaseConfigured)
      return { error: "Password reset is not available yet." };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "steadiday://auth/callback",
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.auth.getSession();
    setSession(data.session ?? null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: isSupabaseConfigured,
      signInWithEmail,
      signUpWithEmail,
      signInWithAppleIdToken,
      sendPasswordReset,
      signOut,
      refreshSession,
    }),
    [
      session,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithAppleIdToken,
      sendPasswordReset,
      signOut,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
