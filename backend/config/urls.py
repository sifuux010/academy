"""
Routage racine.

L'API vit sous /api/. L'administration Django sous /admin/ sert d'outil
d'édition à l'équipe scientifique, en complément de l'administration
intégrée au front-end.

En production (cPanel, app Python unique), Django sert aussi le front
compilé : tout ce qui ne commence pas par admin/, api/, static/ ou media/
renvoie dist/index.html et laisse le routeur React (BrowserRouter) prendre
la main — le même rôle que le .htaccess de rewrite sur un hébergement
purement statique.
"""

from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve as serve_static

admin.site.site_header = "KINEDOK ACADÉMIE"
admin.site.site_title = "KINEDOK ACADÉMIE"
admin.site.index_title = "Administration"


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/content/", include("content.urls")),
    path("api/activity/", include("activity.urls")),
    path("api/promotions/", include("promotions.urls")),
]

# Fichiers téléversés (avatars…). `static()` ne sert rien quand DEBUG=False ;
# derrière Passenger (cPanel), toutes les requêtes passent par Django, donc on
# sert MEDIA explicitement — volume faible (images de profil).
_media_prefix = settings.MEDIA_URL.lstrip("/")
urlpatterns += [
    re_path(
        rf"^{_media_prefix}(?P<path>.*)$",
        serve_static,
        {"document_root": settings.MEDIA_ROOT},
    ),
]

if not settings.DEBUG:
    _index_path = settings.FRONTEND_DIST_DIR / "index.html"

    def serve_frontend(_request, **_kwargs):
        # Lu à chaque requête, et jamais à l'import : une absence du build
        # ne fait pas planter l'application entière (l'API reste servie),
        # elle se limite à un 404 lisible sur les routes du front.
        try:
            return HttpResponse(
                _index_path.read_text(encoding="utf-8"),
                content_type="text/html; charset=utf-8",
            )
        except FileNotFoundError:
            return HttpResponse(
                f"Front-end introuvable : {_index_path} manquant. "
                "Construire avec `npm run build` et déposer le contenu de "
                "dist/ dans ce dossier.",
                status=404,
                content_type="text/plain; charset=utf-8",
            )

    urlpatterns += [
        re_path(r"^(?!api/|admin/|static/|media/).*$", serve_frontend, name="frontend"),
    ]
