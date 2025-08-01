# React Native + Supabase Authentication Best Practices Guide

## Table of Contents
1. [Overview](#overview)
2. [Core Setup](#core-setup)
3. [Security Best Practices](#security-best-practices)
4. [Session Management](#session-management)
5. [Authentication Flow](#authentication-flow)
6. [Error Handling](#error-handling)
7. [Advanced Features](#advanced-features)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Performance Optimization](#performance-optimization)

## Overview

This guide provides comprehensive best practices for implementing secure, scalable authentication in React Native applications using Supabase. Following these practices ensures robust security, excellent user experience, and maintainable code.

## Core Setup

### 1. Dependencies Installation

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

**Additional Security Dependencies:**
```bash
npx expo install expo-secure-store aes-js react-native-get-random-values
```

### 2. Basic Supabase Client Configuration

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
});
```

### 3. Enhanced Secure Storage (Recommended)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';
import { getRandomValues } from 'react-native-get-random-values';

// Encryption key management
const getEncryptionKey = async (): Promise<Uint8Array> => {
  let key = await SecureStore.getItemAsync('supabase-encryption-key');
  if (!key) {
    const newKey = getRandomValues(new Uint8Array(32));
    key = Array.from(newKey).join(',');
    await SecureStore.setItemAsync('supabase-encryption-key', key);
  }
  return new Uint8Array(key.split(',').map(Number));
};

// Secure storage functions
const setSecureItem = async (key: string, value: string): Promise<void> => {
  const encryptionKey = await getEncryptionKey();
  const valueBytes = aesjs.utils.utf8.toBytes(value);
  const aesCtr = new aesjs.ModeOfOperation.ctr(encryptionKey);
  const encryptedBytes = aesCtr.encrypt(valueBytes);
  const encryptedValue = aesjs.utils.hex.fromBytes(encryptedBytes);
  await AsyncStorage.setItem(key, encryptedValue);
};

const getSecureItem = async (key: string): Promise<string | null> => {
  const encryptedValue = await AsyncStorage.getItem(key);
  if (!encryptedValue) return null;
  
  try {
    const encryptionKey = await getEncryptionKey();
    const encryptedBytes = aesjs.utils.hex.toBytes(encryptedValue);
    const aesCtr = new aesjs.ModeOfOperation.ctr(encryptionKey);
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  } catch (error) {
    console.error('Failed to decrypt stored value:', error);
    return null;
  }
};

const removeSecureItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key);
};

// Create secure storage object that implements Supabase's storage interface
const createSecureStorage = () => ({
  setItem: setSecureItem,
  getItem: getSecureItem,
  removeItem: removeSecureItem,
});

// Use secure storage in Supabase client
const secureStorage = createSecureStorage();
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## Security Best Practices

### 1. Input Validation & Sanitization

```typescript
const validateEmail = (email: string): string => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.toLowerCase().trim();
  
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address');
  }
  
  return trimmedEmail;
};

const validatePassword = (password: string): string => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new Error('Password must contain uppercase, lowercase, and number');
  }
  
  return password;
};
```

### 2. Error Normalization

```typescript
const normalizeAuthError = (error: any): Error => {
  const message = error?.message?.toLowerCase() || '';
  
  const errorMap: Record<string, string> = {
    'invalid login credentials': 'Invalid email or password. Please try again.',
    'email not confirmed': 'Please verify your email before signing in.',
    'user already registered': 'An account with this email already exists.',
    'rate limit': 'Too many attempts. Please wait and try again.',
    'weak password': 'Password is too weak. Please choose a stronger password.',
    'invalid email': 'Please enter a valid email address.',
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return new Error(value);
    }
  }

  return new Error(error?.message || 'An unexpected error occurred');
};
```

### 3. Network Resilience

```typescript
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  backoffMs = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxAttempts) throw error;
      
      const errorMessage = error?.message?.toLowerCase() || '';
      const isRetryableError = [
        'network',
        'timeout',
        'connection',
        'fetch'
      ].some(msg => errorMessage.includes(msg));
      
      if (!isRetryableError) throw error;
      
      await new Promise(resolve => 
        setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1))
      );
    }
  }
  throw new Error('Max retry attempts reached');
};
```

## Session Management

### 1. Comprehensive Auth Hook

```typescript
import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

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

  // Session validation
  const isSessionValid = useCallback((session: Session | null): boolean => {
    if (!session) return false;
    
    const now = Date.now() / 1000;
    return session.expires_at ? session.expires_at > now : true;
  }, []);

  // App state management for token refresh
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && authState.isAuthenticated) {
        supabase.auth.startAutoRefresh();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, [authState.isAuthenticated]);

  // Auth state listener
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) throw error;
        
        const isValid = isSessionValid(session);
        
        setAuthState({
          user: isValid ? session?.user ?? null : null,
          session: isValid ? session : null,
          loading: false,
          isAuthenticated: isValid && !!session?.user,
          error: null,
        });
      } catch (error) {
        if (!mounted) return;
        
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        
        console.log('Auth event:', event);
        
        const isValid = isSessionValid(session);
        
        setAuthState({
          user: isValid ? session?.user ?? null : null,
          session: isValid ? session : null,
          loading: false,
          isAuthenticated: isValid && !!session?.user,
          error: null,
        });
      }
    );

    initializeAuth();
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSessionValid]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to sign out',
      }));
    }
  }, []);

  return {
    ...authState,
    signOut,
    isSessionValid: isSessionValid(authState.session),
    userEmail: authState.user?.email || null,
    userId: authState.user?.id || null,
    isEmailVerified: !!authState.user?.email_confirmed_at,
  };
}
```

### 2. Token Expiration Handling

```typescript
export const checkTokenExpiry = (session: Session | null): boolean => {
  if (!session?.expires_at) return false;
  
  const expiryTime = session.expires_at * 1000;
  const currentTime = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  
  return expiryTime - currentTime < bufferTime;
};

