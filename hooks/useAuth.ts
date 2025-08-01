import {
  signOut as authSignOut,
  getCurrentSession,
  supabase,
} from "@/lib/supabase";
import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    error: null,
  });

  // Clear error state
  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  // Simple sign out
  const signOut = useCallback(async () => {
    try {
      await authSignOut();
      setAuthState({
        user: null,
        session: null,
        loading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error("Sign out error:", error);
      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sign out failed",
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session, error } = await getCurrentSession();

        if (!mounted) return;

        if (error) {
          console.error("Failed to get initial session:", error);
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false,
            error: "Failed to restore session",
          });
          return;
        }

        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
          isAuthenticated: !!session?.user,
          error: null,
        });
      } catch (error) {
        if (!mounted) return;

        console.error("Session initialization error:", error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false,
          error: "Authentication initialization failed",
        });
      }
    };

    // Listen for auth changes
    const setupAuthListener = () => {
      authSubscription = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (!mounted) return;

          console.log("Auth event:", event, session?.user?.email);

          setAuthState({
            user: session?.user ?? null,
            session: session,
            loading: false,
            isAuthenticated: !!session?.user,
            error: null,
          });
        }
      );
    };

    getInitialSession();
    setupAuthListener();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // App state change monitoring for token refresh
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active" && authState.isAuthenticated) {
        supabase.auth.startAutoRefresh();
      } else if (nextAppState === "background") {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [authState.isAuthenticated]);

  return {
    // State
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    isAuthenticated: authState.isAuthenticated,
    error: authState.error,

    // Actions
    signOut,
    clearError,

    // Computed values
    isLoggedIn: authState.isAuthenticated && authState.user !== null,
    userEmail: authState.user?.email || null,
    userId: authState.user?.id || null,
    userDisplayName: authState.user?.user_metadata?.full_name || "",
    isEmailVerified: authState.user?.email_confirmed_at ? true : false,
  };
}
