/* =====================================================================
   Cartes de contenu
   ---------------------------------------------------------------------
   Deux formats, un seul vocabulaire :

   - `ContentCard` — couverture 16/9, pour les rails et les grilles ;
   - `MiniCard` — vignette carrée et texte à droite, pour les colonnes
     « Nouveautés », où l'on compare une dizaine de titres d'affilée.

   Les deux lisent les mêmes champs et affichent la même signature, pour
   qu'un même contenu reste reconnaissable d'un bloc à l'autre.

   La mention « Sponsorisé » est rendue à partir des données, pas passée
   à l'appel : une carte sponsorisée ne peut pas s'afficher sans elle.
   ===================================================================== */
import { Link } from 'react-router';
import { Icon, type IconName } from '../icons/Icon';
import { useI18n } from '../../i18n/I18nContext';
import { formatDate, formatDateShort, formatDuration, formatNumber, formatTime } from '../../lib/format';
import { authorName } from '../../lib/content';
import { CoverArt } from './CoverArt';
import type { HomePartner, HomeShelfItem } from '../../hooks/useHomeData';

const NAV_KEY: Record<string, string> = {
  resources: 'library',
  courses: 'courses',
  webinars: 'webinars',
  tools: 'tools',
  exercises: 'exercises',
  pathologies: 'pathologies'
};

const SECTION_META: Record<string, { path: string; icon: IconName }> = {
  resources: { path: 'bibliotheque', icon: 'file' },
  courses: { path: 'formations', icon: 'graduation' },
  webinars: { path: 'webinaires', icon: 'video' },
  tools: { path: 'outils', icon: 'stethoscope' },
  exercises: { path: 'exercices', icon: 'dumbbell' },
  pathologies: { path: 'pathologies', icon: 'body' }
};

function str(item: HomeShelfItem, ...keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value) return value;
  }
  return '';
}

function num(item: HomeShelfItem, key: string): number {
  const value = item[key];
  return typeof value === 'number' ? value : 0;
}

function statsOf(item: HomeShelfItem): { modules: number; lessons: number; minutes: number } {
  const value = item.stats;
  if (value && typeof value === 'object') {
    const r = value as Record<string, unknown>;
    return {
      modules: typeof r.modules === 'number' ? r.modules : 0,
      lessons: typeof r.lessons === 'number' ? r.lessons : 0,
      minutes: typeof r.minutes === 'number' ? r.minutes : 0
    };
  }
  return { modules: 0, lessons: 0, minutes: 0 };
}

/** Route de détail d'un contenu. */
function pathOf(item: HomeShelfItem): string {
  return `${(SECTION_META[item.section] ?? SECTION_META.resources).path}/${item.slug}`;
}

/**
 * Signature : l'intervenant quand on le connaît, sinon le partenaire,
 * sinon la rubrique. Un nom vaut mieux qu'une étiquette générique.
 */
function useSignature(item: HomeShelfItem, partner?: HomePartner | null): string {
  const { t } = useI18n();
  const person =
    str(item, 'instructorName', 'speakerName', 'authorName') ||
    authorName(str(item, 'instructorId', 'speakerId', 'authorId'));
  return person || partner?.name || t(`common.nav.${NAV_KEY[item.section] ?? 'home'}`);
}

/* =====================================================================
   Carte à couverture — rails et grilles
   ===================================================================== */

export interface ContentCardProps {
  item: HomeShelfItem;
  sponsorLabel?: string;
  sponsorNote?: string;
  partner?: HomePartner | null;
  onSponsorClick?: () => void;
  /** Avancement 0–100 : remplace le socle par une barre de progression. */
  progress?: number;
}

