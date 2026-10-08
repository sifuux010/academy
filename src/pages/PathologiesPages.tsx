/* =====================================================================
   Pathologies — index et page pathologie (agrégateur transversal)
   ---------------------------------------------------------------------
   La page pathologie est le cœur clinique de la plateforme : synthèse,
   ressources scientifiques, outils d'évaluation, protocoles, exercices,
   formations et webinaires rattachés, réunis en un seul endroit.
   ===================================================================== */
import { Fragment, useEffect, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import {
  CourseCard,
  ExerciseCard,
  PathologyCard,
  ResourceCard,
  ToolCard,
  WebinarCard
} from '../components/cards/Cards';
import { BulletList } from '../components/content/Shared';
import { Icon } from '../components/icons/Icon';
import {
  Badge,
  Breadcrumb,
  EmptyState,
  FavoriteButton,
  MedicalNotice,
  NotFoundState,
  SectionHead,
  ShareButton,
  Tabs
} from '../components/ui';
import { useContentActions } from '../hooks/useContentActions';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { recordView } from '../lib/activity';
import { forPathology, getBySlug, titleOf, type PathologyLinks } from '../lib/content';
import type { Pathology } from '../model/content';
import { useStoreVersion } from '../state/store';
import { ListPage } from './ListPage';

export function PathologiesListPage() {
  const { t } = useI18n();
  return (
    <ListPage
      collection="pathologies"
      route="pathologies"
      preset="pathologies"
      title={t('pathologies.title')}
      subtitle={t('pathologies.subtitle')}
      placeholder={t('pathologies.searchPlaceholder')}
      renderCard={(pathology) => <PathologyCard pathology={pathology} />}
      eyebrow={t('common.listing.eyebrow.pathologies')}
      sorts={['az', 'newest']}
      defaultSort="az"
      perPage={12}
    />
  );
}

/* --------------------------------------------------------------- onglets */

function GridOf<T extends { id: string }>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) {
  if (!items.length) return <EmptyState />;
  return (
    <div className="grid grid-auto">
      {items.map((item) => (
        <Fragment key={item.id}>{render(item)}</Fragment>
      ))}
    </div>
  );
}

function OverviewTab({ pathology, linked }: { pathology: Pathology; linked: PathologyLinks }) {
  const { t } = useI18n();
  const { downloadPathologyKit } = useContentActions();
  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <div className="prose">
        <p className="lead">{pathology.summary}</p>
        <h2>{t('pathologies.epidemiology')}</h2>
        <p>{pathology.epidemiology}</p>
        <h2>{t('pathologies.presentation')}</h2>
        <BulletList items={pathology.presentation} />
        <h2>{t('pathologies.management')}</h2>
        <BulletList items={pathology.management} />
      </div>
      <div className="stack">
        <div className="card" style={{ background: 'var(--kinedok-danger-soft)', borderColor: 'transparent' }}>
          <strong style={{ color: 'var(--kinedok-danger)' }}>
            <Icon name="alert" size={16} /> {t('pathologies.redFlags')}
          </strong>
          <div className="text-sm mt-4" style={{ color: 'var(--kinedok-danger)' }}>
            <BulletList items={pathology.redFlags} />
          </div>
        </div>
        <div className="card">
          <strong>{t('pathologies.keyFacts')}</strong>
          <div className="text-sm mt-4">
            <BulletList items={pathology.keyFacts} />
          </div>
        </div>
        <div className="card">
          <strong>{t('pathologies.evidence')}</strong>
          <p className="text-sm text-muted mt-4 mb-0">{pathology.evidence}</p>
        </div>
        <div className="card">
          <strong>{t('tools.kitTitle')}</strong>
          <p className="text-sm text-muted mt-4">{t('tools.kitDesc')}</p>
          {linked.tools.length ? (
            <button
              type="button"
              className="btn btn-primary btn-sm btn-block"
              onClick={() => downloadPathologyKit(pathology, linked.tools)}
            >
              <Icon name="download" size={16} />
              {t('common.actions.download')}
            </button>
          ) : (
            <p className="text-sm text-muted mb-0">—</p>
          )}
        </div>
      </div>
    </div>
  );
}

const ASSESSMENT_TYPES = ['test', 'questionnaire', 'score', 'bilan'];

