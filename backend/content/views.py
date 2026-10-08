"""
API de contenu — lecture publique.

Un seul jeu de vues sert les six sections, piloté par le registre de
`sections.py`. Les réponses de liste ont la forme attendue par le
front-end (`{ items, total, page, pages, perPage }`), enrichie des facettes
pour que le panneau de filtres affiche ses compteurs.

Routes :

    GET /api/content/<section>/            liste filtrée, triée, paginée
    GET /api/content/<section>/<slug>/     fiche détaillée
    GET /api/content/taxonomies/           vocabulaires contrôlés
    GET /api/content/authors/              auteurs et intervenants
    GET /api/content/pathologies/<slug>/hub/   tout ce qui s'y rattache
    GET /api/content/search/               recherche globale, six sections
    GET /api/content/stats/                compteurs de la page d'accueil
"""

from __future__ import annotations

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from subscriptions.models import Plan
from taxonomies.models import BodyRegion, ResourceCategory, Specialty, Tag

from .models import (
    Author,
    ClinicalTool,
    Course,
    Exercise,
    Pathology,
    Resource,
    Webinar,
)
from .queries import run_list, visible
from .search import query_words
from .sections import SECTIONS
from .serializers import SERIALIZERS, AuthorSerializer

# Nombre de résultats par section dans la recherche globale.
SEARCH_PER_SECTION = 6


def section_or_404(name: str):
    section = SECTIONS.get(name)
    if section is None:
        return None
    return section


class SectionListView(APIView):
    """Liste d'une section : filtres, recherche, tri, pagination, facettes."""

    permission_classes = [AllowAny]

    def get(self, request, section: str):
        config = section_or_404(section)
        if config is None:
            return Response(
                {"detail": "content.errors.unknownSection"},
                status=status.HTTP_404_NOT_FOUND,
            )

        result, filters, facets = run_list(
            config,
            request.query_params,
            with_facets=request.query_params.get("facets") != "0",
        )
        list_serializer = SERIALIZERS[section][0]
        return Response(
            {
                "section": section,
                "items": list_serializer(
                    result["items"], many=True, context={"request": request}
                ).data,
                "total": result["total"],
                "page": result["page"],
                "pages": result["pages"],
                "perPage": result["perPage"],
                "sort": result["sort"],
                "query": result["query"],
                "filters": filters,
                "facets": facets,
            }
        )


class SectionDetailView(APIView):
    """Fiche détaillée, par slug."""

    permission_classes = [AllowAny]

    def get(self, request, section: str, slug: str):
        config = section_or_404(section)
        if config is None:
            return Response(
                {"detail": "content.errors.unknownSection"},
                status=status.HTTP_404_NOT_FOUND,
            )

        queryset = visible(config)
        if section == "resources":
            queryset = queryset.prefetch_related("key_point_set", "reference_set")
        if section == "courses":
            queryset = queryset.prefetch_related(
                "modules__lessons__quiz__questions__answers"
            )
        item = get_object_or_404(queryset, slug=slug)
        detail_serializer = SERIALIZERS[section][1]
        return Response(detail_serializer(item, context={"request": request}).data)


