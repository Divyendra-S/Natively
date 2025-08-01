import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../useSupabase';
import { postKeys } from '../../lib/database/keys';
import {
  getPost,
  getPosts,
  getPublishedPosts,
  getUserPosts,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
  type Post,
  type PostInsert,
  type PostUpdate,
} from '../../lib/database/queries/posts';

export const usePostsQuery = (options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: postKeys.all,
    queryFn: ({ signal }) => getPosts(supabase, signal),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const usePublishedPostsQuery = (options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: postKeys.published,
    queryFn: ({ signal }) => getPublishedPosts(supabase, signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const usePostQuery = (postId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: postKeys.byId(postId),
    queryFn: ({ signal }) => getPost(supabase, postId, signal),
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useUserPostsQuery = (userId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: postKeys.byUserId(userId),
    queryFn: ({ signal }) => getUserPosts(supabase, userId, signal),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useCreatePostMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (post: PostInsert) => createPost(supabase, post),
    onSuccess: (newPost) => {
      // Update the posts list cache
      queryClient.setQueryData(postKeys.all, (old: Post[] | undefined) => {
        if (!old) return [newPost];
        return [newPost, ...old];
      });
      
      // Update user posts cache if userId exists
      if (newPost.user_id) {
        queryClient.setQueryData(postKeys.byUserId(newPost.user_id), (old: Post[] | undefined) => {
          if (!old) return [newPost];
          return [newPost, ...old];
        });
      }
      
      // Set the individual post cache
      queryClient.setQueryData(postKeys.byId(newPost.id), newPost);
      
      // Update published posts cache if the post is published
      if (newPost.published) {
        queryClient.setQueryData(postKeys.published, (old: Post[] | undefined) => {
          if (!old) return [newPost];
          return [newPost, ...old];
        });
      }
    },
  });
};

export const useUpdatePostMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: PostUpdate }) =>
      updatePost(supabase, postId, updates),
    onSuccess: (updatedPost) => {
      // Update all posts cache
      queryClient.setQueryData(postKeys.all, (old: Post[] | undefined) => {
        if (!old) return [updatedPost];
        return old.map((post) => 
          post.id === updatedPost.id ? updatedPost : post
        );
      });
      
      // Update published posts cache
      queryClient.setQueryData(postKeys.published, (old: Post[] | undefined) => {
        if (!old) return updatedPost.published ? [updatedPost] : [];
        if (updatedPost.published) {
          // Add to published if not already there
          return old.some(post => post.id === updatedPost.id) 
            ? old.map(post => post.id === updatedPost.id ? updatedPost : post)
            : [updatedPost, ...old];
        } else {
          // Remove from published if unpublished
          return old.filter(post => post.id !== updatedPost.id);
        }
      });
      
      // Update user posts cache if userId exists
      if (updatedPost.user_id) {
        queryClient.setQueryData(postKeys.byUserId(updatedPost.user_id), (old: Post[] | undefined) => {
          if (!old) return [updatedPost];
          return old.map((post) => 
            post.id === updatedPost.id ? updatedPost : post
          );
        });
      }
      
      // Update individual post cache
      queryClient.setQueryData(postKeys.byId(updatedPost.id), updatedPost);
    },
  });
};

export const useDeletePostMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId: string) => deletePost(supabase, postId),
    onSuccess: (_, postId) => {
      // Remove from all posts cache
      queryClient.setQueryData(postKeys.all, (old: Post[] | undefined) => {
        if (!old) return [];
        return old.filter((post) => post.id !== postId);
      });
      
      // Remove from published posts cache
      queryClient.setQueryData(postKeys.published, (old: Post[] | undefined) => {
        if (!old) return [];
        return old.filter((post) => post.id !== postId);
      });
      
      // Remove individual post cache
      queryClient.removeQueries({ queryKey: postKeys.byId(postId) });
      
      // Remove from user posts caches (we can't know which user, so invalidate all)
      queryClient.invalidateQueries({ 
        queryKey: ['posts', 'user'],
        exact: false 
      });
    },
  });
};

export const usePublishPostMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId: string) => publishPost(supabase, postId),
    onSuccess: (publishedPost) => {
      // Update all caches as if it's an update
      queryClient.setQueryData(postKeys.all, (old: Post[] | undefined) => {
        if (!old) return [publishedPost];
        return old.map((post) => 
          post.id === publishedPost.id ? publishedPost : post
        );
      });
      
      // Add to published posts cache
      queryClient.setQueryData(postKeys.published, (old: Post[] | undefined) => {
        if (!old) return [publishedPost];
        return old.some(post => post.id === publishedPost.id)
          ? old.map(post => post.id === publishedPost.id ? publishedPost : post)
          : [publishedPost, ...old];
      });
      
      // Update user posts cache if userId exists
      if (publishedPost.user_id) {
        queryClient.setQueryData(postKeys.byUserId(publishedPost.user_id), (old: Post[] | undefined) => {
          if (!old) return [publishedPost];
          return old.map((post) => 
            post.id === publishedPost.id ? publishedPost : post
          );
        });
      }
      
      // Update individual post cache
      queryClient.setQueryData(postKeys.byId(publishedPost.id), publishedPost);
    },
  });
};

export const useUnpublishPostMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId: string) => unpublishPost(supabase, postId),
    onSuccess: (unpublishedPost) => {
      // Update all caches as if it's an update
      queryClient.setQueryData(postKeys.all, (old: Post[] | undefined) => {
        if (!old) return [unpublishedPost];
        return old.map((post) => 
          post.id === unpublishedPost.id ? unpublishedPost : post
        );
      });
      
      // Remove from published posts cache
      queryClient.setQueryData(postKeys.published, (old: Post[] | undefined) => {
        if (!old) return [];
        return old.filter(post => post.id !== unpublishedPost.id);
      });
      
      // Update user posts cache if userId exists
      if (unpublishedPost.user_id) {
        queryClient.setQueryData(postKeys.byUserId(unpublishedPost.user_id), (old: Post[] | undefined) => {
          if (!old) return [unpublishedPost];
          return old.map((post) => 
            post.id === unpublishedPost.id ? unpublishedPost : post
          );
        });
      }
      
      // Update individual post cache
      queryClient.setQueryData(postKeys.byId(unpublishedPost.id), unpublishedPost);
    },
  });
};