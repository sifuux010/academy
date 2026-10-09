/* =====================================================================
   Blocs d'accueil — filtres, progression, parcours, recherche guidée
   ---------------------------------------------------------------------
   Séparés de `Sections.tsx` : ces quatre blocs s'appuient sur l'état du
   membre ou sur la navigation, là où les autres ne font que mettre en
   page des contenus.
   ===================================================================== */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Icon, type IconName } from '../icons/Icon';
import { useI18n } from '../../i18n/I18nContext';
import { recordSearch } from '../../lib/activity';
import { Accent, Doodle, Eyebrow } from './Decor';
import { ContentCard } from './ContentCard';
import type { HomeShelf, HomeShelfItem } from '../../hooks/useHomeData';
import pathBooks from '../../assets/paths/books-set.png';
import pathNotes from '../../assets/paths/notes.png';
import pathCertificates from '../../assets/paths/certificates.png';

/* =====================================================================
   Reprendre sa progression
   ===================================================================== */

export interface ContinueEntry {
  item: HomeShelfItem;
  percent: number;
}

export function ContinueLearning({ entries }: { entries: ContinueEntry[] }) {
  const { t, href } = useI18n();
  if (!entries.length) return null;

  return (
    <section className="lp-wrap">
      <header className="lp-head">
        <div className="lp-head-deco">
          <Eyebrow>{t('showcase.eyebrowProgress')}</Eyebrow>
          <h2 className="lp-head-title">
            {t('showcase.continueTitle')}{' '}
            <Accent underline>{t('showcase.accentContinue')}</Accent>
          </h2>
          <p className="lp-head-sub">{t('showcase.continueSub')}</p>
        </div>
        <Link className="lp-head-link" to={href('dashboard/formations')}>
          {t('showcase.seeAll')}
          <Icon name="arrowRight" size={16} className="icon-flip" />
        </Link>
      </header>

      <div className="lp-grid">
        {entries.slice(0, 4).map((entry) => (
          <ContentCard key={entry.item.id} item={entry.item} progress={entry.percent} />
        ))}
      </div>
    </section>
  );
}

/* =====================================================================
   Collections
   ---------------------------------------------------------------------
   Une carte pastel par rayon : le visiteur voit les grandes portes
   d'entrée et leur volume avant de plonger dans les listes.

   Volontairement alimenté par les **rayons**, pas par les spécialités :
   celles-ci sont déjà le sujet du panneau à onglets, et répéter le même
   axe à deux endroits n'apprend rien de plus.
   ===================================================================== */

/** Rubrique et route d'un rayon, d'après la section qu'il sert. */
const SECTION_NAV: Record<string, string> = {
  resources: 'library',
  courses: 'courses',
  webinars: 'webinars',
  tools: 'tools',
  exercises: 'exercises',
  pathologies: 'pathologies'
};

const SECTION_PATH: Record<string, string> = {
  resources: 'bibliotheque',
  courses: 'formations',
  webinars: 'webinaires',
  tools: 'outils',
  exercises: 'exercices',
  pathologies: 'pathologies'
};

/* Les trois bannières de parcours : chacune a sa teinte, son illustration,
   ses icônes et son libellé d'état (position fixe, comme la maquette). */
const PATH_VARIANTS: {
  image: string;
  badgeIcon: IconName;
  metaIcon: IconName;
  statusIcon: IconName;
  statusKey: string;
}[] = [
  { image: pathBooks, badgeIcon: 'book', metaIcon: 'book', statusIcon: 'clock', statusKey: 'showcase.pathsStatusUpdated' },
  { image: pathNotes, badgeIcon: 'sparkles', metaIcon: 'book', statusIcon: 'clock', statusKey: 'showcase.pathsStatusWeek' },
  { image: pathCertificates, badgeIcon: 'graduation', metaIcon: 'playCircle', statusIcon: 'chart', statusKey: 'showcase.pathsStatusPopular' }
];

