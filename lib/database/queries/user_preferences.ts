import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types';

export type UserPreferences = Tables<'user_preferences'>;
export type UserPreferencesInsert = TablesInsert<'user_preferences'>;
export type UserPreferencesUpdate = TablesUpdate<'user_preferences'>;

export async function getUserPreferences(
  supabase: SupabaseClient<Database>,
  userId: string,
  signal?: AbortSignal
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createUserPreferences(
  supabase: SupabaseClient<Database>,
  preferences: UserPreferencesInsert
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .insert(preferences)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserPreferences(
  supabase: SupabaseClient<Database>,
  userId: string,
  updates: UserPreferencesUpdate
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertUserPreferences(
  supabase: SupabaseClient<Database>,
  preferences: UserPreferencesInsert
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(preferences, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserPreferences(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

export async function updateAnalysisPreferences(
  supabase: SupabaseClient<Database>,
  userId: string,
  analysisIntensity: string,
  autoAnalyze: boolean
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({ 
      analysis_intensity: analysisIntensity,
      auto_analyze: autoAnalyze,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEditingPreferences(
  supabase: SupabaseClient<Database>,
  userId: string,
  editingStyle: string,
  autoEnhance: boolean,
  enhancementStrength: number
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({ 
      editing_style: editingStyle,
      auto_enhance: autoEnhance,
      enhancement_strength: enhancementStrength,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNotificationPreferences(
  supabase: SupabaseClient<Database>,
  userId: string,
  notifyAnalysisComplete: boolean,
  notifyProcessingComplete: boolean
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({ 
      notify_analysis_complete: notifyAnalysisComplete,
      notify_processing_complete: notifyProcessingComplete,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}