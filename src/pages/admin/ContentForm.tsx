/* =====================================================================
   Formulaire de contenu (administration)
   ---------------------------------------------------------------------
   Rendu et lecture pilotés par `contentSchema` : un champ décrit une
   fois y est affiché et enregistré, sans qu'on puisse oublier l'un des
   deux.

   Le programme d'une formation (modules et leçons) échappe à ce schéma :
   c'est la seule structure imbriquée du modèle, et elle demande un
   éditeur à elle. Elle vit donc dans un état React, pas dans le
   `FormData`.
   ===================================================================== */
import { useRef, useState, type FormEvent } from 'react';
import { useToast } from '../../components/feedback/ToastProvider';
import { Icon } from '../../components/icons/Icon';
import { Checkbox, Field, SelectField, TextareaField, focusFirstError, readForm, type Option } from '../../components/ui';
import { taxonomies } from '../../data/taxonomies';
import { useI18n } from '../../i18n/I18nContext';
import { all, create, titleOf, update, type ContentPayload } from '../../lib/content';
import type { AdminCollection } from '../../model/common';
import type { AnyItem, CourseModule, Lesson, LessonType } from '../../model/content';
import {
  CONTENT_SCHEMA,
  NAMED_COLLECTIONS,
  fromLines,
  toLines,
  type FieldSpec
} from './contentSchema';

type Values = Record<string, unknown>;

const str = (data: Values, key: string): string => {
  const value = data[key];
  return value === undefined || value === null ? '' : String(value);
};

/** ISO → valeur d'un champ `datetime-local`, en heure locale. */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

const LESSON_TYPES: LessonType[] = ['video', 'pdf', 'text', 'quiz'];
const newId = () => `tmp-${Math.random().toString(36).slice(2, 9)}`;

/* ===================================================== programme ----- */

/**
 * Éditeur de programme : des modules, chacun portant des leçons.
 *
 * C'est la seule partie du formulaire qui ne passe pas par le `FormData`
 * : une arborescence ne s'exprime pas en champs plats. L'état est donc
 * tenu ici et joint à la charge à la soumission.
 */
