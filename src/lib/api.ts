/* =====================================================================
   Client HTTP de l'API Django
   ---------------------------------------------------------------------
   L'authentification passe par le cookie de session (HttpOnly) : toutes
   les requêtes partent avec `credentials: 'include'`, et les écritures
   portent le jeton CSRF dans l'en-tête `X-CSRFToken`.

   Le jeton CSRF vit dans un cookie lisible (`ka_csrftoken`), posé par
   `GET /api/auth/csrf/`. C'est le seul cookie que le JavaScript lit :
   celui de session reste hors de portée, donc hors de portée d'un XSS.
   ===================================================================== */

export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

const CSRF_COOKIE = 'ka_csrftoken';
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export class ApiError extends Error {
  readonly status: number;
  /** Corps de la réponse : le serveur renvoie des clés i18n (auth.errors.*). */
  readonly payload: unknown;

  constructor(status: number, payload: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }

  /** Première clé i18n trouvée dans le corps, pour l'afficher traduite. */
  get key(): string | null {
    const seek = (value: unknown): string | null => {
      if (typeof value === 'string') return value.includes('.') ? value : null;
      if (Array.isArray(value)) {
        for (const entry of value) {
          const found = seek(entry);
          if (found) return found;
        }
        return null;
      }
      if (value && typeof value === 'object') {
        for (const entry of Object.values(value)) {
          const found = seek(entry);
          if (found) return found;
        }
      }
      return null;
    };
    return seek(this.payload);
  }
}

function readCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

let csrfReady: Promise<void> | null = null;

/** Pose le cookie CSRF, une seule fois par session de page. */
export function ensureCsrf(): Promise<void> {
  if (readCookie(CSRF_COOKIE)) return Promise.resolve();
  if (!csrfReady) {
    csrfReady = fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        csrfReady = null;
      });
  }
  return csrfReady;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  /** Paramètres de requête ; une valeur tableau est répétée (`?type=a&type=b`). */
  params?: Record<string, string | number | boolean | string[] | undefined | null>;
}

export function buildQuery(
  params: RequestOptions['params'] = {}
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((entry) => search.append(key, entry));
    else search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();

  if (UNSAFE.has(method)) await ensureCsrf();

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (UNSAFE.has(method)) {
    const token = readCookie(CSRF_COOKIE);
    if (token) headers['X-CSRFToken'] = token;
  }

  const response = await fetch(`${API_BASE}${path}${buildQuery(options.params)}`, {
    method,
    headers,
    credentials: 'include',
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) throw new ApiError(response.status, payload);
  return payload as T;
}

export const get = <T>(path: string, params?: RequestOptions['params'], signal?: AbortSignal) =>
  api<T>(path, { params, signal });

export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body });
