import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../useSupabase';
import { userPreferencesKeys } from '../../lib/database/keys';
import {
  getUserPreferences,
  createUserPreferences,
  updateUserPreferences,
  upsertUserPreferences,
  deleteUserPreferences,
  updateAnalysisPreferences,
  updateEditingPreferences,
  updateNotificationPreferences,
  type UserPreferences,
  type UserPreferencesInsert,
  type UserPreferencesUpdate,
} from '../../lib/database/queries/user_preferences';

export const useUserPreferencesQuery = (userId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: userPreferencesKeys.byUser(userId),
    queryFn: ({ signal }) => getUserPreferences(supabase, userId, signal),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useCreateUserPreferencesMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: UserPreferencesInsert) => createUserPreferences(supabase, preferences),
    onSuccess: (newPreferences) => {
      // Set individual user preferences cache
      if (newPreferences.user_id) {
        queryClient.setQueryData(userPreferencesKeys.byUser(newPreferences.user_id), newPreferences);
      }
    },
  });
};

export const useUpdateUserPreferencesMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UserPreferencesUpdate }) =>
      updateUserPreferences(supabase, userId, updates),
    onSuccess: (updatedPreferences) => {
      // Update user preferences cache
      if (updatedPreferences.user_id) {
        queryClient.setQueryData(userPreferencesKeys.byUser(updatedPreferences.user_id), updatedPreferences);
      }
    },
  });
};

export const useUpsertUserPreferencesMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: UserPreferencesInsert) => upsertUserPreferences(supabase, preferences),
    onSuccess: (upsertedPreferences) => {
      // Set user preferences cache (create or update)
      if (upsertedPreferences.user_id) {
        queryClient.setQueryData(userPreferencesKeys.byUser(upsertedPreferences.user_id), upsertedPreferences);
      }
    },
  });
};

export const useUpdateAnalysisPreferencesMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      userId, 
      analysisIntensity, 
      autoAnalyze 
    }: { 
      userId: string; 
      analysisIntensity: string; 
      autoAnalyze: boolean; 
    }) => updateAnalysisPreferences(supabase, userId, analysisIntensity, autoAnalyze),
    onSuccess: (updatedPreferences) => {
      // Update user preferences cache
      if (updatedPreferences.user_id) {
        queryClient.setQueryData(userPreferencesKeys.byUser(updatedPreferences.user_id), updatedPreferences);
      }
    },
  });
};

export const useUpdateEditingPreferencesMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      userId, 
      editingStyle, 
      autoEnhance, 
      enhancementStrength 
    }: { 
      userId: string; 
      editingStyle: string; 
      autoEnhance: boolean; 
      enhancementStrength: number; 
    }) => updateEditingPreferences(supabase, userId, editingStyle, autoEnhance, enhancementStrength),
    onSuccess: (updatedPreferences) => {
      // Update user preferences cache
      if (updatedPreferences.user_id) {
        queryClient.setQueryData(userPreferencesKeys.byUser(updatedPreferences.user_id), updatedPreferences);
      }
    },
  });
};

export const useUpdateNotificationPreferencesMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      userId, 
      notifyAnalysisComplete, 
      notifyProcessingComplete 
    }: { 
      userId: string; 
      notifyAnalysisComplete: boolean; 
      notifyProcessingComplete: boolean; 
    }) => updateNotificationPreferences(supabase, userId, notifyAnalysisComplete, notifyProcessingComplete),
    onSuccess: (updatedPreferences) => {
      // Update user preferences cache
      if (updatedPreferences.user_id) {
        queryClient.setQueryData(userPreferencesKeys.byUser(updatedPreferences.user_id), updatedPreferences);
      }
    },
  });
};

export const useDeleteUserPreferencesMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => deleteUserPreferences(supabase, userId),
    onSuccess: (_, userId) => {
      // Remove user preferences cache
      queryClient.removeQueries({ queryKey: userPreferencesKeys.byUser(userId) });
    },
  });
};