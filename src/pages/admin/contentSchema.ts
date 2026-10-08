/* =====================================================================
   Champs éditables de chaque type de contenu
   ---------------------------------------------------------------------
   Un seul endroit décrit ce que l'administration peut modifier. Le
   formulaire se rend à partir d'ici, et la charge envoyée au stockage se
   lit à partir d'ici : impossible d'ajouter un champ au formulaire sans
   qu'il soit enregistré, ou l'inverse.

   La liste a été dressée en face du **modèle de données** et de ce que
   les fiches publiques affichent réellement : chaque valeur visible sur
   une fiche a son champ ici. Les compteurs d'usage (vues,
   téléchargements, inscrits, note) y figurent aussi — ils appartiennent
   à la fiche et l'administration doit pouvoir les corriger — mais sont
   regroupés à part, sous « mesures », parce qu'on ne les saisit pas en
   créant un contenu.

   Les champs « liste » se saisissent une valeur par ligne : c'est ainsi
   que les fiches les affichent (puces), et cela évite un éditeur de
   tableau pour des suites de phrases courtes.
   ===================================================================== */
import type { AdminCollection } from '../../model/common';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'list'
  | 'number'
  | 'date'
  | 'datetime'
  | 'url'
  | 'check'
  | 'taxonomy'
  | 'author'
  | 'pathologies'
  | 'dosage'
  | 'modules';

export interface FieldSpec {
  name: string;
  /** Clé i18n du libellé. */
  label: string;
  kind: FieldKind;
  /** Groupe de taxonomie, pour `kind: 'taxonomy'`. */
  group?: string;
  /** Occupe une demi-largeur dans la grille. */
  half?: boolean;
  /** Clé i18n d'une aide affichée sous le champ. */
  hint?: string;
}

export interface FieldGroup {
  /** Clé i18n du titre de section. */
  title: string;
  fields: FieldSpec[];
}

/* Champs communs à toutes les fiches : identité et classement. */
const identity = (typeGroup?: string): FieldSpec[] => [
  { name: 'title', label: 'admin.forms.title', kind: 'text' },
  { name: 'subtitle', label: 'admin.forms.subtitle', kind: 'text' },
  { name: 'description', label: 'admin.forms.description', kind: 'textarea' },
  ...(typeGroup ? [{ name: 'type', label: 'admin.forms.type', kind: 'taxonomy' as const, group: typeGroup, half: true }] : [])
];

const placement: FieldSpec[] = [
  { name: 'region', label: 'admin.forms.region', kind: 'taxonomy', group: 'regions', half: true },
  { name: 'specialty', label: 'common.labels.specialty', kind: 'taxonomy', group: 'specialties', half: true },
  { name: 'pathologies', label: 'common.labels.pathology', kind: 'pathologies' },
  { name: 'tags', label: 'admin.forms.tags', kind: 'list', hint: 'admin.forms.listHint' }
];

/** Fichier joint : commun à la bibliothèque et aux outils. */
const fileFields: FieldSpec[] = [
  { name: 'fileUrl', label: 'admin.forms.fileUrl', kind: 'url' },
  { name: 'format', label: 'admin.forms.format', kind: 'text', half: true },
  { name: 'sizeKb', label: 'admin.forms.sizeKb', kind: 'number', half: true }
];

