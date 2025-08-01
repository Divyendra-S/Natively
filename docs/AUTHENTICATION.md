# Authentication Flow & Security Best Practices (2024/2025)

## Overview

This documentation outlines the enhanced authentication system implemented using Supabase with modern security best practices for React Native. The system provides secure user authentication with encrypted storage, session management, retry logic, and follows current industry standards.

## 🔐 Security Features (Updated 2024/2025)

### Enhanced Security Implementation

- **🔐 Encrypted Token Storage**: AES-256 encryption for session tokens using expo-secure-store
- **⚡ Session Timeout**: Automatic logout after 30 minutes of inactivity
- **🔄 Retry Logic**: Automatic retry for network failures with exponential backoff
- **✅ Input Validation**: Client-side validation with server-side backup
- **🛡️ Error Normalization**: User-friendly error messages without exposing system details
- **📱 App State Management**: Proper token refresh when app returns from background

## Architecture

### Unified Supabase Client

The authentication system uses a single, unified Supabase client configured with encrypted storage:

```typescript
import { supabase } from "@/lib/supabase";
```

### Enhanced AuthService Class

Modern authentication operations are handled through the `AuthService` class which provides:

- Input validation
- Retry mechanisms
- Normalized error handling
- Session management

### State Management with Enhanced useAuth Hook

The authentication state is managed using a custom `useAuth` hook that provides:

- **Session validation and timeout handling**
- **Automatic cleanup and error recovery**
- **Activity tracking for security**
- **App state monitoring**

## 🚀 Quick Start Guide

### 1. Environment Setup

Ensure your `.env` file contains the Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
EXPO_PUBLIC_SITE_URL=your_app_url  # For password reset redirects
```

### 2. Authentication Usage

#### Using the Enhanced AuthService

```typescript
import { AuthService } from "@/lib/supabase";

// Sign up with enhanced validation and retry
try {
  const data = await AuthService.signUp(email, password);
  console.log("User created:", data.user);
} catch (error) {
  console.error("Sign up failed:", error.message);
}

// Sign in with retry logic
try {
  const data = await AuthService.signIn(email, password);
  console.log("Sign in successful:", data.user);
} catch (error) {
  console.error("Sign in failed:", error.message);
}

// Password reset
try {
  await AuthService.resetPassword(email);
  console.log("Reset email sent");
} catch (error) {
  console.error("Reset failed:", error.message);
}
```

#### Using the Enhanced useAuth Hook

```typescript
import { useAuth } from "@/hooks/useAuth";

function App() {
  const {
    user,
    loading,
    isAuthenticated,
    error,
    signOut,
    clearError,
    updateActivity,
    userEmail,
    isEmailVerified,
  } = useAuth();

  // Update activity on user interaction to prevent timeout
  const handleUserInteraction = () => {
    updateActivity();
  };

  if (loading) return <LoadingScreen />;
  if (error) {
    return <ErrorScreen message={error} onRetry={clearError} />;
  }

  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}
```

## Security Best Practices (2024/2025)

### 1. Encrypted Token Storage ✅

Tokens are encrypted using AES-256 before being stored in AsyncStorage:

- **Encryption Key**: Stored securely in expo-secure-store
- **Session Data**: Encrypted and stored in AsyncStorage
- **Automatic Cleanup**: Keys removed on sign out

### 2. Session Management ✅

Enhanced session handling includes:

- **Validity Checks**: Sessions validated before use
- **Timeout Protection**: Auto-logout after inactivity
- **Token Refresh**: Automatic refresh when app becomes active
- **App State Monitoring**: Proper handling of background/foreground states

### 3. Error Handling & User Experience ✅

```typescript
// User-friendly error messages
"Invalid email or password. Please try again."; // Instead of technical errors
"Please verify your email before signing in."; // Clear instructions
"Too many attempts. Please wait and try again."; // Rate limiting feedback
```

### 4. Input Validation ✅

Client-side validation with server backup:

```typescript
// Email validation
if (!email || !email.includes("@")) {
  throw new Error("Please enter a valid email address");
}

