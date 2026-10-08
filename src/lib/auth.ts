/* =====================================================================
   Comptes, sessions, rôles
   ---------------------------------------------------------------------
   PORTÉE DE CETTE IMPLÉMENTATION
   Version sans serveur : les mots de passe ne sont jamais stockés en
   clair — ils sont dérivés en PBKDF2-SHA-256 (150 000 itérations, sel
   aléatoire par compte) via WebCrypto. En production, cette même API
   est servie par le back-end : Argon2id côté serveur, cookie de session
   HttpOnly + SameSite, vérification d'e-mail réelle, limitation de débit.

   Les erreurs renvoient des CLÉS de traduction (auth.errors.*) : le
   composant qui les affiche les traduit dans la langue courante.

   ⚠ Les mots de passe des comptes de démonstration figurent en clair
   ci-dessous (DEMO_USERS). Ils ne doivent pas être déployés tels quels :
   le compte d'administration réel se crée côté serveur.
   ===================================================================== */
import { getLocale } from '../i18n/core';
import type { PublicUser, StoredUser } from '../model/account';
import type { ProfileType, Role } from '../model/common';
import { track } from './analytics';
import { slugify } from './format';
import * as storage from './storage';

export const ROLE_LEVEL: Record<Role, number> = {
  STUDENT: 10,
  PHYSIOTHERAPIST: 10,
  INSTRUCTOR: 20,
  CONTENT_EDITOR: 30,
  ADMIN: 40,
  SUPER_ADMIN: 50
};

export const ROLES = Object.keys(ROLE_LEVEL) as Role[];

const ITERATIONS = 150_000;
const SESSION_TTL_DAYS = 30;

/** Échec d'authentification : clés de traduction, jamais de texte en dur. */
export interface AuthFailure {
  message?: string;
  fields?: Record<string, string>;
}

/* ------------------------------------------------------- utilitaires */

function randomHex(bytes = 16): string {
  const array = new Uint8Array(bytes);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(array);
  else for (let i = 0; i < array.length; i += 1) array[i] = Math.floor(Math.random() * 256);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

/* Repli non cryptographique, uniquement si WebCrypto est indisponible
   (contexte non sécurisé). Le préfixe « insecure$ » le rend explicite. */
function fallbackHash(value: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < value.length; i += 1) {
    h1 = (h1 ^ value.charCodeAt(i)) >>> 0;
    h1 = Math.imul(h1, 16777619) >>> 0;
    h2 = (h2 + value.charCodeAt(i) * (i + 7)) >>> 0;
  }
  return h1.toString(16) + h2.toString(16);
}

