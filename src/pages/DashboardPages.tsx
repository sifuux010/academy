/* =====================================================================
   Espace membre — tableau de bord et sous-pages
   ---------------------------------------------------------------------
   /dashboard                  vue d'ensemble et recommandations
   /dashboard/formations       mes formations et progression
   /dashboard/favoris          ma bibliothèque
   /dashboard/telechargements  mes téléchargements
   /dashboard/webinaires       mes inscriptions et replays
   /dashboard/certificats      mes certificats
   ===================================================================== */
import { Link } from 'react-router';
import { AnyCard, CourseCard, WebinarCard } from '../components/cards/Cards';
import { CoverArt } from '../components/home/CoverArt';
import { Accent } from '../components/home/Decor';
import { Icon, type IconName } from '../components/icons/Icon';
import { Bar, CardHead, Stat, WorkspaceShell } from '../components/layout/Shells';
import { EmptyState, PillNav, SectionHead } from '../components/ui';
import { useContentActions } from '../hooks/useContentActions';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useQueryParam } from '../hooks/useQueryParam';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import {
  certificates,
  downloads,
  favorites,
  myCourses,
  myWebinars,
  nextLesson,
  recommendations,
  summary,
  type CourseStatus
} from '../lib/activity';
import { courseStats, titleOf } from '../lib/content';
import { formatDate, formatDateShort, formatDuration, formatNumber } from '../lib/format';
import { routeOf } from '../lib/search';
import type { ContentCollection } from '../model/common';
import type { Tool } from '../model/content';
import { useStoreVersion } from '../state/store';

/* ------------------------------------------------------ vue d'ensemble */

