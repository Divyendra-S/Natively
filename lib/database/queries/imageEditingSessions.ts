import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

export type ImageEditingSession = Database['public']['Tables']['image_editing_sessions']['Row'];
export type ImageEditingSessionInsert = Database['public']['Tables']['image_editing_sessions']['Insert'];
export type ImageEditingSessionUpdate = Database['public']['Tables']['image_editing_sessions']['Update'];

export type UserEditingProfile = Database['public']['Tables']['user_editing_profiles']['Row'];
export type UserEditingProfileInsert = Database['public']['Tables']['user_editing_profiles']['Insert'];
export type UserEditingProfileUpdate = Database['public']['Tables']['user_editing_profiles']['Update'];

export type EditingFeedback = Database['public']['Tables']['editing_feedback']['Row'];
export type EditingFeedbackInsert = Database['public']['Tables']['editing_feedback']['Insert'];
export type EditingFeedbackUpdate = Database['public']['Tables']['editing_feedback']['Update'];

// Image Editing Sessions Queries
export async function createImageEditingSession(
  supabase: SupabaseClient<Database>,
  session: ImageEditingSessionInsert,
  signal?: AbortSignal
): Promise<ImageEditingSession> {
  const { data, error } = await supabase
    .from('image_editing_sessions')
    .insert(session)
    .select('*')
    .single()
;

  if (error) throw error;
  return data;
}