async function derive(password: string, salt: string): Promise<string> {
  const subtle = window.crypto?.subtle;
  if (!subtle) return `insecure$${fallbackHash(`${password}|${salt}`)}`;
  const encoder = new TextEncoder();
  const key = await subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return `pbkdf2$${ITERATIONS}$${bufferToHex(bits)}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------------------------------- validation */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(String(email ?? '').trim());
}

export function isStrongPassword(password: string): boolean {
  const value = String(password ?? '');
  return value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value);
}

/** Nettoyage des entrées texte avant stockage (défense en profondeur). */
export function sanitize(value: unknown, maxLength = 180): string {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export interface RegisterPayload {
  profileType: ProfileType | '';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  password: string;
  passwordConfirm: string;
  terms: boolean;
  newsletter: boolean;
  university?: string;
  academicYear?: string;
  graduationYear?: string;
  profStatus?: string;
  workplace?: string;
  experienceYears?: string;
}

export function validateRegistration(p: RegisterPayload): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!p.profileType) errors.profileType = 'auth.errors.profileRequired';
  if (!p.firstName.trim()) errors.firstName = 'auth.errors.required';
  if (!p.lastName.trim()) errors.lastName = 'auth.errors.required';
  if (!isValidEmail(p.email)) errors.email = 'auth.errors.emailInvalid';
  else if (storage.findUserByEmail(p.email)) errors.email = 'auth.errors.emailTaken';
  if (!isStrongPassword(p.password)) errors.password = 'auth.errors.passwordWeak';
  if (p.password !== p.passwordConfirm) errors.passwordConfirm = 'auth.errors.passwordMismatch';
  if (!p.country) errors.country = 'auth.errors.required';
  if (!p.terms) errors.terms = 'auth.errors.termsRequired';
  return errors;
}

/* ---------------------------------------------------------- comptes */

export function publicUser(user: StoredUser): PublicUser {
  const { salt: _salt, passwordHash: _hash, resetToken: _token, ...rest } = user;
  void _salt;
  void _hash;
  void _token;
  return rest;
}

function openSession(user: StoredUser, remember: boolean): void {
  storage.setSession({
    userId: user.id,
    token: randomHex(24),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString(),
    remember
  });
}

function blankProfile(): Omit<
  StoredUser,
  'id' | 'email' | 'firstName' | 'lastName' | 'profileType' | 'role' | 'salt' | 'passwordHash' | 'createdAt' | 'lastLoginAt'
> {
  return {
    phone: '',
    country: '',
    city: '',
    status: 'active',
    emailVerified: true, // en production : faux jusqu'à validation du lien
    locale: getLocale(),
    avatar: '',
    bio: '',
    expertise: [],
    interests: [],
    languages: [],
    website: '',
    linkedin: '',
    profStatus: '',
    workplace: '',
    experienceYears: '',
    licenseNumber: '',
    university: '',
    academicYear: '',
    graduationYear: '',
    newsletter: false
  };
}

export async function register(payload: RegisterPayload): Promise<PublicUser> {
  const errors = validateRegistration(payload);
  if (Object.keys(errors).length) throw { fields: errors } satisfies AuthFailure;

  const salt = randomHex(16);
  const hash = await derive(payload.password, salt);
  const now = new Date().toISOString();
  const profileType: ProfileType = payload.profileType === 'STUDENT' ? 'STUDENT' : 'PHYSIOTHERAPIST';

  const user: StoredUser = {
    ...blankProfile(),
    id: `usr-${randomHex(8)}`,
    email: sanitize(payload.email, 160).toLowerCase(),
    firstName: sanitize(payload.firstName, 60),
    lastName: sanitize(payload.lastName, 60),
    phone: sanitize(payload.phone, 30),
    country: sanitize(payload.country, 60),
    city: sanitize(payload.city, 60),
    profileType,
    role: profileType,
    newsletter: !!payload.newsletter,
    university: sanitize(payload.university, 120),
    academicYear: sanitize(payload.academicYear, 40),
    graduationYear: sanitize(payload.graduationYear, 8),
    profStatus: sanitize(payload.profStatus, 80),
    workplace: sanitize(payload.workplace, 120),
    experienceYears: sanitize(payload.experienceYears, 4),
    salt,
    passwordHash: hash,
    createdAt: now,
    lastLoginAt: now
  };

  storage.upsertUser(user);
  storage.setUserState(user.id, storage.defaultUserState());
  openSession(user, true);
  track('registration', { profileType: user.profileType, country: user.country });
  return publicUser(user);
}

export async function login(email: string, password: string, remember: boolean): Promise<PublicUser> {
  const user = storage.findUserByEmail(email);
  if (!user) {
    /* Dérivation malgré tout : ne pas révéler l'existence d'un compte
       par la durée de la réponse. */
    await derive(String(password ?? ''), 'dummy-salt');
    throw { message: 'auth.errors.credentials' } satisfies AuthFailure;
  }
  if (user.status === 'suspended') throw { message: 'auth.errors.accountSuspended' } satisfies AuthFailure;

  const hash = await derive(password, user.salt);
  if (!timingSafeEqual(hash, user.passwordHash)) throw { message: 'auth.errors.credentials' } satisfies AuthFailure;

  const updated: StoredUser = { ...user, lastLoginAt: new Date().toISOString() };
  storage.upsertUser(updated);
  openSession(updated, remember);
  track('login', { userId: user.id });
  return publicUser(updated);
}

export function logout(): void {
  const user = currentUser();
  storage.clearSession();
  if (user) track('logout', { userId: user.id });
}

export function currentUser(): PublicUser | null {
  const session = storage.getSession();
  if (!session) return null;
  if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
    storage.clearSession();
    return null;
  }
  const user = storage.findUserById(session.userId);
  if (!user || user.status === 'suspended') return null;
  return publicUser(user);
}

export function isAuthenticated(): boolean {
  return currentUser() !== null;
}

export type EditableField =
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'country'
  | 'city'
  | 'bio'
  | 'avatar'
  | 'expertise'
  | 'interests'
  | 'languages'
  | 'website'
  | 'linkedin'
  | 'profStatus'
  | 'workplace'
  | 'experienceYears'
  | 'licenseNumber'
  | 'university'
  | 'academicYear'
  | 'graduationYear'
  | 'locale'
  | 'newsletter';

const EDITABLE: EditableField[] = [
  'firstName', 'lastName', 'phone', 'country', 'city', 'bio', 'avatar', 'expertise', 'interests',
  'languages', 'website', 'linkedin', 'profStatus', 'workplace', 'experienceYears', 'licenseNumber',
  'university', 'academicYear', 'graduationYear', 'locale', 'newsletter'
];

export function updateProfile(patch: Partial<Pick<StoredUser, EditableField>>): PublicUser | null {
  const user = currentUser();
  if (!user) return null;
  const record = storage.findUserById(user.id);
  if (!record) return null;
  const next: StoredUser = { ...record };
  const target = next as unknown as Record<string, unknown>;
  (Object.keys(patch) as (keyof typeof patch)[]).forEach((key) => {
    if (!EDITABLE.includes(key)) return;
    const value = patch[key];
    if (Array.isArray(value)) target[key] = value.map((v) => sanitize(v, 80));
    else if (typeof value === 'boolean') target[key] = value;
    else target[key] = sanitize(value, key === 'bio' ? 1200 : 180);
  });
  next.updatedAt = new Date().toISOString();
  storage.upsertUser(next);
  return publicUser(next);
}

/** Change l'adresse e-mail. Renvoie null si réussi, sinon l'erreur. */
export function changeEmail(newEmail: string): AuthFailure | null {
  const user = currentUser();
  if (!user) return { message: 'common.states.authRequiredTitle' };
  if (!isValidEmail(newEmail)) return { fields: { email: 'auth.errors.emailInvalid' } };
  const existing = storage.findUserByEmail(newEmail);
  if (existing && existing.id !== user.id) return { fields: { email: 'auth.errors.emailTaken' } };
  const record = storage.findUserById(user.id);
  if (!record) return { message: 'common.toast.genericError' };
  storage.upsertUser({ ...record, email: sanitize(newEmail, 160).toLowerCase() });
  return null;
}

export async function changePassword(current: string, next: string): Promise<void> {
  const user = currentUser();
  if (!user) throw { message: 'common.states.authRequiredTitle' } satisfies AuthFailure;
  const record = storage.findUserById(user.id);
  if (!record) throw { message: 'common.toast.genericError' } satisfies AuthFailure;
  const hash = await derive(current, record.salt);
  if (!timingSafeEqual(hash, record.passwordHash)) {
    throw { fields: { currentPassword: 'auth.errors.currentPasswordWrong' } } satisfies AuthFailure;
  }
  if (!isStrongPassword(next)) throw { fields: { newPassword: 'auth.errors.passwordWeak' } } satisfies AuthFailure;
  const salt = randomHex(16);
  const newHash = await derive(next, salt);
  storage.upsertUser({ ...record, salt, passwordHash: newHash, passwordChangedAt: new Date().toISOString() });
}

/** Réponse identique que le compte existe ou non (pas d'énumération). */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = storage.findUserByEmail(email);
  if (user) {
    storage.upsertUser({
      ...user,
      resetToken: { token: randomHex(20), expiresAt: new Date(Date.now() + 3_600_000).toISOString() }
    });
  }
}

export function deleteAccount(): boolean {
  const user = currentUser();
  if (!user) return false;
  storage.deleteUser(user.id);
  storage.clearSession();
  return true;
}

/* --------------------------------------------------- autorisations -- */

export function hasRole(roles: Role | Role[]): boolean {
  const user = currentUser();
  if (!user) return false;
  return (Array.isArray(roles) ? roles : [roles]).includes(user.role);
}

export function atLeast(role: Role): boolean {
  const user = currentUser();
  if (!user) return false;
  return (ROLE_LEVEL[user.role] ?? 0) >= ROLE_LEVEL[role];
}

export function canManageContent(): boolean {
  return atLeast('CONTENT_EDITOR');
}

export function canManageUsers(): boolean {
  return atLeast('ADMIN');
}

/* ------------------------------------------ administration des membres */

export function listUsers(): PublicUser[] {
  if (!canManageUsers()) return [];
  return storage.getUsers().map(publicUser);
}

export function adminSetRole(userId: string, role: Role): boolean {
  const me = currentUser();
  if (!canManageUsers() || !me || me.id === userId) return false;
  const record = storage.findUserById(userId);
  if (!record) return false;
  storage.upsertUser({ ...record, role });
  return true;
}

export function adminToggleStatus(userId: string): boolean {
  const me = currentUser();
  if (!canManageUsers() || !me || me.id === userId) return false;
  const record = storage.findUserById(userId);
  if (!record) return false;
  storage.upsertUser({ ...record, status: record.status === 'suspended' ? 'active' : 'suspended' });
  return true;
}

export function adminDeleteUser(userId: string): boolean {
  const me = currentUser();
  if (!canManageUsers() || !me || me.id === userId) return false;
  storage.deleteUser(userId);
  return true;
}

/* --------------------------- comptes de démonstration (premier lancement) */

interface DemoUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileType: ProfileType;
  role: Role;
  country: string;
  city: string;
  phone?: string;
  profStatus?: string;
  workplace?: string;
  experienceYears?: string;
  university?: string;
  academicYear?: string;
  graduationYear?: string;
  expertise?: string[];
  interests?: string[];
  languages?: string[];
  bio?: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'demo@kinedokdz.com', password: 'Demo2024!',
    firstName: 'Amine', lastName: 'Benyahia', profileType: 'PHYSIOTHERAPIST', role: 'PHYSIOTHERAPIST',
    country: 'Algérie', city: 'Alger', phone: '+213 555 00 00 00',
    profStatus: 'Libéral / cabinet privé', workplace: 'Cabinet Benyahia', experienceYears: '7',
    expertise: ['Musculo-squelettique', 'Sport'], languages: ['Français', 'Arabe'],
    bio: 'Kinésithérapeute libéral, intéressé par la rééducation du sportif et la gestion de la charge.'
  },
  {
    email: 'etudiant@kinedokdz.com', password: 'Etudiant2024!',
    firstName: 'Lina', lastName: 'Kaced', profileType: 'STUDENT', role: 'STUDENT',
    country: 'Algérie', city: 'Oran',
    university: 'Institut de formation paramédicale d’Oran', academicYear: '3e année', graduationYear: '2027',
    interests: ['Neurologie', 'Sport'], languages: ['Français', 'Arabe', 'Anglais'],
    bio: 'Étudiante en 3e année, je prépare mon mémoire sur la rééducation post-AVC.'
  },
  {
    /* Compte d'administration principal : contenus de toutes les sections,
       membres et abonnements. */
    email: 'master@kinedokdz.com', password: 'KinedokMaster2026!',
    firstName: 'Administration', lastName: 'KINEDOK', profileType: 'PHYSIOTHERAPIST', role: 'SUPER_ADMIN',
    country: 'Algérie', city: 'Alger',
    profStatus: 'Enseignant / formateur', workplace: 'KINEDOK ACADÉMIE', experienceYears: '15',
    expertise: ['Musculo-squelettique', 'Recherche clinique'], languages: ['Français', 'Arabe', 'Anglais'],
    bio: 'Compte d’administration principal : contenus, membres et abonnements.'
  },
  {
    email: 'admin@kinedokdz.com', password: 'Admin2024!',
    firstName: 'Équipe', lastName: 'KINEDOK', profileType: 'PHYSIOTHERAPIST', role: 'SUPER_ADMIN',
    country: 'Algérie', city: 'Alger',
    profStatus: 'Enseignant / formateur', workplace: 'KINEDOK ACADÉMIE', experienceYears: '12',
    expertise: ['Musculo-squelettique', 'Recherche clinique'], languages: ['Français', 'Arabe', 'Anglais'],
    bio: 'Compte d’administration secondaire de la plateforme de démonstration.'
  }
];

export const DEMO_ACCOUNTS = DEMO_USERS.map(({ email, password, role }) => ({ email, password, role }));

/** Crée les comptes de démonstration manquants au premier lancement. */
export async function seedDemoUsers(): Promise<boolean> {
  const pending = DEMO_USERS.filter((demo) => !storage.findUserByEmail(demo.email));
  if (!pending.length) return false;
  for (const demo of pending) {
    const salt = randomHex(16);
    const hash = await derive(demo.password, salt);
    const now = new Date().toISOString();
    const user: StoredUser = {
      ...blankProfile(),
      id: `usr-demo-${slugify(demo.email.split('@')[0])}`,
      email: demo.email,
      firstName: demo.firstName,
      lastName: demo.lastName,
      phone: demo.phone ?? '',
      country: demo.country,
      city: demo.city,
      profileType: demo.profileType,
      role: demo.role,
      locale: 'fr',
      bio: demo.bio ?? '',
      expertise: demo.expertise ?? [],
      interests: demo.interests ?? [],
      languages: demo.languages ?? [],
      profStatus: demo.profStatus ?? '',
      workplace: demo.workplace ?? '',
      experienceYears: demo.experienceYears ?? '',
      university: demo.university ?? '',
      academicYear: demo.academicYear ?? '',
      graduationYear: demo.graduationYear ?? '',
      newsletter: true,
      salt,
      passwordHash: hash,
      createdAt: now,
      lastLoginAt: now,
      demo: true
    };
    storage.upsertUser(user);
    storage.setUserState(user.id, storage.defaultUserState());
  }
  return true;
}
