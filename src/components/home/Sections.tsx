/* =====================================================================
   Blocs de la page d'accueil
   ---------------------------------------------------------------------
   Chaque bloc est autonome et se tait quand il n'a rien à dire : un rayon
   vide, une liste de partenaires vide ou un onglet sans contenu ne
   laissent pas de section fantôme à l'écran.
   ===================================================================== */
import { useState } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from '../icons/Icon';
import { useI18n } from '../../i18n/I18nContext';
import { post } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { ContentCard, MiniRow } from './ContentCard';
import { Accent, Doodle, Eyebrow } from './Decor';
import { Rail } from './Rail';
import type { HomePartner, HomeShelf, HomeSponsored } from '../../hooks/useHomeData';

/** Transforme un chemin interne (`/outils`) en URL préfixée par la langue. */
function useTarget() {
  const { href } = useI18n();
  return (path?: string) => (path?.startsWith('/') ? href(path.slice(1)) : path);
}

/* --------------------------------------------------------- en-tête -- */

export function SectionHead({
  eyebrow,
  title,
  accent,
  subtitle,
  ctaHref,
  doodle
}: {
  /** Petites capitales colorées au-dessus du titre. */
  eyebrow?: string;
  title: string;
  /** Mot manuscrit ajouté après le titre, souligné d'un trait tracé. */
  accent?: string;
  subtitle?: string;
  ctaHref?: string;
  /** Griffonnage posé près du titre. */
  doodle?: 'sparkle' | 'rays' | 'heart';
}) {
  const target = useTarget()(ctaHref);

  return (
    <header className="lp-head">
      <div className="lp-head-deco">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {doodle ? <Doodle name={doodle} className="lp-doodle-head" /> : null}
        <h2 className="lp-head-title">
          {target ? (
            <Link className="lp-head-link" to={target}>
              {title}
              <Icon name="arrowRight" size={17} className="icon-flip" />
            </Link>
          ) : (
            title
          )}
          {accent ? (
            <>
              {' '}
              <Accent underline>{accent}</Accent>
            </>
          ) : null}
        </h2>
        {subtitle ? <p className="lp-head-sub">{subtitle}</p> : null}
      </div>
    </header>
  );
}

/* --------------------------------------------------------- rayon -- */

export function ShelfRow({ shelf }: { shelf: HomeShelf }) {
  const { t } = useI18n();
  if (!shelf.items.length) return null;

  return (
    <section className="lp-wrap">
      <SectionHead
        eyebrow={t('showcase.eyebrowSelection')}
        title={shelf.title}
        subtitle={shelf.subtitle}
        ctaHref={shelf.ctaHref}
      />
      <Rail label={t('showcase.rail', { title: shelf.title })}>
        {shelf.items.map((item) => (
          <ContentCard key={`${item.section}-${item.id}`} item={item} />
        ))}
      </Rail>
    </section>
  );
}

/* --------------------------------------------- panneaux groupés -- */

/**
 * Plusieurs rayons côte à côte, sous un seul titre.
 *
 * Un rayon pleine largeur par sujet donne quatre rangées à parcourir ;
 * groupés, les mêmes contenus tiennent sur une seule et se comparent. Le
 * titre de chaque panneau reste un lien : le rayon complet est à un clic,
 * on n'a rien perdu en route.
 *
 * Au-delà de trois panneaux, la rangée défile — c'est le même rail que
 * les cartes, avec des colonnes plus larges.
 */
export function ShelfGroups({ shelves, title }: { shelves: HomeShelf[]; title: string }) {
  const filled = shelves.filter((shelf) => shelf.items.length);
  if (!filled.length) return null;
  /* Un panneau seul n'est pas un groupe : on le sert en rayon pleine
     largeur, comme avant. Le cas se présente dès que l'administration ne
     publie qu'un rayon — la page ne doit pas se retrouver vide ici. */
  if (filled.length === 1) return <ShelfRow shelf={filled[0]} />;

  return (
    <section className="lp-groups">
      <SectionHead title={title} />
      <Rail label={title} variant="panel">
        {filled.map((shelf) => (
          <ShelfPanel key={shelf.id} shelf={shelf} />
        ))}
      </Rail>
    </section>
  );
}

function ShelfPanel({ shelf }: { shelf: HomeShelf }) {
  const target = useTarget()(shelf.ctaHref);

  return (
    <article className="lp-group">
      <h3 className="lp-group-title">
        {target ? (
          <Link to={target}>
            {shelf.title}
            <Icon name="arrowRight" size={16} className="icon-flip" />
          </Link>
        ) : (
          shelf.title
        )}
      </h3>
      <div className="lp-group-list">
        {shelf.items.slice(0, 3).map((item) => (
          <MiniRow key={`${item.section}-${item.id}`} item={item} />
        ))}
      </div>
    </article>
  );
}

/* ---------------------------------------------------- sponsors -- */

export function SponsoredRow({ items }: { items: HomeSponsored[] }) {
  const { t } = useI18n();
  if (!items.length) return null;

  const onClick = (id: string) => {
    // Mesure sans blocage : un échec ne doit jamais retarder la navigation.
    void post(`/promotions/sponsored/${id}/click/`).catch(() => undefined);
  };

  return (
    <section className="lp-wrap">
      <SectionHead title={t('showcase.sponsored')} subtitle={t('showcase.sponsoredHelp')} />
      <Rail label={t('showcase.sponsored')}>
        {items.map((entry) => (
          <ContentCard
            key={entry.id}
            item={entry.item}
            sponsorLabel={entry.label}
            sponsorNote={entry.note}
            partner={entry.partner}
            onSponsorClick={() => onClick(entry.id)}
          />
        ))}
      </Rail>
    </section>
  );
}

