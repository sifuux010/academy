/* =====================================================================
   Webinaires — liste (à venir / en direct / replays) et fiche session
   ===================================================================== */
import { useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { WebinarCard } from '../components/cards/Cards';
import { AuthorCard, PathologyTagsCard } from '../components/content/Shared';
import { QueryPills } from '../components/filters/QueryPills';
import { useToast } from '../components/feedback/ToastProvider';
import { Icon } from '../components/icons/Icon';
import {
  AccessBadge,
  Alert,
  Badge,
  Breadcrumb,
  FavoriteButton,
  MedicalNotice,
  MetaRow,
  NotFoundState,
  SectionHead,
  ShareButton
} from '../components/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { isRegistered, needsAuth, recordView, toggleWebinarRegistration } from '../lib/activity';
import { authorName, getBySlug, published, related, titleOf, webinarStatus } from '../lib/content';
import { formatDate, formatDuration, formatNumber, formatRelative, formatTime } from '../lib/format';
import { safeExternalUrl } from '../lib/html';
import { webinarJsonLd } from '../lib/seo';
import type { WebinarStatus } from '../model/content';
import { useStoreVersion } from '../state/store';
import { ListPage } from './ListPage';

const STATUSES: WebinarStatus[] = ['upcoming', 'live', 'replay', 'past'];

export function WebinarsListPage() {
  const { t, href } = useI18n();
  const webinars = published('webinars');
  const pills = (
    <QueryPills
      param="status"
      allLabel={t('dashboard.filters.all')}
      options={STATUSES.map((status) => ({
        value: status,
        label: t(`webinars.tabs.${status}`),
        count: webinars.filter((w) => webinarStatus(w) === status).length
      }))}
    />
  );
  return (
    <ListPage
      collection="webinars"
      route="webinaires"
      preset="webinars"
      title={t('webinars.title')}
      subtitle={t('webinars.subtitle')}
      placeholder={t('search.placeholder')}
      renderCard={(webinar) => <WebinarCard webinar={webinar} />}
      sorts={['newest', 'popular', 'az']}
      perPage={9}
      illustration="/illustrations/webinars.webp"
      heroArtOnly
      intro={pills}
      help={{
        title: t('webinars.helpTitle'),
        text: t('webinars.helpText'),
        to: `${href('webinaires')}?status=replay`,
        label: t('webinars.helpCta')
      }}
    />
  );
}

export function WebinarPage() {
  useStoreVersion();
  const { slug } = useParams();
  const { t, term, href } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();

  const found = getBySlug('webinars', slug);
  const webinar = found && found.published !== false ? found : null;

  useEffect(() => {
    if (webinar) recordView('webinars', webinar.id);
  }, [webinar?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useSeo(
    webinar
      ? {
          title: titleOf(webinar),
          description: webinar.description,
          path: `webinaires/${webinar.slug}`,
          type: 'article',
          jsonLd: webinarJsonLd(webinar)
        }
      : { title: t('common.states.notFoundTitle') }
  );

  if (!webinar) return <NotFoundState />;

  const status = webinarStatus(webinar);
  const registered = !!user && isRegistered(webinar.id);
  const relatedWebinars = related('webinars', webinar, 3);

  const onRegister = () => {
    const result = toggleWebinarRegistration(webinar.id);
    if (needsAuth(result)) {
      toast(t('webinars.loginToRegister'), 'error');
      navigate(href('connexion'));
      return;
    }
    toast(t(result.registered ? 'common.toast.webinarRegistered' : 'common.toast.webinarUnregistered'), 'success');
  };

  let primaryAction: ReactNode;
  if (status === 'live') {
    primaryAction = (
      <a
        className="btn btn-primary btn-block btn-lg"
        href={safeExternalUrl(webinar.liveUrl) || '#'}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="radio" size={18} />
        {t('webinars.joinLive')}
      </a>
    );
  } else if (status === 'replay') {
    primaryAction = (
      <a
        className="btn btn-primary btn-block btn-lg"
        href={safeExternalUrl(webinar.replayUrl) || '#'}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="playCircle" size={18} />
        {t('webinars.watchReplay')}
      </a>
    );
  } else if (status === 'past') {
    primaryAction = <Alert variant="info">{t('webinars.replaySoon')}</Alert>;
  } else {
    primaryAction = (
      <>
        <button
          type="button"
          className={`btn ${registered ? 'btn-outline' : 'btn-primary'} btn-block btn-lg`}
          onClick={onRegister}
        >
          <Icon name={registered ? 'close' : 'calendar'} size={18} />
          {registered ? t('webinars.unregister') : t('webinars.register')}
        </button>
        {user ? null : <p className="hint mt-4">{t('webinars.loginToRegister')}</p>}
      </>
    );
  }

  return (
    <div className="ka-container section">
      <Breadcrumb
        items={[
          { label: t('common.nav.home'), to: href('') },
          { label: t('webinars.title'), to: href('webinaires') },
          { label: titleOf(webinar) }
        ]}
      />

      <div className="layout-detail">
        <article>
          <header className="detail-head">
            <div className="row-wrap">
              {status === 'live' ? (
                <span className="badge badge-live">{t('webinars.liveNow')}</span>
              ) : (
                <Badge variant={status === 'upcoming' ? 'primary' : undefined}>{term('webinarStatus', status)}</Badge>
              )}
              <Badge>{term('specialties', webinar.specialty)}</Badge>
              <AccessBadge access={webinar.access} />
            </div>
            <h1 className="mt-4">{titleOf(webinar)}</h1>
            <p className="lead">{webinar.subtitle}</p>
          </header>

          <div className="prose">
            <p>{webinar.description}</p>
            <h2>{t('webinars.agenda')}</h2>
            <ul>
              {webinar.agenda.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <AuthorCard authorId={webinar.speakerId} heading={t('webinars.speaker')} />

          <div className="mt-8">
            <MedicalNotice />
          </div>

          {relatedWebinars.length ? (
            <section className="mt-8">
              <SectionHead title={t('common.labels.relatedContent')} />
              <div className="grid grid-2">
                {relatedWebinars.map((item) => (
                  <WebinarCard key={item.id} webinar={item} />
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="sticky-side stack">
          <div className="card">
            <div className="meta-list">
              <MetaRow label={t('common.labels.date')}>
                <time dateTime={webinar.startsAt}>{formatDate(webinar.startsAt)}</time>
              </MetaRow>
              <MetaRow label={t('common.labels.time')}>
                <span className="ltr-nums">{formatTime(webinar.startsAt)}</span>
              </MetaRow>
              <MetaRow label={t('common.labels.duration')}>
                <span className="ltr-nums">{formatDuration(webinar.durationMinutes)}</span>
              </MetaRow>
              <MetaRow label={t('webinars.attendees')}>
                <span className="ltr-nums">{formatNumber(webinar.registeredCount)}</span>
              </MetaRow>
              <MetaRow label={t('common.labels.speaker')}>{authorName(webinar.speakerId)}</MetaRow>
            </div>
            <p className="text-sm text-muted mt-4">{formatRelative(webinar.startsAt)}</p>
            <div className="mt-4">{primaryAction}</div>
            {registered ? (
              <div className="mt-4">
                <Alert variant="success">{t('webinars.registered')}</Alert>
              </div>
            ) : null}
            <p className="hint mt-4">{t('webinars.reminderNote')}</p>
            {webinar.certificate ? <p className="hint">{t('webinars.certificateAttendance')}</p> : null}
            <div className="row-wrap mt-4">
              <FavoriteButton collection="webinars" id={webinar.id} />
              <ShareButton path={`webinaires/${webinar.slug}`} />
            </div>
          </div>

          <PathologyTagsCard slugs={webinar.pathologies} heading={t('common.labels.pathology')} />
        </aside>
      </div>
    </div>
  );
}
