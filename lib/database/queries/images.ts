import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types';

export type Image = Tables<'images'>;
export type ImageInsert = TablesInsert<'images'>;
export type ImageUpdate = TablesUpdate<'images'>;

export async function getImage(
  supabase: SupabaseClient<Database>,
  imageId: string,
  signal?: AbortSignal
): Promise<Image | null> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', imageId)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserImages(
  supabase: SupabaseClient<Database>,
  userId: string,
  signal?: AbortSignal
): Promise<Image[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getImagesByStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  status: string,
  signal?: AbortSignal
): Promise<Image[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createImage(
  supabase: SupabaseClient<Database>,
  image: ImageInsert
): Promise<Image> {
  const { data, error } = await supabase
    .from('images')
    .insert(image)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateImage(
  supabase: SupabaseClient<Database>,
  imageId: string,
  updates: ImageUpdate
): Promise<Image> {
  const { data, error } = await supabase
    .from('images')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', imageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateImageStatus(
  supabase: SupabaseClient<Database>,
  imageId: string,
  status: string
): Promise<Image> {
  const { data, error } = await supabase
    .from('images')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', imageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteImage(
  supabase: SupabaseClient<Database>,
  imageId: string
): Promise<void> {
  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
}

export async function getRecentImages(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 10,
  signal?: AbortSignal
): Promise<Image[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}