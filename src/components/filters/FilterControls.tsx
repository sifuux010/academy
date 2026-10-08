/* =====================================================================
   Panneau de filtres, puces actives et barre d'outils de liste.
   Sur mobile, le panneau devient un tiroir plein écran.
   ===================================================================== */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useI18n } from '../../i18n/I18nContext';
import { facetCounts, pathologyName, type Filters, type SortKey } from '../../lib/content';
import type { ContentCollection } from '../../model/common';
import { Doodle } from '../home/Decor';
import { Icon } from '../icons/Icon';
import type { FilterGroup } from './presets';

export function labelFor(group: FilterGroup, value: string, term: (group: string, key?: string | null) => string): string {
  if (group.termGroup) return term(group.termGroup, value);
  if (group.key === 'pathology') return pathologyName(value);
  return value;
}

/* ---------------------------------------------------------- panneau --- */

/** Encart d'aide au bas de la colonne — « vous ne trouvez pas ? ». */
export interface PanelHelp {
  title: string;
  text: string;
  /** Lien d'action ; sans lui, le bouton n'est qu'une flèche décorative. */
  to?: string;
  label?: string;
}

export function FilterPanel({
  collection,
  groups,
  filters,
  open,
  help,
  onClose,
  onChange,
  onClear
}: {
  collection: ContentCollection;
  groups: FilterGroup[];
  filters: Filters;
  open: boolean;
  help?: PanelHelp;
  onClose: () => void;
  onChange: (key: string, values: string[]) => void;
  onClear: () => void;
}) {
  const { t, term } = useI18n();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.key, !!group.collapsed]))
  );

  return (
    <aside className={open ? 'll-side is-open' : 'll-side'} id="filter-panel">
      <div className="ll-panel">
        <div className="ll-panel-head">
          <span className="ll-panel-icon">
            <Icon name="filter" size={16} />
          </span>
          <h2>{t('common.actions.filters')}</h2>
          <button type="button" className="ll-panel-clear" onClick={onClear}>
            {t('common.actions.clearAll')}
          </button>
        </div>

        {groups.map((group) => {
          const counts = facetCounts(collection, group.key, filters);
          const active = filters[group.key] ?? [];
          const visible = group.values.filter((value) => counts[value] || active.includes(value));
          if (!visible.length) return null;
          const isOpen = !collapsed[group.key];
          return (
            <div key={group.key} className="ll-group" data-open={isOpen ? 'true' : 'false'}>
              <button
                type="button"
                className="ll-group-head"
                aria-expanded={isOpen}
                onClick={() => setCollapsed((state) => ({ ...state, [group.key]: isOpen }))}
              >
                <span>{group.label}</span>
                <span className="chev">
                  <Icon name="chevronDown" size={16} />
                </span>
              </button>
              <div className="ll-group-body">
                {visible.map((value) => (
                  <label key={value} className="ll-check">
                    <input
                      type="checkbox"
                      checked={active.includes(value)}
                      onChange={(event) =>
                        onChange(
                          group.key,
                          event.target.checked ? [...active, value] : active.filter((v) => v !== value)
                        )
                      }
                    />
                    <span className="ll-check-box" aria-hidden="true">
                      <Icon name="check" size={12} />
                    </span>
                    <span className="ll-check-label">
                      {labelFor(group, value, term)}{' '}
                      <span className="ll-check-count ltr-nums">({counts[value] ?? 0})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <button type="button" className="ll-btn ll-btn-quiet ll-panel-close" onClick={onClose}>
          <Icon name="close" size={16} />
          {t('common.actions.close')}
        </button>
      </div>

      {help ? <HelpBlock help={help} /> : null}
    </aside>
  );
}

function HelpBlock({ help }: { help: PanelHelp }) {
  return (
    <div className="ll-help">
      <Doodle name="sparkle" className="ll-help-doodle" width={34} />
      <span className="ll-help-icon">
        <Icon name="playCircle" size={18} />
      </span>
      <h3>{help.title}</h3>
      <p>{help.text}</p>
      {help.to ? (
        <Link className="ll-help-go" to={help.to}>
          {help.label}
          <Icon name="arrowRight" size={15} className="icon-flip" />
        </Link>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------ puces actives */

export function ActiveChips({
  groups,
  filters,
  query,
  onRemove
}: {
  groups: FilterGroup[];
  filters: Filters;
  query: string;
  onRemove: (key: string, value: string) => void;
}) {
  const { t, term } = useI18n();
  const chips: { key: string; value: string; label: string }[] = [];
  groups.forEach((group) => {
    (filters[group.key] ?? []).forEach((value) => {
      chips.push({ key: group.key, value, label: labelFor(group, value, term) });
    });
  });
  if (query) chips.push({ key: 'q', value: query, label: `« ${query} »` });
  if (!chips.length) return null;
  return (
    <div className="ll-chips">
      {chips.map((chip) => (
        <span key={`${chip.key}-${chip.value}`} className="ll-chip">
          {chip.label}
          <button type="button" onClick={() => onRemove(chip.key, chip.value)} aria-label={t('common.actions.close')}>
            <Icon name="close" size={13} />
          </button>
        </span>
      ))}
    </div>
  );
}

/* --------------------------------------------------- barre d'outils -- */

export function FilterBar({
  total,
  placeholder,
  sorts,
  sort,
  query,
  onSort,
  onSearch,
  onOpenFilters
}: {
  total: number;
  placeholder: string;
  sorts: SortKey[];
  sort: SortKey;
  query: string;
  onSort: (sort: SortKey) => void;
  onSearch: (query: string) => void;
  onOpenFilters: () => void;
}) {
  const { t, tn } = useI18n();
  const [value, setValue] = useState(query);
  const debounced = useDebouncedValue(value.trim(), 420);

  /* Synchronise le champ quand la recherche change hors saisie (puce retirée). */
  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    if (debounced !== query) onSearch(debounced);
    // Déclenché uniquement par la saisie : `query` et `onSearch` sont lus à jour.
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ll-toolbar">
      <div className="ll-search">
        <span className="ll-search-icon">
          <Icon name="search" size={17} />
        </span>
        <label className="sr-only" htmlFor="list-search">
          {t('common.actions.search')}
        </label>
        <input
          id="list-search"
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>

      <button
        type="button"
        className="ll-icon-btn ll-filter-toggle"
        aria-controls="filter-panel"
        aria-label={t('common.actions.filters')}
        onClick={onOpenFilters}
      >
        <Icon name="filter" size={18} />
      </button>

      <span className="ll-count ltr-nums">{tn(total, 'common.units.results')}</span>

      <div className="ll-sort">
        <span className="ll-sort-icon">
          <Icon name="activity" size={16} />
        </span>
        <label className="sr-only" htmlFor="sort-select">
          {t('common.labels.sortBy')}
        </label>
        <select id="sort-select" value={sort} onChange={(event) => onSort(event.target.value as SortKey)}>
          {sorts.map((option) => (
            <option key={option} value={option}>
              {t(`common.sort.${option}`)}
            </option>
          ))}
        </select>
        <span className="ll-sort-chev">
          <Icon name="chevronDown" size={16} />
        </span>
      </div>
    </div>
  );
}
