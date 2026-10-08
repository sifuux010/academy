# KINEDOK ACADÉMIE — React + TypeScript + Vite + Tailwind CSS

> **Quick start (EN)** — Node.js 20 or later is required.
>
> ```bash
> npm install
> npm run dev
> ```
>
> Open http://localhost:5173 — you are redirected to `/fr`, `/en` or `/ar`.
> **This code was written on a machine without Node.js: it has never been compiled or run.**
> Static checks were done (see below), but expect a first round of `npm run typecheck` fixes.

**Branche éducative de l'écosystème [KINEDOK](https://kinedokdz.com/)** —
bibliothèque scientifique, formations en ligne, webinaires et outils cliniques
pour les kinésithérapeutes et les étudiants en kinésithérapie.

Construite en **React 19 + TypeScript strict + Vite + Tailwind CSS v4** :
bibliothèque
scientifique, formations (progression, quiz, certificats), webinaires, outils
cliniques imprimables, pathologies, exercices, recherche globale, abonnements,
espace membre, profil et paramètres, administration complète, FR / EN / AR avec
vrai RTL, thème clair / sombre / système.

English version: [README.en.md](README.en.md).

---

## 1. État du projet — à lire avant tout

| Élément | État |
|---|---|
| Code source complet (toutes les sections et fonctionnalités) | ✅ écrit |
| Compilation `tsc` / `vite build` | ❌ **jamais exécutée** (pas de Node.js sur la machine de développement) |
| Vérifications statiques faites sans Node | ✅ résolution de chaque import relatif et de chaque nom importé ; imports et variables de hooks inutilisés (`noUnusedLocals`) ; structure identique des dictionnaires fr / en / ar ; existence de chaque clé de traduction utilisée ; classes CSS utilisées présentes dans la charte |
| Tests automatisés | ❌ aucun (voir la liste de production) |

Première étape recommandée pour le développeur :

```bash
npm run typecheck
```

puis corriger les éventuelles erreurs de types (le code a été écrit en mode
strict mais sans compilateur pour le valider).

## 2. Installation

### Front-end

Les dépendances sont déclarées dans `package.json` (React 19, react-router 7,
Vite, TypeScript, Tailwind CSS 4) : une seule commande suffit.

```bash
npm install
```

Pour repartir des toutes dernières versions plutôt que des intervalles
déclarés :

```bash
npm install react@latest react-dom@latest react-router@latest
```

```bash
npm install -D vite@latest @vitejs/plugin-react@latest typescript@latest tailwindcss@latest @tailwindcss/vite@latest @types/react@latest @types/react-dom@latest
```

| Script | Rôle |
|---|---|
| `npm run dev` | serveur de développement (port 5173) |
| `npm run typecheck` | vérification TypeScript seule |
| `npm run build` | `tsc --noEmit` puis `vite build` → `dist/` |
| `npm run preview` | sert `dist/` (port 4173) |

Recommandé ensuite : ESLint avec `eslint-plugin-react-hooks` (le code contient
déjà quelques commentaires `eslint-disable-line react-hooks/exhaustive-deps`
justifiés).

### Backend