function AssessmentTab({ linked }: { linked: PathologyLinks }) {
  const { term } = useI18n();
  const sections = ASSESSMENT_TYPES.map((type) => ({
    type,
    items: linked.tools.filter((tool) => tool.type === type)
  })).filter((section) => section.items.length);
  if (!sections.length) return <EmptyState />;
  return (
    <>
      {sections.map((section) => (
        <section key={section.type} className="mt-6">
          <SectionHead title={term('toolTypesPlural', section.type)} />
          <div className="grid grid-auto">
            {section.items.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/* ----------------------------------------------------------------- fiche */

export function PathologyPage() {
  useStoreVersion();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { t, term, href } = useI18n();

  const pathology = getBySlug('pathologies', slug);

  useEffect(() => {
    if (pathology) recordView('pathologies', pathology.id);
  }, [pathology?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useSeo(
    pathology
      ? {
          title: titleOf(pathology),
          description: pathology.summary,
          path: `pathologies/${pathology.slug}`,
          type: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'MedicalCondition',
            name: titleOf(pathology),
            description: pathology.summary,
            alternateName: pathology.aliases ?? []
          }
        }
      : { title: t('common.states.notFoundTitle') }
  );

  if (!pathology) return <NotFoundState />;

  const linked = forPathology(pathology.slug);
  const activeTab = params.get('tab') || 'overview';

  const tabs = [
    { key: 'overview', label: t('pathologies.tabs.overview') },
    { key: 'resources', label: t('pathologies.tabs.resources'), count: linked.resources.length },
    { key: 'assessment', label: t('pathologies.tabs.assessment'), count: linked.tools.length },
    { key: 'protocols', label: t('pathologies.tabs.protocols'), count: linked.protocols.length },
    { key: 'exercises', label: t('pathologies.tabs.exercises'), count: linked.exercises.length },
    { key: 'courses', label: t('pathologies.tabs.courses'), count: linked.courses.length },
    { key: 'webinars', label: t('pathologies.tabs.webinars'), count: linked.webinars.length }
  ];

  const selectTab = (key: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (key === 'overview') next.delete('tab');
      else next.set('tab', key);
      return next;
    });

  let content: ReactNode;
  if (activeTab === 'resources') {
    content = <GridOf items={linked.resources} render={(item) => <ResourceCard resource={item} />} />;
  } else if (activeTab === 'assessment') {
    content = <AssessmentTab linked={linked} />;
  } else if (activeTab === 'protocols') {
    content = <GridOf items={linked.protocols} render={(item) => <ResourceCard resource={item} />} />;
  } else if (activeTab === 'exercises') {
    content = <GridOf items={linked.exercises} render={(item) => <ExerciseCard exercise={item} />} />;
  } else if (activeTab === 'courses') {
    content = <GridOf items={linked.courses} render={(item) => <CourseCard course={item} showProgress />} />;
  } else if (activeTab === 'webinars') {
    content = <GridOf items={linked.webinars} render={(item) => <WebinarCard webinar={item} />} />;
  } else {
    content = <OverviewTab pathology={pathology} linked={linked} />;
  }

  return (
    <div className="ka-container section">
      <Breadcrumb
        items={[
          { label: t('common.nav.home'), to: href('') },
          { label: t('pathologies.title'), to: href('pathologies') },
          { label: titleOf(pathology) }
        ]}
      />

      <header className="detail-head">
        <div className="row-wrap">
          <Badge variant="primary">{term('regions', pathology.region)}</Badge>
          <Badge>{term('specialties', pathology.specialty)}</Badge>
        </div>
        <h1 className="mt-4">{titleOf(pathology)}</h1>
        {pathology.aliases?.length ? <p className="text-sm text-muted">{pathology.aliases.join(' · ')}</p> : null}
        <div className="row-wrap mt-4">
          <FavoriteButton collection="pathologies" id={pathology.id} />
          <ShareButton path={`pathologies/${pathology.slug}`} />
          <Link className="btn btn-outline btn-sm" to={href('recherche', { q: pathology.name })}>
            <Icon name="search" size={16} />
            {t('common.actions.search')}
          </Link>
        </div>
      </header>

      <Tabs items={tabs} active={activeTab} onChange={selectTab} />
      <div>{content}</div>
      <div className="mt-8">
        <MedicalNotice />
      </div>
    </div>
  );
}
