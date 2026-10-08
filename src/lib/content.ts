/* =====================================================================
   Couche d'accès aux contenus
   ---------------------------------------------------------------------
   Point de bascule entre l'interface et la source de données.
   Aujourd'hui : jeu de démonstration (src/data) + calque des
   modifications d'administration persisté localement.
   Demain : les mêmes signatures (list / get / create / update / remove),
   rendues asynchrones, sont branchées sur l'API — les pages ne changent pas.
   ===================================================================== */
import { authors as seedAuthors } from '../data/authors';
import { courses as seedCourses } from '../data/courses';
import { exercises as seedExercises } from '../data/exercises';
import { pathologies as seedPathologies } from '../data/pathologies';
import { plans as seedPlans } from '../data/plans';
import { resources as seedResources } from '../data/resources';
import { tools as seedTools } from '../data/tools';
import { webinars as seedWebinars } from '../data/webinars';
import { localized } from '../i18n/core';
import type { Collection } from '../model/common';
import type {
  AnyItem,
  Course,
  CourseModule,
  Exercise,
  ItemMap,
  Lesson,
  Pathology,
  Plan,
  Resource,
  Tool,
  Webinar,
  WebinarStatus
} from '../model/content';
import { notify } from '../state/store';
import { normalize, slugify } from './format';
import { deleteContent, getContentOverlay, upsertContent } from './storage';

type Store = { [K in Collection]: ItemMap[K][] };

const SEED: Store = {
  resources: seedResources,
  courses: seedCourses,
  webinars: seedWebinars,
  tools: seedTools,
  exercises: seedExercises,
  pathologies: seedPathologies,
  authors: seedAuthors,
  plans: seedPlans
};

export const COLLECTIONS = Object.keys(SEED) as Collection[];

/* ----------------------------------------------------- initialisation */

/** Applique le calque d'administration (créations, éditions, suppressions). */
function applyOverlay<K extends Collection>(collection: K): ItemMap[K][] {
  const base = SEED[collection];
  const layer = getContentOverlay()[collection];
  if (!layer) return base.slice();
  let out: ItemMap[K][] = base.slice();
  Object.entries(layer.upsert ?? {}).forEach(([id, patch]) => {
    const index = out.findIndex((item) => item.id === id);
    if (index >= 0) out[index] = { ...out[index], ...(patch as Partial<ItemMap[K]>) };
    else out.push(patch as ItemMap[K]);
  });
  const deleted = layer.deleted ?? [];
  if (deleted.length) out = out.filter((item) => !deleted.includes(item.id));
  return out;
}

function buildAll(): Store {
  return {
    resources: applyOverlay('resources'),
    courses: applyOverlay('courses'),
    webinars: applyOverlay('webinars'),
    tools: applyOverlay('tools'),
    exercises: applyOverlay('exercises'),
    pathologies: applyOverlay('pathologies'),
    authors: applyOverlay('authors'),
    plans: applyOverlay('plans')
  };
}

let state: Store = buildAll();

export function initContent(): void {
  state = buildAll();
}

function rebuild(collection: Collection): void {
  (state as unknown as Record<Collection, unknown>)[collection] = applyOverlay(collection);
}

/* --------------------------------------------------------- lecture --- */

export function all<K extends Collection>(collection: K): ItemMap[K][] {
  return state[collection];
}

/** Contenus visibles par le public (les brouillons restent en admin). */
export function published<K extends Collection>(collection: K): ItemMap[K][] {
  return all(collection).filter((item) => item.published !== false);
}

export function getById<K extends Collection>(collection: K, id: string | undefined | null): ItemMap[K] | null {
  if (!id) return null;
  return all(collection).find((item) => item.id === id) ?? null;
}

export function getBySlug<K extends Collection>(collection: K, slug: string | undefined | null): ItemMap[K] | null {
  if (!slug) return null;
  return all(collection).find((item) => item.slug === slug) ?? null;
}

