"""
API des mises en avant.

Un seul appel sert toute la page d'accueil : bannières du carrousel,
rayons, parcours par spécialité, partenaires et compteurs. Le front-end
n'enchaîne pas six requêtes pour afficher sa première vue.

    GET  /api/promotions/home/                    tout l'accueil
    GET  /api/promotions/sponsored/?placement=…   sponsors d'un emplacement
    POST /api/promotions/sponsored/<id>/click/    enregistre un clic
"""

from __future__ import annotations

from django.db.models import F
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from content.models import (
    Author,
    ClinicalTool,
    Course,
    Exercise,
    Pathology,
    Resource,
    Webinar,
)
from content.queries import visible
from content.sections import SECTIONS
from content.serializers import SERIALIZERS

from .models import Banner, Partner, Placement, Shelf, Sponsorship


def serialize_banner(banner: Banner) -> dict:
    return {
        "id": str(banner.id),
        "theme": banner.theme,
        "eyebrow": banner.eyebrow,
        "title": banner.title,
        "body": banner.body,
        "ctaLabel": banner.cta_label,
        "ctaHref": banner.cta_href,
        "imageUrl": banner.image_url,
        "partner": (
            {
                "slug": banner.partner.slug,
                "name": banner.partner.name,
                "logoUrl": banner.partner.logo_url,
            }
            if banner.partner_id
            else None
        ),
    }


def serialize_partner(partner: Partner) -> dict:
    return {
        "slug": partner.slug,
        "name": partner.name,
        "kind": partner.kind,
        "logoUrl": partner.logo_url,
        "url": partner.url,
    }


def shelf_items(shelf: Shelf, request) -> list[dict]:
    """
    Résout le contenu d'un rayon.

    Une sélection manuelle conserve l'ordre voulu par l'éditeur ; une
    source automatique rejoue une requête de liste ordinaire.
    """
    context = {"request": request}

    if shelf.source == "manual":
        # Un rayon manuel peut mélanger les sections : on regroupe par
        # section pour ne faire qu'une requête par type de contenu.
        wanted = list(shelf.items.all())
        by_section: dict[str, list[str]] = {}
        for entry in wanted:
            by_section.setdefault(entry.section, []).append(entry.slug)

        found: dict[tuple[str, str], dict] = {}
        for section_name, slugs in by_section.items():
            config = SECTIONS.get(section_name)
            if config is None:
                continue
            queryset = visible(config).filter(slug__in=slugs)
            serializer = SERIALIZERS[section_name][0]
            for payload in serializer(queryset, many=True, context=context).data:
                found[(section_name, payload["slug"])] = {
                    **payload, "section": section_name
                }
        # On restitue l'ordre de la sélection, en ignorant ce qui a été
        # dépublié entre-temps.
        return [
            found[(entry.section, entry.slug)]
            for entry in wanted
            if (entry.section, entry.slug) in found
        ]

    config = SECTIONS.get(shelf.section)
    if config is None:
        return []

    queryset = visible(config)
    for key, values in (shelf.filters or {}).items():
        definition = config.filter_map().get(key)
        if definition and values:
            queryset = queryset.filter(**{f"{definition.lookup}__in": values})
    queryset = queryset.distinct()

    if shelf.source == "popular":
        from content.sections import popularity_expression

        queryset = queryset.annotate(
            _popularity=popularity_expression(config)
        ).order_by("-_popularity", f"-{config.date_field}", "slug")
    else:
        queryset = queryset.order_by(f"-{config.date_field}", "slug")

    serializer = SERIALIZERS[shelf.section][0]
    return [
        {**payload, "section": shelf.section}
        for payload in serializer(
            queryset[: shelf.limit], many=True, context=context
        ).data
    ]


def serialize_shelf(shelf: Shelf, request) -> dict:
    return {
        "id": str(shelf.id),
        "key": shelf.key,
        "title": shelf.title,
        "subtitle": shelf.subtitle,
        "ctaLabel": shelf.cta_label,
        "ctaHref": shelf.cta_href,
        "section": shelf.section,
        "source": shelf.source,
        "items": shelf_items(shelf, request),
    }