export function ContentCard({
  item,
  sponsorLabel,
  sponsorNote,
  partner,
  onSponsorClick,
  progress
}: ContentCardProps) {
  const { t, href, term, loc } = useI18n();

  const section = item.section;
  const title = loc(item as never, 'title') || str(item, 'title', 'name');
  const access = str(item, 'access');
  const sponsored = Boolean(sponsorLabel);
  const signature = useSignature(item, partner);

  const rating = num(item, 'rating');
  const ratingCount = num(item, 'ratingCount');

  return (
    <article className={`lp-card${sponsored ? ' lp-card-sponsored' : ''}`}>
      <Link className="lp-card-link" to={href(pathOf(item))} onClick={onSponsorClick}>
        <div className="lp-cover">
          <CoverArt
            src={str(item, 'coverUrl', 'imageUrl')}
            section={section}
            alt={title}
          />

          <span className="lp-cover-tags">
            {typeof progress === 'number' ? (
              <span className="lp-badge lp-badge-progress">{t('showcase.inProgressTag')}</span>
            ) : null}
            {sponsored ? <span className="lp-badge lp-badge-sponsored">{sponsorLabel}</span> : null}
            {access === 'premium' ? (
              <span className="lp-badge lp-badge-premium">
                <Icon name="crown" size={12} />
                {term('access', 'premium')}
              </span>
            ) : null}
          </span>

          {section === 'webinars' ? <WebinarStatus item={item} /> : null}
        </div>

        <div className="lp-card-body">
          <p className="lp-card-partner">
            <span className="lp-card-avatar" aria-hidden="true">
              {initialsOf(signature)}
            </span>
            {signature}
          </p>

          <h3 className="lp-card-title">{title}</h3>

          {sponsorNote ? <p className="lp-card-note">{sponsorNote}</p> : null}

          {rating > 0 ? (
            <p className="lp-card-rating">
              <Icon name="star" size={14} />
              <strong>{rating.toFixed(1)}</strong>
              {ratingCount > 0 ? (
                <span className="lp-card-dim">({formatNumber(ratingCount)})</span>
              ) : null}
            </p>
          ) : null}

          {typeof progress === 'number' ? (
            <ProgressBar value={progress} />
          ) : (
            <CardFooter item={item} />
          )}
        </div>
      </Link>
    </article>
  );
}

/** Initiales d'un nom, pour la pastille de signature. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Barre de progression.
 *
 * `role="progressbar"` et ses bornes : la valeur est annoncée, elle ne
 * repose pas sur la seule largeur du remplissage.
 */
function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="lp-progress">
      <span
        className="lp-progress-bar"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="lp-progress-fill" style={{ width: `${safe}%` }} />
      </span>
      <span className="lp-progress-value ltr-nums">{safe}%</span>
    </div>
  );
}

/* ----------------------------------------------- statut d'un webinaire -- */

function WebinarStatus({ item }: { item: HomeShelfItem }) {
  const { term } = useI18n();
  const status = str(item, 'status');
  if (!status) return null;
  return (
    <span className={`lp-live lp-live-${status}`}>
      {status === 'live' ? <span className="lp-live-dot" aria-hidden="true" /> : null}
      {term('webinarStatus', status)}
    </span>
  );
}

/* --------------------------------------------------------- pied de carte -- */