class TaxonomiesView(APIView):
    """
    Vocabulaires contrôlés.

    Les clés seules sont servies : les libellés viennent des dictionnaires
    i18n du front-end, exactement comme avant.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "regions": list(
                    BodyRegion.objects.order_by("order", "id").values_list("id", flat=True)
                ),
                "specialties": list(
                    Specialty.objects.order_by("order", "id").values_list("id", flat=True)
                ),
                "resourceTypes": list(
                    ResourceCategory.objects.order_by("order", "id").values_list(
                        "id", flat=True
                    )
                ),
                "toolTypes": sorted(
                    ClinicalTool.objects.filter(published=True)
                    .values_list("type", flat=True)
                    .distinct()
                ),
                "objectives": sorted(
                    Exercise.objects.filter(published=True)
                    .values_list("objective", flat=True)
                    .distinct()
                ),
                "tags": list(Tag.objects.order_by("slug").values_list("slug", flat=True)),
            }
        )


class AuthorsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        authors = Author.objects.all().order_by("last_name", "first_name")
        return Response(
            {
                "items": AuthorSerializer(
                    authors, many=True, context={"request": request}
                ).data,
                "total": authors.count(),
            }
        )


class PathologyHubView(APIView):
    """
    Point d'entrée transversal d'une pathologie.

    Réunit en une requête ce que la page pathologie affiche : ressources,
    protocoles, bilans, exercices, formations et webinaires rattachés.
    """

    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        pathology = get_object_or_404(
            Pathology.objects.select_related("region", "specialty").filter(published=True),
            slug=slug,
        )
        context = {"request": request}

        resources = visible(SECTIONS["resources"]).filter(pathologies=pathology)
        tools = visible(SECTIONS["tools"]).filter(pathologies=pathology)

        payload = {
            "pathology": SERIALIZERS["pathologies"][1](pathology, context=context).data,
            # Les protocoles sont isolés : la page leur réserve un bloc.
            "protocols": SERIALIZERS["resources"][0](
                resources.filter(category_id="protocole"), many=True, context=context
            ).data,
            "resources": SERIALIZERS["resources"][0](
                resources.exclude(category_id="protocole"), many=True, context=context
            ).data,
            "assessments": SERIALIZERS["tools"][0](
                tools.filter(type="bilan"), many=True, context=context
            ).data,
            "tools": SERIALIZERS["tools"][0](
                tools.exclude(type="bilan"), many=True, context=context
            ).data,
            "exercises": SERIALIZERS["exercises"][0](
                visible(SECTIONS["exercises"]).filter(pathologies=pathology),
                many=True, context=context,
            ).data,
            "courses": SERIALIZERS["courses"][0](
                visible(SECTIONS["courses"]).filter(pathologies=pathology),
                many=True, context=context,
            ).data,
            "webinars": SERIALIZERS["webinars"][0](
                visible(SECTIONS["webinars"]).filter(pathologies=pathology),
                many=True, context=context,
            ).data,
        }
        return Response(payload)


class GlobalSearchView(APIView):
    """
    Recherche globale : une requête, six sections de résultats.

    Insensible aux accents et aux diacritiques arabes, étendue aux synonymes
    des pathologies — « tendinopathie rotulienne » trouve la fiche
    « tendinopathie patellaire » et ses outils, exercices et protocoles.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "") or ""
        words = query_words(query)
        if not words:
            return Response({"query": query, "total": 0, "sections": {}})

        try:
            per_section = int(request.query_params.get("perSection", SEARCH_PER_SECTION))
        except (TypeError, ValueError):
            per_section = SEARCH_PER_SECTION
        per_section = max(1, min(per_section, 50))

        sections: dict[str, dict] = {}
        total = 0
        for name, config in SECTIONS.items():
            queryset = visible(config)
            for word in words:
                queryset = queryset.filter(search_text__contains=word)
            count = queryset.count()
            total += count
            if not count:
                continue
            items = queryset.order_by(f"-{config.date_field}", "slug")[:per_section]
            sections[name] = {
                "total": count,
                "items": SERIALIZERS[name][0](
                    items, many=True, context={"request": request}
                ).data,
            }

        return Response({"query": query, "total": total, "sections": sections})


class StatsView(APIView):
    """Compteurs affichés sur la page d'accueil."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "resources": Resource.objects.filter(published=True).count(),
                "courses": Course.objects.filter(published=True).count(),
                "webinars": Webinar.objects.filter(published=True).count(),
                "tools": ClinicalTool.objects.filter(published=True).count(),
                "exercises": Exercise.objects.filter(published=True).count(),
                "pathologies": Pathology.objects.filter(published=True).count(),
                "authors": Author.objects.count(),
            }
        )


def plan_payload(plan: Plan) -> dict:
    return {
        "id": str(plan.id),
        "slug": plan.slug,
        "name": plan.name,
        "tagline": plan.tagline,
        "priceDzd": plan.price_dzd,
        "interval": plan.interval,
        "audience": plan.audience,
        "features": plan.features,
        "limits": plan.limits,
        "premium": plan.premium,
        "highlighted": plan.highlighted,
        "order": plan.order,
    }


class PlansView(APIView):
    """Formules d'abonnement — page publique de comparaison."""

    permission_classes = [AllowAny]

    def get(self, request):
        plans = Plan.objects.filter(published=True).order_by("order", "price_dzd")
        return Response(
            {"items": [plan_payload(p) for p in plans], "total": plans.count()}
        )


class BootstrapView(APIView):
    """
    Tout le contenu publié, en une réponse — source d'amorçage du front-end.

    Le front remplit son magasin en mémoire avec ceci au démarrage : les
    pages gardent leurs lectures synchrones (`list` / `getById`) tout en
    s'appuyant sur les données réelles de la base (identifiants UUID, slugs),
    au lieu du jeu figé compilé dans le bundle. Les sérialiseurs « détail »
    sont utilisés pour que les fiches disposent de leurs champs complets
    (modules et leçons des formations, points-clés des ressources…).
    """

    permission_classes = [AllowAny]

    def get(self, request):
        ctx = {"request": request}

        def dump(section: str, queryset):
            return SERIALIZERS[section][1](queryset, many=True, context=ctx).data

        resources = visible(SECTIONS["resources"]).prefetch_related(
            "key_point_set", "reference_set"
        )
        courses = visible(SECTIONS["courses"]).prefetch_related(
            "modules__lessons__quiz__questions__answers"
        )
        pathologies = visible(SECTIONS["pathologies"]).select_related(
            "region", "specialty"
        )

        return Response(
            {
                "resources": dump("resources", resources),
                "courses": dump("courses", courses),
                "webinars": dump("webinars", visible(SECTIONS["webinars"])),
                "tools": dump("tools", visible(SECTIONS["tools"])),
                "exercises": dump("exercises", visible(SECTIONS["exercises"])),
                "pathologies": dump("pathologies", pathologies),
                "authors": AuthorSerializer(
                    Author.objects.all(), many=True, context=ctx
                ).data,
                "plans": [
                    plan_payload(p)
                    for p in Plan.objects.filter(published=True).order_by(
                        "order", "price_dzd"
                    )
                ],
            }
        )