export async function getImageEditingSession(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  signal?: AbortSignal
): Promise<ImageEditingSession | null> {
  const { data, error } = await supabase
    .from('image_editing_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
;

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function getImageEditingSessions(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: {
    imageId?: string;
    limit?: number;
    offset?: number;
  } = {},
  signal?: AbortSignal
): Promise<ImageEditingSession[]> {
  let query = supabase
    .from('image_editing_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options.imageId) {
    query = query.eq('image_id', options.imageId);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getImageEditingSessionsByImageId(
  supabase: SupabaseClient<Database>,
  imageId: string,
  signal?: AbortSignal
): Promise<ImageEditingSession[]> {
  const { data, error } = await supabase
    .from('image_editing_sessions')
    .select('*')
    .eq('image_id', imageId)
    .order('created_at', { ascending: false })
;

  if (error) throw error;
  return data || [];
}

export async function updateImageEditingSession(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  updates: ImageEditingSessionUpdate,
  signal?: AbortSignal
): Promise<ImageEditingSession> {
  const { data, error } = await supabase
    .from('image_editing_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select('*')
    .single()
;

  if (error) throw error;
  return data;
}

export async function deleteImageEditingSession(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  signal?: AbortSignal
): Promise<void> {
  const { error } = await supabase
    .from('image_editing_sessions')
    .delete()
    .eq('id', sessionId)
;

  if (error) throw error;
}

// User Editing Profile Queries
export async function getUserEditingProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  signal?: AbortSignal
): Promise<UserEditingProfile | null> {
  const { data, error } = await supabase
    .from('user_editing_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
;

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function createUserEditingProfile(
  supabase: SupabaseClient<Database>,
  profile: UserEditingProfileInsert,
  signal?: AbortSignal
): Promise<UserEditingProfile> {
  const { data, error } = await supabase
    .from('user_editing_profiles')
    .insert(profile)
    .select('*')
    .single()
;

  if (error) throw error;
  return data;
}

export async function updateUserEditingProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  updates: UserEditingProfileUpdate,
  signal?: AbortSignal
): Promise<UserEditingProfile> {
  const { data, error } = await supabase
    .from('user_editing_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('*')
    .single()
;

  if (error) throw error;
  return data;
}

export async function upsertUserEditingProfile(
  supabase: SupabaseClient<Database>,
  profile: UserEditingProfileInsert & { user_id: string },
  signal?: AbortSignal
): Promise<UserEditingProfile> {
  const { data, error } = await supabase
    .from('user_editing_profiles')
    .upsert({
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()
;

  if (error) throw error;
  return data;
}

// Editing Feedback Queries
export async function createEditingFeedback(
  supabase: SupabaseClient<Database>,
  feedback: EditingFeedbackInsert,
  signal?: AbortSignal
): Promise<EditingFeedback> {
  const { data, error } = await supabase
    .from('editing_feedback')
    .insert(feedback)
    .select('*')
    .single()
;

  if (error) throw error;
  return data;
}

export async function getEditingFeedback(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  signal?: AbortSignal
): Promise<EditingFeedback[]> {
  const { data, error } = await supabase
    .from('editing_feedback')
    .select('*')
    .eq('editing_session_id', sessionId)
    .order('created_at', { ascending: false })
;

  if (error) throw error;
  return data || [];
}

export async function getUserEditingFeedback(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: {
    feedbackType?: string;
    limit?: number;
    offset?: number;
  } = {},
  signal?: AbortSignal
): Promise<EditingFeedback[]> {
  let query = supabase
    .from('editing_feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options.feedbackType) {
    query = query.eq('feedback_type', options.feedbackType);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Analytics and Insights Queries
export async function getUserEditingStats(
  supabase: SupabaseClient<Database>,
  userId: string,
  signal?: AbortSignal
): Promise<{
  totalSessions: number;
  averageQualityImprovement: number;
  mostUsedAlgorithms: Array<{ algorithm: string; count: number }>;
  averageProcessingTime: number;
  favoriteStyles: Array<{ style: string; count: number }>;
}> {
  // Get total sessions and basic stats
  const { data: sessions, error: sessionsError } = await supabase
    .from('image_editing_sessions')
    .select('algorithms_applied, processing_time_ms, quality_improvement_score, config_used')
    .eq('user_id', userId)
;

  if (sessionsError) throw sessionsError;

  const totalSessions = sessions?.length || 0;
  
  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      averageQualityImprovement: 0,
      mostUsedAlgorithms: [],
      averageProcessingTime: 0,
      favoriteStyles: [],
    };
  }

  // Calculate average quality improvement
  const qualityScores = sessions
    ?.map(s => s.quality_improvement_score)
    .filter((score): score is number => score !== null) || [];
  const averageQualityImprovement = qualityScores.length > 0
    ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
    : 0;

  // Calculate average processing time
  const processingTimes = sessions
    ?.map(s => s.processing_time_ms)
    .filter((time): time is number => time !== null) || [];
  const averageProcessingTime = processingTimes.length > 0
    ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
    : 0;

  // Count algorithm usage
  const algorithmCounts: Record<string, number> = {};
  sessions?.forEach(session => {
    session.algorithms_applied?.forEach(algorithm => {
      algorithmCounts[algorithm] = (algorithmCounts[algorithm] || 0) + 1;
    });
  });

  const mostUsedAlgorithms = Object.entries(algorithmCounts)
    .map(([algorithm, count]) => ({ algorithm, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Count style usage
  const styleCounts: Record<string, number> = {};
  sessions?.forEach(session => {
    try {
      const config = typeof session.config_used === 'string'
        ? JSON.parse(session.config_used)
        : session.config_used;
      if (config?.style) {
        styleCounts[config.style] = (styleCounts[config.style] || 0) + 1;
      }
    } catch {
      // Ignore parsing errors
    }
  });

  const favoriteStyles = Object.entries(styleCounts)
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalSessions,
    averageQualityImprovement,
    mostUsedAlgorithms,
    averageProcessingTime,
    favoriteStyles,
  };
}

export async function getPopularAlgorithmConfigurations(
  supabase: SupabaseClient<Database>,
  imageType?: string,
  limit: number = 10,
  signal?: AbortSignal
): Promise<Array<{
  config: any;
  usage_count: number;
  average_rating: number;
  average_quality_improvement: number;
}>> {
  let query = supabase
    .from('image_editing_sessions')
    .select('config_used, user_rating, quality_improvement_score');

  if (imageType) {
    // This would require joining with images table to filter by image type
    // For now, we'll return all configurations
  }

  const { data: sessions, error } = await query
    .not('user_rating', 'is', null)
    .not('quality_improvement_score', 'is', null)
    .limit(1000) // Reasonable limit for processing
;

  if (error) throw error;

  // Group configurations by similarity (simplified approach)
  const configGroups: Record<string, {
    config: any;
    ratings: number[];
    qualityScores: number[];
    count: number;
  }> = {};

  sessions?.forEach(session => {
    try {
      const config = typeof session.config_used === 'string'
        ? JSON.parse(session.config_used)
        : session.config_used;
      
      // Create a simplified key for grouping similar configurations
      const configKey = JSON.stringify({
        style: config.style,
        priority: config.priority,
        algorithmsCount: config.algorithms?.length || 0,
      });

      if (!configGroups[configKey]) {
        configGroups[configKey] = {
          config,
          ratings: [],
          qualityScores: [],
          count: 0,
        };
      }

      configGroups[configKey].count += 1;
      if (session.user_rating) {
        configGroups[configKey].ratings.push(session.user_rating);
      }
      if (session.quality_improvement_score) {
        configGroups[configKey].qualityScores.push(session.quality_improvement_score);
      }
    } catch {
      // Ignore parsing errors
    }
  });

  // Calculate averages and sort
  const results = Object.values(configGroups)
    .map(group => ({
      config: group.config,
      usage_count: group.count,
      average_rating: group.ratings.length > 0
        ? group.ratings.reduce((sum, rating) => sum + rating, 0) / group.ratings.length
        : 0,
      average_quality_improvement: group.qualityScores.length > 0
        ? group.qualityScores.reduce((sum, score) => sum + score, 0) / group.qualityScores.length
        : 0,
    }))
    .filter(result => result.usage_count >= 3) // Only include configs used multiple times
    .sort((a, b) => {
      // Sort by weighted score combining usage, rating, and quality improvement
      const scoreA = (a.usage_count * 0.3) + (a.average_rating * 0.4) + (a.average_quality_improvement * 0.3);
      const scoreB = (b.usage_count * 0.3) + (b.average_rating * 0.4) + (b.average_quality_improvement * 0.3);
      return scoreB - scoreA;
    })
    .slice(0, limit);

  return results;
}