// Password strength
if (!password || password.length < 6) {
  throw new Error("Password must be at least 6 characters");
}

// Email normalization
email: email.toLowerCase().trim();
```

### 5. Network Resilience ✅

Automatic retry logic for temporary failures:

```typescript
// Retry configuration
private static readonly MAX_RETRY_ATTEMPTS = 3;
private static readonly RETRY_DELAY = 1000; // 1 second

// Retryable errors
'network error', 'timeout', 'connection failed', 'server error'
```

## Component Integration

### Authentication Flow Component

The `AuthenticationFlow` component automatically handles navigation between authenticated and unauthenticated states:

```typescript
import { useAuth } from "@/hooks/useAuth";

export function AuthenticationFlow({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingScreen />;
  if (isAuthenticated && user) return <>{children}</>;

  return <AuthScreens />;
}
```

### Sign In/Up Components

Updated components use the enhanced AuthService:

```typescript
import { AuthService } from "@/lib/supabase";

const handleSignIn = async () => {
  setLoading(true);
  try {
    await AuthService.signIn(email, password);
    // Success handled automatically by useAuth
  } catch (error) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};
```

## Advanced Security Features

### Session Timeout Configuration

```typescript
const SESSION_TIMEOUT_MINUTES = 30; // Configurable timeout

// Activity tracking
const { updateActivity } = useAuth();

// Call on user interactions
<TouchableOpacity onPress={() => {
  updateActivity(); // Resets timeout
  handleButtonPress();
}}>
```

### App State Management

Automatic handling of app lifecycle:

```typescript
// Auto-refresh tokens when app becomes active
// Stop refresh when app goes to background
// Track user activity for security
```

## Migration Guide

### From Previous Implementation

If migrating from the previous auth setup:

1. **Remove duplicate files**: Old `lib/auth.ts` has been consolidated
2. **Update imports**: Use unified `@/lib/supabase`
3. **Replace direct calls**: Use `AuthService` methods
4. **Update hook usage**: New `useAuth` returns object with methods

### Breaking Changes

- `useAuth()` now returns an object instead of direct state
- AuthHelpers replaced with `AuthService` class methods
- Additional dependencies required for encryption

## Testing Checklist

### Authentication Testing (2024/2025)

- [ ] Sign up with valid email/password
- [ ] Sign up with invalid inputs (validation)
- [ ] Sign up with existing email
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials
- [ ] Sign in with unverified email
- [ ] Password reset functionality
- [ ] Session persistence across app restarts
- [ ] Session timeout after inactivity
- [ ] App state changes (background/foreground)
- [ ] Network failure retry logic
- [ ] Token encryption/decryption
- [ ] Secure storage cleanup on signout

## Performance Considerations

### Encryption Impact

- **Minimal Overhead**: AES encryption adds <50ms to auth operations
- **Memory Efficient**: Keys stored in secure hardware when available
- **Battery Friendly**: Encryption only on auth events, not ongoing

### Session Management

- **Activity Tracking**: Lightweight timestamp updates
- **Timeout Checks**: Run every minute, minimal CPU impact
- **Token Refresh**: Handled efficiently by Supabase SDK

## Troubleshooting

### Common Issues

1. **"Encryption key not found"**

   - Clear app storage and reinstall
   - Ensure expo-secure-store is properly installed

2. **"Session timeout too aggressive"**

   - Adjust `SESSION_TIMEOUT_MINUTES` constant
   - Call `updateActivity()` on user interactions

3. **"Auth state not updating"**

   - Check that components are using the new `useAuth` object format
   - Verify auth listener subscription is working

4. **"Network retry not working"**
   - Check network conditions in retry error detection
   - Verify error messages match retryable patterns

## Future Enhancements

### Potential Improvements

- **Biometric authentication**: Face ID, Touch ID integration
- **Multi-factor authentication**: SMS, authenticator apps
- **Social authentication**: Google, Apple, Facebook
- **Device management**: List and manage signed-in devices
- **Advanced session policies**: Role-based timeout periods
