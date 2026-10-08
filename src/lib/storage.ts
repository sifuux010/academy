/* =====================================================================
   Persistance locale
   ---------------------------------------------------------------------
   Seul module qui touche au stockage du navigateur. Pour brancher une
   API réelle (Supabase, route handlers), c'est ce fichier — et lui
   seul — qu'il faut remplacer.

   Clés (identiques à la version précédente) :
     ka.users              comptes (empreinte + sel, jamais de mot de passe clair)
     ka.session            session courante
     ka.userState.<id>     favoris, progression, téléchargements, réglages
     ka.content            calque d'administration sur les contenus
     ka.subscriptions      demandes d'abonnement (partagées avec l'admin)
     ka.events             journal analytique (plafonné)
   ===================================================================== */
import type {
  AnalyticsEvent,
  ContentOverlay,
  Session,
  StoredUser,
  UserState
} from '../model/account';
import { notify } from '../state/store';

const PREFIX = 'ka.';
const VERSION = 1;
const memory = new Map<string, string>();

export const storageAvailable: boolean = (() => {
  try {
    const probe = `${PREFIX}probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
})();

interface WriteOptions {
  /** N'avertit pas l'interface (journal analytique, écritures techniques). */
  silent?: boolean;
}

export function read<T>(key: string, fallback: T): T {
  const full = PREFIX + key;
  try {
    const raw = storageAvailable ? window.localStorage.getItem(full) : (memory.get(full) ?? null);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown, options: WriteOptions = {}): boolean {
  const full = PREFIX + key;
  const raw = JSON.stringify(value);
  let ok = true;
  try {
    if (storageAvailable) window.localStorage.setItem(full, raw);
    else memory.set(full, raw);
  } catch {
    memory.set(full, raw);
    ok = false;
  }
  if (!options.silent) notify();
  return ok;
}

export function remove(key: string, options: WriteOptions = {}): void {
  const full = PREFIX + key;
  try {
    if (storageAvailable) window.localStorage.removeItem(full);
  } catch {
    /* stockage indisponible */
  }
  memory.delete(full);
  if (!options.silent) notify();
}

/* ------------------------------------------------------------ comptes */

export function getUsers(): StoredUser[] {
  return read<StoredUser[]>('users', []);
}

export function saveUsers(users: StoredUser[]): boolean {
  return write('users', users);
}

export function findUserByEmail(email: string): StoredUser | null {
  const needle = String(email || '').trim().toLowerCase();
  return getUsers().find((user) => user.email.toLowerCase() === needle) ?? null;
}

export function findUserById(id: string): StoredUser | null {
  return getUsers().find((user) => user.id === id) ?? null;
}

export function upsertUser(user: StoredUser): StoredUser {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === user.id);
  if (index >= 0) users[index] = user;
  else users.push(user);
  saveUsers(users);
  return user;
}

export function deleteUser(id: string): void {
  saveUsers(getUsers().filter((user) => user.id !== id));
  remove(`userState.${id}`);
}

/* ------------------------------------------------------------ session */

export function getSession(): Session | null {
  return read<Session | null>('session', null);
}

export function setSession(session: Session): boolean {
  return write('session', session);
}

export function clearSession(): void {
  remove('session');
}

/* --------------------------------------------------- état du membre -- */

export function defaultUserState(): UserState {
  return {
    favorites: [],
    downloads: [],
    viewed: [],
    enrollments: {},
    progress: {},
    quizScores: {},
    webinarRegistrations: [],
    certificates: [],
    searchHistory: [],
    settings: {
      notifications: {
        newResources: true,
        newCourses: true,
        webinarReminders: true,
        newsletter: false,
        productUpdates: true
      },
      privacy: { publicProfile: false, showEmail: false, analytics: true }
    }
  };
}

export function getUserState(userId?: string | null): UserState {
  const base = defaultUserState();
  if (!userId) return base;
  const stored = read<Partial<UserState> | null>(`userState.${userId}`, null);
  if (!stored) return base;
  return {
    ...base,
    ...stored,
    settings: {
      notifications: { ...base.settings.notifications, ...(stored.settings?.notifications ?? {}) },
      privacy: { ...base.settings.privacy, ...(stored.settings?.privacy ?? {}) }
    }
  };
}

export function setUserState(userId: string, state: UserState, options: WriteOptions = {}): boolean {
  return write(`userState.${userId}`, state, options);
}

/** Mutation atomique : mutateUserState(id, (state) => { state.x = … }) */
export function mutateUserState(
  userId: string,
  mutator: (state: UserState) => void,
  options: WriteOptions = {}
): UserState {
  const state = getUserState(userId);
  mutator(state);
  setUserState(userId, state, options);
  return state;
}

/* ------------------------------------------ calque de contenus (admin) */

export function getContentOverlay(): ContentOverlay {
  return read<ContentOverlay>('content', {});
}

export function upsertContent(collection: string, item: { id: string }): boolean {
  const overlay = getContentOverlay();
  const layer = overlay[collection] ?? { upsert: {}, deleted: [] };
  layer.upsert = { ...layer.upsert, [item.id]: item };
  layer.deleted = (layer.deleted ?? []).filter((id) => id !== item.id);
  overlay[collection] = layer;
  return write('content', overlay);
}

export function deleteContent(collection: string, id: string): boolean {
  const overlay = getContentOverlay();
  const layer = overlay[collection] ?? { upsert: {}, deleted: [] };
  const upsert = { ...layer.upsert };
  delete upsert[id];
  layer.upsert = upsert;
  layer.deleted = [...(layer.deleted ?? []), id];
  overlay[collection] = layer;
  return write('content', overlay);
}

export function resetContent(): void {
  remove('content');
}

/* ------------------------------------------------------- événements -- */

export function pushEvent(event: AnalyticsEvent): void {
  let events = read<AnalyticsEvent[]>('events', []);
  events.push(event);
  if (events.length > 400) events = events.slice(events.length - 400);
  /* silencieux : un suivi de page vue ne doit jamais redessiner l'interface */
  write('events', events, { silent: true });
}

export function getEvents(): AnalyticsEvent[] {
  return read<AnalyticsEvent[]>('events', []);
}

export function ensureVersion(): void {
  if (read<number | null>('version', null) !== VERSION) write('version', VERSION, { silent: true });
}
