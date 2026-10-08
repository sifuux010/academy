/* =====================================================================
   Cartes de contenu
   ---------------------------------------------------------------------
   Une carte par type, une seule grammaire visuelle (`ll-card`) :

     vignette → signature → titre → résumé → repères → socle

   Deux variantes seulement :

   - **à vignette** (formations, webinaires, ressources, exercices,
     pathologies) : l'image annonce la rubrique avant la lecture ;
   - **à pavé d'icône** (outils) : un test ou un score n'a pas d'image —
     lui en inventer une mentirait sur sa nature.

   Dans les deux cas l'action occupe le socle, toujours au même endroit.
   Le titre porte un lien étendu à toute la carte (`::after` en CSS) : la
   cible est grande, mais la page ne compte qu'un seul lien par carte. Les
   boutons du socle passent au-dessus.
   ===================================================================== */
import type { MouseEventHandler } from 'react';
import { Link } from 'react-router';
import { useContentActions } from '../../hooks/useContentActions';
import { useI18n } from '../../i18n/I18nContext';
import { courseProgress } from '../../lib/activity';
import { currentUser } from '../../lib/auth';
import { authorName, courseStats, forPathology, getById, titleOf, webinarStatus } from '../../lib/content';
import { formatDateShort, formatDuration, formatFileSize, formatNumber } from '../../lib/format';
import { routeOf } from '../../lib/search';
import type { ContentCollection } from '../../model/common';
import type { AnyItem, Course, Exercise, Pathology, Resource, Tool, Webinar } from '../../model/content';
import { CoverArt } from '../home/CoverArt';
import { Icon, type IconName } from '../icons/Icon';
import { FavoriteButton } from '../ui/Actions';
import { ProgressBar } from '../ui/Blocks';

/* ======================================================= fragments ---- */

/** Initiales d'un nom, pour les signatures sans portrait. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Signature d'une carte : la personne et sa qualité.
 *
 * La qualité (« Kinésithérapeute du sport ») vaut mieux qu'un second nom
 * de rubrique : elle dit pourquoi cette personne-là signe ce contenu.
 */
function Person({ id }: { id?: string | null }) {
  const author = getById('authors', id);
  if (!author) return null;
  const name = `${author.firstName} ${author.lastName}`;
  return (
    <div className="ll-person">
      <span className="ll-avatar" aria-hidden="true">
        {initialsOf(name)}
      </span>
      <span>
        <span className="ll-person-name">{name}</span>
        <span className="ll-person-role">{author.title}</span>
      </span>
    </div>
  );
}

/** Note moyenne — rien ne s'affiche tant qu'aucun avis n'est déposé. */
function Rating({ value, count }: { value?: number; count?: number }) {
  const { t } = useI18n();
  if (!value) return null;
  return (
    <span className="ll-rating ll-rating-star">
      <Icon name="star" size={15} />
      <strong className="ltr-nums">{value.toFixed(1)}</strong>
      {count ? <span className="ltr-nums">{t('courses.ratingCount', { count: formatNumber(count) })}</span> : null}
    </span>
  );
}

/** Rond fléché du socle : « ceci s'ouvre ». */
function Go() {
  return (
    <span className="ll-go" aria-hidden="true">
      <Icon name="arrowRight" size={16} className="icon-flip" />
    </span>
  );
}

/** Mention « Premium » — un mot, pas seulement une couleur. */
function PremiumTag({ access }: { access?: string }) {
  const { t } = useI18n();
  if (access !== 'premium') return null;
  return (
    <span className="ll-tag ll-tag-premium">
      <Icon name="lock" size={11} />
      {t('taxonomies.access.premium')}
    </span>
  );
}

/* --------------------------------------------------------- formation */

