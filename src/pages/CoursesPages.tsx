/* =====================================================================
   Formations — catalogue, fiche formation, lecteur de leçon, quiz
   ---------------------------------------------------------------------
   Progression réelle : chaque leçon validée est enregistrée pour le
   membre ; barre de progression et certificat en découlent. Les quiz
   sont corrigés côté client dans cette démonstration (en production :
   correction serveur pour ne pas exposer les réponses).
   ===================================================================== */
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CourseCard } from '../components/cards/Cards';
import { AuthorCard, PathologyTagsCard } from '../components/content/Shared';
import { useModal } from '../components/feedback/ModalProvider';
import { useToast } from '../components/feedback/ToastProvider';
import { Icon, type IconName } from '../components/icons/Icon';
import {
  AccessBadge,
  Accordion,
  Alert,
  Badge,
  Breadcrumb,
  FavoriteButton,
  LevelBadge,
  MedicalNotice,
  MetaRow,
  NotFoundState,
  ProgressBar,
  SectionHead,
  ShareButton
} from '../components/ui';
import { useContentActions } from '../hooks/useContentActions';
import { DetailHero, initialsOf } from '../components/content/DetailHero';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import {
  certificateFor,
  courseProgress,
  enroll,
  isEnrolled,
  isLessonDone,
  myCourses,
  needsAuth,
  nextLesson,
  quizScore,
  recordView,
  saveQuizScore,
  setLessonDone,
  toggleLesson
} from '../lib/activity';
import { authorName, courseStats, findLesson, getBySlug, lessonsOf, titleOf } from '../lib/content';
import { formatDateShort, formatDuration, formatNumber, formatPercent } from '../lib/format';
import { courseJsonLd } from '../lib/seo';
import type { Course, Lesson, LessonType } from '../model/content';
import { useStoreVersion } from '../state/store';
import { ListPage } from './ListPage';

const LESSON_ICONS: Record<LessonType, IconName> = { video: 'playCircle', pdf: 'filePdf', text: 'book', quiz: 'quiz' };

const lessonPath = (course: Course, lessonId: string) => `formations/${course.slug}/lecon/${lessonId}`;

/* ---------------------------------------------------------------- liste */

export function CoursesListPage() {
  useStoreVersion();
  const { t, href } = useI18n();
  const user = useCurrentUser();
  const mine = user ? myCourses() : [];

  const intro = mine.length ? (
    <section className="mt-4">
      <SectionHead title={t('courses.myCourses')} ctaTo={href('dashboard/formations')} ctaLabel={t('common.actions.viewAll')} />
      <div className="ll-grid">
        {mine.slice(0, 3).map((entry) => (
          <CourseCard key={entry.course.id} course={entry.course} showProgress />
        ))}
      </div>
    </section>
  ) : null;

  return (
    <ListPage
      collection="courses"
      route="formations"
      preset="courses"
      title={t('courses.title')}
      subtitle={t('courses.subtitle')}
      placeholder={t('courses.searchPlaceholder')}
      renderCard={(course) => <CourseCard course={course} showProgress />}
      sorts={['popular', 'newest', 'az']}
      defaultSort="popular"
      perPage={9}
      eyebrow={t('common.listing.eyebrow.courses')}
      intro={intro}
    />
  );
}

/* ---------------------------------------------------- fiche formation */

function Curriculum({ course }: { course: Course }) {
  const { tn, term, href } = useI18n();
  const enrolled = isEnrolled(course.id);
  return (
    <Accordion
      items={course.modules.map((mod, moduleIndex) => ({
        title: `${moduleIndex + 1}. ${mod.title} — ${tn(mod.lessons.length, 'common.units.lessons')}`,
        open: moduleIndex === 0,
        body: mod.lessons.map((lesson, lessonIndex) => {
          const done = isLessonDone(course.id, lesson.id);
          const accessible = enrolled || (moduleIndex === 0 && lessonIndex === 0);
          return (
            <Link
              key={lesson.id}
              className={done ? 'lesson-row is-done' : 'lesson-row'}
              to={href(lessonPath(course, lesson.id))}
            >
              <span className="lr-index">{done ? <Icon name="check" size={14} /> : lessonIndex + 1}</span>
              <span className="grow">
                <strong>{lesson.title}</strong>
                <span className="si-meta">
                  {' '}
                  {term('lessonTypes', lesson.type)} · {formatDuration(lesson.duration)}
                </span>
              </span>
              <Icon name={accessible ? (LESSON_ICONS[lesson.type] ?? 'file') : 'lock'} size={16} />
            </Link>
          );
        })
      }))}
    />
  );
}

