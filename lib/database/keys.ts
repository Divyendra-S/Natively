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