/* =====================================================================
   Bibliothèque scientifique — liste et fiche ressource
   ===================================================================== */
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ResourceCard } from '../components/cards/Cards';
import { useToast } from '../components/feedback/ToastProvider';
import { CoverArt } from '../components/home/CoverArt';
import { Icon, type IconName } from '../components/icons/Icon';
import { NotFoundState } from '../components/ui';
import { useContentActions } from '../hooks/useContentActions';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { canAccess } from '../lib/access';
import { recordView } from '../lib/activity';
import { authorName, getById, getBySlug, related, titleOf } from '../lib/content';
import { formatDate, formatDateShort, formatFileSize, formatNumber } from '../lib/format';
import { resourceJsonLd } from '../lib/seo';
import { useStoreVersion } from '../state/store';
import { ListPage } from './ListPage';

/* ---------------------------------------------------------------------
   Points clés et références acceptent deux formes : les chaînes du jeu
   embarqué, et les objets servis par l'API depuis que l'administration
   les édite ligne par ligne. Tant que les deux sources coexistent, la
   fiche doit lire l'une comme l'autre.
   --------------------------------------------------------------------- */

interface KeyPoint {
  icon: IconName;
  title: string;
  text: string;
}

interface Reference {
  citation: string;
  source: string;
}

function keyPointsOf(resource: { keyPoints?: unknown }): KeyPoint[] {
  const raw = resource.keyPoints;
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (typeof entry === 'string') return { icon: 'check' as IconName, title: entry, text: '' };
    const value = entry as Record<string, unknown>;
    return {
      icon: (typeof value.icon === 'string' ? value.icon : 'check') as IconName,
      title: typeof value.title === 'string' ? value.title : '',
      text: typeof value.text === 'string' ? value.text : ''
    };
  }).filter((point) => point.title);
}

function referencesOf(resource: { references?: unknown }): Reference[] {
  const raw = resource.references;
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (typeof entry === 'string') return { citation: entry, source: '' };
    const value = entry as Record<string, unknown>;
    return {
      citation: typeof value.citation === 'string' ? value.citation : '',
      source: typeof value.source === 'string' ? value.source : ''
    };
  }).filter((ref) => ref.citation);
}

