export type UserRole = 'citizen' | 'moderator' | 'official' | 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  bio?: string;
  points?: number;
  badges?: string[];
  isVerified?: boolean;
  languagePreference?: 'en' | 'ta' | 'hi' | 'te' | 'ml';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export type IdeaCategory =
  | 'Community'
  | 'Roads & Potholes'
  | 'Electricity & Lighting'
  | 'Water & Drainage'
  | 'Sanitation & Waste'
  | 'Public Safety'
  | 'Healthcare'
  | 'Education'
  | 'Traffic & Transit'
  | 'Environment'
  | 'Green & Eco'
  | 'Smart City'
  | 'Tech & Innovation'
  | 'Transport'
  | 'Culture & Art'
  | 'Local Business';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus =
  | 'submitted'
  | 'verified'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface StatusHistoryItem {
  status: IssueStatus;
  updatedBy: string;
  role: string;
  timestamp: string;
  note?: string;
}

export interface GeoIdea {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  category: IdeaCategory;
  imageUrl?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  likesCount: number;
  commentsCount: number;
  isLikedByUser?: boolean;
  distanceKm?: number; // Calculated dynamically relative to user's point
  severity?: IssueSeverity;
  status?: IssueStatus;
  departmentAssigned?: string;
  assignedOfficialName?: string;
  resolutionNotes?: string;
  resolutionImageUrl?: string;
  verificationsCount?: number;
  isVerifiedByUser?: boolean;
  aiConfidenceScore?: number;
  aiDetectedTags?: string[];
  aiDuplicateWarning?: string;
  statusHistory?: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  ideaId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Like {
  id: string;
  ideaId: string;
  userId: string;
  createdAt: string;
}

export interface Verification {
  id: string;
  ideaId: string;
  userId: string;
  createdAt: string;
  comment?: string;
}

export interface DistanceFilterOptions {
  radiusKm: number; // 0 means any distance
  centerLat?: number;
  centerLng?: number;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  role: UserRole;
  points: number;
  badges: string[];
  ideasCount: number;
  verificationsCount: number;
}

export interface AnalyticsSummary {
  totalIdeas: number;
  totalUsers: number;
  verifiedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  avgResolutionDays: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
}

