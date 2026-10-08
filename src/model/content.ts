/* =====================================================================
   Contenus : ressources, formations, webinaires, outils, exercices,
   pathologies, auteurs, formules d'abonnement.
   Types établis à partir de l'inventaire des données (tous les champs
   obligatoires sont présents sur 100 % des éléments du jeu de démo) ;
   les champs rendus facultatifs le sont pour les contenus créés depuis
   l'administration.
   ===================================================================== */
import type { Access, Collection, Locale } from './common';

export type Translations = Partial<Record<Locale, Record<string, string>>>;

export interface BaseItem {
  id: string;
  slug: string;
  published?: boolean;
  seed?: boolean;
  i18n?: Translations;
}

export interface Author extends BaseItem {
  firstName: string;
  lastName: string;
  title: string;
  country: string;
  city: string;
  expertise: string[];
  bio: string;
  role: string;
}

export interface Pathology extends BaseItem {
  name: string;
  region: string;
  specialty: string;
  aliases: string[];
  summary: string;
  epidemiology: string;
  presentation: string[];
  redFlags: string[];
  management: string[];
  keyFacts: string[];
  evidence: string;
  description?: string;
}

export interface Resource extends BaseItem {
  type: string;
  title: string;
  subtitle?: string;
  description: string;
  abstract?: string;
  keyPoints?: string[];
  authorId?: string;
  publishedAt: string;
  updatedAt?: string;
  pathologies: string[];
  region: string;
  specialty: string;
  level: string;
  language: string;
  tags: string[];
  format: string;
  sizeKb: number;
  pages?: number;
  access: Access;
  views: number;
  downloads: number;
  references: string[];
  fileUrl?: string;
}

export type LessonType = 'video' | 'pdf' | 'text' | 'quiz';

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

export interface Quiz {
  passScore?: number;
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: number;
  content?: string;
  quiz?: Quiz;
  resourceSlug?: string;
  toolSlug?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course extends BaseItem {
  title: string;
  subtitle?: string;
  description: string;
  instructorId?: string;
  level: string;
  language: string;
  durationMinutes: number;
  access: Access;
  rating: number;
  ratingCount: number;
  enrolledCount: number;
  region: string;
  specialty: string;
  pathologies: string[];
  tags: string[];
  objectives: string[];
  audience: string;
  prerequisites: string[];
  certificate: boolean;
  modules: CourseModule[];
}

export type WebinarStatus = 'live' | 'upcoming' | 'replay' | 'past';

export interface Webinar extends BaseItem {
  title: string;
  subtitle?: string;
  description: string;
  speakerId?: string;
  startsAt: string;
  durationMinutes: number;
  liveUrl: string;
  replayUrl: string;
  registeredCount: number;
  access: Access;
  region: string;
  specialty: string;
  pathologies: string[];
  tags: string[];
  agenda: string[];
  certificate: boolean;
}

export interface Tool extends BaseItem {
  type: string;
  name: string;
  subtitle?: string;
  description: string;
  purpose: string;
  indications: string[];
  contraindications: string[];
  equipment: string[];
  procedure: string[];
  scoring: string;
  interpretation: string[];
  psychometrics?: string;
  references: string[];
  pathologies: string[];
  region: string;
  specialty: string;
  format: string;
  sizeKb: number;
  downloads: number;
  access: Access;
  fileUrl?: string;
}

export interface Dosage {
  sets: string;
  reps: string;
  hold: string;
  frequency: string;
}

export interface Exercise extends BaseItem {
  name: string;
  region: string;
  objective: string;
  difficulty: string;
  targetMuscles: string[];
  equipment: string[];
  goal: string;
  steps: string[];
  dosage: Dosage;
  progression: string;
  regression: string;
  precautions: string[];
  pathologies: string[];
  tags: string[];
  description?: string;
  references?: string[];
}

export type PlanInterval = 'free' | 'month' | 'year' | 'quote';
export type PlanAudience = 'all' | 'STUDENT' | 'PHYSIOTHERAPIST';

export interface Plan extends BaseItem {
  name: string;
  tagline: string;
  priceDzd: number;
  interval: PlanInterval;
  audience: PlanAudience;
  premium: boolean;
  highlighted: boolean;
  order: number;
  features: string[];
  limits: string;
}

export interface ItemMap {
  resources: Resource;
  courses: Course;
  webinars: Webinar;
  tools: Tool;
  exercises: Exercise;
  pathologies: Pathology;
  authors: Author;
  plans: Plan;
}

export type ItemOf<C extends Collection> = ItemMap[C];

export type AnyItem = ItemMap[Collection];
