/* =====================================================================
   Bibliothèque d'exercices — liste filtrable et fiche exercice
   ===================================================================== */
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { ExerciseCard } from '../components/cards/Cards';
import { BulletList, OrderedList, PathologyTagsCard } from '../components/content/Shared';
import { Icon } from '../components/icons/Icon';
import {
  Badge,
  Breadcrumb,
  FavoriteButton,
  MedicalNotice,
  MetaRow,
  NotFoundState,
  SectionHead,
  ShareButton,
  Tag
} from '../components/ui';
import { useContentActions } from '../hooks/useContentActions';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import { recordView } from '../lib/activity';
import { getBySlug, related, titleOf } from '../lib/content';
import { useStoreVersion } from '../state/store';
import { ListPage } from './ListPage';

export function ExercisesListPage() {
  const { t } = useI18n();
  return (
    <ListPage
      collection="exercises"
      route="exercices"
      preset="exercises"
      title={t('exercises.title')}
      subtitle={t('exercises.subtitle')}
      placeholder={t('exercises.searchPlaceholder')}
      renderCard={(exercise) => <ExerciseCard exercise={exercise} />}
      eyebrow={t('common.listing.eyebrow.exercises')}
      sorts={['az', 'newest']}
      defaultSort="az"
      perPage={12}
    />
  );
}

export function ExercisePage() {
  useStoreVersion();
  const { slug } = useParams();
  const { t, term, href } = useI18n();
  const { printExercise } = useContentActions();

  const exercise = getBySlug('exercises', slug);

  useEffect(() => {
    if (exercise) recordView('exercises', exercise.id);
  }, [exercise?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useSeo(
    exercise
      ? { title: titleOf(exercise), description: exercise.goal, path: `exercices/${exercise.slug}`, type: 'article' }
      : { title: t('common.states.notFoundTitle') }
  );

  if (!exercise) return <NotFoundState />;

  const relatedExercises = related('exercises', exercise, 4);

  return (
    <div className="ka-container section">
      <Breadcrumb
        items={[
          { label: t('common.nav.home'), to: href('') },
          { label: t('exercises.title'), to: href('exercices') },
          { label: titleOf(exercise) }
        ]}
      />

      <div className="layout-detail">
        <article>
          <header className="detail-head">
            <div className="row-wrap">
              <Badge variant="primary">{term('objectives', exercise.objective)}</Badge>
              <Badge>{term('regions', exercise.region)}</Badge>
              <Badge>{term('difficulty', exercise.difficulty)}</Badge>
            </div>
            <h1 className="mt-4">{titleOf(exercise)}</h1>
            <p className="lead">{exercise.goal}</p>
          </header>

          <div className="player" style={{ background: 'var(--kinedok-surface-sunken)', color: 'var(--kinedok-muted)' }}>
            <Icon name="dumbbell" size={40} />
            <strong style={{ color: 'var(--kinedok-text)' }}>{titleOf(exercise)}</strong>
            <span className="text-xs" style={{ maxWidth: '52ch' }}>
              {t('exercises.videoNotice')}
            </span>
          </div>

          <div className="prose mt-8">
            <h2>{t('exercises.howTo')}</h2>
            <OrderedList items={exercise.steps} />
            <h2>{t('exercises.progression')}</h2>
            <p>{exercise.progression}</p>
            <h2>{t('exercises.regression')}</h2>
            <p>{exercise.regression}</p>
            <h2>{t('exercises.precautions')}</h2>
            <BulletList items={exercise.precautions} />
          </div>

          {exercise.tags?.length ? (
            <div className="mt-6">
              <div className="row-wrap">
                {exercise.tags.map((tag) => (
                  <Tag key={tag} label={tag} to={href('recherche', { q: tag })} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <MedicalNotice />
          </div>

          {relatedExercises.length ? (
            <section className="mt-8">
              <SectionHead title={t('common.labels.relatedContent')} />
              <div className="grid grid-2">
                {relatedExercises.map((item) => (
                  <ExerciseCard key={item.id} exercise={item} />
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="sticky-side stack">
          <div className="card">
            <div className="row-wrap justify-between">
              <strong>{t('exercises.dosage')}</strong>
              <div className="row-wrap">
                <FavoriteButton collection="exercises" id={exercise.id} />
                <ShareButton path={`exercices/${exercise.slug}`} />
              </div>
            </div>
            <div className="meta-list mt-4">
              <MetaRow label={t('exercises.sets')}>{exercise.dosage.sets}</MetaRow>
              <MetaRow label={t('exercises.reps')}>{exercise.dosage.reps}</MetaRow>
              <MetaRow label={t('exercises.hold')}>{exercise.dosage.hold}</MetaRow>
              <MetaRow label={t('exercises.frequency')}>{exercise.dosage.frequency}</MetaRow>
            </div>
            <div className="meta-list mt-6">
              <MetaRow label={t('exercises.targetMuscles')}>{exercise.targetMuscles.join(', ')}</MetaRow>
              <MetaRow label={t('common.labels.equipment')}>{exercise.equipment.join(', ') || '—'}</MetaRow>
              <MetaRow label={t('common.labels.level')}>{term('difficulty', exercise.difficulty)}</MetaRow>
            </div>
            <button type="button" className="btn btn-primary btn-block mt-6" onClick={() => printExercise(exercise)}>
              <Icon name="print" size={18} />
              {t('tools.printable')}
            </button>
          </div>

          <PathologyTagsCard slugs={exercise.pathologies} heading={t('common.labels.pathology')} />
        </aside>
      </div>
    </div>
  );
}
