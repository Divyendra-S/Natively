import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

interface StatusBarConfig {
  style: 'light' | 'dark' | 'auto';
  backgroundColor?: string;
}

export const useStatusBar = (config: StatusBarConfig) => {
  useFocusEffect(
    useCallback(() => {
      // Status bar will be handled by the StatusBar component in each screen
      return () => {
        // Cleanup if needed
      };
    }, [config])
  );
};