/* =====================================================================
   Recherche globale groupée
   ---------------------------------------------------------------------
   Une requête interroge bibliothèque, formations, webinaires, outils,
   pathologies et exercices, puis regroupe les résultats par section.
   Insensible aux accents, aux diacritiques arabes et aux ligatures ;
   étendue aux alias de pathologies (« tendinopathie rotulienne » trouve
   la fiche « tendinopathie patellaire »).
   ===================================================================== */
import { taxonomies } from '../data/taxonomies';
import type { ContentCollection } from '../model/common';
import type { AnyItem } from '../model/content';
import { list, type SortKey } from './content';

export const SEARCH_GROUPS = [
  { key: 'library', collection: 'resources', route: 'bibliotheque' },
  { key: 'courses', collection: 'courses', route: 'formations' },
  { key: 'webinars', collection: 'webinars', route: 'webinaires' },
  { key: 'tools', collection: 'tools', route: 'outils' },
  { key: 'pathologies', collection: 'pathologies', route: 'pathologies' },
  { key: 'exercises', collection: 'exercises', route: 'exercices' }
] as const satisfies readonly { key: string; collection: ContentCollection; route: string }[];

export type SearchGroupKey = (typeof SEARCH_GROUPS)[number]['key'];

export interface SearchGroup {
  key: SearchGroupKey;
  route: string;
  collection: ContentCollection;
  items: AnyItem[];
  total: number;
}

export interface SearchResult {
  total: number;
  groups: SearchGroup[];
  query: string;
}

export function globalSearch(query: string, perGroup = 5, sort: SortKey = 'popular'): SearchResult {
  const q = String(query ?? '').trim();
  if (q.length < 2) return { total: 0, groups: [], query: q };

  let total = 0;
  const groups: SearchGroup[] = [];
  SEARCH_GROUPS.forEach((group) => {
    const result = list(group.collection, { query: q, sort });
    if (!result.total) return;
    total += result.total;
    groups.push({
      key: group.key,
      route: group.route,
      collection: group.collection,
      items: (result.items as AnyItem[]).slice(0, perGroup),
      total: result.total
    });
  });
  return { total, groups, query: q };
}

/** Suggestions affichées quand le champ de recherche est vide. */
export function quickSearches(): string[] {
  return [...taxonomies.quickSearches];
}

const ROUTES: Record<ContentCollection, string> = {
  resources: 'bibliotheque',
  courses: 'formations',
  webinars: 'webinaires',
  tools: 'outils',
  pathologies: 'pathologies',
  exercises: 'exercices',
  plans: 'abonnements'
};

/** Segment d'URL public d'une collection. */
export function routeOf(collection: ContentCollection): string {
  return ROUTES[collection];
}
