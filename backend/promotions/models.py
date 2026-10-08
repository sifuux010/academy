"""
Mise en avant éditoriale — bannières, rayons et contenus sponsorisés.

Trois objets, trois usages distincts :

- `Banner`      une promotion visuelle du carrousel d'accueil ;
- `Shelf`       un rayon de contenus (« Les plus suivis », « Nouveautés »),
                éventuellement regroupé en onglets ;
- `Sponsorship` un contenu poussé à un emplacement donné, avec un poids,
                une fenêtre de diffusion et un partenaire.

Tout est piloté depuis l'administration : aucune mise en avant n'est codée
en dur dans le front-end. Un emplacement (`placement`) décrit *où* la mise
en avant apparaît ; le front-end demande un emplacement et reçoit ce qui
est diffusé aujourd'hui, déjà trié.
"""

from __future__ import annotations

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from config.models import StringListField, TimeStampedModel, UUIDModel


class Placement(models.TextChoices):
    """Emplacements connus du front-end."""

    HOME_HERO = "home_hero", "Accueil — carrousel principal"
    HOME_FEATURED = "home_featured", "Accueil — rayons mis en avant"
    HOME_CAREER = "home_career", "Accueil — parcours par spécialité"
    LIBRARY_TOP = "library_top", "Bibliothèque — en tête de liste"
    COURSES_TOP = "courses_top", "Formations — en tête de liste"
    SEARCH_TOP = "search_top", "Recherche — en tête de résultats"


class Theme(models.TextChoices):
    """
    Habillage d'une bannière, décliné en CSS côté front-end.

    `LIGHT` est le seul à porter un texte sombre : il accompagne les
    visuels clairs, sur lesquels un texte blanc serait illisible.
    """

    BRAND = "brand", "Marque (turquoise)"
    DARK = "dark", "Sombre"
    LIGHT = "light", "Clair (texte sombre)"
    SAND = "sand", "Sable"
    MINT = "mint", "Menthe"
    SLATE = "slate", "Ardoise"


class ScheduledQuerySet(models.QuerySet):
    """Filtre commun : actif, et dans sa fenêtre de diffusion."""

    def live(self, now=None):
        now = now or timezone.now()
        return (
            self.filter(active=True)
            .filter(models.Q(starts_at__isnull=True) | models.Q(starts_at__lte=now))
            .filter(models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=now))
        )


class Scheduled(models.Model):
    """Fenêtre de diffusion — les deux bornes sont facultatives."""

    active = models.BooleanField(default=True, db_index=True)
    starts_at = models.DateTimeField(
        null=True, blank=True, help_text="Vide : diffusé dès maintenant."
    )
    ends_at = models.DateTimeField(
        null=True, blank=True, help_text="Vide : sans date de fin."
    )
    position = models.PositiveSmallIntegerField(
        default=0, help_text="Ordre d'affichage, croissant."
    )

    objects = ScheduledQuerySet.as_manager()

    class Meta:
        abstract = True

    def clean(self):
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError(
                {"ends_at": "La fin doit suivre le début de la diffusion."}
            )

    @property
    def is_live(self) -> bool:
        now = timezone.now()
        if not self.active:
            return False
        if self.starts_at and self.starts_at > now:
            return False
        return not (self.ends_at and self.ends_at < now)


class Partner(UUIDModel):
    """
    Université, établissement ou société savante partenaire.

    Alimente la bande « Ils enseignent sur la plateforme » et signe les
    contenus sponsorisés.
    """

    KIND_CHOICES = [
        ("university", "Université"),
        ("hospital", "Établissement de santé"),
        ("society", "Société savante"),
        ("company", "Entreprise"),
    ]

    slug = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=160)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default="university")
    logo_url = models.CharField(max_length=500, blank=True)
    url = models.URLField(blank=True, max_length=500)
    position = models.PositiveSmallIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "partenaire"
        verbose_name_plural = "partenaires"
        ordering = ["position", "name"]

    def __str__(self) -> str:
        return self.name


class Banner(UUIDModel, TimeStampedModel, Scheduled):
    """Promotion visuelle du carrousel d'accueil."""

    placement = models.CharField(
        max_length=24, choices=Placement.choices, default=Placement.HOME_HERO,
        db_index=True,
    )
    theme = models.CharField(max_length=12, choices=Theme.choices, default=Theme.BRAND)

    eyebrow = models.CharField(
        max_length=80, blank=True, help_text="Surtitre court, au-dessus du titre."
    )
    title = models.CharField(max_length=200)
    body = models.CharField(max_length=400, blank=True)
    cta_label = models.CharField(max_length=80, blank=True)
    cta_href = models.CharField(
        max_length=500, blank=True,
        help_text="Chemin interne sans préfixe de langue (/bibliotheque), ou URL complète.",
    )
    image_url = models.CharField(max_length=500, blank=True)
    partner = models.ForeignKey(
        Partner, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="banners",
    )

    class Meta:
        verbose_name = "bannière"
        verbose_name_plural = "bannières"
        ordering = ["position", "-created_at"]
        indexes = [
            models.Index(fields=["placement", "active"], name="banner_placement_idx"),
        ]

    def __str__(self) -> str:
        return self.title