function CardFooter({ item }: { item: HomeShelfItem }) {
  const { t, tn, term } = useI18n();
  const section = item.section;

  /* Le rond fléché clôt chaque socle : l'action est toujours au même
     endroit, quelle que soit la section. */
  const go = (
    <span className="lp-go" aria-hidden="true">
      <Icon name="arrowRight" size={16} className="icon-flip" />
    </span>
  );

  if (section === 'courses') {
    const { modules, lessons, minutes } = statsOf(item);
    return (
      <div className="lp-card-foot">
        <div className="lp-card-meta">
        {minutes > 0 ? (
          <span className="lp-card-dim">
            <Icon name="clock" size={13} />
            <span className="ltr-nums">{formatDuration(minutes)}</span>
          </span>
        ) : null}
        {modules > 0 ? (
          <span className="lp-card-dim">
            <Icon name="layers" size={13} />
            {tn(modules, 'common.units.modules')}
          </span>
        ) : lessons > 0 ? (
          <span className="lp-card-dim">{tn(lessons, 'common.units.lessons')}</span>
        ) : null}
        {item.certificate ? (
          <span className="lp-chip">
            <Icon name="certificate" size={12} />
            {t('common.labels.certificate')}
          </span>
        ) : null}
        </div>
        {go}
      </div>
    );
  }

  if (section === 'webinars') {
    const startsAt = str(item, 'startsAt');
    const registered = num(item, 'registeredCount');
    return (
      <div className="lp-card-foot">
        <div className="lp-card-meta">
        {startsAt ? (
          <span className="lp-card-date">
            <Icon name="calendar" size={13} />
            <span className="ltr-nums">
              {formatDate(startsAt, { day: 'numeric', month: 'short' })} · {formatTime(startsAt)}
            </span>
          </span>
        ) : null}
        {registered > 0 ? (
          <span className="lp-card-dim">
            <Icon name="users" size={13} />
            <span className="ltr-nums">{formatNumber(registered)}</span>
          </span>
        ) : null}
        </div>
        {go}
      </div>
    );
  }

  const type = str(item, 'type');
  const typeLabel = term(section === 'tools' ? 'toolTypes' : 'resourceTypes', type);
  const level = str(item, 'level');
  const difficulty = str(item, 'difficulty');
  const views = num(item, 'views');
  const downloads = num(item, 'downloads');

  return (
    <div className="lp-card-foot">
      <div className="lp-card-meta">
      {typeLabel ? <span className="lp-card-dim">{typeLabel}</span> : null}
      {level ? <span className="lp-card-dim">{term('levels', level)}</span> : null}
      {difficulty ? <span className="lp-card-dim">{term('difficulty', difficulty)}</span> : null}
      {views > 0 ? (
        <span className="lp-card-dim">
          <Icon name="eye" size={13} />
          <span className="ltr-nums">{formatNumber(views)}</span>
        </span>
      ) : null}
      {!views && downloads > 0 ? (
        <span className="lp-card-dim">
          <Icon name="download" size={13} />
          <span className="ltr-nums">{formatNumber(downloads)}</span>
        </span>
      ) : null}
      </div>
      {go}
    </div>
  );
}

/* =====================================================================
   Ligne compacte — panneaux groupés
   ---------------------------------------------------------------------
   Vignette carrée à gauche, trois lignes à droite : la signature, le
   titre, un repère. C'est la carte réduite à ce qui permet de choisir
   entre trois contenus voisins — on en compare neuf d'un coup d'œil, là
   où neuf cartes à couverture rempliraient deux écrans.
   ===================================================================== */

/**
 * Repère de la troisième ligne.
 *
 * Un seul, choisi selon ce que la rubrique rend comparable : la nature
 * pour un document, le niveau pour une formation, la date pour une
 * session. Les empiler rendrait la ligne illisible à cette taille.
 */
function useMiniKind(item: HomeShelfItem): string {
  const { term } = useI18n();
  const type = str(item, 'type');
  if (type) return term(item.section === 'tools' ? 'toolTypes' : 'resourceTypes', type);
  const level = str(item, 'level');
  if (level) return term('levels', level);
  const startsAt = str(item, 'startsAt');
  if (startsAt) return formatDateShort(startsAt);
  const difficulty = str(item, 'difficulty');
  return difficulty ? term('difficulty', difficulty) : '';
}

export function MiniRow({ item }: { item: HomeShelfItem }) {
  const { href, loc } = useI18n();
  const title = loc(item as never, 'title') || str(item, 'title', 'name');
  const signature = useSignature(item);
  const kind = useMiniKind(item);
  const rating = num(item, 'rating');

  return (
    <Link className="lp-mini" to={href(pathOf(item))}>
      <span className="lp-mini-thumb">
        <CoverArt src={str(item, 'coverUrl', 'imageUrl')} section={item.section} />
      </span>
      <span className="lp-mini-body">
        <span className="lp-mini-sign">
          <span className="lp-mini-avatar" aria-hidden="true">
            {initialsOf(signature)}
          </span>
          <span className="lp-mini-sign-name">{signature}</span>
        </span>
        <span className="lp-mini-title">{title}</span>
        <span className="lp-mini-meta">
          {kind}
          {rating > 0 ? (
            <>
              {kind ? ' · ' : null}
              <Icon name="star" size={12} className="lp-mini-star" />
              <span className="ltr-nums">{rating.toFixed(1)}</span>
            </>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
