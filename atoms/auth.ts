import { atom } from 'jotai';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const userAtom = atom<User | null>(null);
export const sessionAtom = atom<Session | null>(null);
export const authLoadingAtom = atom<boolean>(true);

export const signUpAtom = atom(
  null,
  async (get, set, { email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    // If user is confirmed immediately (email confirmation disabled), update state
    if (!error && data.session) {
      set(sessionAtom, data.session);
      set(userAtom, data.session.user);
    }
    
    return { error, data };
  }
);

export const signInAtom = atom(
  null,
  async (get, set, { email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.session) {
      set(sessionAtom, data.session);
      set(userAtom, data.session.user);
    }
    
    return { error };
  }
);

export const signOutAtom = atom(
  null,
  async (get, set) => {
    const { error } = await supabase.auth.signOut();
    
    if (!error) {
      set(sessionAtom, null);
      set(userAtom, null);
    }
    
    return { error };
  }
);

export const initAuthAtom = atom(
  null,
  async (get, set) => {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    set(sessionAtom, session);
    set(userAtom, session?.user ?? null);
    set(authLoadingAtom, false);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set(sessionAtom, session);
        set(userAtom, session?.user ?? null);
        set(authLoadingAtom, false);
      }
    );

    return () => subscription.unsubscribe();
  }
);