class Shelf(UUIDModel, TimeStampedModel, Scheduled):
    """
    Rayon de contenus de la page d'accueil.

    Un rayon affiche soit une sélection manuelle (`ShelfItem`), soit une
    requête automatique sur une section — les plus consultés, les plus
    récents. Plusieurs rayons partageant un emplacement forment les onglets
    d'un même bandeau, comme les parcours par spécialité.
    """

    AUTO_CHOICES = [
        ("manual", "Sélection manuelle"),
        ("popular", "Les plus consultés"),
        ("newest", "Les plus récents"),
    ]

    placement = models.CharField(
        max_length=24, choices=Placement.choices, default=Placement.HOME_FEATURED,
        db_index=True,
    )
    key = models.SlugField(
        max_length=60,
        help_text="Identifiant stable, servant d'onglet (sport, neurologie…).",
    )
    title = models.CharField(max_length=160)
    subtitle = models.CharField(max_length=300, blank=True)
    cta_label = models.CharField(max_length=80, blank=True)
    cta_href = models.CharField(max_length=500, blank=True)

    section = models.CharField(
        max_length=20, blank=True,
        help_text="resources, courses, webinars, tools, exercises, pathologies.",
    )
    source = models.CharField(max_length=10, choices=AUTO_CHOICES, default="manual")
    limit = models.PositiveSmallIntegerField(default=6)
    filters = models.JSONField(
        default=dict, blank=True,
        help_text='Filtres d\'une source automatique : {"specialty": ["sport"]}.',
    )

    class Meta:
        verbose_name = "rayon"
        verbose_name_plural = "rayons"
        ordering = ["position", "title"]
        constraints = [
            models.UniqueConstraint(
                fields=["placement", "key"], name="shelf_unique_key_per_placement"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.get_placement_display()} — {self.title}"


class ShelfItem(UUIDModel):
    """Entrée d'un rayon en sélection manuelle."""

    shelf = models.ForeignKey(Shelf, on_delete=models.CASCADE, related_name="items")
    section = models.CharField(max_length=20)
    slug = models.SlugField(max_length=200)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "entrée de rayon"
        verbose_name_plural = "entrées de rayon"
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(
                fields=["shelf", "section", "slug"], name="shelfitem_unique"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.section}/{self.slug}"


class Sponsorship(UUIDModel, TimeStampedModel, Scheduled):
    """
    Contenu sponsorisé — poussé en tête d'un emplacement.

    Toujours signalé comme tel : `label` porte la mention affichée
    (« Sponsorisé », « Partenaire »), que le front-end n'omet jamais. Un
    sponsor arrivé à échéance disparaît de lui-même.
    """

    placement = models.CharField(
        max_length=24, choices=Placement.choices, default=Placement.LIBRARY_TOP,
        db_index=True,
    )
    section = models.CharField(max_length=20, help_text="Section du contenu poussé.")
    slug = models.SlugField(max_length=200, help_text="Slug du contenu poussé.")

    partner = models.ForeignKey(
        Partner, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="sponsorships",
    )
    label = models.CharField(
        max_length=40, default="Sponsorisé",
        help_text="Mention affichée sur la carte. Jamais masquée.",
    )
    note = models.CharField(
        max_length=200, blank=True, help_text="Accroche courte, sous le titre."
    )
    weight = models.PositiveSmallIntegerField(
        default=10, help_text="Le plus lourd passe devant ; `position` départage."
    )
    audience_filters = StringListField(
        help_text="Vide : tous les visiteurs. Sinon, slugs de taxonomie ciblés."
    )

    impressions = models.PositiveIntegerField(default=0, editable=False)
    clicks = models.PositiveIntegerField(default=0, editable=False)

    class Meta:
        verbose_name = "contenu sponsorisé"
        verbose_name_plural = "contenus sponsorisés"
        ordering = ["-weight", "position"]
        indexes = [
            models.Index(fields=["placement", "active"], name="sponsor_placement_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["placement", "section", "slug"], name="sponsorship_unique"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.section}/{self.slug} @ {self.placement}"

    @property
    def click_through_rate(self) -> float:
        return round(self.clicks / self.impressions, 4) if self.impressions else 0.0
