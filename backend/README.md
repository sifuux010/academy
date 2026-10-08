Written for: the developer who will run and extend this backend.

# KINEDOK ACADÉMIE — backend Django + MySQL

API de la plateforme : comptes et rôles, contenus scientifiques des six
sections, activité des membres, abonnements et journal d'événements.
Le front-end React vit à la racine du dépôt et consomme cette API.

État : **socle et API de lecture des contenus terminés** — modèles,
administration, authentification par session, jeu de contenus en base et
API publique des six sections. Reste l'activité des membres, les
abonnements et l'écriture par l'administration — voir § 9.

---

## 1. Démarrer

Prérequis : Python 3.12+, une base MySQL ou MariaDB, et les en-têtes de
compilation que `mysqlclient` exige (sous Windows, la roue précompilée
suffit).

> **Versions épinglées — à lire avant de mettre à jour.**
> L'installation de développement utilise **MariaDB 10.4** (celle de
> XAMPP). Django 5.1 a cessé de la prendre en charge : 5.2 refuse de s'y
> connecter (`MariaDB 10.5 or later is required`). Django reste donc en
> **5.0.x**, et DRF en **3.15.x** puisque 3.16+ exige Django 5.1+.
>
> Pour repasser sur les versions courantes, installer MariaDB 10.5+ ou
> MySQL 8, puis `pip install -U django djangorestframework`. Une seule
> incompatibilité est connue dans le code : `CheckConstraint(check=…)`
> s'appelle `condition=` à partir de Django 5.1 — deux occurrences, dans
> `taxonomies/models.py` et `activity/models.py`.

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt

cp .env.example .env            # puis renseigner DJANGO_SECRET_KEY et la base
python manage.py migrate
python manage.py createsuperuser

# Jeu de contenus de référence (42 ressources, 16 formations, 67 outils…)
node --experimental-strip-types ../backend/seed/export.mjs
python manage.py seed_content

python manage.py runserver
```

L'API répond sur <http://localhost:8000/api/>, l'administration sur
<http://localhost:8000/admin/>.

### Créer la base

```sql
CREATE DATABASE kinedok_academie
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'kinedok'@'localhost' IDENTIFIED BY 'mot-de-passe';
GRANT ALL PRIVILEGES ON kinedok_academie.* TO 'kinedok'@'localhost';
FLUSH PRIVILEGES;
```

`utf8mb4` n'est pas optionnel : l'arabe et les diacritiques en dépendent.
La base de développement est servie par le MariaDB de XAMPP, sur le port
3306, avec le compte `root` sans mot de passe — à ne jamais reproduire
ailleurs que sur un poste local.

### Ports de développement

| Service | Adresse |
| --- | --- |
| Front-end (Vite) | <http://localhost:8080> |
| API et administration (Django) | <http://localhost:8000> |
| MariaDB | `127.0.0.1:3306` |

Le serveur Vite relaie `/api/...` vers Django (`vite.config.ts`) : le
navigateur ne voit qu'une seule origine, donc le cookie de session et le
jeton CSRF circulent sans configuration CORS. Lancer les deux :

```bash
# terminal 1
cd backend && .venv/Scripts/python manage.py runserver 8000

