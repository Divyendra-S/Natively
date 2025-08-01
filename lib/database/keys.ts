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

export const imageKeys = {
  all: ['images'] as const,
  byId: (id: string) => ['images', id] as const,
  byUser: (userId: string) => ['images', 'user', userId] as const,
  byStatus: (userId: string, status: string) => ['images', 'user', userId, 'status', status] as const,
  recent: (userId: string, limit: number) => ['images', 'user', userId, 'recent', limit] as const,
};

export const processingQueueKeys = {
  all: ['processing_queue'] as const,
  byId: (id: string) => ['processing_queue', id] as const,
  byUser: (userId: string) => ['processing_queue', 'user', userId] as const,
  byStatus: (userId: string, status: string) => ['processing_queue', 'user', userId, 'status', status] as const,
  byImage: (imageId: string) => ['processing_queue', 'image', imageId] as const,
  pending: ['processing_queue', 'pending'] as const,
};

export const userPreferencesKeys = {
  all: ['user_preferences'] as const,
  byUser: (userId: string) => ['user_preferences', 'user', userId] as const,
};