export function DashboardPage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const user = useCurrentUser();
  useSeo({ title: t('dashboard.title'), path: 'dashboard' });
  if (!user) return null;

  const s = summary();
  const inProgress = myCourses().filter((entry) => entry.status === 'inProgress');
  const favoriteEntries = favorites().slice(0, 3);
  const webinarEntries = myWebinars().slice(0, 3);
  const recommended = recommendations(3);

  const reason = user.expertise.length
    ? user.expertise.join(', ')
    : user.interests.length
      ? user.interests.join(', ')
      : t(`taxonomies.roles.${user.role}`);

  return (
    <WorkspaceShell active="dashboard" title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
      <div className="ws-stack">
        <section className="ws-hello">
          <div className="ws-hello-body">
            <p className="ws-hello-greet">{t('dashboard.hello', { name: user.firstName })}</p>
            <p className="ws-hello-sub">{t('dashboard.bannerBody')}</p>
            <p className="ws-hello-motto">
              {t('dashboard.mottoLine1')}
              <b>{t('dashboard.mottoLine2')}</b>
            </p>
          </div>
          <div className="ws-hello-art" aria-hidden="true">
            <span className="ws-hello-script">
              <Accent>{t('dashboard.mottoScript')}</Accent>
            </span>
            <img src="/illustrations/dashboard.webp" alt="" />
          </div>
        </section>

        {/* Les quatre portes de la plateforme. Elles repondent a
            « et maintenant ? » -- la question qui suit l'etat des lieux. */}
        <section>
          <div className="ws-sec-head">
            <div className="ws-sec-head-text">
              <h2>{t('dashboard.quickTitle')}</h2>
              <p>{t('dashboard.quickSub')}</p>
            </div>
            <Link to={href('recherche')}>{t('common.actions.viewAll')}</Link>
          </div>
          <div className="ws-quick">
            <QuickTile icon="library" tone="violet" to={href('bibliotheque')} title={t('common.nav.library')} desc={t('dashboard.quick.library')} />
            <QuickTile icon="graduation" tone="green" to={href('formations')} title={t('common.nav.courses')} desc={t('dashboard.quick.courses')} />
            <QuickTile icon="radio" tone="teal" to={href('webinaires')} title={t('common.nav.webinars')} desc={t('dashboard.quick.webinars')} />
            <QuickTile icon="tools" tone="blue" to={href('outils')} title={t('common.nav.tools')} desc={t('dashboard.quick.tools')} />
          </div>
        </section>

        <section className="ws-stats">
          <Stat
            label={t('dashboard.stats.coursesCompleted')}
            value={formatNumber(s.coursesCompleted)}
            icon="book"
            tone="green"
            to={href('dashboard/formations')}
          />
          <Stat
            label={t('dashboard.stats.learningHours')}
            value={formatDuration(s.learningMinutes)}
            icon="clock"
            tone="blue"
            to={href('dashboard/formations')}
          />
          <Stat
            label={t('dashboard.stats.certificates')}
            value={formatNumber(s.certificates)}
            icon="certificate"
            tone="violet"
            to={href('dashboard/certificats')}
          />
          <Stat
            label={t('dashboard.stats.resourcesViewed')}
            value={formatNumber(s.resourcesViewed)}
            icon="eye"
            tone="amber"
            to={href('dashboard/favoris')}
          />
        </section>

        {/* La reprise passe avant tout le reste : c'est la raison pour
            laquelle un membre connecté ouvre cette page. */}
        <section className="ws-card">
          <CardHead
            icon="play"
            title={t('dashboard.continueLearning')}
            desc={t('dashboard.continueHint')}
            actions={
              inProgress.length ? (
                <Link className="ws-btn ws-btn-quiet ws-btn-sm" to={href('dashboard/formations')}>
                  {t('common.actions.viewAll')}
                </Link>
              ) : null
            }
          />

          {inProgress.length ? (
            inProgress.slice(0, 3).map((entry) => {
              const next = nextLesson(entry.course);
              return (
                <div key={entry.course.id} className="ws-course">
                  <Link className="ws-course-media" to={href(`formations/${entry.course.slug}`)} tabIndex={-1} aria-hidden="true">
                    <CoverArt section="courses" />
                    <span className="ws-course-play">
                      <Icon name="play" size={16} />
                    </span>
                  </Link>

                  <div className="ws-course-body">
                    <span className="ws-course-flag">{t('showcase.inProgressTag')}</span>
                    <h3 className="ws-course-title">
                      <Link to={href(`formations/${entry.course.slug}`)}>{titleOf(entry.course)}</Link>
                    </h3>
                    <Bar percent={entry.progress.percent} />
                    <div className="ws-course-meta">
                      <span>
                        <Icon name="layers" size={14} />
                        {t('courses.lessonsCompleted', { done: entry.progress.done, total: entry.progress.total })}
                      </span>
                      {next ? (
                        <span>
                          <Icon name="clock" size={14} />
                          {formatDuration(next.duration)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {next ? (
                    <Link
                      className="ws-btn ws-btn-primary"
                      to={href(`formations/${entry.course.slug}/lecon/${next.id}`)}
                    >
                      <Icon name="play" size={15} />
                      {t('common.actions.continueCourse')}
                    </Link>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="ws-empty">
              <span className="ws-tile">
                <Icon name="graduation" size={18} />
              </span>
              <p>{t('dashboard.empty.courses')}</p>
              <Link className="ws-btn ws-btn-primary ws-btn-sm" to={href('formations')}>
                {t('dashboard.empty.coursesCta')}
              </Link>
            </div>
          )}
        </section>

        {recommended.length ? (
          <section>
            <div className="ws-sec-head">
              <div className="ws-sec-head-text">
                <h2>
                  <span className="ws-sec-star" aria-hidden="true">
                    <Icon name="sparkles" size={18} />
                  </span>
                  {t('dashboard.recommended')}
                </h2>
                <p>{t('dashboard.recommendedWhy', { reason })}</p>
              </div>
            </div>
            <div className="ll-grid">
              {recommended.map((entry) => (
                <AnyCard key={entry.item.id} collection={entry.collection} item={entry.item} showProgress />
              ))}
            </div>
          </section>
        ) : null}

        {favoriteEntries.length ? (
          <section>
            <div className="ws-sec-head">
              <h2>{t('dashboard.myLibrary')}</h2>
              <Link to={href('dashboard/favoris')}>{t('common.actions.viewAll')}</Link>
            </div>
            <div className="ll-grid">
              {favoriteEntries.map((entry) => (
                <AnyCard key={`${entry.collection}-${entry.item.id}`} collection={entry.collection} item={entry.item} />
              ))}
            </div>
          </section>
        ) : null}

        {webinarEntries.length ? (
          <section>
            <div className="ws-sec-head">
              <h2>{t('dashboard.myWebinars')}</h2>
              <Link to={href('dashboard/webinaires')}>{t('common.actions.viewAll')}</Link>
            </div>
            <div className="ll-grid">
              {webinarEntries.map((entry) => (
                <WebinarCard key={entry.webinar.id} webinar={entry.webinar} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </WorkspaceShell>
  );
}

/** Tuile d'action rapide : rond d'icone, nom de la rubrique, ce qu'on y trouve. */
function QuickTile({
  icon,
  tone,
  to,
  title,
  desc
}: {
  icon: IconName;
  /** Teinte de la pastille — repère de position, jamais porteur de sens. */
  tone: 'violet' | 'green' | 'teal' | 'blue';
  to: string;
  title: string;
  desc: string;
}) {
  return (
    <Link className={`ws-quick-tile ws-quick-${tone}`} to={to}>
      <span className="ws-quick-icon">
        <Icon name={icon} size={24} />
      </span>
      <span className="ws-quick-text">
        <span className="ws-quick-title">{title}</span>
        <span className="ws-quick-desc">{desc}</span>
      </span>
      <span className="ws-quick-go" aria-hidden="true">
        <Icon name="chevronRight" size={20} className="icon-flip" />
      </span>
    </Link>
  );
}

/* ------------------------------------------------------ mes formations */

const COURSE_FILTERS: ('all' | CourseStatus)[] = ['all', 'inProgress', 'completed'];

export function DashboardCoursesPage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const [statut, setStatut] = useQueryParam('statut');
  const filter = statut || 'all';
  const entries = myCourses();
  const filtered = filter === 'all' ? entries : entries.filter((entry) => entry.status === filter);

  useSeo({ title: t('dashboard.myCourses'), path: 'dashboard/formations' });

  return (
    <WorkspaceShell active="dashboard/formations" title={t('dashboard.myCourses')}>
      <PillNav
        items={COURSE_FILTERS.map((key) => ({ key, label: t(`dashboard.filters.${key}`) }))}
        active={filter}
        onChange={(key) => setStatut(key === 'all' ? null : key)}
      />
      {filtered.length ? (
        <div className="grid grid-auto">
          {filtered.map((entry) => (
            <CourseCard key={entry.course.id} course={entry.course} showProgress />
          ))}
        </div>
      ) : (
        <EmptyState body={t('dashboard.empty.courses')} ctaTo={href('formations')} ctaLabel={t('dashboard.empty.coursesCta')} />
      )}
    </WorkspaceShell>
  );
}

/* --------------------------------------------------------- mes favoris */

export function DashboardFavoritesPage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const [type, setType] = useQueryParam('type');
  const entries = favorites();
  const filtered = type ? entries.filter((entry) => entry.collection === type) : entries;

  const counts: Record<string, number> = {};
  entries.forEach((entry) => {
    counts[entry.collection] = (counts[entry.collection] ?? 0) + 1;
  });

  useSeo({ title: t('dashboard.myLibrary'), path: 'dashboard/favoris' });

  return (
    <WorkspaceShell active="dashboard/favoris" title={t('dashboard.myLibrary')}>
      {entries.length ? (
        <PillNav
          items={[
            { key: '', label: t('dashboard.filters.all'), count: entries.length },
            ...Object.keys(counts).map((collection) => ({
              key: collection,
              label: t(`search.groups.${collection === 'resources' ? 'library' : collection}`) || collection,
              count: counts[collection]
            }))
          ]}
          active={type}
          onChange={(key) => setType(key || null)}
        />
      ) : null}
      {filtered.length ? (
        <div className="grid grid-auto">
          {filtered.map((entry) => (
            <AnyCard key={`${entry.collection}-${entry.item.id}`} collection={entry.collection} item={entry.item} showProgress />
          ))}
        </div>
      ) : (
        <EmptyState
          body={t('dashboard.empty.favorites')}
          ctaTo={href('bibliotheque')}
          ctaLabel={t('dashboard.empty.favoritesCta')}
        />
      )}
    </WorkspaceShell>
  );
}

/* -------------------------------------------------- mes téléchargements */

export function DashboardDownloadsPage() {
  useStoreVersion();
  const { t, term, href } = useI18n();
  const { downloadTool } = useContentActions();
  const entries = downloads();

  useSeo({ title: t('dashboard.myDownloads'), path: 'dashboard/telechargements' });

  return (
    <WorkspaceShell active="dashboard/telechargements" title={t('dashboard.myDownloads')}>
      {entries.length ? (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('common.labels.description')}</th>
                <th>{t('common.labels.type')}</th>
                <th>{t('common.labels.date')}</th>
                <th>{t('admin.users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const route = routeOf(entry.collection as ContentCollection);
                const itemType = (entry.item as { type?: string }).type;
                const typeLabel = itemType
                  ? term(entry.collection === 'tools' ? 'toolTypes' : 'resourceTypes', itemType)
                  : t(`search.groups.${entry.collection === 'resources' ? 'library' : entry.collection}`);
                const to = href(`${route}/${entry.item.slug}`);
                return (
                  <tr key={`${entry.collection}-${entry.item.id}`}>
                    <td>
                      <Link to={to}>{titleOf(entry.item)}</Link>
                    </td>
                    <td>{typeLabel}</td>
                    <td className="num">{formatDateShort(entry.at)}</td>
                    <td>
                      {entry.collection === 'tools' ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => downloadTool(entry.item as Tool)}
                        >
                          <Icon name="download" size={14} />
                          {t('common.actions.download')}
                        </button>
                      ) : (
                        <Link className="btn btn-outline btn-sm" to={to}>
                          {t('common.actions.details')}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState body={t('dashboard.empty.downloads')} ctaTo={href('outils')} ctaLabel={t('dashboard.empty.downloadsCta')} />
      )}
    </WorkspaceShell>
  );
}

/* ------------------------------------------------------- mes webinaires */

export function DashboardWebinarsPage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const entries = myWebinars();
  const upcoming = entries.filter((entry) => entry.status === 'upcoming' || entry.status === 'live');
  const past = entries.filter((entry) => entry.status === 'replay' || entry.status === 'past');

  useSeo({ title: t('dashboard.myWebinars'), path: 'dashboard/webinaires' });

  return (
    <WorkspaceShell active="dashboard/webinaires" title={t('dashboard.myWebinars')}>
      {entries.length ? (
        <>
          {upcoming.length ? (
            <section>
              <SectionHead title={t('webinars.tabs.upcoming')} />
              <div className="grid grid-auto">
                {upcoming.map((entry) => (
                  <WebinarCard key={entry.webinar.id} webinar={entry.webinar} />
                ))}
              </div>
            </section>
          ) : null}
          {past.length ? (
            <section className="mt-8">
              <SectionHead title={t('webinars.tabs.replay')} />
              <div className="grid grid-auto">
                {past.map((entry) => (
                  <WebinarCard key={entry.webinar.id} webinar={entry.webinar} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState body={t('dashboard.empty.webinars')} ctaTo={href('webinaires')} ctaLabel={t('dashboard.empty.webinarsCta')} />
      )}
    </WorkspaceShell>
  );
}

/* ------------------------------------------------------ mes certificats */

export function DashboardCertificatesPage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const { downloadCertificate } = useContentActions();
  const entries = certificates();

  useSeo({ title: t('dashboard.nav.certificates'), path: 'dashboard/certificats' });

  return (
    <WorkspaceShell active="dashboard/certificats" title={t('dashboard.nav.certificates')}>
      {entries.length ? (
        <div className="grid grid-2">
          {entries.map((entry) => (
            <article key={entry.certificate.ref} className="card">
              <span className="feature-icon">
                <Icon name="certificate" size={24} />
              </span>
              <h3 className="card-title mt-4">{titleOf(entry.course)}</h3>
              <p className="text-sm text-muted">
                {t('dashboard.certificate.issued', { date: formatDate(entry.certificate.at) })}
              </p>
              <p className="text-xs text-muted">{t('dashboard.certificate.reference', { ref: entry.certificate.ref })}</p>
              <div className="card-foot">
                <span className="text-xs text-muted ltr-nums">{formatDuration(courseStats(entry.course).minutes)}</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => downloadCertificate(entry.course.id)}
                >
                  <Icon name="download" size={14} />
                  {t('dashboard.certificate.download')}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          body={t('dashboard.empty.certificates')}
          ctaTo={href('dashboard/formations')}
          ctaLabel={t('dashboard.empty.certificatesCta')}
        />
      )}
    </WorkspaceShell>
  );
}