# terminal 2
npm run dev
```

### Sans serveur MySQL

`DB_ENGINE=sqlite` valide le schéma et fait tourner les tests sans MySQL
installé — pratique pour vérifier une migration, jamais pour la production :

```bash
DB_ENGINE=sqlite python manage.py test
```

---

## 2. Arborescence

```text
backend/
├── manage.py
├── requirements.txt
├── .env.example                variables d'environnement, sans secret
├── config/
│   ├── settings.py             configuration unique, pilotée par l'environnement
│   ├── enums.py                énumérations partagées (rôles, accès, niveaux…)
│   ├── models.py               briques : UUID, horodatage, StringListField
│   └── urls.py                 routage racine (/admin/, /api/)
├── seed/
│   ├── export.mjs              extraction des contenus TypeScript → JSON
│   └── data/                   JSON produit — à versionner : c'est la seule
│                               copie des contenus une fois src/data/*.ts supprimé
├── accounts/                   membre, profils, préférences, authentification
├── taxonomies/                 régions, spécialités, catégories, mots-clés
├── content/                    pathologies, auteurs, ressources, formations,
│   │                           webinaires, outils, exercices, traductions
│   ├── sections.py             registre des six sections : filtres et tris
│   ├── queries.py              filtres, recherche, tri, pagination, facettes
│   ├── search.py               normalisation et index de recherche
│   └── management/commands/   seed_content, reindex_search
├── activity/                   favoris, téléchargements, progression, quiz,
│                               certificats, avis, recherches, notifications
├── subscriptions/              formules et demandes d'abonnement
└── analytics/                  journal d'événements produit
```

---

## 3. Modèle de données

44 tables, reprises du schéma de référence `../db/schema.prisma` et du
modèle du front-end. Trois écarts assumés, imposés par MySQL ou par Django :

| Schéma de référence | Ici | Pourquoi |
| --- | --- | --- |
| colonnes `text[]` PostgreSQL | `StringListField` (JSON) | MySQL n'a pas de type tableau ; MySQL 8 valide le JSON nativement |
| table `Session` applicative | `django.contrib.sessions` | Django gère déjà les sessions, leur expiration et leur rotation |
| tables de jointure explicites (`ResourceTag`…) | `ManyToManyField` | Django produit la même table, avec la même clé primaire composite |

`Subscription.user` est une vraie clé étrangère, alors que le schéma Prisma
laissait la colonne sans relation.

### Contraintes « un contenu parmi cinq »

Un favori, une traduction ou un libellé de taxonomie pointe vers exactement
un contenu, par des clés étrangères nullables. MySQL considérant deux `NULL`
comme distincts, une contrainte d'unicité sur `(membre, ressource)` ne
contraint que les lignes qui visent effectivement une ressource : les
favoris d'autres types, dont la colonne est `NULL`, ne se gênent pas. C'est
le comportement voulu, et il évite une table polymorphe.

---

## 4. Rôles

Six rôles hiérarchisés — chacun contient les droits du précédent :

```text
STUDENT < PHYSIOTHERAPIST < INSTRUCTOR < CONTENT_EDITOR < ADMIN < SUPER_ADMIN
```

Les contrôles d'accès appellent `user.has_role(Role.CONTENT_EDITOR)` plutôt
que de comparer deux chaînes. `role` est la source de vérité applicative ;
`is_staff` et `is_superuser` ne servent qu'à l'administration Django.

Le rôle n'est **jamais** choisi par le client : à l'inscription, il découle
du type de profil (`STUDENT` ou `PHYSIOTHERAPIST`).

Un compte dont le `status` n'est pas `active` ne peut pas ouvrir de session :
`is_active` est calculé depuis `status`, donc suspendre un membre le
déconnecte de fait.

---

## 5. Authentification

Session Django, cookie `ka_session` **HttpOnly** : le jeton n'est jamais
lisible par JavaScript, contrairement à un JWT rangé dans `localStorage`.

Le front-end doit :

1. appeler `GET /api/auth/csrf/` une fois au démarrage (pose `ka_csrftoken`) ;
2. envoyer `fetch(..., { credentials: 'include' })` sur **toutes** les requêtes ;
3. renvoyer le jeton CSRF dans l'en-tête `X-CSRFToken` sur toute écriture
   (`POST`, `PATCH`, `PUT`, `DELETE`).

| Méthode | Route | Rôle |
| --- | --- | --- |
| `GET` | `/api/auth/csrf/` | pose le cookie CSRF |
| `POST` | `/api/auth/register/` | inscription, ouvre la session |
| `POST` | `/api/auth/login/` | connexion (`remember` prolonge à 14 jours) |
| `POST` | `/api/auth/logout/` | déconnexion |
| `GET` | `/api/auth/me/` | compte courant |
| `PATCH` | `/api/auth/me/` | mise à jour du profil |
| `DELETE` | `/api/auth/me/` | suppression du compte |
| `GET` `PATCH` | `/api/auth/me/settings/` | préférences |
| `POST` | `/api/auth/password/change/` | changement de mot de passe |
| `POST` | `/api/auth/password/reset/` | demande de réinitialisation |
| `POST` | `/api/auth/password/reset/confirm/` | nouveau mot de passe par jeton |

Mots de passe hachés en **Argon2id**. Les erreurs renvoient les clés i18n que
l'interface traduit déjà (`auth.errors.emailTaken`,
`auth.errors.badCredentials`, `auth.errors.passwordWeak`…), pour qu'aucune
table de correspondance ne soit nécessaire côté front.

Deux refus distincts, volontairement : un mot de passe faux renvoie `401` et
`auth.errors.badCredentials` quelle que soit l'existence du compte (aucune
fuite), tandis qu'un compte suspendu renvoie `403` et
`auth.errors.accountSuspended`, pour que l'interface puisse l'expliquer.

### Forme du compte

L'API expose un compte **aplati** : les champs des profils métier
(`workplace`, `expertise`, `university`…) remontent au même niveau que
`email` ou `city`, exactement comme le `PublicUser` du front-end
(`src/model/account.ts`). En base, ils restent dans deux tables distinctes.

---

## 6. Jeu de contenus

Le contenu de référence (42 ressources, 16 formations, 11 webinaires,
67 outils, 35 pathologies, 42 exercices, 15 auteurs, 5 formules) vivait dans
les fichiers TypeScript du front-end. Sa reprise se fait en deux temps :

```bash
# 1. Extraction  —  ces fichiers n'importent que des types, Node les exécute
#    directement, sans build ni node_modules.
node --experimental-strip-types backend/seed/export.mjs

# 2. Chargement  —  idempotent, appuyé sur les slugs : relançable sans doublon.
python manage.py seed_content
```

`seed_content --flush` vide d'abord les tables de contenu.

La commande traite en un seul endroit les écarts de nommage entre le
front-end et la base : `durationMinutes` → `duration_min`, `downloads` →
`download_count`, `type` → `category`, `dosage.{sets,reps,hold,frequency}`
→ quatre colonnes, et `i18n.<locale>.<champ>` → lignes `Translation`. Les
bonnes réponses de quiz (`answer: 0`) deviennent `QuizAnswer.is_correct`.

### Index de recherche

`search_text` est une colonne par contenu, contenant son texte normalisé :
minuscules, accents latins et diacritiques arabes retirés, enrichie des
mots-clés, des traductions, du nom de l'auteur, et des noms **et synonymes**
des pathologies rattachées. C'est ce qui fait que « tendinopathie
rotulienne » trouve la fiche « tendinopathie patellaire » et ses outils,
exercices et protocoles.

Elle est reconstruite par `reindex_search()` — appelé par le seed — ou en
masse :

```bash
python manage.py reindex_search
```

À appeler après un import, ou après avoir modifié `build_search_text()`.
Un `LIKE` sur une colonne déjà normalisée se comporte de façon identique
sous MySQL et sous SQLite, sans dépendre d'une collation ni d'un index
plein texte.

---

## 7. API de contenu

Lecture publique ; seuls les contenus publiés sortent.

| Méthode | Route | Rôle |
| --- | --- | --- |
| `GET` | `/api/content/<section>/` | liste filtrée, triée, paginée, avec facettes |
| `GET` | `/api/content/<section>/<slug>/` | fiche détaillée |
| `GET` | `/api/content/taxonomies/` | vocabulaires contrôlés (clés seules) |
| `GET` | `/api/content/authors/` | auteurs et intervenants |
| `GET` | `/api/content/pathologies/<slug>/hub/` | tout ce qui se rattache à une pathologie |
| `GET` | `/api/content/search/` | recherche globale, six sections |
| `GET` | `/api/content/stats/` | compteurs de la page d'accueil |
| `GET` | `/api/content/plans/` | formules d'abonnement |

`<section>` vaut `resources`, `courses`, `webinars`, `tools`, `exercises`
ou `pathologies`.

### Forme des réponses

L'API rend **la forme que le front-end connaît déjà** (`src/types.ts`), en
camelCase : `type`, `pathologies` en slugs, `format`, `sizeKb`,
`downloads`, `durationMinutes`, `dosage`, `i18n`… Les cartes, les pages de
détail et les filtres existants la consomment sans réécrire leurs modèles.

Une liste reprend la forme de `ListResult` :

```json
{
  "section": "resources",
  "items": [ … ],
  "total": 42, "page": 1, "pages": 4, "perPage": 12,
  "sort": "newest", "query": "",
  "filters": { "type": ["protocole"] },
  "facets": { "type": { "protocole": 22, "guide": 7 }, … }
}
```

### Filtres

Les clés sont celles que le front-end met déjà dans l'URL
(`src/components/filters/presets.ts`) : une URL de filtre existante reste
donc valable et partageable.

| Section | Filtres |
| --- | --- |
| `resources` | `type` `pathology` `region` `specialty` `level` `language` `access` |
| `courses` | `level` `specialty` `pathology` `region` `access` |
| `webinars` | `status` `specialty` `pathology` |
| `tools` | `type` `pathology` `region` `specialty` `access` |
| `exercises` | `region` `objective` `difficulty` `pathology` |
| `pathologies` | `region` `specialty` |

Deux valeurs d'un même filtre sont en **OU**
(`?type=guide&type=protocole`), deux filtres différents en **ET**. Une clé
inconnue est ignorée.

Tris : `newest` (défaut) · `oldest` · `popular` · `az`. Un tri inconnu
retombe sur le défaut. `perPage` est plafonné à 100 ; `perPage=0` renvoie
tout. Une page au-delà de la dernière est ramenée à la dernière, et non
vidée.

Chaque facette est comptée **sans son propre filtre** : cocher « protocole »
ne fait pas disparaître le compte des autres types, sinon l'utilisateur ne
pourrait plus changer d'avis. `?facets=0` les désactive.

Le `status` d'un webinaire est calculé, mais reste un filtre SQL : `ends_at`
est stocké et recalculé à l'enregistrement, ce qui évite de filtrer en
Python et de casser la pagination.

### Deux garanties tenues par l'API

- **La bonne réponse d'un quiz ne quitte jamais le serveur.** La structure
  du quiz est servie (`passScore`, `questions[].options`) sans `answer` ni
  `isCorrect` : la correction se fera côté serveur. C'était l'un des points
  de sécurité de la feuille de route — le client avait les réponses.
- **Un lien de fichier premium n'est servi qu'à qui y a droit.** `fileUrl`,
  `liveUrl` et `replayUrl` reviennent vides pour un visiteur anonyme ou un
  membre sans abonnement. Un `CONTENT_EDITOR` les reçoit, pour pouvoir
  vérifier ce qu'il publie.

---

## 8. Tests

```bash
DB_ENGINE=sqlite python manage.py test
```

**92 tests.** Le socle (34) : hiérarchie des rôles, inscription des deux
types de profil, impossibilité d'élever son rôle ou de s'offrir le premium
par `PATCH`, session par cookie, refus CSRF sans en-tête, non-divulgation
des comptes existants, réinitialisation par jeton.

L'API de contenu (58) : forme des réponses, OU dans un filtre et ET entre
filtres, non-duplication des lignes sur un filtre traversant une relation,
recherche insensible aux accents et aux diacritiques, recherche par
synonyme de pathologie, les quatre tris, bornes de pagination, facettes
qui ignorent leur propre filtre, les quatre statuts de webinaire, absence
de la bonne réponse de quiz dans le JSON, et la garde premium pour les
quatre profils de visiteur.

---

## 9. Reste à faire

Fait : modèles, administration, authentification, jeu de contenus en base,
API de lecture des six sections, recherche globale.

La suite :

1. **Activité** : favoris, inscriptions aux formations et webinaires,
   progression, certificats, avis.
2. **Correction des quiz côté serveur** : `POST /api/quiz/<id>/attempt/`.
   L'API ne sert déjà plus les bonnes réponses ; il reste à écrire la
   correction et l'enregistrement de la tentative.
3. **Abonnements** : demande motivée, approbation, échéance, ouverture de
   l'accès premium.
4. **Administration par l'API** : CRUD des six sections et gestion des
   membres, pour l'interface d'administration du front-end.
5. **Branchement du front-end** sur l'API, en remplacement de
   `src/lib/storage.ts`, puis **suppression de `src/data/*.ts`** : la base
   devient la seule source de vérité.
6. **Fichiers** : stockage des PDF, vidéos et avatars, URL signées pour le
   premium.

Points de sécurité à ne pas perdre de vue : contrôles de rôle revalidés
côté serveur pour chaque action d'administration et chaque abonnement,
en-têtes de sécurité et CSP sur l'hébergement.
