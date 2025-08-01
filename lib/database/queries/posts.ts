import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types';

export type Post = Tables<'posts'>;
export type PostInsert = TablesInsert<'posts'>;
export type PostUpdate = TablesUpdate<'posts'>;

export async function getPost(
  supabase: SupabaseClient<Database>,
  postId: string,
  signal?: AbortSignal
): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) throw error;
  return data;
}

export async function getPosts(
  supabase: SupabaseClient<Database>,
  signal?: AbortSignal
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPublishedPosts(
  supabase: SupabaseClient<Database>,
  signal?: AbortSignal
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUserPosts(
  supabase: SupabaseClient<Database>,
  userId: string,
  signal?: AbortSignal
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPost(
  supabase: SupabaseClient<Database>,
  post: PostInsert
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePost(
  supabase: SupabaseClient<Database>,
  postId: string,
  updates: PostUpdate
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', postId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(
  supabase: SupabaseClient<Database>,
  postId: string
): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

export async function publishPost(
  supabase: SupabaseClient<Database>,
  postId: string
): Promise<Post> {
  return updatePost(supabase, postId, { published: true });
}

export async function unpublishPost(
  supabase: SupabaseClient<Database>,
  postId: string
): Promise<Post> {
  return updatePost(supabase, postId, { published: false });
}