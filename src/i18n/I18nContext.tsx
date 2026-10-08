/* =====================================================================
   Internationalisation — couche React
   ---------------------------------------------------------------------
   useI18n() fournit t, tn (pluriel), term (taxonomies), loc (contenu
   traduit) et href (lien préfixé par la langue courante).
   ===================================================================== */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Locale } from '../model/common';
import {
  DEFAULT_LOCALE,
  dirOf,
  localized,
  plural,
  setActiveLocale,
  term,
  translate,
  type Vars
} from './core';

export type QueryValue = string | number | null | undefined | ReadonlyArray<string | number>;
export type Query = Record<string, QueryValue>;

export function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value)) {
      (value as ReadonlyArray<string | number>).forEach((v) => {
        if (v !== '') params.append(key, String(v));
      });
    } else {
      params.append(key, String(value));
    }
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** localePath('fr', 'bibliotheque', { type: 'protocole' }) → /fr/bibliotheque?type=protocole */
export function localePath(locale: Locale, path = '', query?: Query): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return `/${locale}${clean ? `/${clean}` : ''}${buildQuery(query)}`;
}

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  /* Reporté immédiatement (et non dans un effet) : les enfants rendus
     dans ce même passage formatent déjà leurs dates dans la bonne langue. */
  setActiveLocale(locale);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export interface I18n {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  t: (path: string, vars?: Vars) => string;
  tn: (count: number, path: string) => string;
  term: (group: string, key?: string | null) => string;
  loc: (item: { i18n?: Partial<Record<Locale, Record<string, string>>> } | null | undefined, field: string) => string;
  href: (path?: string, query?: Query) => string;
}

export function useI18n(): I18n {
  const locale = useContext(LocaleContext);
  return useMemo<I18n>(
    () => ({
      locale,
      dir: dirOf(locale),
      t: (path, vars) => translate(path, vars, locale),
      tn: (count, path) => plural(count, path, locale),
      term: (group, key) => term(group, key, locale),
      loc: (item, field) => localized(item, field, locale),
      href: (path = '', query) => localePath(locale, path, query)
    }),
    [locale]
  );
}
