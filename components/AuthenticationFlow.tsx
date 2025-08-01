import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LandingScreen } from '@/components/LandingScreen';
import { SignUpScreen } from '@/components/SignUpScreen';
import { SignInScreen } from '@/components/SignInScreen';
import { LoadingScreen } from '@/components/LoadingScreen';

type AuthScreen = 'landing' | 'signup' | 'signin';

interface AuthenticationFlowProps {
  children: React.ReactNode;
}

export function AuthenticationFlow({ children }: AuthenticationFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('landing');
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading screen while initializing auth
  if (loading) {
    return <LoadingScreen />;
  }

  // If user is authenticated, show the main app
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // Handle navigation between auth screens
  const handleNavigateToSignUp = () => {
    setCurrentScreen('signup');
  };

  const handleNavigateToSignIn = () => {
    setCurrentScreen('signin');
  };

  const handleBackToLanding = () => {
    setCurrentScreen('landing');
  };

  // Render the appropriate auth screen
  switch (currentScreen) {
    case 'signup':
      return (
        <SignUpScreen
          onSignIn={handleNavigateToSignIn}
          onBack={handleBackToLanding}
        />
      );
    
    case 'signin':
      return (
        <SignInScreen
          onSignUp={handleNavigateToSignUp}
          onBack={handleBackToLanding}
        />
      );
    
    default:
      return (
        <LandingScreen
          onSignUp={handleNavigateToSignUp}
          onSignIn={handleNavigateToSignIn}
        />
      );
  }
}