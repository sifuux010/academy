/* =====================================================================
   Activité du membre
   ---------------------------------------------------------------------
   Favoris, consultations, téléchargements, inscriptions, progression,
   quiz, certificats, webinaires, historique de recherche, réglages,
   recommandations. Sans session, les fonctions d'écriture renvoient
   { requiresAuth: true } pour que l'interface propose la connexion.
   ===================================================================== */
import type { Certificate, EntryRef, QuizScore, UserSettings, UserState } from '../model/account';
import type { Collection } from '../model/common';
import type { AnyItem, Course, Lesson, Webinar, WebinarStatus } from '../model/content';
import { track } from './analytics';
import { currentUser } from './auth';
import { courseStats, getById, lessonsOf, published, searchText, webinarStatus } from './content';
import { normalize } from './format';
import { defaultUserState, getUserState, mutateUserState } from './storage';

export interface RequiresAuth {
  requiresAuth: true;
}

const REQUIRES_AUTH: RequiresAuth = { requiresAuth: true };

export function needsAuth(result: unknown): result is RequiresAuth {
  return typeof result === 'object' && result !== null && 'requiresAuth' in result;
}

function state(): UserState {
  const user = currentUser();
  return user ? getUserState(user.id) : defaultUserState();
}

function mutate(mutator: (s: UserState) => void, silent = false): boolean {
  const user = currentUser();
  if (!user) return false;
  mutateUserState(user.id, mutator, { silent });
  return true;
}

export interface ItemEntry {
  collection: Collection;
  item: AnyItem;
  at: string;
}

function resolve(entries: EntryRef[]): ItemEntry[] {
  return entries
    .map((entry) => {
      const item = getById(entry.collection, entry.id) as AnyItem | null;
      return item ? { collection: entry.collection, item, at: entry.at } : null;
    })
    .filter((entry): entry is ItemEntry => entry !== null);
}

/* ---------------------------------------------------------- favoris --- */

export function isFavorite(collection: Collection, id: string): boolean {
  return state().favorites.some((f) => f.collection === collection && f.id === id);
}

export function toggleFavorite(collection: Collection, id: string): RequiresAuth | { added: boolean } {
  if (!currentUser()) return REQUIRES_AUTH;
  let added = false;
  mutate((s) => {
    const index = s.favorites.findIndex((f) => f.collection === collection && f.id === id);
    if (index >= 0) s.favorites.splice(index, 1);
    else {
      s.favorites.unshift({ collection, id, at: new Date().toISOString() });
      added = true;
    }
  });
  track(added ? 'favorite_added' : 'favorite_removed', { collection, id });
  return { added };
}

export function favorites(): ItemEntry[] {
  return resolve(state().favorites);
}

/* ---------------------------------------------------- consultations --- */

/** Silencieux : appelé depuis un effet, ne doit pas redessiner la page. */
export function recordView(collection: Collection, id: string): void {
  track('resource_viewed', { collection, id });
  mutate((s) => {
    s.viewed = s.viewed.filter((v) => !(v.collection === collection && v.id === id));
    s.viewed.unshift({ collection, id, at: new Date().toISOString() });
    if (s.viewed.length > 60) s.viewed = s.viewed.slice(0, 60);
  }, true);
}

export function recordDownload(collection: Collection, id: string): void {
  track(collection === 'tools' ? 'tool_downloaded' : 'resource_downloaded', { collection, id });
  mutate((s) => {
    s.downloads = s.downloads.filter((d) => !(d.collection === collection && d.id === id));
    s.downloads.unshift({ collection, id, at: new Date().toISOString() });
    if (s.downloads.length > 80) s.downloads = s.downloads.slice(0, 80);
  });
}

export function downloads(): ItemEntry[] {
  return resolve(state().downloads);
}

/* ------------------------------------------------------- formations --- */

export function isEnrolled(courseId: string): boolean {
  return !!state().enrollments[courseId];
}

export function enroll(courseId: string): RequiresAuth | { enrolled: boolean; already?: boolean } {
  if (!currentUser()) return REQUIRES_AUTH;
  if (isEnrolled(courseId)) return { enrolled: true, already: true };
  mutate((s) => {
    s.enrollments[courseId] = { at: new Date().toISOString() };
    if (!s.progress[courseId]) s.progress[courseId] = {};
  });
  track('course_started', { courseId });
  return { enrolled: true };
}

export function isLessonDone(courseId: string, lessonId: string): boolean {
  return !!state().progress[courseId]?.[lessonId];
}

export interface ProgressInfo {
  done: number;
  total: number;
  percent: number;
}

export function courseProgress(course: Course): ProgressInfo {
  const lessons = lessonsOf(course);
  const progress = state().progress[course.id] ?? {};
  const done = lessons.filter((entry) => progress[entry.lesson.id]).length;
  const total = lessons.length;
  return { done, total, percent: Math.round((done / (total || 1)) * 100) };
}