export const refreshTokenIfNeeded = async (session: Session | null) => {
  if (!session || !checkTokenExpiry(session)) return session;
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};
```

## Authentication Flow

### 1. Secure Authentication Functions

```typescript
export const authService = {
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const validEmail = validateEmail(email);
    const validPassword = validatePassword(password);
    
    return withRetry(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: validEmail,
        password: validPassword,
        options: {
          data: metadata,
        },
      });
      
      if (error) throw normalizeAuthError(error);
      return data;
    });
  },

  async signIn(email: string, password: string) {
    const validEmail = validateEmail(email);
    
    return withRetry(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validEmail,
        password,
      });
      
      if (error) throw normalizeAuthError(error);
      return data;
    });
  },

  async signInWithOTP(email: string) {
    const validEmail = validateEmail(email);
    
    return withRetry(async () => {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: validEmail,
      });
      
      if (error) throw normalizeAuthError(error);
      return data;
    });
  },

  async resetPassword(email: string) {
    const validEmail = validateEmail(email);
    
    return withRetry(async () => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        validEmail,
        {
          redirectTo: 'yourapp://reset-password',
        }
      );
      
      if (error) throw normalizeAuthError(error);
      return data;
    });
  },

  async updatePassword(newPassword: string) {
    const validPassword = validatePassword(newPassword);
    
    const { data, error } = await supabase.auth.updateUser({
      password: validPassword,
    });
    
    if (error) throw normalizeAuthError(error);
    return data;
  },
};
```

### 2. Social Authentication

```typescript
export const socialAuth = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'yourapp://auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) throw normalizeAuthError(error);
    return data;
  },

  async signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'yourapp://auth/callback',
      },
    });
    
    if (error) throw normalizeAuthError(error);
    return data;
  },
};
```

## Error Handling

### 1. Comprehensive Error Management

```typescript
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  originalError?: any;
}

