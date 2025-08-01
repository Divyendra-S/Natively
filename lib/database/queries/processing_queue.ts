import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types';

export type ProcessingQueue = Tables<'processing_queue'>;
export type ProcessingQueueInsert = TablesInsert<'processing_queue'>;
export type ProcessingQueueUpdate = TablesUpdate<'processing_queue'>;

export async function getProcessingQueueItem(
  supabase: SupabaseClient<Database>,
  queueId: string,
  signal?: AbortSignal
): Promise<ProcessingQueue | null> {
  const { data, error } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserProcessingQueue(
  supabase: SupabaseClient<Database>,
  userId: string,
  signal?: AbortSignal
): Promise<ProcessingQueue[]> {
  const { data, error } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getProcessingQueueByStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
  status: string,
  signal?: AbortSignal
): Promise<ProcessingQueue[]> {
  const { data, error } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getImageProcessingQueue(
  supabase: SupabaseClient<Database>,
  imageId: string,
  signal?: AbortSignal
): Promise<ProcessingQueue[]> {
  const { data, error } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('image_id', imageId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createProcessingQueueItem(
  supabase: SupabaseClient<Database>,
  queueItem: ProcessingQueueInsert
): Promise<ProcessingQueue> {
  const { data, error } = await supabase
    .from('processing_queue')
    .insert(queueItem)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProcessingQueueItem(
  supabase: SupabaseClient<Database>,
  queueId: string,
  updates: ProcessingQueueUpdate
): Promise<ProcessingQueue> {
  const { data, error } = await supabase
    .from('processing_queue')
    .update(updates)
    .eq('id', queueId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function startProcessingQueueItem(
  supabase: SupabaseClient<Database>,
  queueId: string
): Promise<ProcessingQueue> {
  const { data, error } = await supabase
    .from('processing_queue')
    .update({ 
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', queueId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeProcessingQueueItem(
  supabase: SupabaseClient<Database>,
  queueId: string
): Promise<ProcessingQueue> {
  const { data, error } = await supabase
    .from('processing_queue')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', queueId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function failProcessingQueueItem(
  supabase: SupabaseClient<Database>,
  queueId: string,
  errorMessage: string
): Promise<ProcessingQueue> {
  // First get current retry_count
  const { data: currentData } = await supabase
    .from('processing_queue')
    .select('retry_count')
    .eq('id', queueId)
    .single();

  const newRetryCount = (currentData?.retry_count || 0) + 1;

  const { data, error } = await supabase
    .from('processing_queue')
    .update({ 
      status: 'failed',
      error_message: errorMessage,
      retry_count: newRetryCount
    })
    .eq('id', queueId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProcessingQueueItem(
  supabase: SupabaseClient<Database>,
  queueId: string
): Promise<void> {
  const { error } = await supabase
    .from('processing_queue')
    .delete()
    .eq('id', queueId);

  if (error) throw error;
}

export async function getPendingProcessingQueue(
  supabase: SupabaseClient<Database>,
  signal?: AbortSignal
): Promise<ProcessingQueue[]> {
  const { data, error } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('status', 'pending')
    .filter('retry_count', 'lt', 'max_retries')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}