export function LearningPaths({ shelves }: { shelves: HomeShelf[] }) {
  const { t, href } = useI18n();
  const withItems = shelves.filter((shelf) => shelf.items.length);
  if (!withItems.length) return null;

  return (
    <section className="lp-wrap">
      <header className="lp-head">
        <div className="lp-head-deco">
          <Eyebrow>{t('showcase.eyebrowPaths')}</Eyebrow>
          <Doodle name="sparkle" className="lp-doodle-head" />
          <h2 className="lp-head-title">
            {t('showcase.pathsTitle')}{' '}
            <Accent underline>{t('showcase.accentPaths')}</Accent>
          </h2>
          <p className="lp-head-sub">{t('showcase.pathsSub')}</p>
        </div>
        <Link className="lp-head-link" to={href('formations')}>
          {t('showcase.seeAll')}
          <Icon name="arrowRight" size={16} className="icon-flip" />
        </Link>
      </header>

      <div className="lp-paths">
        {withItems.slice(0, 3).map((shelf, index) => {
          const variant = PATH_VARIANTS[index % PATH_VARIANTS.length];
          return (
            <Link
              key={shelf.key}
              className={`lp-path lp-path-${(index % PATH_VARIANTS.length) + 1}`}
              to={
                shelf.ctaHref?.startsWith('/')
                  ? href(shelf.ctaHref.slice(1))
                  : href(SECTION_PATH[shelf.section] ?? 'bibliotheque')
              }
            >
              <div className="lp-path-body">
                <span className="lp-path-tag">
                  <Icon name={variant.badgeIcon} size={14} />
                  {t(`common.nav.${SECTION_NAV[shelf.section] ?? 'library'}`)}
                </span>
                <h3 className="lp-path-title">{shelf.title}</h3>
                <p className="lp-path-text">{shelf.subtitle}</p>
                <span className="lp-path-foot">
                  <span className="lp-path-meta">
                    <Icon name={variant.metaIcon} size={15} />
                    {t('showcase.pathsResources', { count: String(shelf.items.length) })}
                  </span>
                  <span className="lp-path-divider" aria-hidden="true" />
                  <span className="lp-path-meta">
                    <Icon name={variant.statusIcon} size={15} />
                    {t(variant.statusKey)}
                  </span>
                </span>
              </div>
              <img className="lp-path-art" src={variant.image} alt="" loading="lazy" />
              <span className="lp-go" aria-hidden="true">
                <Icon name="arrowRight" size={20} className="icon-flip" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* =====================================================================
   Bandeau de recherche guidée
   ---------------------------------------------------------------------
   Ce bandeau ne promet rien que la plateforme ne fasse déjà : il met en
   avant la recherche globale existante, qui couvre les six sections et
   suit les synonymes des pathologies.
   ===================================================================== */

export function SearchPromo() {
  const { t, href } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    // Même seuil que la recherche globale : en deçà, le serveur ignore
    // la requête, autant ne pas quitter la page pour rien.
    if (value.length < 2) return;
    recordSearch(value);
    navigate(href('recherche', { q: value }));
  };

  return (
    <section className="lp-wrap">
      <div className="lp-promo">
        <div>
          <span className="lp-banner-badge">
            <Icon name="sparkles" size={13} />
            {t('showcase.promoBadge')}
          </span>
          <h2 className="lp-promo-title">{t('showcase.promoTitle')}</h2>
          <p className="lp-promo-text">{t('showcase.promoText')}</p>
          <ul className="lp-promo-points">
            <li>
              <Icon name="check" size={15} />
              {t('showcase.promoPoint1')}
            </li>
            <li>
              <Icon name="check" size={15} />
              {t('showcase.promoPoint2')}
            </li>
            <li>
              <Icon name="check" size={15} />
              {t('showcase.promoPoint3')}
            </li>
          </ul>
        </div>

        <div className="lp-promo-aside">
          <span className="lp-promo-glow" aria-hidden="true" />
          <form className="lp-promo-search" onSubmit={submit} role="search">
            <label className="sr-only" htmlFor="promo-search">
              {t('search.ariaLabel')}
            </label>
            <input
              id="promo-search"
              type="search"
              value={query}
              placeholder={t('showcase.promoPlaceholder')}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" aria-label={t('common.actions.search')}>
              <Icon name="arrowRight" size={17} className="icon-flip" />
            </button>
          </form>
          <p className="lp-promo-hint">{t('showcase.promoHint')}</p>
        </div>
      </div>
    </section>
  );
}
