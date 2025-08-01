# TanStack Query + Supabase React Native Best Practices

This document outlines the best practices for implementing TanStack Query with Supabase in React Native applications, following modern patterns and conventions for 2025.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setup and Configuration](#setup-and-configuration)
3. [Database Query Functions](#database-query-functions)
4. [Custom Hooks Implementation](#custom-hooks-implementation)
5. [Query Key Management](#query-key-management)
6. [Caching Strategies](#caching-strategies)
7. [Error Handling](#error-handling)
8. [Performance Optimization](#performance-optimization)
9. [Usage Examples](#usage-examples)

## Project Structure

```
src/
├── lib/
│   ├── database/
│   │   ├── index.ts              # Main database exports
│   │   ├── types.ts              # TypeScript types from Supabase
│   │   ├── keys.ts               # Query key definitions
│   │   └── queries/
│   │       ├── users.ts          # User-related queries
│   │       └── posts.ts          # Post-related queries
│   ├── query/
│   │   └── queryClient.tsx       # QueryClient configuration
│   └── supabase.ts               # Supabase client setup
├── hooks/
│   ├── useSupabase.ts            # Supabase client hook
│   └── queries/
│       ├── useUsers.ts           # User query hooks
│       └── usePosts.ts           # Post query hooks
```

## Setup and Configuration

### 1. Supabase Client Setup

```typescript
// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 2. QueryClient Configuration

```typescript
// lib/query/queryClient.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 3. App Setup

```typescript
// App.tsx
import { QueryProvider } from './lib/query/queryClient';

export default function App() {
  return (
    <QueryProvider>
      {/* Your app components */}
    </QueryProvider>
  );
}
```

## Database Query Functions

### Best Practices for Query Functions

1. **Pure Functions**: Keep query functions pure and predictable
2. **AbortSignal Support**: Always support request cancellation
3. **Type Safety**: Use generated TypeScript types from Supabase
4. **Error Handling**: Let errors bubble up to be handled by TanStack Query

```typescript
// lib/database/queries/users.ts
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types';

export type User = Tables<'users'>;
export type UserInsert = TablesInsert<'users'>;
export type UserUpdate = TablesUpdate<'users'>;

export async function getUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  signal?: AbortSignal
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
    .abortSignal(signal);

  if (error) throw error;
  return data;
}
```

## Custom Hooks Implementation

### Query Hook Pattern

```typescript
// hooks/queries/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '../useSupabase';
import { userKeys } from '../../lib/database/keys';
import { getUser } from '../../lib/database/queries/users';

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
```

### Mutation Hook Pattern

```typescript
export const useCreateUserMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (user: UserInsert) => createUser(supabase, user),
    onSuccess: (newUser) => {
      // Optimistic cache updates
      queryClient.setQueryData(userKeys.all, (old: User[] | undefined) => {
        if (!old) return [newUser];
        return [newUser, ...old];
      });
      
      queryClient.setQueryData(userKeys.byId(newUser.id), newUser);
    },
  });
};
```

## Query Key Management

### Hierarchical Key Structure

```typescript
// lib/database/keys.ts
export const userKeys = {
  all: ['users'] as const,
  byId: (id: string) => ['users', id] as const,
  byEmail: (email: string) => ['users', 'email', email] as const,
};

export const postKeys = {
  all: ['posts'] as const,
  published: ['posts', 'published'] as const,
  byId: (id: string) => ['posts', id] as const,
  byUserId: (userId: string) => ['posts', 'user', userId] as const,
};
```

### Key Benefits

- **Cache Invalidation**: Easy to invalidate related queries
- **Type Safety**: Consistent key structure across the app
- **Predictable**: Easy to understand query relationships

## Caching Strategies

### Stale Time Configuration

```typescript
// Different stale times based on data volatility
const queryOptions = {
  userProfile: { staleTime: 10 * 60 * 1000 }, // 10 minutes
  userPosts: { staleTime: 2 * 60 * 1000 },    // 2 minutes
  realTimeData: { staleTime: 0 },             // Always fresh
};
```

### Cache Updates on Mutations

```typescript
// Optimistic updates
onSuccess: (newPost) => {
  // Add to list
  queryClient.setQueryData(postKeys.all, (old: Post[] | undefined) => {
    if (!old) return [newPost];
    return [newPost, ...old];
  });
  
  // Update individual cache
  queryClient.setQueryData(postKeys.byId(newPost.id), newPost);
},
```

## Error Handling

### Global Error Handling

```typescript
// lib/query/queryClient.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry for 4xx errors
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
```

### Component Level Error Handling

```typescript
const MyComponent = () => {
  const { data, isLoading, error } = useUserQuery(userId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorComponent error={error} />;
  
  return <UserProfile user={data} />;
};
```

## Performance Optimization

### React Native Specific Optimizations

```typescript
// Focus refetching for React Navigation
import { useFocusEffect } from '@react-navigation/native';

export const usePostsQuery = (options = {}) => {
  const supabase = useSupabase();
  const { refetch } = useQuery({
    queryKey: postKeys.all,
    queryFn: ({ signal }) => getPosts(supabase, signal),
    ...options,
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  return query;
};
```

### Background Updates

```typescript
// Automatic background refetching
const queryOptions = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: 5 * 60 * 1000, // 5 minutes
};
```

## Usage Examples

### Basic Query Usage

```typescript
const ProfileScreen = ({ userId }: { userId: string }) => {
  const { data: user, isLoading, error } = useUserQuery(userId);
  const { data: posts } = useUserPostsQuery(userId);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <View>
      <UserProfile user={user} />
      <PostsList posts={posts} />
    </View>
  );
};
```

### Mutation Usage

```typescript
const CreatePostScreen = () => {
  const createPostMutation = useCreatePostMutation();
  
  const handleSubmit = async (postData: PostInsert) => {
    try {
      await createPostMutation.mutateAsync(postData);
      // Navigate away or show success message
    } catch (error) {
      // Handle error
    }
  };

  return (
    <PostForm 
      onSubmit={handleSubmit}
      isLoading={createPostMutation.isPending}
    />
  );
};
```

### Optimistic Updates

```typescript
const useTogglePublishMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ postId, published }: { postId: string; published: boolean }) =>
      published ? publishPost(supabase, postId) : unpublishPost(supabase, postId),
    
    // Optimistic update
    onMutate: async ({ postId, published }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.byId(postId) });
      
      const previousPost = queryClient.getQueryData(postKeys.byId(postId));
      
      queryClient.setQueryData(postKeys.byId(postId), (old: Post | undefined) => 
        old ? { ...old, published } : old
      );
      
      return { previousPost };
    },
    
    // Revert on error
    onError: (err, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(postKeys.byId(variables.postId), context.previousPost);
      }
    },
  });
};
```

## Key Benefits

1. **Automatic Caching**: Reduces unnecessary API calls
2. **Background Updates**: Keeps data fresh automatically
3. **Optimistic Updates**: Immediate UI feedback
4. **Error Handling**: Consistent error states across the app
5. **Type Safety**: Full TypeScript support with Supabase types
6. **Performance**: Efficient data fetching and caching
7. **Developer Experience**: Clean, maintainable code structure

## Best Practices Summary

1. **Separate Concerns**: Keep query functions separate from hooks
2. **Use Query Keys**: Implement hierarchical query key system
3. **Cache Management**: Implement proper cache invalidation strategies
4. **Error Handling**: Handle errors consistently across the app
5. **Type Safety**: Leverage TypeScript for better developer experience
6. **Performance**: Use appropriate stale times and background updates
7. **Testing**: Mock queries and mutations for reliable tests

This architecture provides a scalable, maintainable foundation for React Native applications using TanStack Query with Supabase.