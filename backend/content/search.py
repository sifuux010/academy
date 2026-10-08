"""
Normalisation et index de recherche.

Portage littéral de `normalize()` (src/lib/format.ts) et de `searchText()`
(src/lib/content.ts) : la recherche doit donner les mêmes résultats côté
serveur que l'implémentation front-end qu'elle remplace — insensible à la
casse, aux accents latins et aux diacritiques arabes, étendue aux synonymes
des pathologies.

Le texte normalisé est stocké dans une colonne `search_text` mise à jour à
chaque enregistrement. C'est ce qui rend la recherche portable : un `LIKE`
sur une colonne déjà normalisée se comporte de façon identique sous MySQL
et sous SQLite, sans dépendre d'une collation ni d'un index plein texte.
"""

from __future__ import annotations

import re
import unicodedata

RE_LATIN_MARKS = re.compile(r"[̀-ͯ]")
RE_ARABIC_MARKS = re.compile(r"[ً-ٰٟ]")
RE_SPACE = re.compile(r"\s+")

# Longueur minimale d'une requête, alignée sur le front-end.
MIN_QUERY_LENGTH = 2


def normalize(value) -> str:
    """Minuscules, ligatures décomposées, accents et diacritiques retirés."""
    text = str(value if value is not None else "").lower()
    text = text.replace("œ", "oe").replace("æ", "ae")
    text = unicodedata.normalize("NFD", text)
    text = RE_LATIN_MARKS.sub("", text)
    text = RE_ARABIC_MARKS.sub("", text)
    return text


def query_words(query: str) -> list[str]:
    """Mots d'une requête, vide si elle est trop courte pour être utile."""
    cleaned = (query or "").strip()
    if len(cleaned) < MIN_QUERY_LENGTH:
        return []
    return [word for word in RE_SPACE.split(normalize(cleaned)) if word]


# Champs textuels repris dans l'index, par ordre d'intérêt.
TEXT_FIELDS = (
    "title", "name", "subtitle", "description", "summary", "abstract",
    "purpose", "goal",
)
LIST_FIELDS = ("aliases", "target_muscles", "key_points")


def build_search_text(instance) -> str:
    """
    Assemble l'index d'un contenu : ses champs textuels, ses traductions,
    ses mots-clés, les noms et synonymes de ses pathologies, et le nom de
    son auteur ou de son intervenant.
    """
    parts: list[str] = []

    for field in TEXT_FIELDS:
        value = getattr(instance, field, None)
        if isinstance(value, str) and value:
            parts.append(value)

    for field in LIST_FIELDS:
        value = getattr(instance, field, None)
        if isinstance(value, list):
            parts.extend(str(item) for item in value if item)

    if instance.pk:
        # Relations : seulement si l'objet existe déjà en base.
        for relation in ("tags",):
            manager = getattr(instance, relation, None)
            if manager is not None:
                parts.extend(manager.values_list("slug", flat=True))

        pathologies = getattr(instance, "pathologies", None)
        if pathologies is not None:
            for name, aliases in pathologies.values_list("name", "aliases"):
                parts.append(name)
                if isinstance(aliases, list):
                    parts.extend(str(a) for a in aliases if a)

        translations = getattr(instance, "translations", None)
        if translations is not None:
            parts.extend(translations.values_list("value", flat=True))

    for field in ("author", "instructor", "speaker"):
        person = getattr(instance, field, None)
        if person is not None:
            parts.append(f"{person.first_name} {person.last_name}")

    return normalize(" ".join(str(p) for p in parts if p))[:65535]