def sponsored_for(placement: str, request, limit: int = 4) -> list[dict]:
    """
    Contenus sponsorisés d'un emplacement, résolus et comptés.

    L'impression est enregistrée ici : le contenu a bien été servi. Le clic,
    lui, est signalé par le front-end.
    """
    sponsorships = list(
        Sponsorship.objects.live()
        .select_related("partner")
        .order_by("-weight", "position")[:limit]
        if placement is None
        else Sponsorship.objects.live()
        .filter(placement=placement)
        .select_related("partner")
        .order_by("-weight", "position")[:limit]
    )
    if not sponsorships:
        return []

    context = {"request": request}
    out: list[dict] = []
    served: list[Sponsorship] = []

    for sponsorship in sponsorships:
        config = SECTIONS.get(sponsorship.section)
        if config is None:
            continue
        item = visible(config).filter(slug=sponsorship.slug).first()
        if item is None:
            # Contenu dépublié : le sponsor ne doit rien afficher.
            continue
        payload = SERIALIZERS[sponsorship.section][0](item, context=context).data
        out.append(
            {
                "id": str(sponsorship.id),
                "section": sponsorship.section,
                "label": sponsorship.label,
                "note": sponsorship.note,
                "partner": (
                    serialize_partner(sponsorship.partner)
                    if sponsorship.partner_id
                    else None
                ),
                "item": payload,
            }
        )
        served.append(sponsorship)

    if served:
        Sponsorship.objects.filter(pk__in=[s.pk for s in served]).update(
            impressions=F("impressions") + 1
        )
    return out


class HomeView(APIView):
    """Toute la page d'accueil en une requête."""

    permission_classes = [AllowAny]

    def get(self, request):
        banners = Banner.objects.live().filter(
            placement=Placement.HOME_HERO
        ).select_related("partner")

        featured = Shelf.objects.live().filter(placement=Placement.HOME_FEATURED)
        career = Shelf.objects.live().filter(placement=Placement.HOME_CAREER)

        return Response(
            {
                "banners": [serialize_banner(b) for b in banners],
                "shelves": [serialize_shelf(s, request) for s in featured],
                "career": [serialize_shelf(s, request) for s in career],
                "sponsored": sponsored_for(Placement.HOME_FEATURED, request),
                "partners": [
                    serialize_partner(p)
                    for p in Partner.objects.filter(active=True)
                ],
                "stats": {
                    "resources": Resource.objects.filter(published=True).count(),
                    "courses": Course.objects.filter(published=True).count(),
                    "webinars": Webinar.objects.filter(published=True).count(),
                    "tools": ClinicalTool.objects.filter(published=True).count(),
                    "exercises": Exercise.objects.filter(published=True).count(),
                    "pathologies": Pathology.objects.filter(published=True).count(),
                    "authors": Author.objects.count(),
                },
            }
        )


class SponsoredView(APIView):
    """Contenus sponsorisés d'un emplacement donné."""

    permission_classes = [AllowAny]

    def get(self, request):
        placement = request.query_params.get("placement")
        if placement not in Placement.values:
            return Response(
                {"detail": "promotions.errors.unknownPlacement"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            limit = int(request.query_params.get("limit", 4))
        except (TypeError, ValueError):
            limit = 4
        limit = max(1, min(limit, 12))
        return Response({"placement": placement,
                         "items": sponsored_for(placement, request, limit)})


class SponsoredClickView(APIView):
    """
    Enregistre un clic sur un contenu sponsorisé.

    Volontairement sans authentification : la mesure porte sur l'annonce,
    pas sur la personne. Aucune donnée du visiteur n'est conservée.
    """

    permission_classes = [AllowAny]

    def post(self, request, pk):
        updated = Sponsorship.objects.filter(pk=pk).update(clicks=F("clicks") + 1)
        if not updated:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
