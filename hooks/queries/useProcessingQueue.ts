import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../useSupabase';
import { processingQueueKeys } from '../../lib/database/keys';
import {
  getProcessingQueueItem,
  getUserProcessingQueue,
  getProcessingQueueByStatus,
  getImageProcessingQueue,
  getPendingProcessingQueue,
  createProcessingQueueItem,
  updateProcessingQueueItem,
  startProcessingQueueItem,
  completeProcessingQueueItem,
  failProcessingQueueItem,
  deleteProcessingQueueItem,
  type ProcessingQueue,
  type ProcessingQueueInsert,
  type ProcessingQueueUpdate,
} from '../../lib/database/queries/processing_queue';

export const useProcessingQueueItemQuery = (queueId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: processingQueueKeys.byId(queueId),
    queryFn: ({ signal }) => getProcessingQueueItem(supabase, queueId, signal),
    enabled: !!queueId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

export const useUserProcessingQueueQuery = (userId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: processingQueueKeys.byUser(userId),
    queryFn: ({ signal }) => getUserProcessingQueue(supabase, userId, signal),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

export const useProcessingQueueByStatusQuery = (userId: string, status: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: processingQueueKeys.byStatus(userId, status),
    queryFn: ({ signal }) => getProcessingQueueByStatus(supabase, userId, status, signal),
    enabled: !!userId && !!status,
    staleTime: 15 * 1000, // 15 seconds
    ...options,
  });
};

export const useImageProcessingQueueQuery = (imageId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: processingQueueKeys.byImage(imageId),
    queryFn: ({ signal }) => getImageProcessingQueue(supabase, imageId, signal),
    enabled: !!imageId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

export const usePendingProcessingQueueQuery = (options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: processingQueueKeys.pending,
    queryFn: ({ signal }) => getPendingProcessingQueue(supabase, signal),
    staleTime: 10 * 1000, // 10 seconds
    ...options,
  });
};

export const useCreateProcessingQueueMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (queueItem: ProcessingQueueInsert) => createProcessingQueueItem(supabase, queueItem),
    onSuccess: (newQueueItem) => {
      // Set individual queue item cache
      queryClient.setQueryData(processingQueueKeys.byId(newQueueItem.id), newQueueItem);
      
      if (newQueueItem.user_id) {
        // Update user processing queue cache
        queryClient.setQueryData(processingQueueKeys.byUser(newQueueItem.user_id), (old: ProcessingQueue[] | undefined) => {
          if (!old) return [newQueueItem];
          return [newQueueItem, ...old];
        });
        
        // Update status-specific cache
        if (newQueueItem.status) {
          queryClient.setQueryData(processingQueueKeys.byStatus(newQueueItem.user_id, newQueueItem.status), (old: ProcessingQueue[] | undefined) => {
            if (!old) return [newQueueItem];
            return [newQueueItem, ...old];
          });
        }
      }
      
      if (newQueueItem.image_id) {
        // Update image processing queue cache
        queryClient.setQueryData(processingQueueKeys.byImage(newQueueItem.image_id), (old: ProcessingQueue[] | undefined) => {
          if (!old) return [newQueueItem];
          return [newQueueItem, ...old];
        });
      }
      
      // Update pending queue if status is pending
      if (newQueueItem.status === 'pending') {
        queryClient.setQueryData(processingQueueKeys.pending, (old: ProcessingQueue[] | undefined) => {
          if (!old) return [newQueueItem];
          return [newQueueItem, ...old];
        });
      }
    },
  });
};

export const useUpdateProcessingQueueMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ queueId, updates }: { queueId: string; updates: ProcessingQueueUpdate }) =>
      updateProcessingQueueItem(supabase, queueId, updates),
    onSuccess: (updatedQueueItem) => {
      // Update individual queue item cache
      queryClient.setQueryData(processingQueueKeys.byId(updatedQueueItem.id), updatedQueueItem);
      
      if (updatedQueueItem.user_id) {
        // Update user processing queue cache
        queryClient.setQueryData(processingQueueKeys.byUser(updatedQueueItem.user_id), (old: ProcessingQueue[] | undefined) => {
          if (!old) return [updatedQueueItem];
          return old.map((item) => 
            item.id === updatedQueueItem.id ? updatedQueueItem : item
          );
        });
        
        // Invalidate status-based queries since status might have changed
        queryClient.invalidateQueries({
          queryKey: ['processing_queue', 'user', updatedQueueItem.user_id, 'status']
        });
      }
      
      if (updatedQueueItem.image_id) {
        // Update image processing queue cache
        queryClient.setQueryData(processingQueueKeys.byImage(updatedQueueItem.image_id), (old: ProcessingQueue[] | undefined) => {
          if (!old) return [updatedQueueItem];
          return old.map((item) => 
            item.id === updatedQueueItem.id ? updatedQueueItem : item
          );
        });
      }
      
      // Invalidate pending queue since status might have changed
      queryClient.invalidateQueries({ queryKey: processingQueueKeys.pending });
    },
  });
};

