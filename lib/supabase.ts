import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Simple auth utilities with functional approach
const validateEmail = (email: string) => {
  if (!email || !email.includes("@")) {
    throw new Error("Please enter a valid email address");
  }
  return email.toLowerCase().trim();
};

const validatePassword = (password: string) => {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  return password;
};

const normalizeError = (error: any) => {
  const message = error?.message?.toLowerCase() || "";

  if (message.includes("invalid login credentials")) {
    return new Error("Invalid email or password. Please try again.");
  }
  if (message.includes("email not confirmed")) {
    return new Error("Please verify your email before signing in.");
  }
  if (message.includes("user already registered")) {
    return new Error("An account with this email already exists.");
  }
  if (message.includes("rate limit")) {
    return new Error("Too many attempts. Please wait and try again.");
  }

  return new Error(error?.message || "An unexpected error occurred");
};

// Simple retry function
const withRetry = async (operation: () => Promise<any>, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxAttempts) throw error;

      // Only retry on network errors
      const errorMessage = error?.message?.toLowerCase() || "";
      const isNetworkError = ["network", "timeout", "connection"].some((msg) =>
        errorMessage.includes(msg)
      );

      if (!isNetworkError) throw error;

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Simple auth functions
export const signUp = async (email: string, password: string) => {
  const validEmail = validateEmail(email);
  const validPassword = validatePassword(password);

  return withRetry(async () => {
    const { data, error } = await supabase.auth.signUp({
      email: validEmail,
      password: validPassword,
    });

    if (error) throw normalizeError(error);
    return data;
  });
};

export const signIn = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Please enter both email and password");
  }

  const validEmail = validateEmail(email);

  return withRetry(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validEmail,
      password,
    });

    if (error) throw normalizeError(error);
    return data;
  });
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn("Sign out error:", error.message);
  }
  return { error };
};

export const resetPassword = async (email: string) => {
  const validEmail = validateEmail(email);

  return withRetry(async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      validEmail
    );
    if (error) throw normalizeError(error);
    return data;
  });
};

export const getCurrentSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  } catch (err) {
    console.error("Failed to get session:", err);
    return { session: null, error: err };
  }
};
