import { useSearchParams } from 'react-router';

/** Lit et modifie un paramètre de la query string (les autres sont conservés). */
export function useQueryParam(name: string): [string, (value: string | null) => void] {
  const [params, setParams] = useSearchParams();
  const set = (value: string | null) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(name, value);
      else next.delete(name);
      return next;
    });
  return [params.get(name) ?? '', set];
}
