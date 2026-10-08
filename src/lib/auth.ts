/* =====================================================================
   Comptes, sessions, rôles — client de l'API Django
   ---------------------------------------------------------------------
   L'authentification est servie par le back-end : session Django (cookie
   HttpOnly), Argon2id, vérification réelle. Le compte courant est chargé
   une fois au démarrage (`hydrateSession`, GET /auth/me/) puis gardé en
   mémoire pour que `currentUser()` reste synchrone — toutes les pages le
   lisent pendant le rendu. Chaque mutation met à jour ce cache et appelle
   `notify()` pour redessiner l'interface.

   L'API parle en snake_case ; l'interface en camelCase (`PublicUser`).
   La conversion se fait ici, au seul point de contact.
   ===================================================================== */
import { getLocale } from '../i18n/core';
import type { PublicUser } from '../model/account';
import type { ProfileType, Role } from '../model/common';
import { notify } from '../state/store';
import { api, ApiError, get, post } from './api';
import { track } from './analytics';

export const ROLE_LEVEL: Record<Role, number> = {
  STUDENT: 10,
  PHYSIOTHERAPIST: 10,
  INSTRUCTOR: 20,
  CONTENT_EDITOR: 30,
  ADMIN: 40,
  SUPER_ADMIN: 50
};

export const ROLES = Object.keys(ROLE_LEVEL) as Role[];

/** Échec d'authentification : clés de traduction, jamais de texte en dur. */
export interface AuthFailure {
  message?: string;
  fields?: Record<string, string>;
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

/** Nettoyage des entrées texte avant envoi (défense en profondeur). */
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
  if (!isStrongPassword(p.password)) errors.password = 'auth.errors.passwordWeak';
  if (p.password !== p.passwordConfirm) errors.passwordConfirm = 'auth.errors.passwordMismatch';
  if (!p.country) errors.country = 'auth.errors.required';
  if (!p.terms) errors.terms = 'auth.errors.termsRequired';
  return errors;
}

/* ---------------------------------------------- correspondance API -- */

type ApiUser = Record<string, unknown>;

function str(value: unknown): string {
  return value == null ? '' : String(value);
}

function numericStr(value: unknown): string {
  return value == null || value === '' ? '' : String(value);
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

/** Réponse de l'API (snake_case) → `PublicUser` (camelCase). */
function mapUser(d: ApiUser): PublicUser {
  return {
    id: str(d.id),
    email: str(d.email),
    firstName: str(d.first_name),
    lastName: str(d.last_name),
    phone: str(d.phone),
    country: str(d.country),
    city: str(d.city),
    profileType: (str(d.profile_type) || 'PHYSIOTHERAPIST') as ProfileType,
    role: (str(d.role) || 'PHYSIOTHERAPIST') as Role,
    status: d.status === 'suspended' ? 'suspended' : 'active',
    emailVerified: !!d.email_verified,
    locale: str(d.locale) || 'fr',
    avatar: str(d.avatar_url),
    bio: str(d.bio),
    expertise: list(d.expertise),
    interests: list(d.interests),
    languages: list(d.languages),
    website: str(d.website),
    linkedin: str(d.linkedin),
    profStatus: str(d.prof_status),
    workplace: str(d.workplace),
    experienceYears: numericStr(d.experience_years),
    licenseNumber: str(d.license_number),
    university: str(d.university),
    academicYear: str(d.academic_year),
    graduationYear: numericStr(d.graduation_year),
    newsletter: !!d.newsletter,
    premium: !!d.premium,
    createdAt: str(d.created_at),
    lastLoginAt: str(d.last_login_at) || str(d.created_at),
    updatedAt: str(d.updated_at) || undefined
  };
}

/* Noms de champs : l'API les renvoie en snake_case, les formulaires de
   l'interface les attendent en camelCase. */
const FIELD_TO_CAMEL: Record<string, string> = {
  first_name: 'firstName',
  last_name: 'lastName',
  password_confirm: 'passwordConfirm',
  current_password: 'currentPassword',
  new_password: 'newPassword',
  profile_type: 'profileType',
  prof_status: 'profStatus',
  experience_years: 'experienceYears',
  license_number: 'licenseNumber',
  academic_year: 'academicYear',
  graduation_year: 'graduationYear',
  avatar_url: 'avatar'
};

function firstKey(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.length ? firstKey(value[0]) : '';
  if (value && typeof value === 'object') {
    const entries = Object.values(value as Record<string, unknown>);
    return entries.length ? firstKey(entries[0]) : '';
  }
  return '';
}

/** Erreur de l'API → `AuthFailure` (message global ou erreurs par champ). */
function toFailure(error: unknown): AuthFailure {
  if (error instanceof ApiError) {
    const payload = error.payload;
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;
      if ('detail' in record) return { message: firstKey(record.detail) || 'common.toast.genericError' };
      const fields: Record<string, string> = {};
      for (const [key, value] of Object.entries(record)) {
        fields[FIELD_TO_CAMEL[key] ?? key] = firstKey(value);
      }
      if (Object.keys(fields).length) return { fields };
    }
    return { message: error.key ?? 'common.toast.genericError' };
  }
  return { message: 'common.toast.genericError' };
}