export function CourseCard({ course, showProgress }: { course: Course; showProgress?: boolean }) {
  const { t, term, href } = useI18n();
  const to = href(`formations/${course.slug}`);
  const stats = courseStats(course);
  const progress = currentUser() ? courseProgress(course) : null;
  const withProgress = !!showProgress && !!progress && progress.done > 0;

  return (
    <article className="ll-card">
      <Link className="ll-media" to={to} tabIndex={-1} aria-hidden="true">
        <CoverArt section="courses" />
        {course.level ? <span className="ll-flag">{term('levels', course.level)}</span> : null}
        {stats.minutes ? <span className="ll-duration ltr-nums">{formatDuration(stats.minutes)}</span> : null}
      </Link>
      <FavoriteButton collection="courses" id={course.id} className="ll-save" />

      <div className="ll-card-body">
        <h3 className="ll-card-title ll-clamp-2">
          <Link to={to}>{titleOf(course)}</Link>
        </h3>
        <p className="ll-card-desc ll-clamp-2">{course.subtitle || course.description}</p>
        <Person id={course.instructorId} />
        <div className="ll-tags">
          {course.specialty ? <span className="ll-tag">{term('specialties', course.specialty)}</span> : null}
          {course.region ? <span className="ll-tag">{term('regions', course.region)}</span> : null}
          {course.certificate ? <span className="ll-tag">{t('common.labels.certificate')}</span> : null}
          <PremiumTag access={course.access} />
        </div>
        {withProgress && progress ? (
          <div>
            <ProgressBar percent={progress.percent} />
            <p className="ll-card-desc mt-4">
              {t('courses.lessonsCompleted', { done: progress.done, total: progress.total })}
            </p>
          </div>
        ) : null}
      </div>

      <div className="ll-card-foot">
        <Rating value={course.rating} count={course.ratingCount} />
        <Go />
      </div>
    </article>
  );
}

/* --------------------------------------------------------- webinaire */

export function WebinarCard({ webinar }: { webinar: Webinar }) {
  const { t, term, href } = useI18n();
  const status = webinarStatus(webinar);
  const to = href(`webinaires/${webinar.slug}`);
  const replay = status === 'replay' || status === 'past';

  return (
    <article className="ll-card">
      <Link className="ll-media" to={to} tabIndex={-1} aria-hidden="true">
        <CoverArt section="webinars" />
        <span className={status === 'live' ? 'll-flag ll-flag-live' : 'll-flag'}>
          {status === 'live' ? t('webinars.liveNow') : term('webinarStatus', status)}
        </span>
        {replay ? (
          <span className="ll-play">
            <Icon name="play" size={20} />
          </span>
        ) : null}
        <span className="ll-duration ltr-nums">{formatDuration(webinar.durationMinutes)}</span>
      </Link>
      <FavoriteButton collection="webinars" id={webinar.id} className="ll-save" icon="bell" />

      <div className="ll-card-body">
        <h3 className="ll-card-title ll-clamp-2">
          <Link to={to}>{titleOf(webinar)}</Link>
        </h3>
        <p className="ll-card-desc ll-clamp-2">{webinar.subtitle || webinar.description}</p>
        <div className="ll-meta">
          <span>
            <Icon name="user" size={14} />
            {authorName(webinar.speakerId)}
          </span>
          <span>
            <Icon name="calendar" size={14} />
            <time dateTime={webinar.startsAt} className="ltr-nums">
              {formatDateShort(webinar.startsAt)}
            </time>
          </span>
          <span>
            <Icon name="users" size={14} />
            <span className="ltr-nums">{formatNumber(webinar.registeredCount)}</span>
          </span>
        </div>
      </div>

      <div className="ll-card-actions">
        <Link className="ll-btn ll-btn-quiet ll-btn-grow" to={to}>
          {t('common.actions.details')}
        </Link>
        {replay ? (
          <Link className="ll-btn ll-btn-outline ll-btn-grow" to={to}>
            <Icon name="play" size={15} />
            {t('webinars.cardReplay')}
          </Link>
        ) : (
          <Link className="ll-btn ll-btn-primary ll-btn-grow" to={to}>
            <Icon name="calendar" size={15} />
            {t('webinars.cardRegister')}
          </Link>
        )}
      </div>
    </article>
  );
}

/* --------------------------------------------------------- ressource */

export function ResourceCard({ resource }: { resource: Resource }) {
  const { term, href } = useI18n();
  const to = href(`bibliotheque/${resource.slug}`);

  return (
    <article className="ll-card">
      <Link className="ll-media" to={to} tabIndex={-1} aria-hidden="true">
        <CoverArt section="resources" />
        {resource.type ? <span className="ll-flag">{term('resourceTypes', resource.type)}</span> : null}
      </Link>
      <FavoriteButton collection="resources" id={resource.id} className="ll-save" />

      <div className="ll-card-body">
        <h3 className="ll-card-title ll-clamp-2">
          <Link to={to}>{titleOf(resource)}</Link>
        </h3>
        <p className="ll-card-desc ll-clamp-2">{resource.description}</p>
        <Person id={resource.authorId} />
        <div className="ll-meta">
          <span>
            <Icon name="calendar" size={14} />
            <time dateTime={resource.publishedAt} className="ltr-nums">
              {formatDateShort(resource.publishedAt)}
            </time>
          </span>
          <span>
            <Icon name="filePdf" size={14} />
            <span className="ltr-nums">{formatFileSize(resource.sizeKb)}</span>
          </span>
        </div>
        <div className="ll-tags">
          {resource.region ? <span className="ll-tag">{term('regions', resource.region)}</span> : null}
          <PremiumTag access={resource.access} />
        </div>
      </div>

      <div className="ll-card-foot">
        <span className="ll-rating">
          <Icon name="eye" size={15} />
          <span className="ltr-nums">{formatNumber(resource.views)}</span>
        </span>
        <Go />
      </div>
    </article>
  );
}