function field(item: AnyItem, key: string): unknown {
  return (item as unknown as Record<string, unknown>)[key];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function numberOf(item: AnyItem, key: string): number {
  const value = field(item, key);
  return typeof value === 'number' ? value : 0;
}

/** Titre affichable d'un contenu, traduit s'il existe une traduction. */
export function titleOf(item: AnyItem | null | undefined): string {
  if (!item) return '';
  if ('title' in item) return localized(item, 'title');
  if ('name' in item) return localized(item, 'name');
  /* Les auteurs ne sont pas des contenus : leur nom passe par
     `authorName()`. Aucune variante d'AnyItem ne porte `firstName`. */
  return '';
}

export function authorName(id: string | undefined | null): string {
  const author = getById('authors', id);
  return author ? `${author.firstName} ${author.lastName}` : '';
}

export function pathologyName(slug: string): string {
  const pathology = getBySlug('pathologies', slug);
  return pathology ? titleOf(pathology) : slug;
}

/* ------------------------------------------------------- webinaires -- */

/** Statut calculé, jamais stocké : il se déduit de l'heure courante. */
export function webinarStatus(webinar: Webinar): WebinarStatus {
  const start = new Date(webinar.startsAt).getTime();
  const end = start + (webinar.durationMinutes || 60) * 60_000;
  const now = Date.now();
  if (now >= start && now <= end) return 'live';
  if (now < start) return 'upcoming';
  return webinar.replayUrl ? 'replay' : 'past';
}

export function upcomingWebinars(): Webinar[] {
  return published('webinars')
    .filter((w) => {
      const status = webinarStatus(w);
      return status === 'upcoming' || status === 'live';
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

/* ------------------------------------------------------- formations -- */

export interface LessonEntry {
  lesson: Lesson;
  module: CourseModule;
}

export function lessonsOf(course: Course): LessonEntry[] {
  const out: LessonEntry[] = [];
  (course.modules ?? []).forEach((module) => {
    (module.lessons ?? []).forEach((lesson) => out.push({ lesson, module }));
  });
  return out;
}

export function courseStats(course: Course): { modules: number; lessons: number; minutes: number } {
  const lessons = lessonsOf(course);
  const minutes = lessons.reduce((sum, entry) => sum + (entry.lesson.duration || 0), 0);
  return {
    modules: (course.modules ?? []).length,
    lessons: lessons.length,
    minutes: minutes || course.durationMinutes || 0
  };
}

export interface LessonLocation {
  lesson: Lesson;
  module: CourseModule;
  index: number;
  total: number;
  next: Lesson | null;
  prev: Lesson | null;
}

export function findLesson(course: Course, lessonId: string | undefined): LessonLocation | null {
  const entries = lessonsOf(course);
  const index = entries.findIndex((entry) => entry.lesson.id === lessonId);
  if (index < 0) return null;
  return {
    lesson: entries[index].lesson,
    module: entries[index].module,
    index,
    total: entries.length,
    next: entries[index + 1]?.lesson ?? null,
    prev: entries[index - 1]?.lesson ?? null
  };
}

/* -------------------------------------------------------- recherche -- */

/** Texte indexé : titres, résumés, mots-clés, alias de pathologies, auteurs. */
export function searchText(item: AnyItem): string {
  const parts: string[] = [];
  ['title', 'name', 'subtitle', 'description', 'summary', 'abstract', 'purpose', 'goal'].forEach((key) => {
    const value = field(item, key);
    if (typeof value === 'string') parts.push(value);
  });
  if (item.i18n) {
    Object.values(item.i18n).forEach((translations) => {
      if (translations) parts.push(...Object.values(translations));
    });
  }
  parts.push(...strings(field(item, 'tags')), ...strings(field(item, 'aliases')), ...strings(field(item, 'targetMuscles')));
  strings(field(item, 'pathologies')).forEach((slug) => {
    const pathology = getBySlug('pathologies', slug);
    parts.push(pathology ? `${pathology.name} ${pathology.aliases.join(' ')}` : slug);
  });
  ['authorId', 'instructorId', 'speakerId'].forEach((key) => {
    const value = field(item, key);
    if (typeof value === 'string') parts.push(authorName(value));
  });
  return normalize(parts.filter(Boolean).join(' '));
}

/* --------------------------------------------------------- filtrage -- */

export type Filters = Record<string, string[]>;
export type SortKey = 'newest' | 'oldest' | 'popular' | 'az';

function matchesFilter(item: AnyItem, key: string, values: string[]): boolean {
  if (!values.length) return true;
  if (key === 'pathology') {
    const list = strings(field(item, 'pathologies'));
    return values.some((v) => list.includes(v));
  }
  if (key === 'status' && typeof field(item, 'startsAt') === 'string') {
    return values.includes(webinarStatus(item as Webinar));
  }
  const value = field(item, key);
  if (Array.isArray(value)) return values.some((v) => value.includes(v));
  return values.includes(String(value));
}

function dateOf(item: AnyItem): number {
  const value = field(item, 'publishedAt') ?? field(item, 'startsAt') ?? field(item, 'updatedAt');
  return typeof value === 'string' ? new Date(value).getTime() || 0 : 0;
}

function popularity(item: AnyItem): number {
  return numberOf(item, 'views') + numberOf(item, 'downloads') + numberOf(item, 'enrolledCount') + numberOf(item, 'registeredCount');
}

function sortItems<T extends AnyItem>(items: T[], sort: SortKey): T[] {
  const out = items.slice();
  if (sort === 'az') out.sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
  else if (sort === 'popular') out.sort((a, b) => popularity(b) - popularity(a));
  else if (sort === 'oldest') out.sort((a, b) => dateOf(a) - dateOf(b));
  else out.sort((a, b) => dateOf(b) - dateOf(a));
  return out;
}

export interface ListOptions {
  filters?: Filters;
  query?: string;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  includeDrafts?: boolean;
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
}

/**
 * Requête unifiée :
 * list('resources', { filters: { type: ['protocole'] }, query: 'lombalgie', sort: 'newest', page: 1, perPage: 9 })
 */
export function list<K extends Collection>(collection: K, options: ListOptions = {}): ListResult<ItemMap[K]> {
  let items: ItemMap[K][] = options.includeDrafts ? all(collection) : published(collection);

  Object.entries(options.filters ?? {}).forEach(([key, values]) => {
    if (values.length) items = items.filter((item) => matchesFilter(item, key, values));
  });

  const query = (options.query ?? '').trim();
  if (query.length >= 2) {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    items = items.filter((item) => {
      const haystack = searchText(item);
      return words.every((word) => haystack.includes(word));
    });
  }

  items = sortItems(items, options.sort ?? 'newest');

  const total = items.length;
  const perPage = options.perPage ?? 0;
  const pages = perPage ? Math.max(1, Math.ceil(total / perPage)) : 1;
  let page = Math.max(1, options.page ?? 1);
  if (perPage) {
    page = Math.min(page, pages);
    items = items.slice((page - 1) * perPage, page * perPage);
  }
  return { items, total, page, pages, perPage };
}

/** Occurrences d'une facette parmi les éléments filtrés par les autres facettes. */
export function facetCounts(collection: Collection, key: string, baseFilters: Filters = {}): Record<string, number> {
  let items: AnyItem[] = published(collection);
  Object.entries(baseFilters).forEach(([fkey, values]) => {
    if (fkey === key || !values.length) return;
    items = items.filter((item) => matchesFilter(item, fkey, values));
  });

  const counts: Record<string, number> = {};
  items.forEach((item) => {
    let values: unknown[];
    if (key === 'pathology') values = strings(field(item, 'pathologies'));
    else if (key === 'status' && typeof field(item, 'startsAt') === 'string') values = [webinarStatus(item as Webinar)];
    else {
      const value = field(item, key);
      values = Array.isArray(value) ? value : [value];
    }
    values.forEach((v) => {
      if (v === undefined || v === null || v === '') return;
      const k = String(v);
      counts[k] = (counts[k] ?? 0) + 1;
    });
  });
  return counts;
}

/* ------------------------------------------------------ agrégations -- */

export interface PathologyLinks {
  resources: Resource[];
  protocols: Resource[];
  tools: Tool[];
  exercises: Exercise[];
  courses: Course[];
  webinars: Webinar[];
}

/** Tous les contenus rattachés à une pathologie. */
export function forPathology(slug: string): PathologyLinks {
  const linked = <K extends 'resources' | 'tools' | 'exercises' | 'courses' | 'webinars'>(collection: K) =>
    published(collection).filter((item) => (item.pathologies ?? []).includes(slug));
  const resources = linked('resources');
  return {
    resources,
    protocols: resources.filter((r) => r.type === 'protocole' || r.type === 'therapeutique' || r.type === 'reco'),
    tools: linked('tools'),
    exercises: linked('exercises'),
    courses: linked('courses'),
    webinars: linked('webinars')
  };
}

/** Contenus proches : même pathologie, puis même région, spécialité ou type. */
export function related<K extends Collection>(collection: K, item: AnyItem, limit = 4): ItemMap[K][] {
  const pathologies = strings(field(item, 'pathologies'));
  const region = field(item, 'region');
  const specialty = field(item, 'specialty');
  const type = field(item, 'type');
  return published(collection)
    .filter((other) => other.id !== item.id)
    .map((other) => {
      let score = 0;
      strings(field(other, 'pathologies')).forEach((p) => {
        if (pathologies.includes(p)) score += 3;
      });
      if (region && field(other, 'region') === region) score += 2;
      if (specialty && field(other, 'specialty') === specialty) score += 1;
      if (type && field(other, 'type') === type) score += 1;
      return { item: other, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function stats() {
  return {
    resources: published('resources').length,
    courses: published('courses').length,
    webinars: published('webinars').length,
    coursesAndWebinars: published('courses').length + published('webinars').length,
    tools: published('tools').length,
    exercises: published('exercises').length,
    pathologies: published('pathologies').length
  };
}

/** Formules visibles par le public, dans l'ordre défini en administration. */
export function plans(): Plan[] {
  return published('plans')
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/* ---------------------------------------------- écriture (admin) ----- */

const ID_PREFIX: Record<Collection, string> = {
  resources: 'res',
  courses: 'cou',
  webinars: 'web',
  tools: 'too',
  exercises: 'exo',
  pathologies: 'pat',
  authors: 'aut',
  plans: 'plan'
};

function nextId(collection: Collection): string {
  return `${ID_PREFIX[collection]}-x${Date.now().toString(36)}`;
}

export type ContentPayload = Record<string, unknown>;

export function create<K extends Collection>(collection: K, payload: ContentPayload): ItemMap[K] {
  const item: ContentPayload = { ...payload };
  if (typeof item.id !== 'string' || !item.id) item.id = nextId(collection);
  if (typeof item.slug !== 'string' || !item.slug) {
    item.slug = slugify(item.title ?? item.name ?? item.id) || String(item.id);
  }
  if (item.published === undefined) item.published = false;
  item.seed = false;
  upsertContent(collection, item as { id: string });
  rebuild(collection);
  notify();
  return item as unknown as ItemMap[K];
}

export function update<K extends Collection>(collection: K, id: string, patch: ContentPayload): ItemMap[K] | null {
  const current = getById(collection, id);
  if (!current) return null;
  const merged = { ...(current as unknown as ContentPayload), ...patch, id } as ContentPayload;
  upsertContent(collection, merged as { id: string });
  rebuild(collection);
  notify();
  return merged as unknown as ItemMap[K];
}

export function remove(collection: Collection, id: string): void {
  deleteContent(collection, id);
  rebuild(collection);
  notify();
}

export type { Pathology };
