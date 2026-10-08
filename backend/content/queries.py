"""
Moteur de requête des listes — filtres, recherche, tri, pagination, facettes.

Portage de `list()` et `facetCounts()` de `src/lib/content.ts`, avec la même
sémantique :

- plusieurs valeurs d'un même filtre sont en **OU** (`?level=debutant&level=avance`) ;
- deux filtres différents sont en **ET** ;
- la recherche exige **tous** les mots, dans n'importe quel ordre ;
- une facette se compte en ignorant son propre filtre, pour que les autres
  choix restent visibles.
"""

from __future__ import annotations

from django.db.models import Count, Q, QuerySet

from .search import query_words
from .sections import Section, popularity_expression


def visible(section: Section, include_drafts: bool = False) -> QuerySet:
    """Requête de base : contenus publiés, relations préchargées."""
    queryset = section.model.objects.all()
    if not include_drafts:
        queryset = queryset.filter(published=True)
    if section.select_related:
        queryset = queryset.select_related(*section.select_related)
    if section.prefetch_related:
        queryset = queryset.prefetch_related(*section.prefetch_related)
    return queryset


def parse_filters(section: Section, params) -> dict[str, list[str]]:
    """Extrait des paramètres d'URL les filtres connus de la section."""
    known = set(section.filter_map()) | set(section.special)
    out: dict[str, list[str]] = {}
    for key in known:
        values = [v for v in params.getlist(key) if v]
        if values:
            out[key] = values
    return out


def apply_filters(
    queryset: QuerySet,
    section: Section,
    filters: dict[str, list[str]],
    skip: str | None = None,
) -> QuerySet:
    """
    Applique les filtres. `skip` sert au calcul d'une facette : on ignore
    le filtre de la facette elle-même.
    """
    filter_map = section.filter_map()
    for key, values in filters.items():
        if key == skip or not values:
            continue
        if key in section.special:
            queryset = section.special[key](queryset, values)
            continue
        lookup = filter_map[key].lookup
        queryset = queryset.filter(**{f"{lookup}__in": values})
    # Un filtre traversant une relation plusieurs-à-plusieurs peut dupliquer
    # les lignes : `pathology` en est le cas courant.
    if any(
        key in filter_map and "__" in filter_map[key].lookup
        for key in filters
        if key != skip
    ):
        queryset = queryset.distinct()
    return queryset


def apply_search(queryset: QuerySet, query: str) -> QuerySet:
    """Tous les mots doivent figurer dans l'index normalisé."""
    words = query_words(query)
    for word in words:
        queryset = queryset.filter(search_text__contains=word)
    return queryset


def apply_sort(queryset: QuerySet, section: Section, sort: str) -> QuerySet:
    if sort == "az":
        return queryset.order_by(section.title_field, "slug")
    if sort == "popular":
        return queryset.annotate(_popularity=popularity_expression(section)).order_by(
            "-_popularity", f"-{section.date_field}", "slug"
        )
    if sort == "oldest":
        return queryset.order_by(f"{section.date_field}", "slug")
    # `newest` par défaut. Les contenus sans date passent en dernier.
    return queryset.order_by(f"-{section.date_field}", "slug")


def paginate(queryset: QuerySet, page: int, per_page: int) -> dict:
    """
    Pagination à la forme attendue par le front-end :
    `{ items, total, page, pages, perPage }`.

    `perPage = 0` renvoie tout, comme `list()` sans `perPage`.
    """
    total = queryset.count()
    if per_page <= 0:
        return {
            "items": list(queryset),
            "total": total,
            "page": 1,
            "pages": 1,
            "perPage": 0,
        }
    pages = max(1, -(-total // per_page))  # division entière par excès
    page = max(1, min(page, pages))
    start = (page - 1) * per_page
    return {
        "items": list(queryset[start:start + per_page]),
        "total": total,
        "page": page,
        "pages": pages,
        "perPage": per_page,
    }


def facet_counts(
    section: Section, filters: dict[str, list[str]], query: str = ""
) -> dict[str, dict[str, int]]:
    """
    Occurrences de chaque valeur, filtre par filtre.

    Chaque facette est comptée sans son propre filtre : cocher « protocole »
    ne doit pas faire disparaître le compte des autres types.
    """
    out: dict[str, dict[str, int]] = {}

    for key, definition in section.filter_map().items():
        base = apply_search(visible(section), query)
        base = apply_filters(base, section, filters, skip=key)
        rows = (
            base.values(definition.path)
            .annotate(total=Count("id", distinct=True))
            .order_by()
        )
        out[key] = {
            str(row[definition.path]): row["total"]
            for row in rows
            if row[definition.path] not in (None, "")
        }

    # Les filtres calculés se comptent valeur par valeur.
    for key, handler in section.special.items():
        base = apply_search(visible(section), query)
        base = apply_filters(base, section, filters, skip=key)
        counts: dict[str, int] = {}
        for value in ("upcoming", "live", "replay", "past"):
            counts[value] = handler(base, [value]).distinct().count()
        out[key] = {k: v for k, v in counts.items() if v}

    return out


def run_list(
    section: Section,
    params,
    *,
    default_sort: str = "newest",
    default_per_page: int = 12,
    include_drafts: bool = False,
    with_facets: bool = True,
) -> tuple[dict, dict[str, list[str]], dict]:
    """Enchaîne filtres, recherche, tri et pagination. Retourne (page, filtres, facettes)."""
    filters = parse_filters(section, params)
    query = params.get("q", "") or ""

    sort = params.get("sort") or default_sort
    if sort not in section.sorts:
        sort = default_sort

    try:
        page = max(1, int(params.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = int(params.get("perPage", default_per_page))
    except (TypeError, ValueError):
        per_page = default_per_page
    # Garde-fou : une page géante n'est pas une requête légitime.
    per_page = max(0, min(per_page, 100))

    queryset = visible(section, include_drafts=include_drafts)
    queryset = apply_search(queryset, query)
    queryset = apply_filters(queryset, section, filters)
    queryset = apply_sort(queryset, section, sort)

    result = paginate(queryset, page, per_page)
    result["sort"] = sort
    result["query"] = query

    facets = facet_counts(section, filters, query) if with_facets else {}
    return result, filters, facets