export const createAuthError = (error: any): AuthError => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('invalid login credentials')) {
    return {
      code: AuthErrorCode.INVALID_CREDENTIALS,
      message: 'Invalid email or password. Please try again.',
      originalError: error,
    };
  }
  
  if (message.includes('email not confirmed')) {
    return {
      code: AuthErrorCode.EMAIL_NOT_CONFIRMED,
      message: 'Please verify your email before signing in.',
      originalError: error,
    };
  }
  
  // Add more error mappings...
  
  return {
    code: AuthErrorCode.UNKNOWN_ERROR,
    message: error?.message || 'An unexpected error occurred',
    originalError: error,
  };
};
```

### 2. Error Reporting

```typescript
export const errorReporting = {
  reportAuthError(error: AuthError, context: string) {
    // Log to your analytics service
    console.error(`Auth error in ${context}:`, {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    
    // Don't log sensitive information in production
    if (__DEV__) {
      console.error('Original error:', error.originalError);
    }
  },
};
```

## Advanced Features

### 1. Multi-Factor Authentication

```typescript
export const mfaService = {
  async enrollMFA() {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    
    if (error) throw normalizeAuthError(error);
    return data;
  },

  async verifyMFA(factorId: string, code: string) {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    
    if (error) throw normalizeAuthError(error);
    return data;
  },

  async getMFAFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    
    if (error) throw normalizeAuthError(error);
    return data;
  },
};
```

### 2. Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

export const biometricAuth = {
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  async authenticate(promptMessage: string = 'Authenticate to continue') {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use passcode',
    });
    
    return result.success;
  },

  async enableBiometricAuth(userId: string) {
    const isAvailable = await this.isAvailable();
    if (!isAvailable) throw new Error('Biometric authentication not available');
    
    const authenticated = await this.authenticate('Enable biometric authentication');
    if (!authenticated) throw new Error('Biometric authentication failed');
    
    // Store biometric preference securely
    await SecureStore.setItemAsync(`biometric_enabled_${userId}`, 'true');
  },
};
```

### 3. Deep Link Handling

```typescript
import * as Linking from 'expo-linking';

export const deepLinkHandler = {
  configure() {
    const url = Linking.addEventListener('url', this.handleDeepLink);
    return () => url?.remove();
  },

  async handleDeepLink(event: { url: string }) {
    const { hostname, path, queryParams } = Linking.parse(event.url);
    
    if (hostname === 'auth' && path === '/callback') {
      await this.handleAuthCallback(queryParams);
    } else if (hostname === 'reset-password') {
      await this.handlePasswordReset(queryParams);
    }
  },

  async handleAuthCallback(params: any) {
    if (params.access_token && params.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      
      if (error) {
        console.error('Auth callback error:', error);
      }
    }
  },

  async handlePasswordReset(params: any) {
    if (params.access_token && params.refresh_token) {
      // Navigate to password reset screen
      // You'll need to implement navigation logic here
    }
  },
};
```

## Testing

### 1. Auth Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../hooks/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    // Mock Supabase client
  });

  test('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('should handle successful sign in', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      // Trigger sign in
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
  });
});
```

### 2. Integration Testing

```typescript
import { authService } from '../services/auth';

describe('Auth Service Integration', () => {
  test('should handle sign up flow', async () => {
    const result = await authService.signUp(
      'test@example.com',
      'SecurePassword123!'
    );
    
    expect(result.user).toBeDefined();
    expect(result.session).toBeDefined();
  });

  test('should handle invalid credentials', async () => {
    await expect(
      authService.signIn('invalid@email.com', 'wrongpassword')
    ).rejects.toThrow('Invalid email or password');
  });
});
```

## Deployment

### 1. Environment Configuration

```typescript
// app.config.js
export default {
  expo: {
    name: 'YourApp',
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    },
    scheme: 'yourapp',
  },
};

// .env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

### 2. Row Level Security Policies

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Insert policy for new users
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Performance Optimization

### 1. Lazy Loading & Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const AuthFlow = lazy(() => import('./components/AuthFlow'));
const MainApp = lazy(() => import('./components/MainApp'));

export function App() {
  const { loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      {isAuthenticated ? <MainApp /> : <AuthFlow />}
    </Suspense>
  );
}
```

### 2. Request Debouncing

```typescript
import { debounce } from 'lodash';

export const debouncedAuth = {
  signIn: debounce(authService.signIn, 1000, { leading: true, trailing: false }),
  signUp: debounce(authService.signUp, 1000, { leading: true, trailing: false }),
};
```

### 3. Caching Strategy

```typescript
class AuthCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const authCache = new AuthCache();
```

## Conclusion

This comprehensive guide covers all essential aspects of implementing secure, scalable authentication in React Native with Supabase. Key takeaways:

1. **Security First**: Always validate inputs, normalize errors, and use encrypted storage for sensitive data
2. **Robust Session Management**: Implement proper token refresh, expiry checks, and app state handling  
3. **User Experience**: Provide clear error messages, loading states, and smooth flows
4. **Scalability**: Use proper testing, caching, and performance optimization techniques
5. **Compliance**: Implement RLS policies and proper access controls

Following these practices ensures your authentication system is production-ready, secure, and maintainable.

---

*Last updated: July 2025*
*Version: 2.0*