/* =====================================================================
   Briques partagées des écrans d'administration
   ---------------------------------------------------------------------
   Une bascule liste / grille et un choix de densité, posés dans la barre
   d'outils de chaque page. Les deux vivent dans l'URL : l'affichage
   choisi survit à un rafraîchissement et part avec le lien partagé.

   Elles sont ici plutôt que dans chaque page parce qu'elles doivent se
   comporter pareil partout — une bascule qui change de place ou d'ordre
   d'un écran à l'autre se cherche à chaque fois.
   ===================================================================== */
import { useSearchParams } from 'react-router';
import { useI18n } from '../../i18n/I18nContext';
import { useQueryParam } from '../../hooks/useQueryParam';
import { Icon } from '../icons/Icon';

/** Bascule entre le tableau et la grille de cartes. */
export function ViewToggle({ grid, onChange }: { grid: boolean; onChange: (grid: boolean) => void }) {
  const { t } = useI18n();
  return (
    <div className="ws-viewtoggle" role="group" aria-label={t('admin.users.view')}>
      <button type="button" aria-pressed={!grid} onClick={() => onChange(false)}>
        <Icon name="list" size={15} />
        {t('admin.users.viewList')}
      </button>
      <button type="button" aria-pressed={grid} onClick={() => onChange(true)}>
        <Icon name="grid" size={15} />
        {t('admin.users.viewGrid')}
      </button>
    </div>
  );
}

/**
 * Nombre de lignes par page.
 *
 * Changer la densité renvoie à la première page : rester sur la page 7
 * après être passé de 10 à 50 par page afficherait un tableau vide, ou
 * pire, des lignes qu'on croirait être les mêmes.
 */
export function usePageSize(fallback: number) {
  const [raw, setSize] = useQueryParam('size');
  const [, setPage] = useQueryParam('page');
  const allowed = [10, 25, 50];
  const value = allowed.includes(Number(raw)) ? Number(raw) : fallback;

  return {
    size: value,
    setSize: (next: number) => {
      setPage(null);
      setSize(next === fallback ? null : String(next));
    },
    options: allowed
  };
}

export function PageSize({
  size,
  options,
  onChange
}: {
  size: number;
  options: number[];
  onChange: (size: number) => void;
}) {
  const { t } = useI18n();
  return (
    <label className="ws-pagesize">
      <span>{t('admin.pager.show')}</span>
      <select
        className="select"
        value={size}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ======================================================== tri ------- */

/**
 * Tri d'un tableau d'administration.
 *
 * La maquette montre une flèche de tri sur chaque en-tête. La dessiner
 * sans la brancher serait pire que de ne rien montrer : un libellé qui a
 * l'air cliquable et ne fait rien se re-teste à chaque visite. Le tri est
 * donc réel, et la colonne active porte sa direction.
 *
 * La clé vit dans l'URL (`?sort=`, `?dir=`) comme la page et l'affichage.
 */
export function useSort<T>(rows: T[], getters: Record<string, (row: T) => string | number>) {
  /*
     `sort` et `dir` changent ensemble, donc en une seule écriture : deux
     appels à `useQueryParam` dans le même tic partaient tous deux de la
     même valeur précédente, et le second effaçait le premier — on cliquait
     un en-tête, l'URL restait vide et rien ne se triait.
  */
  const [params, setParams] = useSearchParams();
  const key = params.get('sort') ?? '';
  const descending = params.get('dir') === 'desc';

  const apply = (nextKey: string | null, nextDir: string | null) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (nextKey) next.set('sort', nextKey);
      else next.delete('sort');
      if (nextDir) next.set('dir', nextDir);
      else next.delete('dir');
      /* Un tri change l'ordre : rester page 3 montrerait des lignes sans
         rapport avec celles qu'on venait de lire. */
      next.delete('page');
      return next;
    });

  const get = getters[key];
  const sorted = get
    ? [...rows].sort((a, b) => {
        const left = get(a);
        const right = get(b);
        const result =
          typeof left === 'number' && typeof right === 'number'
            ? left - right
            : String(left).localeCompare(String(right), undefined, { numeric: true });
        return descending ? -result : result;
      })
    : rows;

  /* Un clic trie, un second inverse, un troisième remet l'ordre d'origine
     — sinon on ne peut plus revenir à l'ordre naturel de la liste. */
  const toggle = (next: string) => {
    if (key !== next) return apply(next, null);
    if (!descending) return apply(next, 'desc');
    return apply(null, null);
  };

  return { rows: sorted, key, descending, toggle };
}

/** En-tête de colonne triable. */
export function SortTh({
  label,
  field,
  sort
}: {
  label: string;
  field?: string;
  sort?: { key: string; descending: boolean; toggle: (key: string) => void };
}) {
  if (!field || !sort) return <th>{label}</th>;
  const active = sort.key === field;
  return (
    <th aria-sort={active ? (sort.descending ? 'descending' : 'ascending') : 'none'}>
      <button type="button" className="ws-sort" onClick={() => sort.toggle(field)}>
        {label}
        {/* Le jeu d'icônes n'a pas de chevron vers le haut : on retourne
            celui du bas, ce qui garde un seul tracé à maintenir. */}
        <span
          className={`ws-sort-mark${active ? ' is-active' : ''}${active && !sort.descending ? ' is-up' : ''}`}
          aria-hidden="true"
        >
          <Icon name="chevronDown" size={13} />
        </span>
      </button>
    </th>
  );
}
