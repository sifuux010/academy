# Déploiement — cPanel « Setup Python App »

Une seule application Python sert tout : Django répond sur `/api/...` et
`/admin/...`, et sert aussi le front compilé (React + Vite) pour toutes les
autres routes, via WhiteNoise. Un seul point à configurer dans cPanel, un
seul domaine, pas de CORS à gérer.

```
┌─ academy_api/  (racine de l'app Python, hors public_html)
│  ├─ passenger_wsgi.py
│  ├─ manage.py
│  ├─ config/ accounts/ activity/ analytics/ content/ promotions/
│  │   subscriptions/ taxonomies/ seed/
│  ├─ requirements.txt
│  ├─ .env                 ← copié depuis .env.production, secrets remplis
│  └─ dist/                ← contenu de `npm run build` (racine du projet)
```

## 1. Base de données MySQL

Déjà fait si `backend/.env.production` contient déjà un nom de base et un
utilisateur réels (`qsyagngb_academy` / `qsyagngb_amdjed`) : c'est que la base
et l'utilisateur ont été créés via cPanel → **MySQL® Databases**, avec
l'utilisateur ajouté à la base avec « ALL PRIVILEGES ». Sinon, à faire avant
la suite.

## 2. cPanel → Setup Python App

- **Python version** : 3.11 ou 3.12 (Django 5.0 supporte 3.10 à 3.12 ; 3.13
  fonctionne aussi mais vérifier sa disponibilité sur l'hébergement).
- **Application root** : `academy_api` (un dossier **hors** de `public_html`
  — cPanel le crée).
- **Application URL** : le domaine ou sous-domaine visé, **sans** sous-chemin
  (ex. `academy.kinedok.dz`), pour que l'app couvre tout le domaine.
- **Application startup file** : `passenger_wsgi.py`
- **Application Entry point** : `application`

Cliquer **Create**. cPanel crée le virtualenv et place un `passenger_wsgi.py`
d'exemple dans `academy_api/` — il sera remplacé à l'étape 4.

## 3. Uploader le code

Dans `academy_api/`, via le gestionnaire de fichiers cPanel ou en SFTP/SSH :

- Le **contenu de `backend/`** (en conservant la structure : `config/`,
  `accounts/`, `manage.py`, `requirements.txt`, `passenger_wsgi.py`…).
- Le **contenu de `backend/.env.production`**, renommé `.env`, avec les
  vrais secrets (`DJANGO_SECRET_KEY` généré, mot de passe MySQL…) :
  ```bash
  python -c "import secrets;print(secrets.token_urlsafe(64))"
  ```
- **Ne pas** uploader `backend/.venv/` (cPanel gère son propre virtualenv) ni
  `backend/db.sqlite3` ni les `__pycache__/`.

En local, construire le front et copier le résultat dans `academy_api/dist/` :

```bash
npm install
npm run build          # → dist/
# puis uploader le contenu de dist/ dans academy_api/dist/
```

## 4. Installer les dépendances et préparer la base

Dans l'interface **Setup Python App**, ouvrir le lien « commande d'activation
du virtualenv » (ou se connecter en SSH) :

```bash
source /home/<user>/virtualenv/academy_api/3.11/bin/activate
cd /home/<user>/academy_api
pip install -r requirements.txt
```

Si `mysqlclient` échoue à compiler (en-têtes MySQL absents du venv), voir la
note en fin de `requirements.txt` : basculer sur `PyMySQL`.

Puis, toujours dans ce venv :

```bash
python manage.py migrate
python manage.py collectstatic --noinput   # CSS/JS de l'admin Django
python manage.py createsuperuser           # compte admin
```

`python manage.py migrate` crée les 61 tables listées dans
`db/full_schema.sql` (généré depuis une base déjà migrée — il documente le
schéma, il ne sert pas à l'initialiser : c'est `migrate` qui fait foi).

## 5. Redémarrer l'app

Dans **Setup Python App**, bouton **Restart**. cPanel régénère
`tmp/restart.txt` pour forcer Passenger à recharger le code.

## 6. Vérifications

```bash
curl https://academy.kinedok.dz/api/health/
curl https://academy.kinedok.dz/api/content/stats/
```

Puis ouvrir `https://academy.kinedok.dz/` dans un navigateur : page d'accueil,
navigation profonde (`/fr/bibliotheque/...`) suivie d'un F5 (doit rester sur
la page, pas de 404 — c'est le test qui valide le repli SPA), connexion,
admin Django sur `/admin/`.

## Pourquoi une seule app plutôt que front/API séparés

Une alternative classique sur cPanel consiste à monter l'app Python sur un
sous-chemin (`Application URL = domaine/api`) et à déposer le front dans
`public_html/`. Elle a été écartée ici : Passenger retire alors le préfixe
`/api` de `PATH_INFO` avant qu'il n'atteigne Django, alors que
`config/urls.py` déclare ses routes avec le préfixe `api/` inclus (utilisé
tel quel par le serveur de développement Vite). Il aurait fallu deux
variantes de `urls.py` selon l'environnement. Servir aussi le front depuis
Django (WhiteNoise + vue de repli dans `config/urls.py`) évite cette
divergence et garde `.env` comme unique différence entre local et
production.

## Ce qui a été modifié dans le code pour ce déploiement

- `backend/requirements.txt` : ajout de `whitenoise`.
- `backend/config/settings.py` : middleware WhiteNoise ; `WHITENOISE_ROOT`
  pointant vers `dist/` s'il existe (absent en développement local).
- `backend/config/urls.py` : route de repli qui sert `dist/index.html` pour
  toute URL hors `admin/`, `api/`, `static/`, `media/`, uniquement quand
  `DEBUG=False` et que `dist/` existe (en développement, Vite sert déjà le
  front sur le port 8080 et relaie `/api/...` vers Django).
- `backend/passenger_wsgi.py` : nouveau, point d'entrée attendu par
  Passenger/cPanel.

Testé localement : `DJANGO_DEBUG=False`, `dist/` construit et copié à côté de
`manage.py`, serveur de dev Django lancé sur ce réglage — racine, lien
profond après rechargement, assets `/assets/*.js`, `/brand/*.svg`, `/api/...`
et `/static/admin/...` répondent tous 200.