export const CONTENT_SCHEMA: Record<AdminCollection, FieldGroup[]> = {
  resources: [
    { title: 'admin.forms.groupIdentity', fields: identity('resourceTypes') },
    {
      title: 'admin.forms.groupBody',
      fields: [
        { name: 'abstract', label: 'admin.forms.abstract', kind: 'textarea' },
        { name: 'keyPoints', label: 'admin.forms.keyPoints', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'references', label: 'admin.forms.references', kind: 'list', hint: 'admin.forms.listHint' }
      ]
    },
    {
      title: 'admin.forms.groupPlacement',
      fields: [
        ...placement,
        { name: 'level', label: 'common.labels.level', kind: 'taxonomy', group: 'levels', half: true },
        { name: 'language', label: 'common.labels.language', kind: 'taxonomy', group: 'languages', half: true },
        { name: 'authorId', label: 'admin.forms.author', kind: 'author', half: true },
        { name: 'access', label: 'common.labels.access', kind: 'taxonomy', group: 'access', half: true }
      ]
    },
    {
      title: 'admin.forms.groupFile',
      fields: [
        ...fileFields,
        { name: 'pages', label: 'admin.forms.pages', kind: 'number', half: true },
        { name: 'publishedAt', label: 'admin.forms.publishedAt', kind: 'date', half: true },
        { name: 'updatedAt', label: 'admin.forms.updatedAt', kind: 'date', half: true }
      ]
    },
    {
      title: 'admin.forms.groupMetrics',
      fields: [
        { name: 'views', label: 'admin.forms.views', kind: 'number', half: true },
        { name: 'downloads', label: 'admin.forms.downloads', kind: 'number', half: true }
      ]
    }
  ],

  courses: [
    { title: 'admin.forms.groupIdentity', fields: identity() },
    {
      title: 'admin.forms.groupTeaching',
      fields: [
        { name: 'objectives', label: 'admin.forms.objectives', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'audience', label: 'admin.forms.audience', kind: 'text' },
        { name: 'prerequisites', label: 'admin.forms.prerequisites', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'certificate', label: 'common.labels.certificate', kind: 'check' }
      ]
    },
    { title: 'admin.forms.groupCurriculum', fields: [{ name: 'modules', label: 'admin.forms.modules', kind: 'modules' }] },
    {
      title: 'admin.forms.groupPlacement',
      fields: [
        ...placement,
        { name: 'level', label: 'common.labels.level', kind: 'taxonomy', group: 'levels', half: true },
        { name: 'language', label: 'common.labels.language', kind: 'taxonomy', group: 'languages', half: true },
        { name: 'instructorId', label: 'admin.forms.instructor', kind: 'author', half: true },
        { name: 'access', label: 'common.labels.access', kind: 'taxonomy', group: 'access', half: true }
      ]
    },
    {
      title: 'admin.forms.groupMetrics',
      fields: [
        { name: 'rating', label: 'admin.forms.rating', kind: 'number', half: true },
        { name: 'ratingCount', label: 'admin.forms.ratingCount', kind: 'number', half: true },
        { name: 'enrolledCount', label: 'admin.forms.enrolled', kind: 'number', half: true }
      ]
    }
  ],

  webinars: [
    { title: 'admin.forms.groupIdentity', fields: identity() },
    {
      title: 'admin.forms.groupSession',
      fields: [
        { name: 'startsAt', label: 'admin.forms.startsAt', kind: 'datetime', half: true },
        { name: 'durationMinutes', label: 'admin.forms.duration', kind: 'number', half: true },
        { name: 'liveUrl', label: 'admin.forms.liveUrl', kind: 'url' },
        { name: 'replayUrl', label: 'admin.forms.replayUrl', kind: 'url' },
        { name: 'agenda', label: 'admin.forms.agenda', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'certificate', label: 'common.labels.certificate', kind: 'check' }
      ]
    },
    {
      title: 'admin.forms.groupPlacement',
      fields: [
        ...placement,
        { name: 'speakerId', label: 'admin.forms.speaker', kind: 'author', half: true },
        { name: 'access', label: 'common.labels.access', kind: 'taxonomy', group: 'access', half: true }
      ]
    },
    {
      title: 'admin.forms.groupMetrics',
      fields: [{ name: 'registeredCount', label: 'admin.forms.registered', kind: 'number', half: true }]
    }
  ],

  tools: [
    { title: 'admin.forms.groupIdentity', fields: identity('toolTypes') },
    {
      title: 'admin.forms.groupClinical',
      fields: [
        { name: 'purpose', label: 'tools.purpose', kind: 'textarea' },
        { name: 'indications', label: 'admin.forms.indications', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'contraindications', label: 'admin.forms.contraindications', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'equipment', label: 'admin.forms.equipment', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'procedure', label: 'admin.forms.procedure', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'scoring', label: 'admin.forms.scoring', kind: 'textarea' },
        { name: 'interpretation', label: 'admin.forms.interpretation', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'psychometrics', label: 'admin.forms.psychometrics', kind: 'textarea' },
        { name: 'references', label: 'admin.forms.references', kind: 'list', hint: 'admin.forms.listHint' }
      ]
    },
    {
      title: 'admin.forms.groupPlacement',
      fields: [...placement, { name: 'access', label: 'common.labels.access', kind: 'taxonomy', group: 'access', half: true }]
    },
    {
      title: 'admin.forms.groupFile',
      fields: [...fileFields, { name: 'downloads', label: 'admin.forms.downloads', kind: 'number', half: true }]
    }
  ],

  exercises: [
    {
      title: 'admin.forms.groupIdentity',
      fields: [
        { name: 'title', label: 'admin.forms.title', kind: 'text' },
        { name: 'goal', label: 'admin.forms.goal', kind: 'textarea' },
        { name: 'description', label: 'admin.forms.description', kind: 'textarea' }
      ]
    },
    {
      title: 'admin.forms.groupExecution',
      fields: [
        { name: 'steps', label: 'admin.forms.steps', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'dosage', label: 'admin.forms.dosage', kind: 'dosage' },
        { name: 'progression', label: 'admin.forms.progression', kind: 'textarea' },
        { name: 'regression', label: 'admin.forms.regression', kind: 'textarea' },
        { name: 'precautions', label: 'admin.forms.precautions', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'targetMuscles', label: 'admin.forms.targetMuscles', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'equipment', label: 'admin.forms.equipment', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'references', label: 'admin.forms.references', kind: 'list', hint: 'admin.forms.listHint' }
      ]
    },
    {
      title: 'admin.forms.groupPlacement',
      fields: [
        { name: 'region', label: 'admin.forms.region', kind: 'taxonomy', group: 'regions', half: true },
        { name: 'objective', label: 'exercises.objective', kind: 'taxonomy', group: 'objectives', half: true },
        { name: 'difficulty', label: 'common.labels.level', kind: 'taxonomy', group: 'difficulty', half: true },
        { name: 'pathologies', label: 'common.labels.pathology', kind: 'pathologies' },
        { name: 'tags', label: 'admin.forms.tags', kind: 'list', hint: 'admin.forms.listHint' }
      ]
    }
  ],

  pathologies: [
    {
      title: 'admin.forms.groupIdentity',
      fields: [
        { name: 'title', label: 'admin.forms.title', kind: 'text' },
        { name: 'aliases', label: 'admin.forms.aliases', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'summary', label: 'admin.forms.summary', kind: 'textarea' },
        { name: 'description', label: 'admin.forms.description', kind: 'textarea' }
      ]
    },
    {
      title: 'admin.forms.groupClinical',
      fields: [
        { name: 'epidemiology', label: 'admin.forms.epidemiology', kind: 'textarea' },
        { name: 'presentation', label: 'admin.forms.presentation', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'redFlags', label: 'admin.forms.redFlags', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'management', label: 'admin.forms.management', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'keyFacts', label: 'admin.forms.keyFacts', kind: 'list', hint: 'admin.forms.listHint' },
        { name: 'evidence', label: 'admin.forms.evidence', kind: 'textarea' }
      ]
    },
    {
      title: 'admin.forms.groupPlacement',
      fields: [
        { name: 'region', label: 'admin.forms.region', kind: 'taxonomy', group: 'regions', half: true },
        { name: 'specialty', label: 'common.labels.specialty', kind: 'taxonomy', group: 'specialties', half: true }
      ]
    }
  ]
};

/** Champs qui portent le nom sous la clé `name` et non `title`. */
export const NAMED_COLLECTIONS: AdminCollection[] = ['tools', 'exercises', 'pathologies'];

/** Listes rendues une valeur par ligne. */
export const toLines = (value: unknown): string =>
  Array.isArray(value) ? value.map((entry) => String(entry)).join('\n') : '';

export const fromLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
