# Déploiement — https://academy.kinedok.dz

Le front et l'API sont servis par **le même domaine**. Le navigateur appelle
`/api/...` en relatif ; le cookie de session reste donc en `SameSite=Lax`,
et aucune configuration CORS n'est nécessaire pour les écritures.

| Chemin        | Servi par                                   |
| ------------- | ------------------------------------------- |
| `/`           | le build Vite (`dist/`), fichiers statiques |
| `/api/...`    | Django (Gunicorn)                           |
| `/admin/`     | l'administration Django                     |
| `/static/...` | `collectstatic`                             |

## 1. Base de données

```bash
mysql -u root -p < db/create_database.sql
```

Le fichier crée la base `kinedok_academie` en `utf8mb4` et le compte
`kinedok`, limité à cette base. **Changer le mot de passe dans le fichier
avant de l'exécuter**, puis le reporter dans `.env`.

Aucune table n'y est écrite : le schéma appartient aux migrations Django,
qui en sont la seule source de vérité.

## 2. Backend

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.production.example .env        # puis renseigner les secrets
python -c "import secrets;print(secrets.token_urlsafe(64))"   # DJANGO_SECRET_KEY

python manage.py migrate
python manage.py seed_content          # taxonomies + contenus de référence
python manage.py seed_promotions       # accueil de démonstration — facultatif
python manage.py reindex_search
python manage.py createsuperuser
python manage.py collectstatic --noinput

python manage.py check --deploy        # doit renvoyer « no issues »
gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3
```

## 3. Front-end

```bash
npm ci && npm run build                # produit dist/
```

`VITE_API_BASE` n'a pas à être défini : l'API est sur le même domaine, et
le client part sur `/api` par défaut.

## 4. Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name academy.kinedok.dz;

    ssl_certificate     /etc/letsencrypt/live/academy.kinedok.dz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/academy.kinedok.dz/privkey.pem;

    root /var/www/academy/dist;
    index index.html;

    # Django se fie à cet en-tête pour savoir que la requête est bien
    # arrivée en HTTPS (SECURE_PROXY_SSL_HEADER).
    location ~ ^/(api|admin)/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ { alias /var/www/academy/static/; }
    location /media/  { alias /var/www/academy/media/;  }

    # Les noms de fichiers du build portent une empreinte : ils ne
    # changent jamais sans changer de nom.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Application à page unique : toute route inconnue rend index.html,
    # sans quoi un rechargement sur /fr/formations renverrait un 404.
    location / { try_files $uri $uri/ /index.html; }
}

server {
    listen 80;
    server_name academy.kinedok.dz;
    return 301 https://$host$request_uri;
}
```

## Vérifications

```bash
curl -I  https://academy.kinedok.dz/api/health/
curl -sI https://academy.kinedok.dz/ | grep -i strict-transport
```
