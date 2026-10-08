"""
Taxonomies — vocabulaires contrôlés partagés par toutes les sections.

Les identifiants sont des slugs lisibles (`genou`, `neurologie`, `protocole`)
et non des UUID : ils apparaissent tels quels dans les URL de filtre du
front-end (`?region=genou`) et dans les dictionnaires i18n.
"""

from django.db import models

from config.enums import Locale
from config.models import UUIDModel


class Term(models.Model):
    """Base des taxonomies à identifiant lisible."""

    id = models.SlugField(primary_key=True, max_length=64)
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        abstract = True
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return self.id


class BodyRegion(Term):
    """Région anatomique : rachis, épaule, genou…"""

    class Meta(Term.Meta):
        abstract = False
        ordering = ["order", "id"]
        verbose_name = "région anatomique"
        verbose_name_plural = "régions anatomiques"


class Specialty(Term):
    """Spécialité : musculosquelettique, sport, neurologie…"""

    class Meta(Term.Meta):
        abstract = False
        ordering = ["order", "id"]
        verbose_name = "spécialité"
        verbose_name_plural = "spécialités"


class ResourceCategory(Term):
    """Catégorie de ressource : revue, article, protocole, livre…"""

    class Meta(Term.Meta):
        abstract = False
        ordering = ["order", "id"]
        verbose_name = "catégorie de ressource"
        verbose_name_plural = "catégories de ressource"


class Tag(models.Model):
    """Mot-clé libre, partagé entre ressources et exercices."""

    slug = models.SlugField(primary_key=True, max_length=96)

    class Meta:
        ordering = ["slug"]
        verbose_name = "mot-clé"
        verbose_name_plural = "mots-clés"

    def __str__(self) -> str:
        return self.slug


class TermLabel(UUIDModel):
    """
    Libellé traduit d'un terme de taxonomie.

    L'interface utilise ses propres dictionnaires i18n ; ces libellés servent
    l'API publique et l'administration, pour qu'un terme ne soit pas affiché
    sous forme de slug hors de l'application React.
    """

    locale = models.CharField(max_length=2, choices=Locale.choices)
    label = models.CharField(max_length=200)

    body_region = models.ForeignKey(
        BodyRegion, null=True, blank=True, on_delete=models.CASCADE, related_name="labels"
    )
    specialty = models.ForeignKey(
        Specialty, null=True, blank=True, on_delete=models.CASCADE, related_name="labels"
    )
    resource_category = models.ForeignKey(
        ResourceCategory, null=True, blank=True, on_delete=models.CASCADE, related_name="labels"
    )

    class Meta:
        verbose_name = "libellé de taxonomie"
        verbose_name_plural = "libellés de taxonomie"
        constraints = [
            # Un libellé porte sur exactement un terme.
            models.CheckConstraint(
                check=(
                    models.Q(body_region__isnull=False, specialty__isnull=True,
                             resource_category__isnull=True)
                    | models.Q(body_region__isnull=True, specialty__isnull=False,
                               resource_category__isnull=True)
                    | models.Q(body_region__isnull=True, specialty__isnull=True,
                               resource_category__isnull=False)
                ),
                name="termlabel_exactly_one_target",
            ),
            # MySQL traite les NULL comme distincts : chaque contrainte ne
            # contraint donc que les lignes qui visent ce type de terme.
            models.UniqueConstraint(
                fields=["locale", "body_region"], name="termlabel_unique_region"
            ),
            models.UniqueConstraint(
                fields=["locale", "specialty"], name="termlabel_unique_specialty"
            ),
            models.UniqueConstraint(
                fields=["locale", "resource_category"], name="termlabel_unique_category"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.label} ({self.locale})"