/** Initiales d'un nom, pour les avatars sans portrait. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function LibraryListPage() {
  const { t } = useI18n();
  return (
    <ListPage
      collection="resources"
      route="bibliotheque"
      preset="resources"
      title={t('library.title')}
      subtitle={t('library.subtitle')}
      placeholder={t('library.searchPlaceholder')}
      renderCard={(resource) => <ResourceCard resource={resource} />}
      sorts={['newest', 'popular', 'az', 'oldest']}
      perPage={9}
      eyebrow={t('common.listing.eyebrow.library')}
    />
  );
}

export function ResourcePage() {
  useStoreVersion();
  const { slug } = useParams();
  const { t, term, href, loc } = useI18n();
  const toast = useToast();
  const { downloadResource } = useContentActions();

  const found = getBySlug('resources', slug);
  const resource = found && found.published !== false ? found : null;

  useEffect(() => {
    if (resource) recordView('resources', resource.id);
  }, [resource?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useSeo(
    resource
      ? {
          title: titleOf(resource),
          description: resource.description,
          path: `bibliotheque/${resource.slug}`,
          type: 'article',
          jsonLd: resourceJsonLd(resource)
        }
      : { title: t('common.states.notFoundTitle') }
  );

  if (!resource) return <NotFoundState />;

  const author = resource.authorId ? getById('authors', resource.authorId) : null;
  const relatedResources = related('resources', resource, 3);
  const relatedTools = related('tools', resource, 3);
  const locked = !canAccess(resource);
  const points = keyPointsOf(resource);
  const refs = referencesOf(resource);
  const abstract = resource.abstract || resource.description;

  const citation = `${authorName(resource.authorId)}. ${titleOf(resource)}. KINEDOK ACADÉMIE, ${new Date(
    resource.publishedAt
  ).getFullYear()}. academie.kinedokdz.com/bibliotheque/${resource.slug}`;

  /* Les onglets sont des ancres : tout le contenu reste dans la page,
     donc imprimable et trouvable par la recherche du navigateur. */
  const tabs: { id: string; label: string }[] = [
    { id: 'apercu', label: t('library.abstract') },
    ...(points.length ? [{ id: 'points', label: t('library.keyPoints') }] : []),
    ...(refs.length ? [{ id: 'references', label: t('common.labels.references') }] : []),
    ...(relatedResources.length ? [{ id: 'liees', label: t('library.related') }] : []),
    ...(relatedTools.length ? [{ id: 'outils', label: t('common.nav.tools') }] : [])
  ];

  const copyCitation = () => {
    navigator.clipboard
      ?.writeText(citation)
      .then(() => toast(t('library.citation'), 'success'))
      .catch(() => undefined);
  };

  return (
    <div className="rd">
      <nav className="rd-crumbs" aria-label={t('common.nav.menu')}>
        <Link to={href('')}>
          <Icon name="grid" size={14} />
        </Link>
        <span className="rd-crumbs-sep" aria-hidden="true">›</span>
        <Link to={href('bibliotheque')}>{t('library.title')}</Link>
        {resource.region ? (
          <>
            <span className="rd-crumbs-sep" aria-hidden="true">›</span>
            <Link to={href('bibliotheque', { region: resource.region })}>
              {term('regions', resource.region)}
            </Link>
          </>
        ) : null}
        <span className="rd-crumbs-sep" aria-hidden="true">›</span>
        <span aria-current="page">{titleOf(resource)}</span>
      </nav>

      {/* ------------------------------------------------------ en-tête */}
      <header className="rd-hero">
        <div className="rd-cover">
          <CoverArt section="resources" alt={titleOf(resource)} />
          <span className="rd-cover-tags">
            <span className="rd-tag">
              <Icon name="file" size={13} />
              {term('resourceTypes', resource.type)}
            </span>
            <span className="rd-tag">
              <Icon name="trending" size={13} />
              {term('levels', resource.level)}
            </span>
            {resource.format ? (
              <span className="rd-tag">{resource.format.toUpperCase()}</span>
            ) : null}
          </span>
        </div>

        <div>
          <h1 className="rd-title">{titleOf(resource)}</h1>
          {resource.subtitle ? (
            <p className="rd-subtitle">{loc(resource, 'subtitle') || resource.subtitle}</p>
          ) : null}

          {author ? (
            <Link className="rd-byline" to={href('bibliotheque', { q: authorName(resource.authorId) })}>
              <span className="rd-avatar" aria-hidden="true">
                {initialsOf(authorName(resource.authorId))}
              </span>
              {authorName(resource.authorId)}
            </Link>
          ) : null}

          <div className="rd-stats">
            {resource.publishedAt ? (
              <span className="rd-stat">
                <Icon name="calendar" size={15} />
                <span className="ltr-nums">{formatDate(resource.publishedAt)}</span>
              </span>
            ) : null}
            <span className="rd-stat">
              <Icon name="eye" size={15} />
              <span className="ltr-nums">{formatNumber(resource.views)}</span> {t('common.labels.views')}
            </span>
            <span className="rd-stat">
              <Icon name="download" size={15} />
              <span className="ltr-nums">{formatNumber(resource.downloads)}</span> {t('common.labels.downloads')}
            </span>
          </div>

          <p className="rd-lead">{resource.description}</p>

          <div className="rd-actions">
            <button
              type="button"
              className="rd-btn rd-btn-primary"
              onClick={() => downloadResource(resource)}
            >
              <Icon name="download" size={17} />
              {t('common.actions.download')} {resource.format?.toUpperCase()}
            </button>
            <Link className="rd-btn rd-btn-outline" to={href('bibliotheque', { type: resource.type })}>
              <Icon name="eye" size={17} />
              {t('common.actions.preview')}
            </Link>
          </div>

          <div className="rd-facts">
            {resource.region ? (
              <span className="rd-fact">
                <Icon name="body" size={15} />
                {term('regions', resource.region)}
              </span>
            ) : null}
            {resource.specialty ? (
              <span className="rd-fact">
                <Icon name="activity" size={15} />
                {term('specialties', resource.specialty)}
              </span>
            ) : null}
            <span className="rd-fact">
              <Icon name="globe" size={15} />
              {term('languages', resource.language)}
            </span>
            {resource.sizeKb ? (
              <span className="rd-fact">
                <Icon name="file" size={15} />
                <span className="ltr-nums">{formatFileSize(resource.sizeKb)}</span>
              </span>
            ) : null}
            {resource.pages ? (
              <span className="rd-fact">
                <Icon name="layers" size={15} />
                <span className="ltr-nums">{resource.pages}</span> {t('common.units.pagesShort')}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------- onglets */}
      <nav className="rd-tabs" aria-label={t('library.metadata')}>
        {tabs.map((tab, index) => (
          <a key={tab.id} className={`rd-tab${index === 0 ? ' is-active' : ''}`} href={`#${tab.id}`}>
            {tab.label}
          </a>
        ))}
      </nav>

      {/* --------------------------------------------------------- corps */}
      <div className="rd-body">
        <div>
          <section className="rd-card" id="apercu">
            <h2 className="rd-card-head">
              <Icon name="file" size={19} />
              {t('library.abstract')}
            </h2>
            <p className="rd-prose">{abstract}</p>
          </section>

          {points.length ? (
            <section className="rd-card" id="points">
              <h2 className="rd-card-head">
                <Icon name="sparkles" size={19} />
                {t('library.keyPoints')}
              </h2>
              <div className="rd-points">
                {points.map((point) => (
                  <article className="rd-point" key={point.title}>
                    <span className="rd-point-icon" aria-hidden="true">
                      <Icon name={point.icon} size={19} />
                    </span>
                    <div>
                      <h3 className="rd-point-title">{point.title}</h3>
                      {point.text ? <p className="rd-point-text">{point.text}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {refs.length ? (
            <section className="rd-card" id="references">
              <h2 className="rd-card-head">
                <Icon name="book" size={19} />
                {t('common.labels.references')}
              </h2>
              <ol className="rd-refs">
                {refs.map((ref) => (
                  <li key={ref.citation}>
                    <span className="rd-ref-citation">{ref.citation}</span>
                    {ref.source ? <span className="rd-ref-source">{ref.source}</span> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        {/* ------------------------------------------------------ colonne */}
        <aside className="rd-aside">
          {author ? (
            <section className="rd-card">
              <h2 className="rd-card-head">
                <Icon name="user" size={19} />
                {t('library.aboutAuthor')}
              </h2>
              <div className="rd-author">
                <span className="rd-author-avatar" aria-hidden="true">
                  {initialsOf(authorName(resource.authorId))}
                </span>
                <div>
                  <p className="rd-author-name">{authorName(resource.authorId)}</p>
                  {author.title ? <p className="rd-author-role">{author.title}</p> : null}
                </div>
              </div>
              {author.bio ? <p className="rd-prose">{author.bio}</p> : null}
            </section>
          ) : null}

          <section className="rd-card">
            <h2 className="rd-card-head">
              <Icon name="settings" size={19} />
              {t('library.metadata')}
            </h2>
            <dl className="rd-specs">
              <dt>{t('common.labels.type')}</dt>
              <dd>{term('resourceTypes', resource.type)}</dd>
              {resource.region ? (
                <>
                  <dt>{t('common.labels.region')}</dt>
                  <dd>{term('regions', resource.region)}</dd>
                </>
              ) : null}
              {resource.specialty ? (
                <>
                  <dt>{t('common.labels.specialty')}</dt>
                  <dd>{term('specialties', resource.specialty)}</dd>
                </>
              ) : null}
              <dt>{t('common.labels.level')}</dt>
              <dd>{term('levels', resource.level)}</dd>
              <dt>{t('common.labels.language')}</dt>
              <dd>{term('languages', resource.language)}</dd>
              {resource.format ? (
                <>
                  <dt>{t('common.labels.format')}</dt>
                  <dd>{resource.format.toUpperCase()}</dd>
                </>
              ) : null}
              {resource.sizeKb ? (
                <>
                  <dt>{t('common.labels.size')}</dt>
                  <dd className="ltr-nums">{formatFileSize(resource.sizeKb)}</dd>
                </>
              ) : null}
              {resource.updatedAt ? (
                <>
                  <dt>{t('common.labels.updatedOn')}</dt>
                  <dd className="ltr-nums">{formatDateShort(resource.updatedAt)}</dd>
                </>
              ) : null}
            </dl>

            <button
              type="button"
              className="rd-btn rd-btn-primary rd-btn-block"
              style={{ marginBlockStart: 18 }}
              onClick={() => downloadResource(resource)}
            >
              <Icon name="download" size={17} />
              {t('common.actions.download')} {resource.format?.toUpperCase()}
            </button>
            {locked ? <p className="rd-point-text" style={{ marginBlockStart: 10 }}>{t('library.previewNotice')}</p> : null}
          </section>
        </aside>
      </div>

      {/* ------------------------------------------------ ressources liées */}
      {relatedResources.length ? (
        <section className="rd-section" id="liees">
          <div className="rd-section-head">
            <h2 className="rd-section-title">
              <Icon name="layers" size={19} />
              {t('library.related')}
            </h2>
            <Link className="rd-link" to={href('bibliotheque')}>
              {t('common.actions.viewAll')}
              <Icon name="arrowRight" size={15} className="icon-flip" />
            </Link>
          </div>
          <div className="rd-cards">
            {relatedResources.map((item) => (
              <Link className="rd-rel" key={item.id} to={href(`bibliotheque/${item.slug}`)}>
                <span className="rd-rel-thumb">
                  <CoverArt section="resources" alt="" />
                </span>
                <span className="rd-rel-body">
                  <span className="rd-chip">{term('resourceTypes', item.type)}</span>
                  <h3 className="rd-rel-title">{titleOf(item)}</h3>
                  <p className="rd-rel-text">{item.subtitle || item.description}</p>
                  <span className="rd-rel-meta">
                    {item.format ? <span>{item.format.toUpperCase()}</span> : null}
                    {item.pages ? <span className="ltr-nums">{item.pages} {t('common.units.pagesShort')}</span> : null}
                    {item.sizeKb ? <span className="ltr-nums">{formatFileSize(item.sizeKb)}</span> : null}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------- outils liés */}
      {relatedTools.length ? (
        <section className="rd-section" id="outils">
          <div className="rd-section-head">
            <h2 className="rd-section-title">
              <Icon name="tools" size={19} />
              {t('common.nav.tools')}
            </h2>
            <Link className="rd-link" to={href('outils')}>
              {t('common.actions.viewAll')}
              <Icon name="arrowRight" size={15} className="icon-flip" />
            </Link>
          </div>
          <div className="rd-cards">
            {relatedTools.map((tool) => (
              <Link className="rd-tool" key={tool.id} to={href(`outils/${tool.slug}`)}>
                <span className="rd-tool-icon" aria-hidden="true">
                  <Icon name="stethoscope" size={20} />
                </span>
                <span className="rd-tool-body">
                  <h3 className="rd-tool-title">{titleOf(tool)}</h3>
                  <p className="rd-tool-text">{tool.subtitle || term('toolTypes', tool.type)}</p>
                </span>
                <Icon name="arrowRight" size={18} className="icon-flip rd-tool-arrow" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------ pied de page */}
      <div className="rd-foot">
        <p className="rd-notice">
          <Icon name="info" size={18} />
          {t('common.disclaimer.body')}
        </p>
        <button type="button" className="rd-cite" onClick={copyCitation}>
          <Icon name="quiz" size={17} />
          {t('library.citation')}
        </button>
      </div>
    </div>
  );
}