/* -------------------------------------------------------------- outil */

const TOOL_ICONS: Record<string, IconName> = {
  test: 'stethoscope',
  questionnaire: 'quiz',
  score: 'chart',
  bilan: 'file'
};

export function ToolCard({ tool }: { tool: Tool }) {
  const { t, term, href } = useI18n();
  const { downloadTool } = useContentActions();
  const to = href(`outils/${tool.slug}`);

  return (
    <article className="ll-card ll-card-plain">
      <div className="ll-card-body">
        <div className="ll-card-head">
          <div className="ll-card-head-start">
            <span className="ll-tile">
              <Icon name={TOOL_ICONS[tool.type] ?? 'tools'} size={19} />
            </span>
            <span className="ll-tag">{term('toolTypes', tool.type)}</span>
          </div>
          <FavoriteButton collection="tools" id={tool.id} className="ll-save" />
        </div>

        <h3 className="ll-card-title ll-clamp-2">
          <Link to={to}>{titleOf(tool)}</Link>
        </h3>
        <p className="ll-card-desc ll-clamp-2">{tool.subtitle || tool.description}</p>

        <div className="ll-meta">
          <span>
            <Icon name="body" size={14} />
            {term('regions', tool.region)}
          </span>
          <span>
            <Icon name="download" size={14} />
            <span className="ltr-nums">{formatNumber(tool.downloads)}</span>
          </span>
        </div>
      </div>

      <div className="ll-card-actions">
        <Link className="ll-btn ll-btn-quiet ll-btn-grow" to={to}>
          {t('common.actions.details')}
        </Link>
        <button
          type="button"
          className="ll-btn ll-btn-outline ll-btn-square"
          aria-label={t('common.actions.download')}
          onClick={() => downloadTool(tool)}
        >
          <Icon name="download" size={16} />
        </button>
      </div>
    </article>
  );
}

/* --------------------------------------------------------- pathologie */

export function PathologyCard({ pathology }: { pathology: Pathology }) {
  const { t, term, href } = useI18n();
  const to = href(`pathologies/${pathology.slug}`);
  const linked = forPathology(pathology.slug);
  const count =
    linked.resources.length +
    linked.tools.length +
    linked.exercises.length +
    linked.courses.length +
    linked.webinars.length;

  return (
    <article className="ll-card">
      <Link className="ll-media" to={to} tabIndex={-1} aria-hidden="true">
        <CoverArt section="pathologies" />
        <span className="ll-flag">{term('regions', pathology.region)}</span>
      </Link>

      <div className="ll-card-body">
        <h3 className="ll-card-title ll-clamp-2">
          <Link to={to}>{titleOf(pathology)}</Link>
        </h3>
        <p className="ll-card-desc ll-clamp-3">{pathology.summary}</p>
        <div className="ll-tags">
          <span className="ll-tag">{term('specialties', pathology.specialty)}</span>
        </div>
      </div>

      <div className="ll-card-foot">
        <span className="ll-rating">{t('pathologies.resourcesCount', { count })}</span>
        <Go />
      </div>
    </article>
  );
}

/* ----------------------------------------------------------- exercice */

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const { term, href } = useI18n();
  const to = href(`exercices/${exercise.slug}`);

  return (
    <article className="ll-card">
      <Link className="ll-media" to={to} tabIndex={-1} aria-hidden="true">
        <CoverArt section="exercises" />
        <span className="ll-flag">{term('difficulty', exercise.difficulty)}</span>
      </Link>
      <FavoriteButton collection="exercises" id={exercise.id} className="ll-save" />

      <div className="ll-card-body">
        <h3 className="ll-card-title ll-clamp-2">
          <Link to={to}>{titleOf(exercise)}</Link>
        </h3>
        <p className="ll-card-desc ll-clamp-2">{exercise.goal}</p>
        <div className="ll-meta">
          <span>
            <Icon name="body" size={14} />
            {term('regions', exercise.region)}
          </span>
          <span>
            <Icon name="dumbbell" size={14} />
            {exercise.equipment.join(', ') || '—'}
          </span>
        </div>
        <div className="ll-tags">
          <span className="ll-tag">{term('objectives', exercise.objective)}</span>
        </div>
      </div>

      <div className="ll-card-foot">
        <span className="ll-rating">{exercise.targetMuscles[0] ?? ''}</span>
        <Go />
      </div>
    </article>
  );
}

