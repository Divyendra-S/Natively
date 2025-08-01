# Claude Development Guidelines

## Database Operations Flow

When making any database calls in this React Native project, ALWAYS follow this established architecture:

### 1. Query Functions First
- Create pure query functions in `lib/database/queries/`
- Functions should accept Supabase client and AbortSignal
- Use generated TypeScript types from `lib/database/types.ts`
- Let errors bubble up to TanStack Query

```typescript
// lib/database/queries/tableName.ts
export async function getEntity(
  supabase: SupabaseClient<Database>,
  entityId: string,
  signal?: AbortSignal
): Promise<Entity | null> {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', entityId)
    .single()
    .abortSignal(signal);

  if (error) throw error;
  return data;
}
```

### 2. Query Keys Management
- Define query keys in `lib/database/keys.ts`
- Use hierarchical structure for cache invalidation
- Keep keys consistent and predictable

```typescript
// lib/database/keys.ts
export const entityKeys = {
  all: ['entities'] as const,
  byId: (id: string) => ['entities', id] as const,
  byStatus: (status: string) => ['entities', 'status', status] as const,
};
```

### 3. Custom Hooks Implementation
- Create hooks in `hooks/queries/`
- Use appropriate stale times based on data volatility
- Implement optimistic updates for mutations
- Handle cache invalidation properly

```typescript
// hooks/queries/useEntities.ts
export const useEntityQuery = (entityId: string, options = {}) => {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: entityKeys.byId(entityId),
    queryFn: ({ signal }) => getEntity(supabase, entityId, signal),
    enabled: !!entityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
```

### 4. Mutation Patterns
- Always update relevant caches on successful mutations
- Use optimistic updates where appropriate
- Handle rollback on errors

```typescript
export const useCreateEntityMutation = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (entity: EntityInsert) => createEntity(supabase, entity),
    onSuccess: (newEntity) => {
      // Update list cache
      queryClient.setQueryData(entityKeys.all, (old: Entity[] | undefined) => {
        if (!old) return [newEntity];
        return [newEntity, ...old];
      });
      
      // Set individual cache
      queryClient.setQueryData(entityKeys.byId(newEntity.id), newEntity);
    },
  });
};
```

## Required File Structure

```
lib/
├── database/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Supabase generated types
│   ├── keys.ts               # Query key definitions
│   └── queries/
│       └── [tableName].ts    # Query functions for each table
hooks/
├── useSupabase.ts            # Supabase client hook
└── queries/
    └── use[TableName].ts     # Custom hooks for each table
```

## Development Rules

1. **NO Direct Supabase Calls**: Never call supabase directly in components
2. **Use Custom Hooks**: Always use the established hook pattern
3. **Type Safety**: Use generated types from `lib/database/types.ts`
4. **Cache Management**: Always consider cache updates on mutations
5. **Error Handling**: Let TanStack Query handle errors, don't catch in query functions
6. **AbortSignal**: Always support request cancellation in query functions
7. **Stale Time**: Set appropriate stale times based on data freshness needs

## Example Component Usage

```typescript
const MyComponent = () => {
  const { data, isLoading, error } = useEntityQuery(entityId);
  const createMutation = useCreateEntityMutation();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorComponent error={error} />;
  
  const handleCreate = async (entityData) => {
    try {
      await createMutation.mutateAsync(entityData);
    } catch (error) {
      // Handle error
    }
  };
  
  return <EntityComponent data={data} onCreate={handleCreate} />;
};
```

## Performance Considerations

- User profiles: `staleTime: 10 * 60 * 1000` (10 minutes)
- User posts: `staleTime: 2 * 60 * 1000` (2 minutes)  
- Real-time data: `staleTime: 0` (always fresh)
- Static data: `staleTime: 60 * 60 * 1000` (1 hour)

## Reference Documentation

See `TANSTACK_QUERY_BEST_PRACTICES.md` for comprehensive implementation details and examples.

---

**IMPORTANT**: This flow ensures consistent, performant, and maintainable database operations throughout the application. Always follow this pattern when implementing new features or modifying existing database interactions.