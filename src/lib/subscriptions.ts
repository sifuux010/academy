/* =====================================================================
   Abonnements : demandes des membres, validation par l'administration
   ---------------------------------------------------------------------
     pending   → le membre a demandé une formule
     active    → approuvé : l'accès premium est ouvert
     rejected  → refusé (motif conservé)
     cancelled → annulé ou résilié par le membre
     expired   → calculé : l'échéance est dépassée

   Les demandes sont dans une clé partagée (ka.subscriptions) : l'admin
   doit pouvoir les lire. Aucun paiement n'est traité en ligne.
   ===================================================================== */
import type { PublicUser, Subscription, SubscriptionStatus } from '../model/account';
import type { Plan } from '../model/content';
import { track } from './analytics';
import { atLeast, currentUser, publicUser, sanitize } from './auth';
import { getById } from './content';
import { findUserById, read, write } from './storage';

const KEY = 'subscriptions';

function all(): Subscription[] {
  return read<Subscription[]>(KEY, []);
}

function save(list: Subscription[]): void {
  write(KEY, list);
}

function newId(): string {
  return `sub-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
}

/** Échéance selon la périodicité ; null pour les formules gratuites ou sur devis. */
export function endDate(plan: Plan | null, from?: string): string | null {
  if (!plan || plan.interval === 'free' || plan.interval === 'quote') return null;
  const end = from ? new Date(from) : new Date();
  if (plan.interval === 'year') end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end.toISOString();
}

export function isExpired(subscription: Subscription): boolean {
  return !!subscription.endsAt && new Date(subscription.endsAt).getTime() < Date.now();
}

export function statusOf(subscription: Subscription): SubscriptionStatus {
  if (subscription.status === 'active' && isExpired(subscription)) return 'expired';
  return subscription.status;
}

export interface SubscriptionEntry {
  subscription: Subscription;
  status: SubscriptionStatus;
  plan: Plan | null;
  user: PublicUser | null;
}

function decorate(subscription: Subscription): SubscriptionEntry {
  const user = findUserById(subscription.userId);
  return {
    subscription,
    status: statusOf(subscription),
    plan: getById('plans', subscription.planId),
    user: user ? publicUser(user) : null
  };
}

/* --------------------------------------------------------- côté membre */

export function mySubscriptions(): SubscriptionEntry[] {
  const user = currentUser();
  if (!user) return [];
  return all()
    .filter((s) => s.userId === user.id)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
    .map(decorate);
}

export function currentFor(userId: string): SubscriptionEntry | null {
  const active = all()
    .filter((s) => s.userId === userId && statusOf(s) === 'active')
    .sort(
      (a, b) =>
        new Date(b.approvedAt ?? b.requestedAt).getTime() - new Date(a.approvedAt ?? a.requestedAt).getTime()
    );
  return active.length ? decorate(active[0]) : null;
}

export function currentSubscription(): SubscriptionEntry | null {
  const user = currentUser();
  return user ? currentFor(user.id) : null;
}

export function pendingSubscription(): SubscriptionEntry | null {
  const user = currentUser();
  if (!user) return null;
  const found = all().find((s) => s.userId === user.id && s.status === 'pending');
  return found ? decorate(found) : null;
}

export type RequestResult =
  | { requiresAuth: true }
  | { error: 'plan-inconnu' | 'demande-en-cours' | 'deja-actif' }
  | { created: true; immediate: boolean; subscription: Subscription };

/** Une seule demande en attente à la fois ; la formule gratuite est immédiate. */
export function requestPlan(planId: string, note = ''): RequestResult {
  const user = currentUser();
  if (!user) return { requiresAuth: true };

  const plan = getById('plans', planId);
  if (!plan || plan.published === false) return { error: 'plan-inconnu' };
  if (pendingSubscription()) return { error: 'demande-en-cours' };

  const existing = currentFor(user.id);
  if (existing && existing.subscription.planId === planId) return { error: 'deja-actif' };

  const immediate = plan.interval === 'free';
  const now = new Date().toISOString();
  const subscription: Subscription = {
    id: newId(),
    userId: user.id,
    planId,
    status: immediate ? 'active' : 'pending',
    requestedAt: now,
    approvedAt: immediate ? now : null,
    approvedBy: immediate ? 'auto' : null,
    endsAt: immediate ? endDate(plan, now) : null,
    note: sanitize(note, 400),
    decisionNote: '',
    history: [{ at: now, status: immediate ? 'active' : 'pending', by: user.id }]
  };
  save([...all(), subscription]);
  track('subscription_requested', { planId, immediate });
  return { created: true, immediate, subscription };
}

export function cancelSubscription(subscriptionId: string): { requiresAuth: true } | { cancelled: boolean } {
  const user = currentUser();
  if (!user) return { requiresAuth: true };
  let changed = false;
  const list = all().map((s) => {
    if (s.id !== subscriptionId || s.userId !== user.id) return s;
    if (s.status !== 'pending' && s.status !== 'active') return s;
    changed = true;
    const at = new Date().toISOString();
    return { ...s, status: 'cancelled' as const, cancelledAt: at, history: [...s.history, { at, status: 'cancelled' as const, by: user.id }] };
  });
  if (changed) {
    save(list);
    track('subscription_cancelled', { id: subscriptionId });
  }
  return { cancelled: changed };
}

/* ------------------------------------------------ côté administration */

export type SubscriptionFilter = SubscriptionStatus | 'all';

export function listSubscriptions(filter: SubscriptionFilter = 'all'): SubscriptionEntry[] {
  if (!atLeast('ADMIN')) return [];
  const order: Record<SubscriptionStatus, number> = { pending: 0, active: 1, expired: 2, rejected: 3, cancelled: 4 };
  return all()
    .map(decorate)
    .filter((entry) => filter === 'all' || entry.status === filter)
    .sort((a, b) => {
      const diff = order[a.status] - order[b.status];
      if (diff !== 0) return diff;
      return new Date(b.subscription.requestedAt).getTime() - new Date(a.subscription.requestedAt).getTime();
    });
}

export function subscriptionCounts(): Record<SubscriptionStatus | 'total', number> {
  const counts: Record<SubscriptionStatus | 'total', number> = {
    pending: 0,
    active: 0,
    rejected: 0,
    cancelled: 0,
    expired: 0,
    total: 0
  };
  all().forEach((s) => {
    counts[statusOf(s)] += 1;
    counts.total += 1;
  });
  return counts;
}

type Decision = { forbidden: true } | { done: boolean; subscription: Subscription | null };

function decide(subscriptionId: string, apply: (s: Subscription, adminId: string, at: string) => Subscription): Decision {
  if (!atLeast('ADMIN')) return { forbidden: true };
  const admin = currentUser();
  if (!admin) return { forbidden: true };
  let updated: Subscription | null = null;
  const at = new Date().toISOString();
  const list = all().map((s) => {
    if (s.id !== subscriptionId) return s;
    updated = apply(s, admin.id, at);
    return updated;
  });
  if (updated) save(list);
  return { done: !!updated, subscription: updated };
}

export function approveSubscription(subscriptionId: string, note = '', endsAt?: string): Decision {
  const result = decide(subscriptionId, (s, adminId, at) => ({
    ...s,
    status: 'active',
    approvedAt: at,
    approvedBy: adminId,
    endsAt: endsAt ?? endDate(getById('plans', s.planId), at),
    decisionNote: sanitize(note, 400),
    history: [...s.history, { at, status: 'active', by: adminId }]
  }));
  if ('done' in result && result.done) track('subscription_approved', { id: subscriptionId });
  return result;
}

export function rejectSubscription(subscriptionId: string, note = ''): Decision {
  const result = decide(subscriptionId, (s, adminId, at) => ({
    ...s,
    status: 'rejected',
    rejectedAt: at,
    approvedBy: adminId,
    decisionNote: sanitize(note, 400),
    history: [...s.history, { at, status: 'rejected', by: adminId }]
  }));
  if ('done' in result && result.done) track('subscription_rejected', { id: subscriptionId });
  return result;
}

export function removeSubscription(subscriptionId: string): boolean {
  if (!atLeast('ADMIN')) return false;
  save(all().filter((s) => s.id !== subscriptionId));
  return true;
}

/** Accès premium effectif : drapeau de compte ou abonnement actif ouvrant le premium. */
export function grantsPremium(userId: string): boolean {
  const user = findUserById(userId);
  if (user?.premium) return true;
  const entry = currentFor(userId);
  return !!entry?.plan?.premium;
}
