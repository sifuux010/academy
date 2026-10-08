/* =====================================================================
   Comptes, sessions, activité des membres, abonnements
   ---------------------------------------------------------------------
   Miroir des tables User / Session / Favorite / Enrollment /
   LessonProgress / Certificate / Subscription de db/schema.prisma.
   ===================================================================== */
import type { Collection, ProfileType, Role } from './common';

export interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  profileType: ProfileType;
  role: Role;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  locale: string;
  avatar: string;
  bio: string;
  expertise: string[];
  interests: string[];
  languages: string[];
  website: string;
  linkedin: string;
  profStatus: string;
  workplace: string;
  experienceYears: string;
  licenseNumber: string;
  university: string;
  academicYear: string;
  graduationYear: string;
  newsletter: boolean;
  salt: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string;
  updatedAt?: string;
  passwordChangedAt?: string;
  premium?: boolean;
  demo?: boolean;
  resetToken?: { token: string; expiresAt: string };
}

/** Utilisateur tel qu'exposé à l'interface : sans secret. */
export type PublicUser = Omit<StoredUser, 'salt' | 'passwordHash' | 'resetToken'>;

export interface Session {
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  remember: boolean;
}

/** Référence horodatée vers un contenu (favori, téléchargement, consultation). */
export interface EntryRef {
  collection: Collection;
  id: string;
  at: string;
}

export interface Certificate {
  courseId: string;
  ref: string;
  at: string;
}

export interface QuizScore {
  courseId: string;
  score: number;
  total: number;
  at: string;
}

export interface UserSettings {
  notifications: Record<string, boolean>;
  privacy: Record<string, boolean>;
}

export interface UserState {
  favorites: EntryRef[];
  downloads: EntryRef[];
  viewed: EntryRef[];
  enrollments: Record<string, { at: string }>;
  /** progress[courseId][lessonId] = date de validation (ISO) */
  progress: Record<string, Record<string, string>>;
  quizScores: Record<string, QuizScore>;
  webinarRegistrations: { id: string; at: string }[];
  certificates: Certificate[];
  searchHistory: string[];
  settings: UserSettings;
}

export type SubscriptionStatus = 'pending' | 'active' | 'rejected' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  /** Statut stocké ; « expired » est calculé à partir de l'échéance. */
  status: Exclude<SubscriptionStatus, 'expired'>;
  requestedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  endsAt: string | null;
  note: string;
  decisionNote: string;
  cancelledAt?: string;
  rejectedAt?: string;
  history: { at: string; status: SubscriptionStatus; by: string }[];
}

export interface AnalyticsEvent {
  name: string;
  payload: Record<string, unknown>;
  locale: string;
  at: string;
}

/** Calque des modifications d'administration appliqué sur le jeu de démonstration. */
export interface OverlayLayer {
  upsert: Record<string, unknown>;
  deleted: string[];
}

export type ContentOverlay = Record<string, OverlayLayer | undefined>;