function intOrNull(value: unknown): number | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------ compte courant --- */

let cachedUser: PublicUser | null = null;
let hydrated = false;

/** Charge le compte courant au démarrage de l'application. */
export async function hydrateSession(): Promise<void> {
  try {
    const data = await get<ApiUser>('/auth/me/');
    cachedUser = mapUser(data);
  } catch {
    cachedUser = null;
  } finally {
    hydrated = true;
    notify();
  }
}

export function isSessionHydrated(): boolean {
  return hydrated;
}

export function currentUser(): PublicUser | null {
  return cachedUser;
}

export function isAuthenticated(): boolean {
  return cachedUser !== null;
}

/** Sans secret à retirer côté API : l'utilisateur est déjà « public ». */
export function publicUser(user: PublicUser): PublicUser {
  return user;
}

/* ------------------------------------------------- inscription ---- */

export async function register(payload: RegisterPayload): Promise<PublicUser> {
  const errors = validateRegistration(payload);
  if (Object.keys(errors).length) throw { fields: errors } satisfies AuthFailure;

  const body: Record<string, unknown> = {
    profile_type: payload.profileType,
    first_name: sanitize(payload.firstName, 60),
    last_name: sanitize(payload.lastName, 60),
    email: sanitize(payload.email, 160).toLowerCase(),
    password: payload.password,
    password_confirm: payload.passwordConfirm,
    phone: sanitize(payload.phone, 30),
    country: sanitize(payload.country, 60),
    city: sanitize(payload.city, 60),
    terms: payload.terms,
    newsletter: !!payload.newsletter,
    locale: getLocale()
  };
  if (payload.profileType === 'STUDENT') {
    body.university = sanitize(payload.university, 120);
    body.academic_year = sanitize(payload.academicYear, 40);
    body.graduation_year = intOrNull(payload.graduationYear);
  } else {
    body.prof_status = sanitize(payload.profStatus, 80);
    body.workplace = sanitize(payload.workplace, 120);
    body.experience_years = intOrNull(payload.experienceYears);
  }

  try {
    const data = await post<ApiUser>('/auth/register/', body);
    cachedUser = mapUser(data);
    notify();
    track('registration', { profileType: cachedUser.profileType, country: cachedUser.country });
    return cachedUser;
  } catch (error) {
    throw toFailure(error);
  }
}

export async function login(email: string, password: string, remember: boolean): Promise<PublicUser> {
  try {
    const data = await post<ApiUser>('/auth/login/', {
      email: String(email ?? '').trim().toLowerCase(),
      password,
      remember
    });
    cachedUser = mapUser(data);
    notify();
    track('login', { userId: cachedUser.id });
    return cachedUser;
  } catch (error) {
    throw toFailure(error);
  }
}

export function logout(): void {
  const user = cachedUser;
  cachedUser = null;
  notify();
  void post('/auth/logout/').catch(() => undefined);
  if (user) track('logout', { userId: user.id });
}

/* ------------------------------------------------------- profil --- */

export type EditableField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'country'
  | 'city'
  | 'bio'
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

