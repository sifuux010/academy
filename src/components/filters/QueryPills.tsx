/* Pastilles de catégorie au-dessus d'une liste (statut des webinaires,
   type d'outil). Une seule valeur active, stockée dans l'URL. */
import { useSearchParams } from 'react-router';

export interface PillOption {
  value: string;
  label: string;
  count: number;
}

export function QueryPills({ param, allLabel, options }: { param: string; allLabel: string; options: PillOption[] }) {
  const [params, setParams] = useSearchParams();
  const active = params.getAll(param);

  const select = (value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete(param);
      next.delete('page');
      if (value) next.set(param, value);
      return next;
    });

  return (
    <div className="ll-tabs">
      <button type="button" aria-pressed={!active.length} onClick={() => select('')}>
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={active.includes(option.value)}
          onClick={() => select(option.value)}
        >
          {option.label} <span className="ltr-nums">({option.count})</span>
        </button>
      ))}
    </div>
  );
}
