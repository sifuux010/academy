/* =====================================================================
   Internationalisation — cœur (hors React)
   ---------------------------------------------------------------------
   - Dictionnaires : src/locales/{fr,en,ar}.ts. en et ar sont typés
     contre fr : une clé manquante fait échouer la compilation.
   - La langue active est portée par l'URL (/fr/…, /en/…, /ar/…) ;
     LocaleProvider la reporte ici pour les fonctions hors composants
     (formatage des dates, documents imprimables).
   - L'arabe bascule le document entier en dir="rtl".
   ===================================================================== */
import { fr, type Dictionary } from '../locales/fr';
import { en } from '../locales/en';
import { ar } from '../locales/ar';
import type { Locale } from '../model/common';

export interface LocaleMeta {
  code: Locale;
  label: string;
  name: string;
  dir: 'ltr' | 'rtl';
}

export const LOCALES: LocaleMeta[] = [
  { code: 'fr', label: 'FR', name: 'Français', dir: 'ltr' },
  { code: 'en', label: 'EN', name: 'English', dir: 'ltr' },
  { code: 'ar', label: 'ع', name: 'العربية', dir: 'rtl' }
];

export const DEFAULT_LOCALE: Locale = 'fr';

const DICTS: Record<Locale, Dictionary> = { fr, en, ar };
const STORAGE_KEY = 'ka.locale';
const NUMBER_TAGS: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-DZ' };

let active: Locale = DEFAULT_LOCALE;

export function isLocale(value: unknown): value is Locale {
  return value === 'fr' || value === 'en' || value === 'ar';
}

export function setActiveLocale(locale: Locale): void {
  active = locale;
}

export function getLocale(): Locale {
  return active;
}

export function localeMeta(locale: Locale = active): LocaleMeta {
  return LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
}

export function dirOf(locale: Locale = active): 'ltr' | 'rtl' {
  return localeMeta(locale).dir;
}

/** Langue initiale : choix mémorisé, puis langue du navigateur, puis français. */
export function detectLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* mode privé */
  }
  const nav = (window.navigator.language || '').slice(0, 2).toLowerCase();
  return isLocale(nav) ? nav : DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* mode privé */
  }
}

function lookup(dict: unknown, path: string): unknown {
  let node: unknown = dict;
  for (const part of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

export type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  );
}

/**
 * translate('common.nav.library')              → « Bibliothèque »
 * translate('dashboard.hello', { name: 'Y' })  → « Bonjour, Y »
 * Repli : français, puis la clé elle-même (visible en développement).
 */
export function translate(path: string, vars?: Vars, locale: Locale = active): string {
  let value = lookup(DICTS[locale], path);
  if (value === undefined) value = lookup(DICTS[DEFAULT_LOCALE], path);
  if (typeof value !== 'string') {
    if (import.meta.env.DEV) console.warn(`[i18n] clé manquante : ${path}`);
    return path;
  }
  return interpolate(value, vars);
}

/** Pluriel simple : plural(3, 'common.units.results') → « 3 résultats » */
export function plural(count: number, path: string, locale: Locale = active): string {
  const forms = (lookup(DICTS[locale], path) ?? lookup(DICTS[DEFAULT_LOCALE], path)) as
    | Record<string, string>
    | string
    | undefined;
  const formatted = new Intl.NumberFormat(NUMBER_TAGS[locale]).format(count);
  if (!forms) return `${formatted} ${path}`;
  if (typeof forms === 'string') return interpolate(forms, { count: formatted });
  const key = count === 0 ? 'zero' : count === 1 ? 'one' : 'other';
  const template = forms[key] ?? forms.other ?? '';
  return template.replace('{count}', formatted);
}

/** Libellé d'une valeur de taxonomie (région, niveau, type…). */
export function term(group: string, key?: string | null, locale: Locale = active): string {
  if (!key) return '';
  const path = `taxonomies.${group}.${key}`;
  const value = lookup(DICTS[locale], path) ?? lookup(DICTS[DEFAULT_LOCALE], path);
  return typeof value === 'string' ? value : key;
}

interface Translatable {
  i18n?: Partial<Record<Locale, Record<string, string>>>;
}

/**
 * Champ de contenu localisé : les contenus scientifiques gardent leur
 * titre d'origine, une traduction est utilisée si elle existe.
 */
export function localized(item: Translatable | null | undefined, field: string, locale: Locale = active): string {
  if (!item) return '';
  const override = item.i18n?.[locale]?.[field];
  if (override !== undefined) return override;
  const value = (item as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}