export type CourseStatus = 'notStarted' | 'inProgress' | 'completed';

export function courseStatus(course: Course): CourseStatus {
  const progress = courseProgress(course);
  if (!isEnrolled(course.id) && progress.done === 0) return 'notStarted';
  if (progress.total > 0 && progress.done >= progress.total) return 'completed';
  return 'inProgress';
}

/** Certificat existant (lecture seule, utilisable pendant le rendu). */
export function certificateFor(courseId: string): Certificate | null {
  return state().certificates.find((c) => c.courseId === courseId) ?? null;
}

/** Délivre le certificat si la formation est terminée à 100 %. */
function issueCertificateIfComplete(courseId: string): { certificate: Certificate | null; newlyIssued: boolean } {
  const user = currentUser();
  const course = getById('courses', courseId);
  if (!user || !course || !course.certificate) return { certificate: null, newlyIssued: false };
  const progress = courseProgress(course);
  if (progress.total === 0 || progress.done < progress.total) return { certificate: null, newlyIssued: false };

  const existing = certificateFor(courseId);
  if (existing) return { certificate: existing, newlyIssued: false };

  const certificate: Certificate = {
    courseId,
    ref: `KA-${new Date().getFullYear()}-${courseId.toUpperCase().replace('COU-', '')}-${user.id.slice(-4).toUpperCase()}`,
    at: new Date().toISOString()
  };
  mutate((s) => {
    s.certificates.unshift(certificate);
  });
  track('certificate_earned', { courseId });
  return { certificate, newlyIssued: true };
}

export interface LessonToggleResult {
  done: boolean;
  certificate: Certificate | null;
  newlyIssued: boolean;
}

export function toggleLesson(courseId: string, lessonId: string): RequiresAuth | LessonToggleResult {
  if (!currentUser()) return REQUIRES_AUTH;
  let done = false;
  mutate((s) => {
    if (!s.enrollments[courseId]) s.enrollments[courseId] = { at: new Date().toISOString() };
    const progress = s.progress[courseId] ?? {};
    if (progress[lessonId]) delete progress[lessonId];
    else {
      progress[lessonId] = new Date().toISOString();
      done = true;
    }
    s.progress[courseId] = progress;
  });
  if (done) track('lesson_completed', { courseId, lessonId });
  const issued = issueCertificateIfComplete(courseId);
  return { done, certificate: issued.certificate, newlyIssued: issued.newlyIssued };
}

export function setLessonDone(courseId: string, lessonId: string): RequiresAuth | LessonToggleResult {
  if (isLessonDone(courseId, lessonId)) {
    return { done: true, certificate: certificateFor(courseId), newlyIssued: false };
  }
  return toggleLesson(courseId, lessonId);
}

export interface MyCourseEntry {
  course: Course;
  progress: ProgressInfo;
  status: CourseStatus;
}

export function myCourses(): MyCourseEntry[] {
  const s = state();
  return published('courses')
    .filter((course) => !!s.enrollments[course.id] || Object.keys(s.progress[course.id] ?? {}).length > 0)
    .map((course) => ({ course, progress: courseProgress(course), status: courseStatus(course) }))
    .sort((a, b) => b.progress.percent - a.progress.percent);
}

/** Prochaine leçon non terminée (bouton « Reprendre »). */
export function nextLesson(course: Course): Lesson | null {
  const lessons = lessonsOf(course);
  const progress = state().progress[course.id] ?? {};
  const next = lessons.find((entry) => !progress[entry.lesson.id]);
  return next?.lesson ?? lessons[lessons.length - 1]?.lesson ?? null;
}

export function saveQuizScore(courseId: string, lessonId: string, score: number, total: number): RequiresAuth | { saved: true } {
  if (!currentUser()) return REQUIRES_AUTH;
  mutate((s) => {
    s.quizScores[lessonId] = { courseId, score, total, at: new Date().toISOString() };
  });
  track('quiz_completed', { courseId, lessonId, score, total });
  return { saved: true };
}

export function quizScore(lessonId: string): QuizScore | null {
  return state().quizScores[lessonId] ?? null;
}

/* ------------------------------------------------------- webinaires --- */

export function isRegistered(webinarId: string): boolean {
  return state().webinarRegistrations.some((r) => r.id === webinarId);
}

export function toggleWebinarRegistration(webinarId: string): RequiresAuth | { registered: boolean } {
  if (!currentUser()) return REQUIRES_AUTH;
  let registered = false;
  mutate((s) => {
    const index = s.webinarRegistrations.findIndex((r) => r.id === webinarId);
    if (index >= 0) s.webinarRegistrations.splice(index, 1);
    else {
      s.webinarRegistrations.unshift({ id: webinarId, at: new Date().toISOString() });
      registered = true;
    }
  });
  if (registered) track('webinar_registration', { webinarId });
  return { registered };
}