const PATCH_KEY: Partial<Record<EditableField, string>> = {
  firstName: 'first_name',
  lastName: 'last_name',
  profStatus: 'prof_status',
  experienceYears: 'experience_years',
  licenseNumber: 'license_number',
  academicYear: 'academic_year',
  graduationYear: 'graduation_year'
};

const INT_FIELDS = new Set<EditableField>(['experienceYears', 'graduationYear']);
const LIST_FIELDS = new Set<EditableField>(['expertise', 'interests', 'languages']);

/**
 * Met à jour le profil. Les erreurs sont levées sous forme d'`AuthFailure`
 * (par champ, en camelCase) pour que le formulaire les affiche au bon endroit.
 */
export async function updateProfile(
  patch: Partial<Record<EditableField, unknown>>
): Promise<PublicUser> {
  const body: Record<string, unknown> = {};
  (Object.keys(patch) as EditableField[]).forEach((key) => {
    const value = patch[key];
    if (value === undefined) return;
    const apiKey = PATCH_KEY[key] ?? key;
    if (LIST_FIELDS.has(key)) body[apiKey] = (Array.isArray(value) ? value : []).map((v) => sanitize(v, 80));
    else if (INT_FIELDS.has(key)) body[apiKey] = intOrNull(value);
    else if (typeof value === 'boolean') body[apiKey] = value;
    else if (key === 'email') body[apiKey] = sanitize(value, 160).toLowerCase();
    else body[apiKey] = sanitize(value, key === 'bio' ? 1200 : 180);
  });

  try {
    const data = await api<ApiUser>('/auth/me/', { method: 'PATCH', body });
    cachedUser = mapUser(data);
    notify();
    return cachedUser;
  } catch (error) {
    throw toFailure(error);
  }
}

/** Téléverse la photo de profil (data URL) et renvoie le compte mis à jour. */
export async function uploadAvatar(dataUrl: string): Promise<PublicUser> {
  try {
    const data = await post<ApiUser>('/auth/me/avatar/', { data_url: dataUrl });
    cachedUser = mapUser(data);
    notify();
    return cachedUser;
  } catch (error) {
    throw toFailure(error);
  }
}

export async function changePassword(current: string, next: string): Promise<void> {
  if (!isStrongPassword(next)) {
    throw { fields: { newPassword: 'auth.errors.passwordWeak' } } satisfies AuthFailure;
  }
  try {
    await post('/auth/password/change/', { current_password: current, new_password: next });
  } catch (error) {
    throw toFailure(error);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await post('/auth/password/reset/', { email: String(email ?? '').trim().toLowerCase() });
  } catch {
    /* Réponse identique que le compte existe ou non : on n'expose rien. */
  }
}

export async function confirmPasswordReset(uid: string, token: string, newPassword: string): Promise<void> {
  try {
    await post('/auth/password/reset/confirm/', { uid, token, new_password: newPassword });
  } catch (error) {
    throw toFailure(error);
  }
}

export async function deleteAccount(): Promise<boolean> {
  try {
    await api('/auth/me/', { method: 'DELETE' });
    cachedUser = null;
    notify();
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------- autorisations -- */

export function hasRole(roles: Role | Role[]): boolean {
  const user = cachedUser;
  if (!user) return false;
  return (Array.isArray(roles) ? roles : [roles]).includes(user.role);
}

export function atLeast(role: Role): boolean {
  const user = cachedUser;
  if (!user) return false;
  return (ROLE_LEVEL[user.role] ?? 0) >= ROLE_LEVEL[role];
}

export function canManageContent(): boolean {
  return atLeast('CONTENT_EDITOR');
}

export function canManageUsers(): boolean {
  return atLeast('ADMIN');
}

/* ------------------------------------------ administration des membres

   L'API d'administration des membres (liste, rôle, suspension, suppression)
   n'est pas encore exposée par le back-end. Ces fonctions restent en place
   pour l'interface d'administration ; elles seront branchées sur
   `/api/admin/users/…` lors de la phase suivante.
   -------------------------------------------------------------------- */

export function listUsers(): PublicUser[] {
  return [];
}

export function adminSetRole(_userId: string, _role: Role): boolean {
  return false;
}

export function adminToggleStatus(_userId: string): boolean {
  return false;
}

export function adminDeleteUser(_userId: string): boolean {
  return false;
}