/* --------------------------------------------------- carte générique */

export function AnyCard({
  collection,
  item,
  showProgress
}: {
  collection: ContentCollection | 'authors';
  item: AnyItem;
  showProgress?: boolean;
}) {
  switch (collection) {
    case 'resources':
      return <ResourceCard resource={item as Resource} />;
    case 'courses':
      return <CourseCard course={item as Course} showProgress={showProgress} />;
    case 'webinars':
      return <WebinarCard webinar={item as Webinar} />;
    case 'tools':
      return <ToolCard tool={item as Tool} />;
    case 'pathologies':
      return <PathologyCard pathology={item as Pathology} />;
    case 'exercises':
      return <ExerciseCard exercise={item as Exercise} />;
    default:
      return null;
  }
}

/* -------------------------------------------------- ligne compacte ---- */

const ROW_ICONS: Record<ContentCollection, IconName> = {
  resources: 'book',
  courses: 'graduation',
  webinars: 'radio',
  tools: 'tools',
  pathologies: 'stethoscope',
  exercises: 'dumbbell',
  plans: 'creditCard'
};

export function ResultRow({
  collection,
  item,
  onNavigate
}: {
  collection: ContentCollection;
  item: AnyItem;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const { term, href } = useI18n();
  const record = item as unknown as Record<string, unknown>;
  const meta: string[] = [];
  if (typeof record.type === 'string') meta.push(term(collection === 'tools' ? 'toolTypes' : 'resourceTypes', record.type));
  if (typeof record.region === 'string') meta.push(term('regions', record.region));
  if (typeof record.level === 'string') meta.push(term('levels', record.level));
  if (typeof record.startsAt === 'string') meta.push(formatDateShort(record.startsAt));
  return (
    <Link className="search-item" to={href(`${routeOf(collection)}/${item.slug}`)} onClick={onNavigate}>
      <span className="hv-icon">
        <Icon name={ROW_ICONS[collection]} size={16} />
      </span>
      <span className="grow">
        <span className="si-title">{titleOf(item)}</span>
        <span className="si-meta">{meta.join(' · ')}</span>
      </span>
    </Link>
  );
}

/* ====================================================== mise en avant -- */

/**
 * Encart de tête d'une liste : un contenu sorti du rang.
 *
 * Il ne remplace pas la grille — il la précède. Le même contenu réapparaît
 * à sa place dans les résultats : on ne le perd pas en changeant de page.
 */
export function FeaturedPanel({
  label,
  title,
  description,
  to,
  cta,
  meta,
  illustration
}: {
  label: string;
  title: string;
  description: string;
  to: string;
  cta: string;
  meta?: { icon: IconName; text: string }[];
  illustration?: string;
}) {
  return (
    <section className="ll-featured">
      <div>
        <span className="ll-featured-pill">{label}</span>
        <h2>
          <Link to={to}>{title}</Link>
        </h2>
        <p>{description}</p>
        {meta?.length ? (
          <div className="ll-meta">
            {meta.map((entry) => (
              <span key={entry.text}>
                <Icon name={entry.icon} size={14} />
                {entry.text}
              </span>
            ))}
          </div>
        ) : null}
        <Link className="ll-featured-go" to={to}>
          {cta}
          <Icon name="arrowRight" size={16} className="icon-flip" />
        </Link>
      </div>
      {illustration ? (
        <div className="ll-featured-art">
          <img src={illustration} alt="" width={330} height={278} loading="lazy" />
        </div>
      ) : null}
    </section>
  );
}

/* ----------------------------------------------------------- widgets -- */

export function StatCard({ label, value, icon = 'chart' }: { label: string; value: string; icon?: IconName }) {
  return (
    <div className="stat">
      <div className="row-between">
        <span className="stat-icon">
          <Icon name={icon} size={20} />
        </span>
      </div>
      <div className="stat-value ltr-nums mt-4">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  desc,
  cta,
  to
}: {
  icon: IconName;
  title: string;
  desc: string;
  cta: string;
  to: string;
}) {
  return (
    <article className="feature-card">
      <span className="feature-icon">
        <Icon name={icon} size={24} />
      </span>
      <h3>{title}</h3>
      <p className="text-muted grow">{desc}</p>
      <Link className="btn btn-primary" to={to}>
        {cta}
        <Icon name="arrowRight" size={16} className="icon-flip" />
      </Link>
    </article>
  );
}
