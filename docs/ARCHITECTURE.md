# Architecture — KINEDOK ACADÉMIE

## 1. Choix technique et justification

Le cahier des charges recommandait Next.js + Tailwind + Supabase. Cette version
est livrée en **application web sans étape de compilation** (HTML/CSS/JavaScript
natif, scripts classiques), pour une raison précise et vérifiable : Node.js n'est
pas installé sur la machine de développement, et une base de code Next.js
n'aurait pu être ni exécutée ni testée avant livraison.

Le compromis retenu évite l'impasse habituelle du prototype :

| Exigence du cahier des charges | Réponse ici |
| --- | --- |
| Application réellement fonctionnelle | Oui : auth, filtres, progression, admin, tout opère |
| Design system centralisé | `src/styles/tokens.css` (mêmes noms de tokens que la config Tailwind cible) |
| i18n sans texte codé en dur | `src/locales/{fr,en,ar}.ts` + `KA.i18n.t()` — structure identique à next-intl |
| RTL réel | `dir="rtl"` + propriétés logiques CSS partout |
| Architecture de données scalable | `KA.data` isole totalement l'interface de la source ; schéma SQL fourni |
| Rôles et autorisations | 6 rôles hiérarchisés, protection des routes, contrôles par action |
| Migration vers Next.js | Routes, namespaces i18n, tokens et modèle de données conçus pour un portage direct (§ 8) |

Aucun élément livré n'est à jeter lors de la migration : les dictionnaires, les
tokens, le contenu scientifique, le schéma de base et la logique métier
(recherche, recommandations, progression, certificats) se transposent tels quels.

## 2. Couches

```text
┌─────────────────────────────────────────────────────────────┐
│  Pages (src/pages/*)                                     │
│  Composent des chaînes HTML et branchent leurs interactions │
├─────────────────────────────────────────────────────────────┤
│  Composants (src/components/*)                           │
│  ui · cards · filters · header · footer                     │
├─────────────────────────────────────────────────────────────┤
│  Services (src/core/*)                                   │
│  router · i18n · auth · activity · search · seo · analytics │
├─────────────────────────────────────────────────────────────┤
│  Données (src/lib/content.ts → KA.data)                      │
│  list / get / create / update / remove  ← point de bascule  │
├─────────────────────────────────────────────────────────────┤
│  Persistance (src/lib/storage.ts → KA.store)              │
│  localStorage aujourd'hui, API/Prisma/Supabase demain       │
└─────────────────────────────────────────────────────────────┘
```

Deux règles structurantes :

1. **Aucune page n'accède directement au stockage.** Elle passe par `KA.data`
   (lecture de contenus) ou `KA.activity` (activité du membre).
2. **Aucune donnée n'est injectée sans échappement.** `KA.dom.esc()` est
   systématique ; `KA.dom.escUrl()` filtre les schémas d'URL dangereux.

### Couche de données

`KA.data` expose une API volontairement proche d'un ORM :

```js
KA.data.list('resources', {
  filters: { type: ['protocole'], pathology: ['lombalgie-commune'] },
  query: 'exercice', sort: 'newest', page: 2, perPage: 9
});                                   // → { items, total, page, pages }
KA.data.get('tools', 'test-de-lachman');
KA.data.forPathology('reconstruction-lca');   // agrégation transversale
KA.data.create('resources', payload);
KA.data.update('courses', id, patch);
KA.data.remove('webinars', id);
```

Brancher un back-end consiste à réécrire ces six fonctions (versions
asynchrones) sans toucher aux pages.

### Couche d'activité

`KA.activity` porte tout ce qui appartient au membre : favoris, consultations,
téléchargements, inscriptions, progression par leçon, scores de quiz,
certificats, historique de recherche, réglages, recommandations. Sans session,
chaque méthode renvoie `{ requiresAuth: true }` — l'appelant propose alors la
connexion plutôt que d'échouer silencieusement.

## 3. Routage

URL de la forme `#/{locale}/{chemin}?{filtres}` :

```text
/fr/bibliotheque?type=protocole&pathology=lombalgie-commune&sort=popular&page=2
#/ar/outils?type=bilan
#/en/formations/rehabilitation-du-genou-apres-lca/lecon/les-01-3-4
```

Le préfixe `#` permet de fonctionner en `file://` comme sur tout hébergement
statique. **L'état des filtres vit dans l'URL** : une recherche filtrée est
partageable et compatible avec les boutons Précédent / Suivant.

### Table des routes