L'API Django + MySQL vit dans [`backend/`](backend/README.md) : comptes et
rôles, contenus, activité des membres, abonnements. Son README donne la mise
en route et l'état d'avancement.

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate && python manage.py runserver
```

## 3. Ce que la plateforme fait réellement

Tout ce qui suit est fonctionnel, pas maquetté :

- **Bibliothèque scientifique** — 42 ressources (revues, articles, revues de
  littérature, protocoles, fiches d'exercices, livres, e-books, guides,
  recommandations), filtres combinés par type, pathologie, région anatomique,
  spécialité, niveau, langue et accès ; tri, pagination, favoris, partage,
  fiche détaillée avec résumé, points clés, références et export imprimable/PDF.
- **Formations** — 16 formations structurées en modules et leçons (vidéo, PDF,
  lecture, quiz), inscription, lecteur de leçon, progression réellement
  enregistrée, quiz corrigés, certificat de réussite généré à 100 %.
- **Webinaires** — 11 sessions avec statut calculé en direct (à venir / en direct /
  replay / terminé), inscription, programme, intervenant, rappels documentés.
- **Outils pratiques** — 67 fiches cliniques (25 tests et mesures,
  17 questionnaires, 13 scores, 12 bilans) avec objectif, indications,
  précautions, réalisation, cotation, interprétation, qualités métrologiques et
  références ; téléchargement/impression de la fiche complète et « kit de bilan »
  par pathologie.
- **Pathologies** — 35 pathologies servant de point d'entrée transversal : une
  page réunit synthèse, signaux d'alerte, ressources, bilans, protocoles,
  exercices, formations et webinaires liés. Chaque pathologie dispose d'au moins
  une ressource, un outil, un exercice et une formation rattachés.
- **Exercices** — 42 exercices thérapeutiques filtrables par région, objectif,
  difficulté, matériel et pathologie, avec dosage, progression et précautions.
- **Recherche globale** — une requête, six sections de résultats. Insensible aux
  accents et aux diacritiques arabes, étendue aux synonymes : « tendinopathie
  rotulienne » trouve la fiche « tendinopathie patellaire » et ses tests,
  exercices, protocoles et webinaires.
- **Comptes** — inscription en deux temps (kinésithérapeute / étudiant),
  connexion, mot de passe oublié, profil complet et distinct selon le type de
  compte, changement de mot de passe, préférences, suppression de compte.
- **Espace membre** — tableau de bord, formations en cours, favoris,
  téléchargements, webinaires, certificats, recommandations expliquées.
- **Abonnements** — 5 formules (Découverte gratuite, Étudiant, Professionnel
  mensuel et annuel, Institution sur devis), page publique de comparaison, espace
  « Mon abonnement » dans la grille latérale du membre, demande motivée,
  approbation ou refus par l'administration, échéance calculée, résiliation,
  historique. L'accès aux contenus premium s'ouvre à l'approbation.
- **Administration** — vue d'ensemble (membres, répartition par profil, rôle et
  pays, dernières inscriptions, demandes en attente), gestion des membres
  (recherche, rôle, suspension, suppression), CRUD complet des **six** sections de
  contenu avec publication / dépublication, et gestion des formules d'abonnement.
- **Trois langues** — bascule FR / EN / AR instantanée, `dir="rtl"` réel en arabe
  (navigation, filtres, cartes, formulaires, icônes directionnelles).
- **Thème clair et sombre** — commutateur à trois états (système / clair /
  sombre) dans l'en-tête et dans les paramètres, mémorisé par navigateur. Le logo
  suit l'apparence : bicolore sur fond clair, monochrome turquoise sur fond sombre.

## 4. Comptes de démonstration

Créés dans le navigateur au premier lancement (`src/lib/auth.ts`, `DEMO_USERS`).

| Profil | E-mail | Mot de passe |
|---|---|---|
| Administrateur principal (SUPER_ADMIN) | master@kinedokdz.com | KinedokMaster2026! |
| Administrateur secondaire (SUPER_ADMIN) | admin@kinedokdz.com | Admin2024! |
| Kinésithérapeute | demo@kinedokdz.com | Demo2024! |
| Étudiant | etudiant@kinedokdz.com | Etudiant2024! |

> ⚠️ **Sécurité** — ces mots de passe sont en clair dans le code source livré
> au navigateur : c'est acceptable pour une démonstration, **pas en
> production**. Avant toute mise en ligne, supprimer `DEMO_USERS`, créer le
> compte administrateur côté serveur (hachage Argon2id) et refaire tous les
> contrôles de rôle côté serveur.

## 5. Arborescence

```text
.
├── index.html                  application monopage, thème appliqué avant le 1er rendu
├── package.json                scripts npm et dépendances
├── vite.config.ts              React + Tailwind (@tailwindcss/vite)
├── tsconfig.json               TypeScript strict
├── vercel.json                 repli SPA Vercel
├── public/
│   ├── brand/                  logos SVG (bicolore = clair, monochrome = sombre)
│   ├── _redirects              repli SPA Netlify / Cloudflare Pages
│   └── .htaccess               repli SPA Apache
├── src/
│   ├── main.tsx                amorçage : stockage, contenus, logos, comptes démo, rendu
│   ├── App.tsx                 table des routes (/:locale/…)
│   ├── styles/                 charte graphique + index.css (Tailwind v4)
│   ├── data/                   jeu de démonstration typé (contenus, formules, taxonomies)
│   ├── locales/                dictionnaires fr.ts (référence), en.ts, ar.ts
│   ├── model/                  types métier (contenus, comptes, abonnements)
│   ├── i18n/                   langue active, traduction, pluriels, liens préfixés
│   ├── theme/                  thème clair / sombre / système
│   ├── state/store.ts          réactivité : useSyncExternalStore sur une version
│   ├── lib/                    services (auth, contenus, activité, abonnements,
│   │                           recherche, analytics, impression, SEO, stockage, marque)
│   ├── hooks/                  useSeo, useCurrentUser, useContentActions…
│   ├── components/
│   │   ├── ui/                 badges, fil d'Ariane, alertes, onglets, formulaires…
│   │   ├── cards/              cartes de contenu
│   │   ├── filters/            panneau de filtres, tri, pastilles
│   │   ├── layout/             en-tête, pied de page, mises en page, gardes
│   │   ├── feedback/           modales et notifications
│   │   └── content/            blocs partagés des fiches
│   └── pages/                  une page (ou un groupe de pages) par section
├── backend/                    API Django + MySQL (voir son README)
├── db/
│   ├── schema.prisma           schéma de référence (Prisma, PostgreSQL)
│   └── supabase.sql            DDL + politiques RLS pour Supabase
└── docs/
    ├── ARCHITECTURE.md         couches, routes, autorisations, back-end visé
    ├── DATABASE.md             modèle de données détaillé
    ├── I18N.md                 traductions et RTL
    ├── DESIGN-SYSTEM.md        tokens, composants, remplacement du logo
    ├── DEPLOYMENT.md           mise en ligne
    ├── ROADMAP.md              limites connues et suite du développement
    ├── apercu-logo.html        page de contrôle des variantes de logo
    └── apercu-couvertures.html les couvertures générées, en planche
