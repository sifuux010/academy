/* Groupes de filtres de chaque page de liste. */
import { taxonomies } from '../../data/taxonomies';
import { published } from '../../lib/content';

export type PresetKey = 'resources' | 'tools' | 'courses' | 'exercises' | 'webinars' | 'pathologies';

export interface FilterGroup {
  key: string;
  label: string;
  /** Groupe de taxonomie servant aux libellés (taxonomies.<termGroup>.<valeur>). */
  termGroup?: string;
  values: string[];
  collapsed?: boolean;
}

type Translate = (path: string) => string;

function values(name: keyof typeof taxonomies): string[] {
  return [...(taxonomies[name] as readonly string[])];
}

export function filterPreset(preset: PresetKey, t: Translate): FilterGroup[] {
  const pathologies = published('pathologies').map((p) => p.slug);
  switch (preset) {
    case 'resources':
      return [
        { key: 'type', label: t('common.labels.type'), termGroup: 'resourceTypes', values: values('resourceTypes') },
        { key: 'pathology', label: t('common.labels.pathology'), values: pathologies },
        { key: 'region', label: t('common.labels.region'), termGroup: 'regions', values: values('regions') },
        { key: 'specialty', label: t('common.labels.specialty'), termGroup: 'specialties', values: values('specialties'), collapsed: true },
        { key: 'level', label: t('common.labels.level'), termGroup: 'levels', values: values('levels') },
        { key: 'language', label: t('common.labels.language'), termGroup: 'languages', values: values('languages'), collapsed: true },
        { key: 'access', label: t('common.labels.access'), termGroup: 'access', values: values('access'), collapsed: true }
      ];
    case 'tools':
      return [
        { key: 'type', label: t('common.labels.type'), termGroup: 'toolTypes', values: values('toolTypes') },
        { key: 'pathology', label: t('common.labels.pathology'), values: pathologies },
        { key: 'region', label: t('common.labels.region'), termGroup: 'regions', values: values('regions') },
        { key: 'specialty', label: t('common.labels.specialty'), termGroup: 'specialties', values: values('specialties'), collapsed: true }
      ];
    case 'courses':
      return [
        { key: 'level', label: t('common.labels.level'), termGroup: 'levels', values: values('levels') },
        { key: 'specialty', label: t('common.labels.specialty'), termGroup: 'specialties', values: values('specialties') },
        { key: 'pathology', label: t('common.labels.pathology'), values: pathologies },
        { key: 'region', label: t('common.labels.region'), termGroup: 'regions', values: values('regions'), collapsed: true },
        { key: 'access', label: t('common.labels.access'), termGroup: 'access', values: values('access'), collapsed: true }
      ];
    case 'exercises':
      return [
        { key: 'region', label: t('common.labels.region'), termGroup: 'regions', values: values('regions') },
        { key: 'objective', label: t('exercises.objective'), termGroup: 'objectives', values: values('objectives') },
        { key: 'difficulty', label: t('common.labels.level'), termGroup: 'difficulty', values: values('difficulty') },
        { key: 'pathology', label: t('common.labels.pathology'), values: pathologies }
      ];
    case 'webinars':
      return [
        { key: 'status', label: t('common.labels.status'), termGroup: 'webinarStatus', values: ['upcoming', 'live', 'replay', 'past'] },
        { key: 'specialty', label: t('common.labels.specialty'), termGroup: 'specialties', values: values('specialties') },
        { key: 'pathology', label: t('common.labels.pathology'), values: pathologies }
      ];
    case 'pathologies':
      return [
        { key: 'region', label: t('common.labels.region'), termGroup: 'regions', values: values('regions') },
        { key: 'specialty', label: t('common.labels.specialty'), termGroup: 'specialties', values: values('specialties') }
      ];
    default:
      return [];
  }
}
