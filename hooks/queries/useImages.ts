import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../useSupabase';
import { imageKeys } from '../../lib/database/keys';
import {
  getImage,
  getUserImages,
  getImagesByStatus,
  getRecentImages,
  createImage,
  updateImage,
  updateImageStatus,
  deleteImage,
  type Image,
  type ImageInsert,
  type ImageUpdate,
} from '../../lib/database/queries/images';

export const useImageQuery = (imageId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: imageKeys.byId(imageId),
    queryFn: ({ signal }) => getImage(supabase, imageId, signal),
    enabled: !!imageId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useUserImagesQuery = (userId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: imageKeys.byUser(userId),
    queryFn: ({ signal }) => getUserImages(supabase, userId, signal),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useImagesByStatusQuery = (userId: string, status: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: imageKeys.byStatus(userId, status),
    queryFn: ({ signal }) => getImagesByStatus(supabase, userId, status, signal),
    enabled: !!userId && !!status,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

export const useRecentImagesQuery = (userId: string, limit: number = 10, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: imageKeys.recent(userId, limit),
    queryFn: ({ signal }) => getRecentImages(supabase, userId, limit, signal),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useCreateImageMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (image: ImageInsert) => createImage(supabase, image),
    onSuccess: (newImage) => {
      // Update user images cache
      if (newImage.user_id) {
        queryClient.setQueryData(imageKeys.byUser(newImage.user_id), (old: Image[] | undefined) => {
          if (!old) return [newImage];
          return [newImage, ...old];
        });
        
        // Update status-specific cache
        if (newImage.status) {
          queryClient.setQueryData(imageKeys.byStatus(newImage.user_id, newImage.status), (old: Image[] | undefined) => {
            if (!old) return [newImage];
            return [newImage, ...old];
          });
        }
        
        // Update recent images cache
        queryClient.setQueryData(imageKeys.recent(newImage.user_id, 10), (old: Image[] | undefined) => {
          if (!old) return [newImage];
          return [newImage, ...old.slice(0, 9)];
        });
      }
      
      // Set individual image cache
      queryClient.setQueryData(imageKeys.byId(newImage.id), newImage);
    },
  });
};

export const useUpdateImageMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ imageId, updates }: { imageId: string; updates: ImageUpdate }) =>
      updateImage(supabase, imageId, updates),
    onSuccess: (updatedImage) => {
      // Update individual image cache
      queryClient.setQueryData(imageKeys.byId(updatedImage.id), updatedImage);
      
      if (updatedImage.user_id) {
        // Update user images cache
        queryClient.setQueryData(imageKeys.byUser(updatedImage.user_id), (old: Image[] | undefined) => {
          if (!old) return [updatedImage];
          return old.map((image) => 
            image.id === updatedImage.id ? updatedImage : image
          );
        });
        
        // Invalidate status-based queries since status might have changed
        queryClient.invalidateQueries({
          queryKey: ['images', 'user', updatedImage.user_id, 'status']
        });
      }
    },
  });
};

export const useUpdateImageStatusMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ imageId, status, updates }: { imageId: string; status: string; updates?: ImageUpdate }) => {
      if (updates) {
        return updateImage(supabase, imageId, { ...updates, status });
      }
      return updateImageStatus(supabase, imageId, status);
    },
    onSuccess: (updatedImage) => {
      // Update individual image cache
      queryClient.setQueryData(imageKeys.byId(updatedImage.id), updatedImage);
      
      if (updatedImage.user_id) {
        // Update user images cache
        queryClient.setQueryData(imageKeys.byUser(updatedImage.user_id), (old: Image[] | undefined) => {
          if (!old) return [updatedImage];
          return old.map((image) => 
            image.id === updatedImage.id ? updatedImage : image
          );
        });
        
        // Invalidate all status-based queries for this user
        queryClient.invalidateQueries({
          queryKey: ['images', 'user', updatedImage.user_id, 'status']
        });
      }
    },
  });
};

export const useDeleteImageMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (imageId: string) => deleteImage(supabase, imageId),
    onMutate: async (imageId) => {
      // Get the image data before deletion for cache updates
      const imageData = queryClient.getQueryData(imageKeys.byId(imageId)) as Image;
      return { imageData };
    },
    onSuccess: (_, imageId, context) => {
      const { imageData } = context || {};
      
      // Remove individual image cache
      queryClient.removeQueries({ queryKey: imageKeys.byId(imageId) });
      
      if (imageData?.user_id) {
        // Remove from user images cache
        queryClient.setQueryData(imageKeys.byUser(imageData.user_id), (old: Image[] | undefined) => {
          if (!old) return [];
          return old.filter((image) => image.id !== imageId);
        });
        
        // Invalidate status-based queries
        queryClient.invalidateQueries({
          queryKey: ['images', 'user', imageData.user_id, 'status']
        });
        
        // Invalidate recent images
        queryClient.invalidateQueries({
          queryKey: ['images', 'user', imageData.user_id, 'recent']
        });
      }
    },
  });
};