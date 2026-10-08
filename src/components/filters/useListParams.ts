/* =====================================================================
   État des listes dans l'URL
   ---------------------------------------------------------------------
   Filtres, recherche, tri et page vivent dans la query string : une
   recherche filtrée est partageable et suit Précédent / Suivant.
   ===================================================================== */
import { useSearchParams } from 'react-router';
import type { Filters, SortKey } from '../../lib/content';
import type { FilterGroup } from './presets';

export type ParamPatch = Record<string, string | string[] | null>;

export function useListParams(groups: FilterGroup[], defaultSort: SortKey, allowedSorts: SortKey[]) {
  const [params, setParams] = useSearchParams();

  const filters: Filters = {};
  groups.forEach((group) => {
    const values = params.getAll(group.key);
    if (values.length) filters[group.key] = values;
  });

  const query = params.get('q') ?? '';
  const rawSort = params.get('sort') as SortKey | null;
  const sort: SortKey = rawSort && allowedSorts.includes(rawSort) ? rawSort : defaultSort;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const update = (patch: ParamPatch) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(patch).forEach(([key, value]) => {
        next.delete(key);
        if (value === null || value === '') return;
        if (Array.isArray(value)) value.forEach((v) => next.append(key, v));
        else next.set(key, value);
      });
      return next;
    });
  };

  const clear = () => setParams(new URLSearchParams());

  return { params, filters, query, sort, page, update, clear };
}
