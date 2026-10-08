/* =====================================================================
   Référencement : titre, méta-description, Open Graph, URL canonique,
   données structurées schema.org.
   ===================================================================== */
import { getLocale, translate } from '../i18n/core';
import type { Course, Resource, Webinar } from '../model/content';
import { authorName, titleOf } from './content';

export const SITE = 'KINEDOK ACADÉMIE';
export const BASE_URL = 'https://academie.kinedokdz.com';

export interface SeoOptions {
  title?: string | null;
  description?: string;
  /** Chemin canonique sans le préfixe de langue. */
  path?: string;
  type?: string;
  jsonLd?: Record<string, unknown> | null;
}

function upsertMeta(selector: string, attribute: string, name: string, content: string): void {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, name);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

function structuredData(json: Record<string, unknown> | null | undefined): void {
  document.getElementById('ka-jsonld')?.remove();
  if (!json) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'ka-jsonld';
  script.textContent = JSON.stringify(json);
  document.head.appendChild(script);
}

export function applySeo(options: SeoOptions): void {
  const locale = getLocale();
  const fullTitle = options.title
    ? `${options.title} — ${SITE}`
    : `${SITE} — ${translate('common.brand.subtitle')}`;
  const description = options.description || translate('home.hero.subtitle');
  const path = (options.path ?? '').replace(/^\/+/, '');
  const canonical = `${BASE_URL}/${locale}${path ? `/${path}` : ''}`;

  document.title = fullTitle;
  document.documentElement.setAttribute('lang', locale);
  upsertMeta('meta[name="description"]', 'name', 'description', description);
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
  upsertMeta('meta[property="og:type"]', 'property', 'og:type', options.type ?? 'website');
  upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', locale);
  upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  upsertLink('canonical', canonical);
  structuredData(options.jsonLd);
}

export function courseJsonLd(course: Course): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: titleOf(course),
    description: course.description,
    inLanguage: course.language,
    provider: { '@type': 'Organization', name: SITE, url: BASE_URL },
    instructor: { '@type': 'Person', name: authorName(course.instructorId) }
  };
}

export function webinarJsonLd(webinar: Webinar): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: titleOf(webinar),
    description: webinar.description,
    startDate: webinar.startsAt,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    organizer: { '@type': 'Organization', name: SITE, url: BASE_URL },
    performer: { '@type': 'Person', name: authorName(webinar.speakerId) }
  };
}

export function resourceJsonLd(resource: Resource): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: titleOf(resource),
    description: resource.description,
    datePublished: resource.publishedAt,
    inLanguage: resource.language,
    author: { '@type': 'Person', name: authorName(resource.authorId) },
    publisher: { '@type': 'Organization', name: SITE }
  };
}