export const useStartProcessingQueueMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (queueId: string) => startProcessingQueueItem(supabase, queueId),
    onSuccess: (updatedQueueItem) => {
      // Update individual queue item cache
      queryClient.setQueryData(processingQueueKeys.byId(updatedQueueItem.id), updatedQueueItem);
      
      // Invalidate relevant caches since status changed to 'processing'
      if (updatedQueueItem.user_id) {
        queryClient.invalidateQueries({
          queryKey: ['processing_queue', 'user', updatedQueueItem.user_id]
        });
      }
      
      queryClient.invalidateQueries({ queryKey: processingQueueKeys.pending });
    },
  });
};

export const useCompleteProcessingQueueMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (queueId: string) => completeProcessingQueueItem(supabase, queueId),
    onSuccess: (updatedQueueItem) => {
      // Update individual queue item cache
      queryClient.setQueryData(processingQueueKeys.byId(updatedQueueItem.id), updatedQueueItem);
      
      // Invalidate relevant caches since status changed to 'completed'
      if (updatedQueueItem.user_id) {
        queryClient.invalidateQueries({
          queryKey: ['processing_queue', 'user', updatedQueueItem.user_id]
        });
      }
      
      queryClient.invalidateQueries({ queryKey: processingQueueKeys.pending });
    },
  });
};

export const useFailProcessingQueueMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ queueId, errorMessage }: { queueId: string; errorMessage: string }) =>
      failProcessingQueueItem(supabase, queueId, errorMessage),
    onSuccess: (updatedQueueItem) => {
      // Update individual queue item cache
      queryClient.setQueryData(processingQueueKeys.byId(updatedQueueItem.id), updatedQueueItem);
      
      // Invalidate relevant caches since status changed to 'failed'
      if (updatedQueueItem.user_id) {
        queryClient.invalidateQueries({
          queryKey: ['processing_queue', 'user', updatedQueueItem.user_id]
        });
      }
      
      queryClient.invalidateQueries({ queryKey: processingQueueKeys.pending });
    },
  });
};

export const useDeleteProcessingQueueMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (queueId: string) => deleteProcessingQueueItem(supabase, queueId),
    onMutate: async (queueId) => {
      // Get the queue item data before deletion for cache updates
      const queueItemData = queryClient.getQueryData(processingQueueKeys.byId(queueId)) as ProcessingQueue;
      return { queueItemData };
    },
    onSuccess: (_, queueId, context) => {
      const { queueItemData } = context || {};
      
      // Remove individual queue item cache
      queryClient.removeQueries({ queryKey: processingQueueKeys.byId(queueId) });
      
      if (queueItemData?.user_id) {
        // Remove from user processing queue cache
        queryClient.setQueryData(processingQueueKeys.byUser(queueItemData.user_id), (old: ProcessingQueue[] | undefined) => {
          if (!old) return [];
          return old.filter((item) => item.id !== queueId);
        });
        
        // Invalidate status-based queries
        queryClient.invalidateQueries({
          queryKey: ['processing_queue', 'user', queueItemData.user_id, 'status']
        });
      }
      
      if (queueItemData?.image_id) {
        // Remove from image processing queue cache
        queryClient.setQueryData(processingQueueKeys.byImage(queueItemData.image_id), (old: ProcessingQueue[] | undefined) => {
          if (!old) return [];
          return old.filter((item) => item.id !== queueId);
        });
      }
      
      // Remove from pending queue cache
      queryClient.setQueryData(processingQueueKeys.pending, (old: ProcessingQueue[] | undefined) => {
        if (!old) return [];
        return old.filter((item) => item.id !== queueId);
      });
    },
  });
};