| Route | Page | Protection |
| --- | --- | --- |
| `/` | Accueil | — |
| `/connexion`, `/inscription`, `/mot-de-passe-oublie` | Authentification | — |
| `/bibliotheque`, `/bibliotheque/[slug]` | Bibliothèque | — |
| `/formations`, `/formations/[slug]` | Formations | — |
| `/formations/[slug]/lecon/[lessonId]` | Lecteur de leçon | — |
| `/webinaires`, `/webinaires/[slug]` | Webinaires | — |
| `/outils`, `/outils/[slug]` | Outils pratiques | — |
| `/pathologies`, `/pathologies/[slug]` | Pathologies | — |
| `/exercices`, `/exercices/[slug]` | Exercices | — |
| `/recherche` | Résultats groupés | — |
| `/a-propos`, `/faq`, `/contact`, `/conditions`, `/confidentialite`, `/avertissement-medical` | Éditorial | — |
| `/dashboard`, `/dashboard/formations`, `/dashboard/favoris`, `/dashboard/telechargements`, `/dashboard/webinaires`, `/dashboard/certificats` | Espace membre | session |
| `/profil`, `/profil/modifier`, `/parametres` | Profil | session |
| `/abonnements` | Formules d'abonnement | — |
| `/dashboard/abonnement` | Mon abonnement | session |
| `/admin`, `/admin/bibliotheque`, `/admin/formations`, `/admin/webinaires`, `/admin/outils`, `/admin/exercices`, `/admin/pathologies` | Administration des contenus | rôle ≥ `CONTENT_EDITOR` |
| `/admin/utilisateurs`, `/admin/abonnements` | Membres et abonnements | rôle ≥ `ADMIN` |

La protection est déclarée à l'enregistrement de la route :

```js
r.register('dashboard', pages.dashboard, { auth: true });
r.register('admin/utilisateurs', pages.adminUsers, { auth: true, role: 'ADMIN' });
```

## 4. Authentification

**Périmètre de cette version** — fonctionnement sans serveur :

- mots de passe dérivés en **PBKDF2-SHA-256, 150 000 itérations**, sel aléatoire
  de 16 octets par compte (WebCrypto) ; jamais de mot de passe en clair ;
- comparaison des empreintes à temps constant ;
- réponse volontairement identique lorsque l'e-mail est inconnu (pas
  d'énumération de comptes), y compris sur le délai de calcul ;
- session à jeton aléatoire de 24 octets, expiration 30 jours ;
- validation et assainissement de toutes les entrées avant stockage.

**En production**, l'API publique (`register`, `login`, `logout`, `currentUser`,
`hasRole`, `atLeast`) reste identique ; l'implémentation devient :

- hachage **Argon2id** (ou bcrypt) côté serveur ;
- session en **cookie HttpOnly + SameSite=Lax + Secure**, ou Supabase Auth ;
- vérification d'e-mail réelle et réinitialisation par jeton à usage unique ;
- limitation de débit sur `/login`, `/register` et `/mot-de-passe-oublie` ;
- secrets exclusivement en variables d'environnement.

### Rôles

```text
STUDENT (10) · PHYSIOTHERAPIST (10) → INSTRUCTOR (20) → CONTENT_EDITOR (30)
    → ADMIN (40) → SUPER_ADMIN (50)
```

| Capacité | STUDENT / PHYSIO | INSTRUCTOR | CONTENT_EDITOR | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- | --- | --- |
| Consulter, favoriser, télécharger | ✓ | ✓ | ✓ | ✓ | ✓ |
| Suivre formations, certificats | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gérer ses propres formations | — | ✓ | ✓ | ✓ | ✓ |
| Créer / publier tout contenu | — | — | ✓ | ✓ | ✓ |
| Gérer les membres | — | — | — | ✓ | ✓ |
| Rôles et sécurité | — | — | — | — | ✓ |

`KA.auth.canAccess(item)` gouverne l'accès premium : un contenu
`access: 'premium'` n'est servi qu'aux membres disposant du droit — abonnement
actif dont la formule ouvre le premium, drapeau `user.premium`, ou rôle éditeur
et plus.

### Abonnements

`KA.subscriptions` (src/lib/subscriptions.ts) porte le cycle de vie complet :

```text
pending → active     approbation par un administrateur
pending → rejected   refus motivé
active  → cancelled  résiliation par le membre
active  → expired    échéance dépassée (calculée à l'approbation)
```

Trois principes :

1. **Une seule demande en attente par membre**, pour éviter les files parasites.
2. **Les demandes vivent dans une clé partagée** (`ka.subscriptions`) et non dans
   l'espace du membre : l'administration doit pouvoir les lire et les traiter.
3. **Aucun paiement n'est traité en ligne.** L'approbation est manuelle, ce qui
   correspond aux usages locaux (virement, versement, convention
   institutionnelle) et laisse la porte ouverte à un prestataire de paiement sans
   rien redéfinir : seul l'appel à `approve()` changerait de déclencheur.

Les formules elles-mêmes (`src/data/plans.ts`, collection `plans`) sont des contenus
comme les autres : elles passent par `KA.data.create/update/remove` et sont donc
entièrement modifiables depuis `/admin/abonnements` — libellé, prix, périodicité,
public visé, avantages, accès premium, ordre d'affichage, visibilité.

## 4 bis. Apparence

`KA.theme` (src/theme/ThemeContext.tsx) gère trois états — `system`, `light`, `dark` —
écrits dans l'attribut `data-theme` de `<html>` et mémorisés par navigateur.
`src/styles/tokens.css` redéfinit la palette pour chacun ; aucun composant ne
contient de règle propre au thème sombre.

Deux points de vigilance appris à l'usage :

