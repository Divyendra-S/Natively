import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../useSupabase';
import {
  imageEditingSessionKeys,
  userEditingProfileKeys,
  editingFeedbackKeys,
  popularConfigKeys,
} from '../../lib/database/keys';
import {
  createImageEditingSession,
  getImageEditingSession,
  getImageEditingSessions,
  getImageEditingSessionsByImageId,
  updateImageEditingSession,
  deleteImageEditingSession,
  getUserEditingProfile,
  createUserEditingProfile,
  updateUserEditingProfile,
  upsertUserEditingProfile,
  createEditingFeedback,
  getEditingFeedback,
  getUserEditingFeedback,
  getUserEditingStats,
  getPopularAlgorithmConfigurations,
  type ImageEditingSession,
  type ImageEditingSessionInsert,
  type ImageEditingSessionUpdate,
  type UserEditingProfile,
  type UserEditingProfileInsert,
  type UserEditingProfileUpdate,
  type EditingFeedback,
  type EditingFeedbackInsert,
} from '../../lib/database/queries/imageEditingSessions';

// Image Editing Session Hooks
export const useImageEditingSessionQuery = (sessionId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: imageEditingSessionKeys.byId(sessionId),
    queryFn: ({ signal }) => getImageEditingSession(supabase, sessionId, signal),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useImageEditingSessionsQuery = (
  userId: string,
  options: {
    imageId?: string;
    limit?: number;
    offset?: number;
  } = {},
  queryOptions = {}
) => {
  const supabase = useSupabase();
  
  const queryKey = options.imageId 
    ? imageEditingSessionKeys.byUserImage(userId, options.imageId)
    : imageEditingSessionKeys.byUser(userId);
  
  return useQuery({
    queryKey: [...queryKey, options],
    queryFn: ({ signal }) => getImageEditingSessions(supabase, userId, options, signal),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions,
  });
};

export const useImageEditingSessionsByImageQuery = (imageId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: imageEditingSessionKeys.byImage(imageId),
    queryFn: ({ signal }) => getImageEditingSessionsByImageId(supabase, imageId, signal),
    enabled: !!imageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useCreateImageEditingSessionMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (session: ImageEditingSessionInsert) => 
      createImageEditingSession(supabase, session),
    onSuccess: (newSession: ImageEditingSession) => {
      // Update individual session cache
      queryClient.setQueryData(
        imageEditingSessionKeys.byId(newSession.id),
        newSession
      );
      
      // Invalidate user sessions list
      if (newSession.user_id) {
        queryClient.invalidateQueries({
          queryKey: imageEditingSessionKeys.byUser(newSession.user_id),
        });
      }
      
      // Invalidate image sessions list
      if (newSession.image_id) {
        queryClient.invalidateQueries({
          queryKey: imageEditingSessionKeys.byImage(newSession.image_id),
        });
      }
      
      // Invalidate user stats
      if (newSession.user_id) {
        queryClient.invalidateQueries({
          queryKey: imageEditingSessionKeys.stats(newSession.user_id),
        });
      }
    },
  });
};

export const useUpdateImageEditingSessionMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, updates }: { sessionId: string; updates: ImageEditingSessionUpdate }) =>
      updateImageEditingSession(supabase, sessionId, updates),
    onSuccess: (updatedSession: ImageEditingSession) => {
      // Update individual session cache
      queryClient.setQueryData(
        imageEditingSessionKeys.byId(updatedSession.id),
        updatedSession
      );
      
      // Update user sessions list cache
      if (updatedSession.user_id) {
        queryClient.setQueryData(
          imageEditingSessionKeys.byUser(updatedSession.user_id),
          (old: ImageEditingSession[] | undefined) => {
            if (!old) return [updatedSession];
            return old.map(session => 
              session.id === updatedSession.id ? updatedSession : session
            );
          }
        );
      }
      
      // Update image sessions list cache
      if (updatedSession.image_id) {
        queryClient.setQueryData(
          imageEditingSessionKeys.byImage(updatedSession.image_id),
          (old: ImageEditingSession[] | undefined) => {
            if (!old) return [updatedSession];
            return old.map(session => 
              session.id === updatedSession.id ? updatedSession : session
            );
          }
        );
      }
    },
  });
};

export const useDeleteImageEditingSessionMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => deleteImageEditingSession(supabase, sessionId),
    onSuccess: (_, sessionId) => {
      // Remove from individual cache
      queryClient.removeQueries({
        queryKey: imageEditingSessionKeys.byId(sessionId),
      });
      
      // Invalidate related lists
      queryClient.invalidateQueries({
        queryKey: imageEditingSessionKeys.all,
      });
    },
  });
};

// User Editing Profile Hooks
export const useUserEditingProfileQuery = (userId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: userEditingProfileKeys.byUser(userId),
    queryFn: ({ signal }) => getUserEditingProfile(supabase, userId, signal),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useCreateUserEditingProfileMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profile: UserEditingProfileInsert) => 
      createUserEditingProfile(supabase, profile),
    onSuccess: (newProfile: UserEditingProfile) => {
      if (newProfile.user_id) {
        queryClient.setQueryData(
          userEditingProfileKeys.byUser(newProfile.user_id),
          newProfile
        );
      }
    },
  });
};

export const useUpdateUserEditingProfileMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UserEditingProfileUpdate }) =>
      updateUserEditingProfile(supabase, userId, updates),
    onSuccess: (updatedProfile: UserEditingProfile) => {
      if (updatedProfile.user_id) {
        queryClient.setQueryData(
          userEditingProfileKeys.byUser(updatedProfile.user_id),
          updatedProfile
        );
      }
    },
  });
};

export const useUpsertUserEditingProfileMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profile: UserEditingProfileInsert & { user_id: string }) =>
      upsertUserEditingProfile(supabase, profile),
    onSuccess: (profile: UserEditingProfile) => {
      if (profile.user_id) {
        queryClient.setQueryData(
          userEditingProfileKeys.byUser(profile.user_id),
          profile
        );
      }
    },
  });
};

// Editing Feedback Hooks
export const useEditingFeedbackQuery = (sessionId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: editingFeedbackKeys.bySession(sessionId),
    queryFn: ({ signal }) => getEditingFeedback(supabase, sessionId, signal),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useUserEditingFeedbackQuery = (
  userId: string,
  options: {
    feedbackType?: string;
    limit?: number;
    offset?: number;
  } = {},
  queryOptions = {}
) => {
  const supabase = useSupabase();
  
  const queryKey = options.feedbackType
    ? editingFeedbackKeys.byType(userId, options.feedbackType)
    : editingFeedbackKeys.byUser(userId);
  
  return useQuery({
    queryKey: [...queryKey, options],
    queryFn: ({ signal }) => getUserEditingFeedback(supabase, userId, options, signal),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions,
  });
};

export const useCreateEditingFeedbackMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (feedback: EditingFeedbackInsert) => 
      createEditingFeedback(supabase, feedback),
    onSuccess: (newFeedback: EditingFeedback) => {
      // Invalidate session feedback
      if (newFeedback.editing_session_id) {
        queryClient.invalidateQueries({
          queryKey: editingFeedbackKeys.bySession(newFeedback.editing_session_id),
        });
      }
      
      // Invalidate user feedback
      if (newFeedback.user_id) {
        queryClient.invalidateQueries({
          queryKey: editingFeedbackKeys.byUser(newFeedback.user_id),
        });
      }
    },
  });
};

// Analytics and Stats Hooks
export const useUserEditingStatsQuery = (userId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: imageEditingSessionKeys.stats(userId),
    queryFn: ({ signal }) => getUserEditingStats(supabase, userId, signal),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const usePopularConfigurationsQuery = (
  imageType?: string,
  limit: number = 10,
  options = {}
) => {
  const supabase = useSupabase();
  
  const queryKey = imageType
    ? popularConfigKeys.byImageType(imageType)
    : popularConfigKeys.general;
  
  return useQuery({
    queryKey: [...queryKey, limit],
    queryFn: ({ signal }) => getPopularAlgorithmConfigurations(supabase, imageType, limit, signal),
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

// Utility hook for managing editing workflow
export const useImageEditingWorkflow = (imageId: string, userId: string | null) => {
  const createSessionMutation = useCreateImageEditingSessionMutation();
  const updateSessionMutation = useUpdateImageEditingSessionMutation();
  const createFeedbackMutation = useCreateEditingFeedbackMutation();
  const upsertProfileMutation = useUpsertUserEditingProfileMutation();
  
  const startEditingSession = async (config: any, algorithms: string[]) => {
    if (!userId) throw new Error('User ID is required');
    const session = await createSessionMutation.mutateAsync({
      image_id: imageId,
      user_id: userId,
      config_used: config,
      algorithms_applied: algorithms,
    });
    return session;
  };
  
  const completeEditingSession = async (
    sessionId: string,
    processingTime: number,
    qualityScore: number
  ) => {
    const session = await updateSessionMutation.mutateAsync({
      sessionId,
      updates: {
        processing_time_ms: processingTime,
        quality_improvement_score: qualityScore,
      },
    });
    return session;
  };
  
  const rateEditingSession = async (sessionId: string, rating: number) => {
    const session = await updateSessionMutation.mutateAsync({
      sessionId,
      updates: {
        user_rating: rating,
      },
    });
    return session;
  };
  
  const provideFeedback = async (
    sessionId: string,
    feedbackType: 'like' | 'dislike' | 'adjustment_request',
    specificFeedback?: any
  ) => {
    if (!userId) throw new Error('User ID is required');
    const feedback = await createFeedbackMutation.mutateAsync({
      editing_session_id: sessionId,
      user_id: userId,
      feedback_type: feedbackType,
      specific_feedback: specificFeedback,
    });
    return feedback;
  };
  
  const updateUserProfile = async (preferences: Partial<UserEditingProfileInsert>) => {
    if (!userId) throw new Error('User ID is required');
    const profile = await upsertProfileMutation.mutateAsync({
      ...preferences,
      user_id: userId,
    } as UserEditingProfileInsert & { user_id: string });
    return profile;
  };
  
  return {
    startEditingSession,
    completeEditingSession,
    rateEditingSession,
    provideFeedback,
    updateUserProfile,
    isCreatingSession: createSessionMutation.isPending,
    isUpdatingSession: updateSessionMutation.isPending,
    isCreatingFeedback: createFeedbackMutation.isPending,
    isUpdatingProfile: upsertProfileMutation.isPending,
  };
};