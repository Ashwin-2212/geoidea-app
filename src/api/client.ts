import { GeoIdea, User, AuthResponse, Comment, IdeaCategory, IssueSeverity, IssueStatus, LeaderboardUser, AnalyticsSummary } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('geo_idea_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('geo_idea_token', token);
  } else {
    localStorage.removeItem('geo_idea_token');
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('geo_idea_refresh_token');
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem('geo_idea_refresh_token', token);
  } else {
    localStorage.removeItem('geo_idea_refresh_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An unexpected error occurred.');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string; role?: string; department?: string; avatar?: string; bio?: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; demoResetCode?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (payload: { email: string; resetCode: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMe: () => request<User>('/auth/me'),

  // AI & Duplicate Services
  checkDuplicate: (payload: { title: string; description?: string }) =>
    request<{
      isDuplicate: boolean;
      duplicateIdeaId?: string;
      similarityScore: number;
      reason?: string;
      suggestedAction?: string;
    }>('/ideas/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  predictAi: (payload: { title: string; description: string }) =>
    request<{
      category: IdeaCategory;
      severity: IssueSeverity;
      department: string;
      confidenceScore: number;
      detectedTags: string[];
      summary: string;
    }>('/ideas/ai-predict', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  translateText: (payload: { text: string; targetLang: string }) =>
    request<{ translatedText: string; detectedLanguage: string }>('/ideas/translate', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getAnalytics: () => request<AnalyticsSummary>('/ideas/analytics'),

  getLeaderboard: () => request<LeaderboardUser[]>('/ideas/leaderboard'),

  // Ideas
  getIdeas: (params: {
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
    severity?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    userId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.lat !== undefined) query.set('lat', params.lat.toString());
    if (params.lng !== undefined) query.set('lng', params.lng.toString());
    if (params.radius !== undefined) query.set('radius', params.radius.toString());
    if (params.category) query.set('category', params.category);
    if (params.severity) query.set('severity', params.severity);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.userId) query.set('userId', params.userId);

    const qs = query.toString();
    return request<GeoIdea[]>(`/ideas${qs ? `?${qs}` : ''}`);
  },

  getIdeaById: (id: string) => request<GeoIdea>(`/ideas/${id}`),

  createIdea: (payload: {
    title: string;
    description: string;
    category?: IdeaCategory;
    severity?: IssueSeverity;
    latitude: number;
    longitude: number;
    address?: string;
    imageUrl?: string;
  }) =>
    request<GeoIdea>('/ideas', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  verifyIdea: (id: string, comment?: string) =>
    request<{
      message: string;
      verificationsCount: number;
      isVerifiedByUser: boolean;
      currentStatus: IssueStatus;
    }>(`/ideas/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    }),

  updateStatus: (
    id: string,
    payload: {
      status: IssueStatus;
      departmentAssigned?: string;
      assignedOfficialName?: string;
      resolutionNotes?: string;
      resolutionImageUrl?: string;
    }
  ) =>
    request<{ message: string; idea: GeoIdea }>(`/ideas/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  updateIdea: (id: string, payload: Partial<GeoIdea>) =>
    request<GeoIdea>(`/ideas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteIdea: (id: string) =>
    request<{ message: string }>(`/ideas/${id}`, {
      method: 'DELETE'
    }),

  toggleLike: (id: string) =>
    request<{ isLikedByUser: boolean; likesCount: number }>(`/ideas/${id}/like`, {
      method: 'POST'
    }),

  // Comments
  getComments: (ideaId: string) => request<Comment[]>(`/comments/idea/${ideaId}`),

  addComment: (ideaId: string, text: string) =>
    request<Comment>(`/comments/idea/${ideaId}`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),

  deleteComment: (commentId: string) =>
    request<{ message: string }>(`/comments/${commentId}`, {
      method: 'DELETE'
    }),

  // User Profile & Admin Directory
  getAllUsers: () =>
    request<
      Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        department?: string;
        avatar?: string;
        bio?: string;
        points?: number;
        badges?: string[];
        createdAt: string;
        ideasCount: number;
        totalUpvotesEarned?: number;
        commentsCount: number;
      }>
    >('/users'),

  getUserProfile: (userId: string) =>
    request<{
      user: User;
      stats: {
        ideasCount: number;
        totalUpvotesEarned: number;
        commentsWrittenCount: number;
      };
    }>(`/users/${userId}/profile`),

  // SQL Schema
  getSqlSchema: async (): Promise<string> => {
    const res = await fetch('/api/schema/sql');
    return res.text();
  }
};