function Curriculum({ modules, onChange }: { modules: CourseModule[]; onChange: (next: CourseModule[]) => void }) {
  const { t } = useI18n();

  const patchModule = (index: number, patch: Partial<CourseModule>) =>
    onChange(modules.map((module, i) => (i === index ? { ...module, ...patch } : module)));

  const patchLesson = (mi: number, li: number, patch: Partial<Lesson>) =>
    patchModule(mi, {
      lessons: modules[mi].lessons.map((lesson, i) => (i === li ? { ...lesson, ...patch } : lesson))
    });

  return (
    <div className="adm-modules">
      {modules.map((module, mi) => (
        <div className="adm-module" key={module.id}>
          <div className="adm-module-head">
            <input
              className="input"
              value={module.title}
              placeholder={t('admin.forms.moduleTitle')}
              aria-label={t('admin.forms.moduleTitle')}
              onChange={(event) => patchModule(mi, { title: event.target.value })}
            />
            <button
              type="button"
              className="icon-btn"
              aria-label={t('admin.forms.removeModule')}
              onClick={() => onChange(modules.filter((_, i) => i !== mi))}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>

          {module.lessons.map((lesson, li) => (
            <div className="adm-lesson" key={lesson.id}>
              <input
                className="input"
                value={lesson.title}
                placeholder={t('admin.forms.lessonTitle')}
                aria-label={t('admin.forms.lessonTitle')}
                onChange={(event) => patchLesson(mi, li, { title: event.target.value })}
              />
              <select
                className="select"
                value={lesson.type}
                aria-label={t('admin.forms.lessonType')}
                onChange={(event) => patchLesson(mi, li, { type: event.target.value as LessonType })}
              >
                {LESSON_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`admin.forms.lessonTypes.${type}`)}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                min={0}
                value={lesson.duration}
                aria-label={t('admin.forms.duration')}
                onChange={(event) => patchLesson(mi, li, { duration: Number(event.target.value) || 0 })}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label={t('admin.forms.removeLesson')}
                onClick={() =>
                  patchModule(mi, { lessons: module.lessons.filter((_, i) => i !== li) })
                }
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() =>
              patchModule(mi, {
                lessons: [...module.lessons, { id: newId(), title: '', type: 'video', duration: 10 }]
              })
            }
          >
            <Icon name="plus" size={14} />
            {t('admin.forms.addLesson')}
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline"
        onClick={() => onChange([...modules, { id: newId(), title: '', lessons: [] }])}
      >
        <Icon name="plus" size={15} />
        {t('admin.forms.addModule')}
      </button>
    </div>
  );
}

/* ================================================== le formulaire ---- */

export function ContentForm({
  collection,
  existing,
  onDone
}: {
  collection: AdminCollection;
  existing: AnyItem | null;
  onDone: () => void;
}) {
  const { t, term } = useI18n();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [titleError, setTitleError] = useState<string>();

  const data = (existing ?? {}) as unknown as Values;
  const groups = CONTENT_SCHEMA[collection];

  const [modules, setModules] = useState<CourseModule[]>(
    Array.isArray(data.modules) ? (data.modules as CourseModule[]) : []
  );
  const [pathologies, setPathologies] = useState<string[]>(
    Array.isArray(data.pathologies) ? (data.pathologies as string[]) : []
  );

  const termOptions = (group: string, values: readonly string[]): Option[] =>
    values.map((value) => ({ value, label: term(group, value) }));
  const authorOptions: Option[] = all('authors').map((author) => ({
    value: author.id,
    label: `${author.firstName} ${author.lastName}`
  }));
  const pathologyList = all('pathologies').map((p) => ({ slug: p.slug, label: p.name || titleOf(p) }));

  const taxonomyValues = (group: string): readonly string[] =>
    (taxonomies as unknown as Record<string, readonly string[]>)[group] ?? [];

  /* ------------------------------------------------------- rendu ----- */

  const renderField = (spec: FieldSpec) => {
    const key = spec.name;
    const label = t(spec.label);
    const hint = spec.hint ? t(spec.hint) : undefined;

    switch (spec.kind) {
      case 'textarea':
        return <TextareaField key={key} name={key} label={label} defaultValue={str(data, key)} hint={hint} />;

      case 'list':
        return (
          <TextareaField
            key={key}
            name={key}
            label={label}
            defaultValue={toLines(data[key])}
            hint={hint}
          />
        );

      case 'taxonomy':
        return (
          <SelectField
            key={key}
            name={key}
            label={label}
            defaultValue={str(data, key)}
            options={termOptions(spec.group ?? '', taxonomyValues(spec.group ?? ''))}
          />
        );

      case 'author':
        return (
          <SelectField key={key} name={key} label={label} defaultValue={str(data, key)} options={authorOptions} />
        );

      case 'check':
        return <Checkbox key={key} name={key} label={label} defaultChecked={data[key] !== false} />;

      case 'number':
        return <Field key={key} name={key} label={label} type="number" defaultValue={str(data, key)} hint={hint} />;

      case 'date':
        return <Field key={key} name={key} label={label} type="date" defaultValue={str(data, key).slice(0, 10)} />;

      case 'datetime':
        return (
          <Field
            key={key}
            name={key}
            label={label}
            type="datetime-local"
            defaultValue={str(data, key) ? toLocalInput(str(data, key)) : ''}
          />
        );

      case 'url':
        return <Field key={key} name={key} label={label} defaultValue={str(data, key)} placeholder="https://…" />;

      case 'dosage': {
        const dosage = (data.dosage ?? {}) as Record<string, string>;
        return (
          <div className="field" key={key}>
            <span className="label">{label}</span>
            <div className="grid grid-4" style={{ gap: 'var(--space-3)' }}>
              {(['sets', 'reps', 'hold', 'frequency'] as const).map((part) => (
                <Field
                  key={part}
                  name={`dosage.${part}`}
                  label={t(`admin.forms.dosageParts.${part}`)}
                  defaultValue={dosage[part] ?? ''}
                />
              ))}
            </div>
          </div>
        );
      }

      case 'pathologies':
        return (
          <div className="field" key={key}>
            <span className="label">{label}</span>
            {/* Plusieurs pathologies par contenu : le modèle en stocke une
                liste, et les fiches les affichent toutes. */}
            <div className="adm-checks">
              {pathologyList.map((entry) => (
                <Checkbox
                  key={entry.slug}
                  label={entry.label}
                  checked={pathologies.includes(entry.slug)}
                  onChange={(event) =>
                    setPathologies((current) =>
                      event.target.checked
                        ? [...current, entry.slug]
                        : current.filter((slug) => slug !== entry.slug)
                    )
                  }
                />
              ))}
            </div>
          </div>
        );

      case 'modules':
        return <Curriculum key={key} modules={modules} onChange={setModules} />;

      case 'text':
      default:
        return (
          <Field
            key={key}
            name={key}
            label={label}
            defaultValue={key === 'title' ? str(data, 'title') || str(data, 'name') : str(data, key)}
            required={key === 'title'}
            error={key === 'title' ? titleError : undefined}
            hint={hint}
          />
        );
    }
  };

  /* ---------------------------------------------------- lecture ------ */

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = readForm(event.currentTarget);

    if (!f.get('title')) {
      setTitleError(t('auth.errors.required'));
      focusFirstError(formRef.current);
      return;
    }

    const payload: ContentPayload = {
      published: f.checked('published'),
      pathologies
    };

    groups.forEach((group) =>
      group.fields.forEach((spec) => {
        const key = spec.name;
        switch (spec.kind) {
          case 'pathologies':
            return;
          case 'modules':
            payload.modules = modules;
            return;
          case 'list':
            payload[key] = fromLines(f.get(key));
            return;
          case 'check':
            payload[key] = f.checked(key);
            return;
          case 'number': {
            const raw = f.get(key);
            payload[key] = raw === '' ? 0 : Number(raw) || 0;
            return;
          }
          case 'datetime': {
            const raw = f.get(key);
            if (raw) payload[key] = new Date(raw).toISOString();
            return;
          }
          case 'dosage':
            payload.dosage = {
              sets: f.get('dosage.sets'),
              reps: f.get('dosage.reps'),
              hold: f.get('dosage.hold'),
              frequency: f.get('dosage.frequency')
            };
            return;
          case 'text':
            if (key === 'title') {
              /* Outils, exercices et pathologies portent leur nom sous
                 `name` ; le formulaire n'a qu'un champ « titre ». */
              if (NAMED_COLLECTIONS.includes(collection)) payload.name = f.get('title');
              else payload.title = f.get('title');
              return;
            }
            payload[key] = f.get(key);
            return;
          default:
            payload[key] = f.get(key);
        }
      })
    );

    /* Une formation calcule sa durée depuis ses leçons : la saisir à la
       main la mettrait en désaccord avec le programme affiché. */
    if (collection === 'courses') {
      payload.durationMinutes = modules.reduce(
        (total, module) => total + module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
        0
      );
    }

    if (existing) {
      update(collection, existing.id, payload);
      toast(t('common.toast.saved'), 'success');
    } else {
      create(collection, payload);
      toast(t('common.toast.created'), 'success');
    }
    onDone();
  };

  return (
    <form ref={formRef} id="content-form" className="adm-form" noValidate onSubmit={onSubmit}>
      {groups.map((group) => (
        <section className="adm-group" key={group.title}>
          <h3>{t(group.title)}</h3>
          <div className="adm-grid">
            {group.fields.map((spec) => (
              <div className={spec.half ? 'adm-cell adm-cell-half' : 'adm-cell'} key={spec.name}>
                {renderField(spec)}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="adm-group">
        <Checkbox name="published" label={t('admin.content.publish')} defaultChecked={data.published !== false} />
      </section>
    </form>
  );
}
