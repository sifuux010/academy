/* =====================================================================
   Journal d'événements produit
   ---------------------------------------------------------------------
   Les événements attendus sont nommés ici une fois pour toutes ;
   brancher un outil réel (Plausible, Matomo, GA4 ou une table
   AnalyticsEvent) se fait dans track() sans toucher au reste.
   Aucune donnée de santé n'est journalisée. Le réglage de
   confidentialité du membre est respecté.
   ===================================================================== */
import { getLocale } from '../i18n/core';
import { getEvents, getSession, getUserState, pushEvent } from './storage';

export const EVENTS = [
  'registration',
  'login',
  'logout',
  'page_view',
  'locale_changed',
  'resource_viewed',
  'resource_downloaded',
  'tool_downloaded',
  'favorite_added',
  'favorite_removed',
  'search_performed',
  'course_started',
  'lesson_completed',
  'quiz_completed',
  'webinar_registration',
  'webinar_attendance',
  'certificate_earned',
  'subscription_requested',
  'subscription_approved',
  'subscription_rejected',
  'subscription_cancelled'
] as const;

export type EventName = (typeof EVENTS)[number];

/* Lecture directe de la session (et non via lib/auth) pour éviter une
   dépendance circulaire auth ↔ analytics. */
function allowed(): boolean {
  const session = getSession();
  if (!session) return true; // visiteur anonyme : compteurs agrégés uniquement
  return getUserState(session.userId).settings.privacy.analytics !== false;
}

export function track(name: EventName, payload: Record<string, unknown> = {}): void {
  if (!allowed()) return;
  pushEvent({ name, payload, locale: getLocale(), at: new Date().toISOString() });
}

export function trackPageView(path: string): void {
  track('page_view', { path });
}

export function analyticsSummary(): { total: number; counts: Record<string, number> } {
  const events = getEvents();
  const counts: Record<string, number> = {};
  events.forEach((event) => {
    counts[event.name] = (counts[event.name] ?? 0) + 1;
  });
  return { total: events.length, counts };
}
