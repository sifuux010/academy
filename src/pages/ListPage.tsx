/* =====================================================================
   Page de liste générique
   ---------------------------------------------------------------------
   Bibliothèque, formations, webinaires, outils, pathologies et exercices
   partagent la même mécanique : en-tête illustré, colonne de filtres,
   barre d'outils, grille de cartes, pagination, état vide. Chaque page ne
   déclare que ses différences — son illustration, ses onglets, sa mise en
   avant.
   ===================================================================== */
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { ActiveChips, FilterBar, FilterPanel, type PanelHelp } from '../components/filters/FilterControls';
import { filterPreset, type PresetKey } from '../components/filters/presets';
import { useListParams } from '../components/filters/useListParams';
import { Doodle } from '../components/home/Decor';
import { Icon } from '../components/icons/Icon';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { list, type SortKey } from '../lib/content';
import type { ContentCollection } from '../model/common';
import type { ItemMap } from '../model/content';
import { useStoreVersion } from '../state/store';
import { Link } from 'react-router';

export interface ListPageProps<K extends ContentCollection> {
  collection: K;
  route: string;
  preset: PresetKey;
  title: string;
  subtitle: string;
  placeholder: string;
  renderCard: (item: ItemMap[K]) => ReactNode;
  sorts: SortKey[];
  defaultSort?: SortKey;
  perPage?: number;
  /** Surtitre de l'en-tête (« sessions en direct et replays »). */
  eyebrow?: string;
  /** Illustration de l'en-tête, servie depuis `public/illustrations/`. */
  illustration?: string;
  /**
   * Le visuel porte lui-même le titre : surtitre, titre et accroche
   * passent en lecture d'écran seule plutôt que d'être répétés dessous.
   */
  heroArtOnly?: boolean;
  /** Contenu inséré sous le titre : onglets de statut, pastilles de type. */
  intro?: ReactNode;
  /** Encart mis en avant, posé au-dessus de la barre d'outils. */
  featured?: ReactNode;
  /** Encart d'aide au bas de la colonne de filtres. */
  help?: PanelHelp;
}

