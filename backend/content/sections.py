"""
Registre des six sections de contenu.

Une seule table décrit, pour chaque section, ses filtres, ses tris et son
modèle. Les clés de filtre sont **exactement** celles que le front-end met
déjà dans la query string (`?type=protocole&pathology=lombalgie-commune`),
définies dans `src/components/filters/presets.ts` : l'API se branche donc
sans réécrire les URL de filtre, qui restent partageables.

Les tris reprennent `SortKey` de `src/lib/content.ts` :
`newest` · `oldest` · `popular` · `az`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from django.db.models import F, Q, QuerySet, Value
from django.db.models.functions import Coalesce
from django.utils import timezone

from .models import ClinicalTool, Course, Exercise, Pathology, Resource, Webinar


@dataclass(frozen=True)
class Filter:
    """
    Un groupe de filtre : la clé vue par le client, et le chemin ORM visé.

    `values_source` indique d'où viennent les valeurs possibles, pour les
    facettes : un champ de taxonomie, un champ propre, ou une relation.
    """

    key: str
    lookup: str
    # Les valeurs d'une facette se comptent sur ce chemin (souvent le même).
    facet_path: str | None = None

    @property
    def path(self) -> str:
        return self.facet_path or self.lookup


def webinar_status_filter(queryset: QuerySet, values: list[str]) -> QuerySet:
    """
    Statut d'un webinaire — calculé, donc traité à part.

    `ends_at` est stocké (cf. `Webinar.save`), ce qui permet de rester en
    SQL et de ne pas casser la pagination.
    """
    now = timezone.now()
    clauses = Q()
    for value in values:
        if value == "live":
            clauses |= Q(starts_at__lte=now, ends_at__gte=now)
        elif value == "upcoming":
            clauses |= Q(starts_at__gt=now)
        elif value == "replay":
            clauses |= Q(ends_at__lt=now) & ~Q(replay_url="")
        elif value == "past":
            clauses |= Q(ends_at__lt=now, replay_url="")
    return queryset.filter(clauses) if clauses else queryset.none()


@dataclass(frozen=True)
class Section:
    name: str
    model: type
    filters: tuple[Filter, ...]
    sorts: tuple[str, ...]
    # Champ servant au tri alphabétique et au titre affiché.
    title_field: str
    # Champs additionnés pour le tri « populaire ».
    popularity_fields: tuple[str, ...] = ()
    # Champ de date pour « newest » / « oldest ».
    date_field: str = "published_at"
    # Filtres calculés, traités en Python plutôt que par un simple lookup.
    special: dict[str, Callable[[QuerySet, list[str]], QuerySet]] = field(
        default_factory=dict
    )
    select_related: tuple[str, ...] = ()
    prefetch_related: tuple[str, ...] = ()

    def filter_map(self) -> dict[str, Filter]:
        return {f.key: f for f in self.filters}


ALL_SORTS = ("newest", "oldest", "popular", "az")

SECTIONS: dict[str, Section] = {
    "resources": Section(
        name="resources",
        model=Resource,
        filters=(
            Filter("type", "category_id"),
            Filter("pathology", "pathologies__slug"),
            Filter("region", "region_id"),
            Filter("specialty", "specialty_id"),
            Filter("level", "level"),
            Filter("language", "language"),
            Filter("access", "access"),
        ),
        sorts=ALL_SORTS,
        title_field="title",
        popularity_fields=("views", "download_count"),
        date_field="published_at",
        select_related=("category", "author", "region", "specialty"),
        prefetch_related=("tags", "pathologies", "translations"),
    ),
    "courses": Section(
        name="courses",
        model=Course,
        filters=(
            Filter("level", "level"),
            Filter("specialty", "specialty_id"),
            Filter("pathology", "pathologies__slug"),
            Filter("region", "region_id"),
            Filter("access", "access"),
        ),
        sorts=ALL_SORTS,
        title_field="title",
        popularity_fields=("enrolled_count",),
        date_field="published_at",
        select_related=("instructor", "region", "specialty"),
        prefetch_related=("tags", "pathologies", "translations", "modules__lessons"),
    ),
    "webinars": Section(
        name="webinars",
        model=Webinar,
        filters=(
            Filter("specialty", "specialty_id"),
            Filter("pathology", "pathologies__slug"),
        ),
        sorts=ALL_SORTS,
        title_field="title",
        popularity_fields=("registered_count",),
        date_field="starts_at",
        special={"status": webinar_status_filter},
        select_related=("speaker", "region", "specialty"),
        prefetch_related=("tags", "pathologies", "translations"),
    ),
    "tools": Section(
        name="tools",
        model=ClinicalTool,
        filters=(
            Filter("type", "type"),
            Filter("pathology", "pathologies__slug"),
            Filter("region", "region_id"),
            Filter("specialty", "specialty_id"),
            Filter("access", "access"),
        ),
        sorts=ALL_SORTS,
        title_field="name",
        popularity_fields=("download_count",),
        date_field="created_at",
        select_related=("region", "specialty"),
        prefetch_related=("pathologies", "translations"),
    ),
    "exercises": Section(
        name="exercises",
        model=Exercise,
        filters=(
            Filter("region", "region_id"),
            Filter("objective", "objective"),
            Filter("difficulty", "difficulty"),
            Filter("pathology", "pathologies__slug"),
        ),
        sorts=ALL_SORTS,
        title_field="name",
        date_field="created_at",
        select_related=("region",),
        prefetch_related=("tags", "pathologies", "translations"),
    ),
    "pathologies": Section(
        name="pathologies",
        model=Pathology,
        filters=(
            Filter("region", "region_id"),
            Filter("specialty", "specialty_id"),
        ),
        sorts=ALL_SORTS,
        title_field="name",
        date_field="created_at",
        select_related=("region", "specialty"),
        prefetch_related=("translations",),
    ),
}


def popularity_expression(section: Section):
    """Somme des compteurs de la section, 0 si elle n'en a pas."""
    if not section.popularity_fields:
        return Value(0)
    expression = F(section.popularity_fields[0])
    for name in section.popularity_fields[1:]:
        expression = expression + F(name)
    return Coalesce(expression, Value(0))
