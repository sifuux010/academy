/* =====================================================================
   Formatage : dates, durées, tailles, nombres, normalisation de recherche
   Toutes les fonctions suivent la langue active (fr / en / ar).
   ===================================================================== */
import { getLocale, translate } from '../i18n/core';

const LOCALE_TAGS = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-DZ' } as const;

type DateInput = string | number | Date | null | undefined;

export function localeTag(): string {
  return LOCALE_TAGS[getLocale()];
}

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: DateInput, opts?: Intl.DateTimeFormatOptions): string {
  const d = toDate(value);
  if (!d) return '';
  try {
    return d.toLocaleDateString(localeTag(), opts ?? { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function formatDateShort(value: DateInput): string {
  return formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatMonthYear(value: DateInput): string {
  return formatDate(value, { year: 'numeric', month: 'long' });
}

export function formatTime(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '';
  try {
    return d.toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' });
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

/** 95 → « 1 h 35 min » */
export function formatDuration(minutes: number): string {
  const m = Number(minutes) || 0;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  const hShort = translate('common.units.hShort');
  const mShort = translate('common.units.mShort');
  if (h && rest) return `${h} ${hShort} ${rest} ${mShort}`;
  if (h) return `${h} ${hShort}`;
  return `${m} ${mShort}`;
}

export function formatFileSize(kb: number): string {
  const k = Number(kb) || 0;
  if (k >= 1024) return `${(k / 1024).toFixed(1).replace('.0', '')} MB`;
  return `${k} KB`;
}

export function formatNumber(value: number): string {
  try {
    return Number(value).toLocaleString(localeTag());
  } catch {
    return String(value);
  }
}

export function formatPercent(value: number): string {
  return `${Math.round(Number(value) || 0)} %`;
}

/** « dans 3 jours », « il y a 2 mois » */
export function formatRelative(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '';
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const day = 86_400_000;
  let unit: Intl.RelativeTimeFormatUnit = 'day';
  let amount = Math.round(diff / day);
  if (abs < 3_600_000) {
    unit = 'minute';
    amount = Math.round(diff / 60_000);
  } else if (abs < day) {
    unit = 'hour';
    amount = Math.round(diff / 3_600_000);
  } else if (abs > day * 60) {
    unit = 'month';
    amount = Math.round(diff / (day * 30));
  }
  try {
    return new Intl.RelativeTimeFormat(localeTag(), { numeric: 'auto' }).format(amount, unit);
  } catch {
    return formatDateShort(d);
  }
}

export function initials(first?: string, last?: string): string {
  const a = (first ?? '').trim();
  const b = (last ?? '').trim();
  return ((a ? a[0] : '') + (b ? b[0] : '') || '?').toUpperCase();
}

/* Plages Unicode, écrites en séquences d'échappement :
     ̀-ͯ  diacritiques latines (é, à, ü…)
     ً-ٟ  tashkil arabe (fatha, damma, sukun…) + ٰ
     ؀-ۿ  bloc arabe
   Les ligatures (œ, æ) ne se décomposent pas en NFD : elles sont
   translittérées explicitement, sinon « lymphœdème » serait introuvable
   depuis « lymphoedeme ». */
const RE_LATIN_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');
const RE_ARABIC_MARKS = new RegExp('[\\u064b-\\u065f\\u0670]', 'g');
const RE_NON_SLUG = new RegExp('[^a-z0-9\\u0600-\\u06ff]+', 'g');
const RE_OE = new RegExp('\\u0153', 'g');
const RE_AE = new RegExp('\\u00e6', 'g');

/** Minuscules, sans diacritiques latins ni arabes, ligatures dépliées. */
export function normalize(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(RE_OE, 'oe')
    .replace(RE_AE, 'ae')
    .normalize('NFD')
    .replace(RE_LATIN_MARKS, '')
    .replace(RE_ARABIC_MARKS, '');
}

export function slugify(value: unknown): string {
  return normalize(value)
    .replace(RE_NON_SLUG, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function truncate(value: unknown, max: number): string {
  const s = String(value ?? '');
  return s.length > max ? `${s.slice(0, max - 1).trim()}…` : s;
}