export function CoursePage() {
  useStoreVersion();
  const { slug } = useParams();
  const { t, tn, term, href } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const { downloadCertificate } = useContentActions();

  const found = getBySlug('courses', slug);
  const course = found && found.published !== false ? found : null;

  useEffect(() => {
    if (course) recordView('courses', course.id);
  }, [course?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useSeo(
    course
      ? {
          title: titleOf(course),
          description: course.description,
          path: `formations/${course.slug}`,
          jsonLd: courseJsonLd(course)
        }
      : { title: t('common.states.notFoundTitle') }
  );

  if (!course) return <NotFoundState />;

  const stats = courseStats(course);
  const instructor = authorName(course.instructorId);
  const enrolled = !!user && isEnrolled(course.id);
  const progress = user ? courseProgress(course) : { done: 0, total: stats.lessons, percent: 0 };
  const certificate = user ? certificateFor(course.id) : null;
  const next = user ? nextLesson(course) : null;

  const onEnroll = () => {
    const result = enroll(course.id);
    if (needsAuth(result)) {
      toast(t('courses.loginToEnroll'), 'error');
      navigate(href('connexion'));
      return;
    }
    toast(t('common.toast.enrolled'), 'success');
  };

  return (
    <div className="ka-container section">
      <Breadcrumb
        items={[
          { label: t('common.nav.home'), to: href('') },
          { label: t('courses.title'), to: href('formations') },
          { label: titleOf(course) }
        ]}
      />

      <div className="layout-detail">
        <article>
          <DetailHero
            eyebrow={term('specialties', course.specialty)}
            title={titleOf(course)}
            subtitle={course.subtitle}
            people={instructor ? [{ name: instructor, initials: initialsOf(instructor) }] : []}
            peopleLabel={t('courses.instructor')}
            badges={
              <>
                <LevelBadge level={course.level} />
                <AccessBadge access={course.access} />
                {course.certificate ? (
                  <Badge variant="success">{t('common.labels.certificate')}</Badge>
                ) : null}
              </>
            }
            action={
              enrolled ? (
                next ? (
                  <Link className="btn btn-primary btn-lg" to={href(`formations/${course.slug}/${next.id}`)}>
                    <Icon name="play" size={18} />
                    {t('courses.continue')}
                  </Link>
                ) : null
              ) : (
                <button type="button" className="btn btn-primary btn-lg" onClick={onEnroll}>
                  <Icon name="graduation" size={18} />
                  {t('courses.enroll')}
                </button>
              )
            }
            actionNote={
              <span className="ltr-nums">
                {tn(course.enrolledCount, 'common.units.participants')}
              </span>
            }
            facts={[
              {
                value: String(stats.modules),
                label: t('courses.curriculum'),
                hint: tn(stats.lessons, 'common.units.lessons')
              },
              {
                value: course.rating ? course.rating.toFixed(1) : '—',
                label: t('common.labels.rating'),
                hint: course.ratingCount
                  ? t('showcase.meta.reviews', { count: formatNumber(course.ratingCount) })
                  : undefined,
                icon: 'star'
              },
              { value: term('levels', course.level), label: t('common.labels.level') },
              { value: formatDuration(stats.minutes), label: t('common.labels.duration') }
            ]}
          />

          <div className="prose">
            <p>{course.description}</p>
            <h2>{t('courses.objectives')}</h2>
            <ul>
              {course.objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
            <h2>{t('courses.audience')}</h2>
            <p>{course.audience}</p>
            {course.prerequisites?.length ? (
              <>
                <h2>{t('courses.prerequisites')}</h2>
                <ul>
                  {course.prerequisites.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <section className="mt-8">
            <SectionHead title={t('courses.curriculum')} />
            <Curriculum course={course} />
          </section>

          <AuthorCard authorId={course.instructorId} heading={t('courses.instructor')} />

          <div className="mt-8">
            <MedicalNotice />
          </div>
        </article>

        <aside className="sticky-side stack">
          <div className="card">
            <div className="card-thumb" style={{ marginBlockEnd: 'var(--space-4)' }}>
              <span className="thumb-icon">
                <Icon name="graduation" size={40} />
              </span>
              <span className="thumb-duration ltr-nums">{formatDuration(stats.minutes)}</span>
            </div>

            {enrolled ? (
              <>
                <p className="text-sm fw-semibold">
                  {t('courses.progressLabel', { percent: formatPercent(progress.percent) })}
                </p>
                <ProgressBar percent={progress.percent} large />
                <p className="text-xs text-muted mt-4">
                  {t('courses.lessonsCompleted', { done: progress.done, total: progress.total })}
                </p>
                {next ? (
                  <Link className="btn btn-primary btn-block mt-4" to={href(lessonPath(course, next.id))}>
                    <Icon name="play" size={16} />
                    {progress.done ? t('common.actions.continueCourse') : t('common.actions.startCourse')}
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <button type="button" className="btn btn-primary btn-block btn-lg" onClick={onEnroll}>
                  <Icon name="checkCircle" size={18} />
                  {t('courses.enrollNow')}
                </button>
                {user ? null : <p className="hint mt-4">{t('courses.loginToEnroll')}</p>}
              </>
            )}

            {certificate ? (
              <div className="mt-4">
                <Alert variant="success" title={t('courses.certificateReady')}>
                  {t('dashboard.certificate.issued', { date: formatDateShort(certificate.at) })}
                </Alert>
                <button
                  type="button"
                  className="btn btn-outline btn-block mt-4"
                  onClick={() => downloadCertificate(course.id)}
                >
                  <Icon name="certificate" size={16} />
                  {t('dashboard.certificate.download')}
                </button>
              </div>
            ) : null}

            <div className="row-wrap mt-4">
              <FavoriteButton collection="courses" id={course.id} />
              <ShareButton path={`formations/${course.slug}`} />
            </div>

            <div className="meta-list mt-6">
              <MetaRow label={t('common.labels.modules')}>{String(stats.modules)}</MetaRow>
              <MetaRow label={t('common.labels.lessons')}>{String(stats.lessons)}</MetaRow>
              <MetaRow label={t('common.labels.duration')}>
                <span className="ltr-nums">{formatDuration(stats.minutes)}</span>
              </MetaRow>
              <MetaRow label={t('common.labels.level')}>{term('levels', course.level)}</MetaRow>
              <MetaRow label={t('common.labels.language')}>{term('languages', course.language)}</MetaRow>
              <MetaRow label={t('common.labels.certificate')}>
                {course.certificate ? t('courses.certificateInfo') : '—'}
              </MetaRow>
              <MetaRow label={t('common.labels.access')}>{term('access', course.access)}</MetaRow>
            </div>
          </div>

          <PathologyTagsCard slugs={course.pathologies} heading={t('common.labels.pathology')} />
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ quiz */

function QuizBlock({ course, lesson }: { course: Course; lesson: Lesson }) {
  const { t, href } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  /* Score précédent figé à l'ouverture : le résultat du nouvel essai
     s'affiche en dessous, comme dans la version d'origine. */
  const [previous] = useState(() => quizScore(lesson.id));
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const quiz = lesson.quiz;
  if (!quiz) return null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let score = 0;
    quiz.questions.forEach((question, index) => {
      const value = data.get(`q${index}`);
      if (value !== null && Number(value) === question.answer) score += 1;
    });
    const total = quiz.questions.length;
    const passed = score >= (quiz.passScore || total);

    const saved = saveQuizScore(course.id, lesson.id, score, total);
    if (needsAuth(saved)) {
      toast(t('courses.loginToEnroll'), 'error');
      navigate(href('connexion'));
      return;
    }
    setResult({ score, total, passed });
    if (passed) setLessonDone(course.id, lesson.id);
  };

  return (
    <form className="card" id="quiz-form" onSubmit={onSubmit}>
      <p className="text-sm text-muted">{t('courses.quizIntro')}</p>
      {previous ? (
        <Alert variant="info">{t('courses.quizScore', { score: previous.score, total: previous.total })}</Alert>
      ) : null}
      {quiz.questions.map((question, qIndex) => (
        <fieldset key={qIndex} style={{ border: 0, padding: 0, marginBlock: 'var(--space-6) 0' }}>
          <legend className="label">
            <span className="ltr-nums">{qIndex + 1}.</span> {question.q}
          </legend>
          {question.options.map((option, oIndex) => (
            <label key={oIndex} className="radio">
              <input type="radio" name={`q${qIndex}`} value={oIndex} />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <div id="quiz-result" className="mt-6">
        {result ? (
          <Alert
            variant={result.passed ? 'success' : 'warning'}
            title={t('courses.quizScore', { score: result.score, total: result.total })}
          >
            {result.passed ? t('courses.quizPassed') : t('courses.quizFailed')}
          </Alert>
        ) : null}
      </div>
      <button type="submit" className="btn btn-primary mt-6">
        {t('courses.quizSubmit')}
      </button>
    </form>
  );
}

/* ----------------------------------------------------- lecteur de leçon */

function LessonContent({ course, lesson }: { course: Course; lesson: Lesson }) {
  const { t, href } = useI18n();
  const toast = useToast();

  if (lesson.type === 'quiz') return <QuizBlock key={lesson.id} course={course} lesson={lesson} />;

  if (lesson.type === 'text') {
    return (
      <div className="prose card">
        {(lesson.content ?? '').split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    );
  }

  if (lesson.type === 'pdf') {
    const linked = lesson.resourceSlug ? getBySlug('resources', lesson.resourceSlug) : null;
    const linkedTool = lesson.toolSlug ? getBySlug('tools', lesson.toolSlug) : null;
    return (
      <div className="card">
        <div className="row" style={{ gap: 'var(--space-4)', alignItems: 'flex-start' }}>
          <span className="feature-icon">
            <Icon name="filePdf" size={24} />
          </span>
          <div className="grow">
            <strong>{lesson.title}</strong>
            <p className="text-sm text-muted">{t('taxonomies.lessonTypes.pdf')}</p>
            {linked ? (
              <Link className="btn btn-outline btn-sm" to={href(`bibliotheque/${linked.slug}`)}>
                {t('common.actions.details')}
              </Link>
            ) : null}
            {linkedTool ? (
              <Link className="btn btn-outline btn-sm" to={href(`outils/${linkedTool.slug}`)}>
                {t('common.actions.details')}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player">
      <button
        type="button"
        className="play-btn"
        aria-label={t('common.actions.startCourse')}
        onClick={() => toast(t('courses.lessonPlayerNotice'), 'success')}
      >
        <Icon name="play" size={26} />
      </button>
      <strong>{lesson.title}</strong>
      <span className="text-sm" style={{ color: '#B9C7D2' }}>
        {formatDuration(lesson.duration)} · {t('taxonomies.lessonTypes.video')}
      </span>
      <span className="text-xs" style={{ color: '#8FA6BA', maxWidth: '52ch' }}>
        {t('courses.lessonPlayerNotice')}
      </span>
    </div>
  );
}

export function LessonPage() {
  useStoreVersion();
  const { slug, lessonId } = useParams();
  const { t, href } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const modal = useModal();
  const { downloadCertificate } = useContentActions();

  const course = getBySlug('courses', slug);
  const found = course ? findLesson(course, lessonId) : null;

  useSeo(
    course && found
      ? {
          title: `${found.lesson.title} — ${titleOf(course)}`,
          description: course.description,
          path: lessonPath(course, found.lesson.id)
        }
      : { title: t('common.states.notFoundTitle') }
  );

  if (!course || !found) return <NotFoundState />;

  const lesson = found.lesson;
  const done = isLessonDone(course.id, lesson.id);
  const progress = courseProgress(course);

  const onToggle = () => {
    const result = toggleLesson(course.id, lesson.id);
    if (needsAuth(result)) {
      toast(t('courses.loginToEnroll'), 'error');
      navigate(href('connexion'));
      return;
    }
    if (result.done) toast(t('common.toast.lessonDone'), 'success');
    if (result.done && result.certificate) {
      modal.open({
        title: t('courses.certificateReady'),
        body: <p>{t('dashboard.certificate.reference', { ref: result.certificate.ref })}</p>,
        footer: (
          <>
            <button type="button" className="btn btn-outline" onClick={modal.close}>
              {t('common.actions.close')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                modal.close();
                downloadCertificate(course.id);
              }}
            >
              {t('dashboard.certificate.download')}
            </button>
          </>
        )
      });
    }
  };

  return (
    <div className="ka-container section">
      <Breadcrumb
        items={[
          { label: t('courses.title'), to: href('formations') },
          { label: titleOf(course), to: href(`formations/${course.slug}`) },
          { label: lesson.title }
        ]}
      />

      <div className="layout-detail">
        <article>
          <p className="text-sm text-muted">
            {found.module.title} · {t('common.labels.lessons')}{' '}
            <span className="ltr-nums">
              {found.index + 1}/{found.total}
            </span>
          </p>
          <h1>{lesson.title}</h1>
          <div className="mt-6">
            <LessonContent course={course} lesson={lesson} />
          </div>

          <div className="row-wrap mt-6" style={{ justifyContent: 'space-between' }}>
            <div className="row-wrap">
              {found.prev ? (
                <Link className="btn btn-outline btn-sm" to={href(lessonPath(course, found.prev.id))}>
                  <Icon name="arrowLeft" size={16} className="icon-flip" />
                  {t('common.pagination.prev')}
                </Link>
              ) : null}
              {found.next ? (
                <Link className="btn btn-outline btn-sm" to={href(lessonPath(course, found.next.id))}>
                  {t('courses.nextLesson')}
                  <Icon name="arrowRight" size={16} className="icon-flip" />
                </Link>
              ) : null}
            </div>
            {lesson.type !== 'quiz' ? (
              <button type="button" className={done ? 'btn btn-outline' : 'btn btn-primary'} onClick={onToggle}>
                <Icon name={done ? 'close' : 'check'} size={16} />
                {done ? t('common.actions.markUndone') : t('common.actions.markDone')}
              </button>
            ) : null}
          </div>
        </article>

        <aside className="sticky-side stack">
          <div className="card">
            <strong>{titleOf(course)}</strong>
            <div className="mt-4">
              <ProgressBar percent={progress.percent} large />
            </div>
            <p className="text-xs text-muted mt-4">
              {t('courses.lessonsCompleted', { done: progress.done, total: progress.total })}
            </p>
            <Link className="btn btn-outline btn-sm btn-block mt-4" to={href(`formations/${course.slug}`)}>
              {t('courses.curriculum')}
            </Link>
          </div>
          <div className="card">
            <strong>{t('courses.curriculum')}</strong>
            <div className="mt-4">
              {lessonsOf(course).map((entry, index) => {
                const isDone = isLessonDone(course.id, entry.lesson.id);
                const isCurrent = entry.lesson.id === lesson.id;
                const className = ['lesson-row', isDone ? 'is-done' : '', isCurrent ? 'is-current' : '']
                  .filter(Boolean)
                  .join(' ');
                return (
                  <Link key={entry.lesson.id} className={className} to={href(lessonPath(course, entry.lesson.id))}>
                    <span className="lr-index">{isDone ? <Icon name="check" size={14} /> : index + 1}</span>
                    <span className="grow text-sm">{entry.lesson.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