export function ListPage<K extends ContentCollection>({
  collection,
  route,
  preset,
  title,
  subtitle,
  placeholder,
  renderCard,
  sorts,
  defaultSort = 'newest',
  perPage = 9,
  eyebrow,
  illustration,
  heroArtOnly,
  intro,
  featured,
  help
}: ListPageProps<K>) {
  useStoreVersion();
  const { t, href } = useI18n();
  const groups = useMemo(() => filterPreset(preset, t), [preset, t]);
  const { filters, query, sort, page, update, clear } = useListParams(groups, defaultSort, sorts);
  const [panelOpen, setPanelOpen] = useState(false);

  const result = list(collection, { filters, query, sort, page, perPage });

  useSeo({ title, description: subtitle, path: route });

  /* L'encart d'aide par défaut dit la même chose sur les six listes :
     affiner par les filtres ou la recherche. Une page qui a mieux à
     proposer (« tous les replays ») passe le sien. */
  const panelHelp: PanelHelp = help ?? {
    title: t('common.listing.helpTitle'),
    text: t('common.listing.helpText')
  };

  return (
    <div className="ll">
      <Doodle name="squiggle" className="ll-decor ll-decor-1" width={96} />
      <Doodle name="dots" className="ll-decor ll-decor-2" width={84} />

      <div className="ll-wrap">
        <nav className="ll-crumbs" aria-label={t('common.nav.home')}>
          <Link to={href('')}>{t('common.nav.home')}</Link>
          <span className="ll-crumbs-sep" aria-hidden="true">
            <Icon name="chevronRight" size={14} className="icon-flip" />
          </span>
          <span aria-current="page">{title}</span>
        </nav>

        {heroArtOnly && illustration ? (
          <header className="ll-hero ll-hero-art-only">
            {/* Le titre reste dans le document, masqué visuellement : ni un
                lecteur d'écran ni un moteur de recherche ne lit le texte
                peint dans une image. L'image, elle, devient décorative. */}
            <h1 className="sr-only">{title}</h1>
            <p className="sr-only">{subtitle}</p>
            <div className="ll-hero-art">
              <img src={illustration} alt="" />
            </div>
            {intro}
          </header>
        ) : (
          <header className={illustration ? 'll-hero' : 'll-hero ll-hero-plain'}>
            <div>
              {eyebrow ? <p className="ll-eyebrow">{eyebrow}</p> : null}
              <h1 className="ll-title">{title}</h1>
              <p className="ll-lead">{subtitle}</p>
              {intro}
            </div>
            {illustration ? (
              <div className="ll-hero-art">
                <img src={illustration} alt="" width={420} height={323} />
              </div>
            ) : null}
          </header>
        )}

        <div className="ll-body">
          <FilterPanel
            collection={collection}
            groups={groups}
            filters={filters}
            open={panelOpen}
            help={panelHelp}
            onClose={() => setPanelOpen(false)}
            onChange={(key, values) => update({ [key]: values, page: null })}
            onClear={() => {
              clear();
              setPanelOpen(false);
            }}
          />

          <div>
            {featured}

            <FilterBar
              total={result.total}
              placeholder={placeholder}
              sorts={sorts}
              sort={sort}
              query={query}
              onSort={(value) => update({ sort: value === defaultSort ? null : value, page: null })}
              onSearch={(value) => update({ q: value || null, page: null })}
              onOpenFilters={() => setPanelOpen(true)}
            />

            <ActiveChips
              groups={groups}
              filters={filters}
              query={query}
              onRemove={(key, value) =>
                update(
                  key === 'q'
                    ? { q: null, page: null }
                    : { [key]: (filters[key] ?? []).filter((v) => v !== value), page: null }
                )
              }
            />

            {result.total ? (
              <>
                <div className="ll-grid">
                  {result.items.map((item) => (
                    <Fragment key={item.id}>{renderCard(item)}</Fragment>
                  ))}
                </div>
                <ListPagination
                  page={result.page}
                  pages={result.pages}
                  onChange={(next) => {
                    update({ page: next === 1 ? null : String(next) });
                    window.scrollTo({ top: 0 });
                  }}
                />
              </>
            ) : (
              <div className="ll-empty">
                <span className="ll-empty-icon">
                  <Icon name="search" size={22} />
                </span>
                <h2>{t('common.states.emptyTitle')}</h2>
                <p>{t('common.states.emptyBody')}</p>
                <Link className="ll-btn ll-btn-primary mt-4" to={href(route)}>
                  {t('common.actions.clearAll')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================== pagination -- */

/**
 * Pagination de liste.
 *
 * Les pages lointaines sont repliées derrière une ellipse : sur six pages
 * on les voit toutes, sur soixante on garde la première, la dernière et
 * le voisinage immédiat.
 */
function ListPagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  const { t } = useI18n();
  if (pages <= 1) return null;

  const items: (number | '…')[] = [];
  for (let i = 1; i <= pages; i += 1) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i);
    else if (items[items.length - 1] !== '…') items.push('…');
  }

  return (
    <nav className="ll-pages" aria-label={t('common.labels.results')}>
      <button
        type="button"
        className="ll-pages-arrow"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label={t('common.pagination.prev')}
      >
        <Icon name="arrowLeft" size={16} className="icon-flip" />
      </button>
      {items.map((item, index) =>
        item === '…' ? (
          <button key={`gap-${index}`} type="button" className="ll-pages-gap" disabled>
            …
          </button>
        ) : (
          <button
            key={item}
            type="button"
            className="ltr-nums"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        className="ll-pages-arrow"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label={t('common.pagination.next')}
      >
        <Icon name="arrowRight" size={16} className="icon-flip" />
      </button>
    </nav>
  );
}