export interface MyWebinarEntry {
  webinar: Webinar;
  at: string;
  status: WebinarStatus;
}

export function myWebinars(): MyWebinarEntry[] {
  return state()
    .webinarRegistrations.map((r) => {
      const webinar = getById('webinars', r.id);
      return webinar ? { webinar, at: r.at, status: webinarStatus(webinar) } : null;
    })
    .filter((entry): entry is MyWebinarEntry => entry !== null)
    .sort((a, b) => new Date(a.webinar.startsAt).getTime() - new Date(b.webinar.startsAt).getTime());
}

/* ----------------------------------------------------- certificats ---- */

export function certificates(): { certificate: Certificate; course: Course }[] {
  return state()
    .certificates.map((certificate) => {
      const course = getById('courses', certificate.courseId);
      return course ? { certificate, course } : null;
    })
    .filter((entry): entry is { certificate: Certificate; course: Course } => entry !== null);
}

/* ------------------------------------------ historique et réglages --- */

export function recordSearch(query: string): void {
  track('search_performed', { query });
  if (!query || query.length < 2) return;
  mutate((s) => {
    s.searchHistory = [query, ...s.searchHistory.filter((q) => q !== query)].slice(0, 8);
  }, true);
}

export function searchHistory(): string[] {
  return state().searchHistory;
}

export function clearSearchHistory(): void {
  mutate((s) => {
    s.searchHistory = [];
  });
}

export function settings(): UserSettings {
  return state().settings;
}

export function updateSettings(patch: Partial<UserSettings>): RequiresAuth | { saved: true } {
  if (!currentUser()) return REQUIRES_AUTH;
  mutate((s) => {
    Object.entries(patch.notifications ?? {}).forEach(([key, value]) => {
      s.settings.notifications[key] = !!value;
    });
    Object.entries(patch.privacy ?? {}).forEach(([key, value]) => {
      s.settings.privacy[key] = !!value;
    });
  });
  return { saved: true };
}

/* ------------------------------------------------- tableau de bord --- */

export function summary() {
  const s = state();
  let completed = 0;
  let minutes = 0;
  published('courses').forEach((course) => {
    const progress = s.progress[course.id];
    if (!progress) return;
    const lessons = lessonsOf(course);
    const done = lessons.filter((entry) => progress[entry.lesson.id]);
    done.forEach((entry) => {
      minutes += entry.lesson.duration || 0;
    });
    if (lessons.length && done.length >= lessons.length) completed += 1;
  });
  return {
    coursesCompleted: completed,
    learningMinutes: minutes,
    certificates: s.certificates.length,
    resourcesViewed: s.viewed.length,
    favorites: s.favorites.length,
    downloads: s.downloads.length,
    lastActivity: s.viewed[0]?.at ?? null
  };
}

export interface Recommendation {
  collection: 'resources' | 'courses' | 'tools';
  item: AnyItem;
  score: number;
}

/**
 * Recommandations explicables : profil (spécialités, intérêts),
 * pathologies consultées ou mises en favori, niveau selon le profil.
 */
export function recommendations(limit = 4): Recommendation[] {
  const user = currentUser();
  const s = state();
  const interestWords = user ? [...user.expertise, ...user.interests].map(normalize) : [];

  const seen = new Set<string>();
  s.viewed.forEach((v) => seen.add(v.id));
  s.favorites.forEach((f) => seen.add(f.id));

  const weights: Record<string, number> = {};
  [...s.viewed, ...s.favorites].forEach((entry) => {
    const item = getById(entry.collection, entry.id) as AnyItem | null;
    const pathologies = item ? ((item as { pathologies?: string[] }).pathologies ?? []) : [];
    pathologies.forEach((p) => {
      weights[p] = (weights[p] ?? 0) + 2;
    });
  });

  const pool: { collection: Recommendation['collection']; item: AnyItem }[] = [
    ...published('resources').map((item) => ({ collection: 'resources' as const, item })),
    ...published('courses').map((item) => ({ collection: 'courses' as const, item })),
    ...published('tools').map((item) => ({ collection: 'tools' as const, item }))
  ];

  return pool
    .map(({ collection, item }) => {
      const record = item as unknown as Record<string, unknown>;
      let score = seen.has(item.id) ? -5 : 0;
      ((record.pathologies as string[] | undefined) ?? []).forEach((p) => {
        score += weights[p] ?? 0;
      });
      const haystack = searchText(item);
      interestWords.forEach((word) => {
        if (word && haystack.includes(word)) score += 3;
      });
      const level = record.level;
      if (user?.profileType === 'STUDENT' && (level === 'etudiant' || level === 'debutant')) score += 2;
      if (user?.profileType === 'PHYSIOTHERAPIST' && (level === 'avance' || level === 'expert')) score += 1;
      const popularity = (Number(record.views) || 0) + (Number(record.downloads) || 0);
      score += Math.min(2, popularity / 2000);
      return { collection, item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export { courseStats };
