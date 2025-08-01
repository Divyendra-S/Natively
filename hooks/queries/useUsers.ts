import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '../useSupabase';
import { userKeys } from '../../lib/database/keys';
import {
  getUser,
  getUserByEmail,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type UserInsert,
  type UserUpdate,
} from '../../lib/database/queries/users';

export const useUsersQuery = (options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: userKeys.all,
    queryFn: ({ signal }) => getUsers(supabase, signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useUserQuery = (userId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: userKeys.byId(userId),
    queryFn: ({ signal }) => getUser(supabase, userId, signal),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useUserByEmailQuery = (email: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: userKeys.byEmail(email),
    queryFn: ({ signal }) => getUserByEmail(supabase, email, signal),
    enabled: !!email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useCreateUserMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (user: UserInsert) => createUser(supabase, user),
    onSuccess: (newUser) => {
      // Update the users list cache
      queryClient.setQueryData(userKeys.all, (old: User[] | undefined) => {
        if (!old) return [newUser];
        return [newUser, ...old];
      });
      
      // Set the individual user cache
      queryClient.setQueryData(userKeys.byId(newUser.id), newUser);
      queryClient.setQueryData(userKeys.byEmail(newUser.email), newUser);
    },
  });
};

export const useUpdateUserMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UserUpdate }) =>
      updateUser(supabase, userId, updates),
    onSuccess: (updatedUser) => {
      // Update the users list cache
      queryClient.setQueryData(userKeys.all, (old: User[] | undefined) => {
        if (!old) return [updatedUser];
        return old.map((user) => 
          user.id === updatedUser.id ? updatedUser : user
        );
      });
      
      // Update the individual user cache
      queryClient.setQueryData(userKeys.byId(updatedUser.id), updatedUser);
      queryClient.setQueryData(userKeys.byEmail(updatedUser.email), updatedUser);
    },
  });
};

export const useDeleteUserMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => deleteUser(supabase, userId),
    onSuccess: (_, userId) => {
      // Remove from users list cache
      queryClient.setQueryData(userKeys.all, (old: User[] | undefined) => {
        if (!old) return [];
        return old.filter((user) => user.id !== userId);
      });
      
      // Remove individual user cache
      queryClient.removeQueries({ queryKey: userKeys.byId(userId) });
    },
  });
};