/* ------------------------------------------- parcours à onglets -- */

export function CareerPanel({ shelves }: { shelves: HomeShelf[] }) {
  const { t } = useI18n();
  const withItems = shelves.filter((shelf) => shelf.items.length);
  const [active, setActive] = useState(0);

  if (!withItems.length) return null;
  const current = withItems[Math.min(active, withItems.length - 1)];

  return (
    <section className="lp-wrap">
      <div className="lp-panel">
        <div>
          <h2 className="lp-panel-title">
            <Icon name="sparkles" size={21} />
            {t('showcase.careerTitle')}
          </h2>
          <p className="lp-panel-sub">{t('showcase.careerSubtitle')}</p>

          <div className="lp-panel-tabs" role="tablist" aria-label={t('showcase.careerTitle')}>
            {withItems.map((shelf, index) => (
              <button
                key={shelf.key}
                type="button"
                role="tab"
                id={`career-tab-${shelf.key}`}
                aria-selected={index === active}
                aria-controls={`career-panel-${shelf.key}`}
                className={`lp-panel-tab${index === active ? ' is-active' : ''}`}
                onClick={() => setActive(index)}
              >
                {shelf.title}
              </button>
            ))}
          </div>

          <div
            className="lp-grid"
            role="tabpanel"
            id={`career-panel-${current.key}`}
            aria-labelledby={`career-tab-${current.key}`}
          >
            {current.items.map((item) => (
              <ContentCard key={`${item.section}-${item.id}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------- partenaires -- */

export function PartnerStrip({ partners }: { partners: HomePartner[] }) {
  const { t } = useI18n();
  if (!partners.length) return null;

  return (
    <section className="lp-wrap">
      <Eyebrow>{t('showcase.eyebrowPartners')}</Eyebrow>
      <h2 className="lp-partners-title">{t('showcase.partners')}</h2>
      <ul className="lp-partners-list">
        {partners.map((partner) => (
          <li key={partner.slug} className="lp-partner-chip">
            {partner.logoUrl ? (
              <img className="lp-partner-logo" src={partner.logoUrl} alt="" loading="lazy" />
            ) : (
              <Icon name="building" size={16} />
            )}
            {partner.name}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------- tuiles -- */

const TILES: { key: string; icon: IconName; path: string }[] = [
  { key: 'career', icon: 'target', path: 'formations' },
  { key: 'team', icon: 'users', path: 'abonnements' },
  { key: 'certificate', icon: 'certificate', path: 'formations' }
];

export function ActionTiles() {
  const { t, href } = useI18n();

  return (
    <section className="lp-wrap">
      <div className="lp-tiles">
        {TILES.map((tile) => (
          <Link key={tile.key} to={href(tile.path)} className="lp-tile">
            <span className="lp-tile-body">
              <strong>{t(`showcase.tiles.${tile.key}Title`)}</strong>
              <span>{t(`showcase.tiles.${tile.key}Text`)}</span>
            </span>
            <span className="lp-tile-icon" aria-hidden="true">
              <Icon name={tile.icon} size={30} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------- spécialités -- */

export function CategoryPills({ specialties }: { specialties: string[] }) {
  const { t, href, term } = useI18n();
  if (!specialties.length) return null;

  return (
    <section className="lp-wrap">
      <SectionHead
        eyebrow={t('showcase.eyebrowExplore')}
        title={t('showcase.categories')}
        accent={t('showcase.accentExplore')}
        subtitle={t('showcase.categoriesSub')}
        doodle="rays"
      />
      <ul className="lp-pill-list">
        {specialties.map((slug) => (
          <li key={slug}>
            <Link className="lp-pill" to={href('bibliotheque', { specialty: slug })}>
              <Icon name="stethoscope" size={15} />
              {term('specialties', slug)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ----------------------------------------------- recherches -- */

export function TrendingSearches({ queries }: { queries: string[] }) {
  const { t, href } = useI18n();
  if (!queries.length) return null;

  return (
    <section className="lp-wrap">
      <SectionHead eyebrow={t('showcase.eyebrowTrending')} title={t('showcase.trending')} />
      <ul className="lp-pill-list">
        {queries.map((query) => (
          <li key={query}>
            <Link className="lp-pill" to={href('recherche', { q: query })}>
              <Icon name="search" size={14} />
              {query}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------ compteurs -- */

const COUNTERS = ['resources', 'courses', 'tools', 'pathologies'] as const;

export function Counters({ stats }: { stats: Record<string, number> }) {
  const { t, href } = useI18n();
  const paths: Record<string, string> = {
    resources: 'bibliotheque',
    courses: 'formations',
    tools: 'outils',
    pathologies: 'pathologies'
  };
  const shown = COUNTERS.filter((key) => stats[key]);
  if (!shown.length) return null;

  return (
    <section className="lp-wrap">
      <div className="lp-counters">
        {shown.map((key) => (
          <Link key={key} className="lp-counter" to={href(paths[key])}>
            <strong className="ltr-nums">{formatNumber(stats[key])}</strong>
            <span>{t(`home.stats.${key}`)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
