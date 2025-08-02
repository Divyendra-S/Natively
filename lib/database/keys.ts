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

export const imageEditingSessionKeys = {
  all: ['image_editing_sessions'] as const,
  byId: (id: string) => ['image_editing_sessions', id] as const,
  byUser: (userId: string) => ['image_editing_sessions', 'user', userId] as const,
  byImage: (imageId: string) => ['image_editing_sessions', 'image', imageId] as const,
  byUserImage: (userId: string, imageId: string) => ['image_editing_sessions', 'user', userId, 'image', imageId] as const,
  stats: (userId: string) => ['image_editing_sessions', 'user', userId, 'stats'] as const,
};

export const userEditingProfileKeys = {
  all: ['user_editing_profiles'] as const,
  byUser: (userId: string) => ['user_editing_profiles', 'user', userId] as const,
};

export const editingFeedbackKeys = {
  all: ['editing_feedback'] as const,
  bySession: (sessionId: string) => ['editing_feedback', 'session', sessionId] as const,
  byUser: (userId: string) => ['editing_feedback', 'user', userId] as const,
  byType: (userId: string, type: string) => ['editing_feedback', 'user', userId, 'type', type] as const,
};

export const popularConfigKeys = {
  all: ['popular_configs'] as const,
  byImageType: (imageType: string) => ['popular_configs', 'image_type', imageType] as const,
  general: ['popular_configs', 'general'] as const,
};