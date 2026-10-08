/* =====================================================================
   Recherche globale — résultats groupés
   ---------------------------------------------------------------------
   Une requête, six sections : bibliothèque, formations, webinaires,
   outils, pathologies, exercices. « tendinopathie rotulienne » expose
   immédiatement revues, protocoles, tests, exercices et formations.
   ===================================================================== */
import { useEffect, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnyCard } from '../components/cards/Cards';
import { Icon } from '../components/icons/Icon';
import { Breadcrumb, EmptyState, SectionHead } from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { clearSearchHistory, recordSearch, searchHistory } from '../lib/activity';
import { formatNumber } from '../lib/format';
import { globalSearch, quickSearches, type SearchResult } from '../lib/search';
import { useStoreVersion } from '../state/store';

function EmptyQueryState() {
  const { t, href } = useI18n();
  const user = useCurrentUser();
  const recent = user ? searchHistory() : [];
  return (
    <div className="card">
      <p className="label">{t('search.suggestions')}</p>
      <div className="row-wrap">
        {quickSearches().map((word) => (
          <Link key={word} className="tag" to={href('recherche', { q: word })}>
            {word}
          </Link>
        ))}
      </div>
      {recent.length ? (
        <div className="mt-6">
          <div className="row-between">
            <p className="label mb-0">{t('search.recent')}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearSearchHistory}>
              {t('search.clearRecent')}
            </button>
          </div>
          <div className="row-wrap mt-4">
            {recent.map((word) => (
              <Link key={word} className="tag" to={href('recherche', { q: word })}>
                <Icon name="clock" size={12} /> {word}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SearchPage() {
  useStoreVersion();
  const { t, tn, href } = useI18n();
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') ?? '').trim();
  const activeGroup = params.get('group') ?? '';

  const result: SearchResult =
    query.length >= 2 ? globalSearch(query, activeGroup ? 12 : 3) : { total: 0, groups: [], query };
  const groups = activeGroup ? result.groups.filter((group) => group.key === activeGroup) : result.groups;

  useSeo({
    title: query ? t('search.resultsFor', { query }) : t('search.title'),
    description: t('search.placeholder'),
    path: 'recherche'
  });

  useEffect(() => {
    if (query.length >= 2) recordSearch(query);
  }, [query]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    const value = event.currentTarget.value.trim();
    const next = new URLSearchParams();
    if (value) next.set('q', value);
    setParams(next);
  };

  const selectGroup = (key: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (key) next.set('group', key);
      else next.delete('group');
      return next;
    });

  let body: ReactNode;
  if (query.length < 2) {
    body = <EmptyQueryState />;
  } else if (!result.total) {
    body = (
      <EmptyState
        title={t('search.noResultsTitle', { query })}
        body={t('search.noResultsBody')}
        ctaTo={href('bibliotheque')}
        ctaLabel={t('common.actions.explore')}
      />
    );
  } else {
    body = (
      <>
        <div className="pill-nav">
          <button type="button" aria-pressed={!activeGroup} onClick={() => selectGroup('')}>
            {t('search.allResults')} <span className="ltr-nums">({result.total})</span>
          </button>
          {result.groups.map((group) => (
            <button
              key={group.key}
              type="button"
              aria-pressed={activeGroup === group.key}
              onClick={() => selectGroup(group.key)}
            >
              {t(`search.groups.${group.key}`)} <span className="ltr-nums">({group.total})</span>
            </button>
          ))}
        </div>
        {groups.map((group) => (
          <section key={group.key} className="mt-8">
            <SectionHead
              title={`${t(`search.groups.${group.key}`)} (${formatNumber(group.total)})`}
              ctaTo={href(group.route, { q: query })}
              ctaLabel={t('search.seeAllIn', { group: t(`search.groups.${group.key}`) })}
            />
            <div className="grid grid-auto">
              {group.items.map((item) => (
                <AnyCard key={item.id} collection={group.collection} item={item} />
              ))}
            </div>
          </section>
        ))}
      </>
    );
  }

  return (
    <div className="ka-container section">
      <Breadcrumb items={[{ label: t('common.nav.home'), to: href('') }, { label: t('search.title') }]} />
      <header className="detail-head">
        <h1>{query ? t('search.resultsFor', { query }) : t('search.title')}</h1>
        <p className="lead">{query.length >= 2 ? tn(result.total, 'common.units.results') : t('search.typeToSearch')}</p>
        <div className="header-search mt-4" style={{ display: 'block', maxWidth: 560 }}>
          <span className="search-icon">
            <Icon name="search" size={18} />
          </span>
          <label className="sr-only" htmlFor="page-search">
            {t('search.ariaLabel')}
          </label>
          <input
            key={query}
            id="page-search"
            type="search"
            defaultValue={query}
            placeholder={t('search.placeholder')}
            onKeyDown={onKeyDown}
          />
        </div>
      </header>
      {body}
    </div>
  );
}
