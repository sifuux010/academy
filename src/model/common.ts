/* =====================================================================
   Types transverses de KINEDOK ACADÉMIE
   ===================================================================== */

export type Locale = 'fr' | 'en' | 'ar';

export type Access = 'free' | 'premium';

/** Hiérarchie des rôles applicatifs (cf. ROLE_LEVEL dans lib/auth.ts). */
export type Role =
  | 'STUDENT'
  | 'PHYSIOTHERAPIST'
  | 'INSTRUCTOR'
  | 'CONTENT_EDITOR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export type ProfileType = 'STUDENT' | 'PHYSIOTHERAPIST';

/** Collections de contenu gérées par la couche de données. */
export type Collection =
  | 'resources'
  | 'courses'
  | 'webinars'
  | 'tools'
  | 'exercises'
  | 'pathologies'
  | 'authors'
  | 'plans';

/** Collections éditables depuis l'administration et visibles publiquement. */
export type ContentCollection = Exclude<Collection, 'authors'>;

/** Choix d'apparence de l'utilisateur. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** Apparence réellement affichée. */
export type Appearance = 'light' | 'dark';

/** Collections editables depuis l'administration. */
export type AdminCollection = 'resources' | 'courses' | 'webinars' | 'tools' | 'exercises' | 'pathologies';
