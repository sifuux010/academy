# Déploiement — KINEDOK ACADÉMIE

## 1. Version actuelle : site statique compilé par Vite

L'application est une SPA React compilée par Vite. Déployer = compiler puis
mettre en ligne le dossier produit.

```bash
npm install
npm run build        # tsc --noEmit puis vite build  →  dist/
npm run preview      # contrôle local du résultat compilé
```

### Ce qu'il faut mettre en ligne

```text
le contenu de dist/
```

`src/`, `docs/`, `db/`, `package.json` et les READMEs ne sont pas mis en ligne :
seul le résultat de `npm run build` l'est.

### Repli SPA — obligatoire

Les URL sont de vraies URL (`/fr/bibliotheque/…`), pas des ancres : l'hébergeur
doit renvoyer `index.html` pour toute URL inconnue, sinon un rechargement en
pleine page renvoie une 404. Les fichiers de configuration sont fournis et
copiés dans `dist/` par la compilation :

| Hébergeur | Fichier |
| --- | --- |
| Netlify, Cloudflare Pages | `public/_redirects` |
| Apache, OVH, cPanel | `public/.htaccess` |
| Vercel | `vercel.json` (à la racine du projet) |

### Hébergement mutualisé / OVH / cPanel (le plus simple)

1. `npm run build` en local.
2. Connectez-vous en FTP.
3. Copiez le **contenu de `dist/`** dans `www/academie/` (ou le sous-domaine
   visé) — en vérifiant que le `.htaccess` est bien transféré (les clients FTP
   masquent souvent les fichiers commençant par un point).
4. Ouvrez `https://academie.kinedokdz.com/`.

### Netlify

Glissez-déposez le dossier `dist/` sur <https://app.netlify.com/drop>, ou :

```bash
npx netlify-cli deploy --dir . --prod
```

### Vercel

```bash
npx vercel --prod
```

### GitHub Pages

```bash
git init && git add . && git commit -m "KINEDOK ACADÉMIE"
git branch -M main && git remote add origin <votre-dépôt>
git push -u origin main
# puis : Settings → Pages → Source: main / root
```

### En-têtes recommandés

Si votre hébergeur permet de configurer les en-têtes (`_headers` sur Netlify,
`vercel.json`, `.htaccess`) :

```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'self'; form-action 'self'
```

La CSP ci-dessus fonctionne telle quelle : l'application ne charge ni script, ni
police, ni image externe.

### Sous-domaine conseillé

`academie.kinedokdz.com` — un enregistrement CNAME vers l'hébergeur suffit. Cela
garde l'académie visiblement rattachée au domaine principal tout en permettant
des déploiements indépendants.

## 2. Limites de l'hébergement statique

Les comptes et l'activité (favoris, progression, certificats) sont stockés **dans
le navigateur de chaque visiteur**. Concrètement :

- pas de synchronisation entre appareils ;
- effacer les données du navigateur efface le compte local ;
- l'administration modifie les contenus **localement** : les ajouts ne sont pas
  visibles par les autres visiteurs.

C'est suffisant pour une démonstration, une validation de maquette ou un pilote
interne. Pour une ouverture publique avec comptes réels, passez à l'étape 3.

## 3. Version complète : Next.js + PostgreSQL/Supabase

### Prérequis

- Node.js 20 LTS ou supérieur
- Un projet Supabase (ou toute base PostgreSQL 15+)

### Variables d'environnement

```env
# .env.local — ne jamais committer
DATABASE_URL="postgresql://user:password@host:5432/kinedok?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/kinedok"

NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."       # serveur uniquement, jamais NEXT_PUBLIC_

NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXT_PUBLIC_SITE_URL="https://academie.kinedokdz.com"

SMTP_HOST="..."                           # vérification d'e-mail, rappels webinaires
SMTP_USER="..."
SMTP_PASSWORD="..."
MAIL_FROM="academie@kinedokdz.com"
```

Règles : aucun secret dans le code, aucun secret dans Git (`.env*` dans
`.gitignore`), les clés `SERVICE_ROLE` jamais exposées au client.

### Mise en place de la base

```bash
npx prisma migrate deploy      # ou : psql -f db/supabase.sql
npx prisma db seed             # reprend src/data/*.ts
```

Puis appliquer les compléments décrits dans `docs/DATABASE.md` § 5 (index
partiels, contraintes métier, index de recherche plein texte).

### Stockage des fichiers

Créer trois buckets Supabase Storage :

| Bucket | Contenu | Accès |
| --- | --- | --- |
| `resources` | PDF de la bibliothèque | privé, URL signée (15 min) |
| `tools` | fiches cliniques PDF/DOCX | public pour `access = free`, signé pour `premium` |
| `media` | vidéos de formation, avatars, couvertures | privé, URL signée |

Validation à l'upload : type MIME vérifié côté serveur, taille maximale
(PDF 25 Mo, vidéo 2 Go), nom de fichier régénéré, jamais de chemin fourni par le
client.

### Déploiement

```bash
vercel --prod          # ou : npm run build && npm run start derrière un reverse proxy
```

Vercel : renseigner les variables d'environnement dans le projet, y compris
`DATABASE_URL`. Activer les *cron jobs* pour les rappels de webinaires
(24 h et 1 h avant `starts_at`).

## 4. Après mise en ligne : vérifications

- [ ] Les trois langues s'affichent, l'arabe en RTL complet.
- [ ] Aucune erreur en console (`F12`) sur les pages principales.
- [ ] Création de compte, connexion, déconnexion, mot de passe oublié.
- [ ] Filtres, tri, pagination, recherche globale.
- [ ] Inscription à une formation, validation d'une leçon, quiz, certificat.
- [ ] Téléchargement/impression d'un outil et d'une ressource.
- [ ] Administration : création, publication, dépublication, suppression.
- [ ] Rôles : un compte étudiant n'accède pas à `/admin`.
- [ ] Responsive : 375 px, 768 px, 1024 px, 1440 px.
- [ ] Balises `og:` correctes (test : partage sur WhatsApp / LinkedIn).
- [ ] En-têtes de sécurité présents (test : securityheaders.com).
- [ ] Avertissement médical visible sur les pages cliniques.