```

## 6. Personnaliser la marque

Trois points à toucher pour aligner l'académie sur `kinedokdz.com` :

1. **Couleurs** — `src/styles/tokens.css`, variables `--kinedok-*`. Aucun
   composant ne code une couleur en dur.
2. **Logo** — déposez les fichiers officiels dans `public/brand/` sous les noms
   `kinedok-logo-compact.png` (en-tête), `kinedok-logo.png` (pied de page),
   `kinedok-logo-stacked.png` (pages de connexion) et `kinedok-mark.png`
   (symbole seul), avec leurs variantes `-dark`. `detectOfficialLogos()`
   (`src/lib/brand.ts`) les détecte au démarrage et les utilise automatiquement ;
   les `.svg` livrés servent de repli. Ouvrez
   [docs/apercu-logo.html](docs/apercu-logo.html) pour vérifier le rendu sur les
   quatre fonds de l'application, en thème clair et sombre.
3. **Typographie** — `--font-sans` et `--font-arabic` dans le même fichier.

Détails et règles d'usage : [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).

## 7. Ajouter du contenu

Deux voies :

- **Par l'interface** — connectez-vous en administration (`/fr/admin`) et
  utilisez « Ajouter un contenu ». Vos ajouts sont conservés dans votre
  navigateur et cohabitent avec le jeu de démonstration.
- **Par les fichiers** — ajoutez une entrée dans `src/data/resources.ts`,
  `src/data/courses.ts`, `src/data/webinars.ts`, `src/data/tools.ts`,
  `src/data/exercises.ts` ou `src/data/pathologies.ts` en suivant la structure
  existante. Les listes, filtres, recherche, pages pathologie et
  recommandations s'actualisent automatiquement.

## 8. Choix techniques

**Routage.** Toutes les pages sont sous `/:locale` (`fr`, `en`, `ar`). Un chemin
sans langue est redirigé vers la langue détectée ; `/` aussi. Les gardes
`RequireAuth` / `RequireRole` protègent l'espace membre et l'administration
(éditeur de contenu pour les contenus, ADMIN pour les membres et abonnements).
L'hébergement doit renvoyer `index.html` pour toute URL inconnue : fichiers
fournis pour Netlify / Cloudflare (`public/_redirects`), Apache
(`public/.htaccess`) et Vercel (`vercel.json`).

**Styles — charte graphique d'origine.** La charte est reprise telle quelle
dans `src/styles/` et chargée dans les couches Tailwind
(`base`, `components`), les variables de `tokens.css` restant hors couche pour
primer sur celles de Tailwind. Deux précautions garantissent un rendu identique :

- le *preflight* de Tailwind n'est pas chargé (la base d'origine ne suppose
  aucun reset global) ;
- les classes de la charte qui portent le nom d'un utilitaire Tailwind
  (`text-sm`, `grid`, `mt-4`…) sont exclues de la génération
  (`@source not inline(...)` dans `index.css`), sinon Tailwind imposerait par
  exemple sa propre hauteur de ligne.

`.container` a été renommé `.ka-container` pour ne pas entrer en conflit avec
l'utilitaire Tailwind. Les couleurs de la charte sont exposées comme
utilitaires (`bg-kinedok`, `text-muted`, `border-line`…) et suivent le thème.

**Réactivité.** Les services écrivent dans localStorage puis appellent
`notify()` ; les composants s'abonnent via `useStoreVersion()`
(`useSyncExternalStore`). Les écritures « silencieuses » (consultations,
historique de recherche, statistiques) ne provoquent pas de nouveau rendu.
Les onglets du navigateur restent synchronisés (événement `storage`).

**Internationalisation.** Dictionnaires TypeScript, sans dépendance. `useI18n()`
fournit `t`, `tn` (pluriel), `term` (taxonomies), `loc` (contenu traduit) et
`href` (lien préfixé par la langue). L'arabe passe `dir="rtl"` sur `<html>` ;
`rtl.css` adapte la mise en page.

**Logos.** `public/brand/*.svg` : bicolore en thème clair, monochrome turquoise
en thème sombre ; le pied de page (toujours sombre) utilise la version sombre et
l'impression la version claire. Déposer les fichiers officiels
`public/brand/kinedok-logo.png`, `kinedok-logo-compact.png`,
`kinedok-logo-stacked.png` (et leurs variantes `-dark`) : ils sont détectés au
démarrage et remplacent les SVG sans modification de code.

**Téléchargements.** Fiches d'outils, ressources, exercices, kits de bilan et
certificats s'ouvrent dans un document imprimable (enregistrable en PDF par le
navigateur). Quand les PDF réels seront sur un stockage, servir `fileUrl`.

**SEO.** Titre, description, Open Graph, URL canonique et données structurées
schema.org sont mis à jour à chaque page (`hooks/useSeo.ts`). Rendu côté client
uniquement : pour un référencement optimal en production, prévoir un
pré-rendu ou un rendu serveur.

## 9. Comportements à connaître

Quelques comportements méritent d'être connus avant de lire le code — les
premiers points corrigent des défauts de la version HTML/JavaScript d'origine :

- Tri des listes : choisir « Plus récents » sur une liste dont le tri par
  défaut est différent (formations, outils) fonctionne désormais.
- Webinaires (administration) : l'heure de début n'est plus décalée du fuseau
  horaire à chaque enregistrement.
- Pathologies créées depuis l'administration : l'intitulé est enregistré dans
  `name`, comme les pathologies du jeu de démonstration.
- Après un quiz réussi, la progression affichée dans la colonne latérale se met
  à jour immédiatement.
- En développement, `<StrictMode>` exécute deux fois certains effets
  (consultations, pages vues) : comportement propre au mode développement.

## 10. Avant la production

1. Backend : schémas fournis dans `db/schema.prisma` et `db/supabase.sql`.
   Remplacer `src/lib/storage.ts` par des appels API ; conserver les signatures des
   services pour ne pas toucher aux pages.
2. Authentification serveur (Argon2id, sessions HttpOnly, vérification
   d'e-mail, réinitialisation par lien) ; supprimer `DEMO_USERS`.
3. Contrôles de rôle et validation refaits côté serveur pour chaque action
   d'administration et chaque abonnement.
4. Correction des quiz côté serveur (les réponses sont aujourd'hui dans le
   client).
5. Stockage des fichiers (PDF, vidéos, avatars) et URL signées pour le premium.
6. Paiement des abonnements (aujourd'hui : demande puis validation manuelle).
7. En-têtes de sécurité et CSP sur l'hébergement.
8. Tests : Vitest + Testing Library (services, composants), Playwright
   (parcours inscription → formation → certificat, administration, RTL).
9. Validation médicale des contenus avant publication (avertissement déjà
   présent sur toutes les fiches).

Documentation fonctionnelle détaillée : `docs/` (architecture, i18n,
sécurité, sections).

## 11. Avertissement médical

Les contenus sont **pédagogiques et scientifiques**. Ils ne constituent pas un
avis médical individuel et ne remplacent ni l'examen clinique ni le raisonnement
thérapeutique. Chaque ressource porte ses auteurs et ses références ; un
avertissement est affiché sur toutes les pages cliniques et sur les documents
exportés. Aucune donnée de santé de patient ne doit être saisie dans la
plateforme.