- Les **surfaces sombres permanentes** (pied de page, panneau des pages de
  connexion, toasts) ont leurs propres tokens `--kinedok-footer-*` et
  `--kinedok-panel-*`. Sans cela, une variable comme `--kinedok-secondary`, qui
  s'éclaircit en thème sombre, produisait un pied de page clair avec du texte
  clair.
- Le **logo suit l'apparence** : `KA.ui.logo()` sert la version bicolore sur fond
  clair et la version monochrome turquoise sur fond sombre.

## 5. Recherche

`KA.search.global(query)` interroge les six collections et regroupe les
résultats. L'index de chaque contenu (`KA.data.searchText`) agrège titre,
sous-titre, description, résumé, mots-clés, muscles ciblés, **alias de
pathologies** et noms d'auteurs, puis passe par `KA.format.normalize()` qui
supprime accents latins et diacritiques arabes. Conséquences vérifiées :

- « tendinopathie rotulienne » → 9 résultats (2 bibliothèque, 3 outils,
  1 webinaire, 1 pathologie, 2 exercices) alors que la fiche s'intitule
  « tendinopathie patellaire » ;
- « LCA » → 19 résultats dans 6 sections ;
- « الركبة » (genou) → 13 résultats via les alias arabes.

En production, remplacer cette fonction par un index `tsvector` PostgreSQL
(dictionnaire `french` + `arabic`) ou un moteur externe ; la signature et
l'affichage groupé restent inchangés.

## 6. Accessibilité

- HTML sémantique (`header`, `nav`, `main`, `aside`, `article`, `footer`), un seul
  `h1` par page, hiérarchie de titres respectée.
- Lien d'évitement, `:focus-visible` visible partout, focus piégé dans les
  modales et restitué à la fermeture.
- `aria-current` sur la navigation, `aria-pressed` sur les bascules,
  `aria-expanded` sur les menus, `role="alert"` sur les erreurs de champ,
  `aria-live` pour les toasts et les changements de page.
- Champs toujours étiquetés (`label` visible ou `sr-only`), erreurs rattachées au
  champ, `aria-invalid`.
- `prefers-reduced-motion` respecté ; contrastes conformes en thème clair et
  sombre.

## 7. Performance

- Aucune dépendance externe : ni CDN, ni police distante, ni bundle.
- Rendu par page, pagination systématique (9 à 12 éléments), facettes calculées
  sur la collection filtrée.
- Icônes SVG en ligne (pas de requête réseau), images en SVG vectoriel.
- Recherche debouncée (200 ms en-tête, 420 ms listes).
- Total transféré ≈ 300 Ko non minifié, contenu scientifique inclus.

## 8. Migration vers Next.js + Supabase

### Étape 1 — initialisation

```bash
npx create-next-app@latest kinedok-academie --typescript --tailwind --app --eslint
cd kinedok-academie
npm i next-intl @supabase/supabase-js @supabase/ssr zod
npm i -D prisma && npx prisma init --datasource-provider postgresql
```

### Étape 2 — reprise des acquis

| Livré ici | Destination Next.js |
| --- | --- |
| `src/styles/tokens.css` | `app/globals.css` + `theme.extend.colors` de `tailwind.config.ts` |
| `src/locales/fr.ts` → objet `common`, `auth`, … | `locales/fr/common.json`, `locales/fr/auth.json`, … (next-intl) |
| `src/App.tsx` (table des routes) | `app/[locale]/…/page.tsx` |
| `src/data/*.ts` | `prisma/seed.ts` (les objets sont déjà au bon format) |
| `db/schema.prisma` | `prisma/schema.prisma` |
| `src/lib/auth.ts` | Supabase Auth ou route handlers `/api/auth/*` |
| `KA.data.list()` | requêtes Prisma / PostgREST, mêmes paramètres |
| `src/components/*` | composants React (le balisage et les classes sont réutilisables) |

Configuration Tailwind reprenant les tokens :

```ts
// tailwind.config.ts
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kinedok: {
          DEFAULT: 'var(--kinedok-primary)',
          600: 'var(--kinedok-primary-600)',
          700: 'var(--kinedok-primary-700)',
          soft: 'var(--kinedok-primary-soft)',
          secondary: 'var(--kinedok-secondary)'
        },
        surface: 'var(--kinedok-surface)',
        muted: 'var(--kinedok-muted)',
        line: 'var(--kinedok-border)'
      },
      borderRadius: { md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      boxShadow: { card: 'var(--shadow-sm)', pop: 'var(--shadow-lg)' }
    }
  },
  plugins: []
};
```

Le RTL ne demande aucun plugin : n'employer que des utilitaires logiques
(`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) et poser
`dir` sur `<html>` depuis le segment `[locale]`.

### Étape 3 — ordre de portage conseillé

1. Layout, en-tête, pied de page, thème, i18n, RTL.
2. Schéma Prisma + seed depuis `src/data/*.ts`.
3. Pages publiques de liste et de détail (SSR + `generateMetadata`).
4. Authentification et espace membre.
5. Administration (route handlers protégés + validation Zod).
6. Stockage des fichiers (Supabase Storage : PDF, vidéos, avatars) avec URL
   signées pour les contenus premium.
