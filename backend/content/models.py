"""
Contenus scientifiques — les six sections de la plateforme.

Les pathologies servent de point d'entrée transversal : chaque autre
section s'y rattache par une relation plusieurs-à-plusieurs, ce qui permet
à une page pathologie de réunir ressources, bilans, protocoles, exercices,
formations et webinaires.
"""

from datetime import timedelta

from django.db import models
from django.utils import timezone

from config.enums import (
    Access,
    Difficulty,
    LessonType,
    Level,
    Locale,
    ToolType,
)
from config.models import PublishableModel, StringListField, TimeStampedModel, UUIDModel
from taxonomies.models import BodyRegion, ResourceCategory, Specialty, Tag


class ContentBase(UUIDModel, TimeStampedModel, PublishableModel):
    """Socle commun : identifiant UUID, slug unique, horodatage, publication."""

    slug = models.SlugField(max_length=200, unique=True)

    # Index de recherche normalisé (accents et diacritiques retirés). Il est
    # reconstruit par `reindex_search()`, qu'il faut appeler **après** avoir
    # posé les relations : mots-clés, pathologies et traductions en font
    # partie et ne sont pas encore là au premier `save()`.
    search_text = models.TextField(blank=True, default="", editable=False)

    class Meta:
        abstract = True

    def __str__(self) -> str:
        return getattr(self, "title", None) or getattr(self, "name", self.slug)

    @property
    def display_title(self) -> str:
        return getattr(self, "title", None) or getattr(self, "name", "") or self.slug

    def reindex_search(self, save: bool = True) -> str:
        from .search import build_search_text

        self.search_text = build_search_text(self)
        if save and self.pk:
            # `update()` plutôt que `save()` : pas de signal, pas de
            # réécriture de `updated_at` pour une simple réindexation.
            type(self).objects.filter(pk=self.pk).update(
                search_text=self.search_text
            )
        return self.search_text


# ------------------------------------------------------------- Pathologies

class Pathology(ContentBase):
    name = models.CharField(max_length=200)
    summary = models.TextField()
    epidemiology = models.TextField(blank=True)
    presentation = StringListField()
    red_flags = StringListField()
    management = StringListField()
    key_facts = StringListField()
    evidence = models.CharField(max_length=200, blank=True)
    aliases = StringListField(help_text="Synonymes repris par la recherche globale.")

    region = models.ForeignKey(
        BodyRegion, on_delete=models.PROTECT, related_name="pathologies"
    )
    specialty = models.ForeignKey(
        Specialty, on_delete=models.PROTECT, related_name="pathologies"
    )

    # Les pathologies du jeu de référence sont publiées par défaut.
    published = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "pathologie"
        verbose_name_plural = "pathologies"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["region", "specialty"], name="pathology_taxo_idx"),
        ]


# ----------------------------------------------------------------- Auteurs

class Author(UUIDModel):
    """
    Auteur, formateur ou intervenant.

    `user` est facultatif : un auteur cité dans la bibliographie n'a pas
    nécessairement de compte sur la plateforme.
    """

    slug = models.SlugField(max_length=200, unique=True)
    user = models.OneToOneField(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="authored_as",
    )
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    title = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    country = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=120, blank=True)
    avatar_url = models.URLField(blank=True, max_length=500)
    expertise = StringListField()

    class Meta:
        verbose_name = "auteur"
        verbose_name_plural = "auteurs"
        ordering = ["last_name", "first_name"]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


# ------------------------------------------------------------ Bibliothèque

class Resource(ContentBase):
    title = models.CharField(max_length=300)
    subtitle = models.CharField(max_length=300, blank=True)
    description = models.TextField()
    abstract = models.TextField(blank=True)
    key_points = StringListField()
    references = StringListField()

    category = models.ForeignKey(
        ResourceCategory, on_delete=models.PROTECT, related_name="resources"
    )
    author = models.ForeignKey(
        Author, null=True, blank=True, on_delete=models.SET_NULL, related_name="resources"
    )
    region = models.ForeignKey(
        BodyRegion, null=True, blank=True, on_delete=models.PROTECT, related_name="resources"
    )
    specialty = models.ForeignKey(
        Specialty, null=True, blank=True, on_delete=models.PROTECT, related_name="resources"
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="resources")
    pathologies = models.ManyToManyField(
        Pathology, blank=True, related_name="resources"
    )

    level = models.CharField(
        max_length=16, choices=Level.choices, default=Level.INTERMEDIAIRE
    )
    language = models.CharField(max_length=2, choices=Locale.choices, default=Locale.FR)
    access = models.CharField(max_length=8, choices=Access.choices, default=Access.FREE)

    file_url = models.URLField(blank=True, max_length=800)
    file_format = models.CharField(max_length=12, blank=True, default="pdf")
    file_size_kb = models.PositiveIntegerField(null=True, blank=True)
    pages = models.PositiveIntegerField(null=True, blank=True)

    # Compteurs dénormalisés : la source de vérité reste `activity`.
    views = models.PositiveIntegerField(default=0)
    download_count = models.PositiveIntegerField(default=0)

    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "ressource"
        verbose_name_plural = "ressources"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["published", "published_at"], name="resource_pub_idx"),
            models.Index(
                fields=["category", "region", "specialty", "level"],
                name="resource_filter_idx",
            ),
        ]


class ResourceKeyPoint(UUIDModel):
    """
    Point clé d'une ressource — titre, explication, pictogramme.

    Une table plutôt qu'une liste de chaînes : l'administration doit
    pouvoir ajouter, réordonner et illustrer chaque point sans éditer du
    JSON à la main.
    """

    ICON_CHOICES = [
        ("trending", "Progression"),
        ("activity", "Mesure"),
        ("target", "Objectif"),
        ("brain", "Dimension psychologique"),
        ("shield", "Sécurité"),
        ("check", "Critère"),
        ("clock", "Délai"),
        ("dumbbell", "Renforcement"),
    ]

    resource = models.ForeignKey(
        "content.Resource", on_delete=models.CASCADE, related_name="key_point_set"
    )
    title = models.CharField(max_length=200)
    text = models.TextField(blank=True)
    icon = models.CharField(max_length=20, choices=ICON_CHOICES, default="check")
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "point clé"
        verbose_name_plural = "points clés"
        ordering = ["position"]

    def __str__(self) -> str:
        return self.title


class ResourceReference(UUIDModel):
    """
    Référence bibliographique d'une ressource.

    Séparée en deux champs — la citation et la source — parce que la
    fiche les met en forme différemment : auteurs et titre en évidence,
    revue en retrait.
    """

    resource = models.ForeignKey(
        "content.Resource", on_delete=models.CASCADE, related_name="reference_set"
    )
    citation = models.CharField(
        max_length=400, help_text="Auteurs, année et titre de l'article."
    )
    source = models.CharField(
        max_length=300, blank=True, help_text="Revue, volume, pages."
    )
    url = models.URLField(blank=True, max_length=600)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "référence"
        verbose_name_plural = "références"
        ordering = ["position"]

    def __str__(self) -> str:
        return self.citation[:80]


# -------------------------------------------------------------- Formations

class Course(ContentBase):
    title = models.CharField(max_length=300)
    subtitle = models.CharField(max_length=300, blank=True)
    description = models.TextField()
    objectives = StringListField()
    audience = models.TextField(blank=True)
    prerequisites = StringListField()

    instructor = models.ForeignKey(
        Author, null=True, blank=True, on_delete=models.SET_NULL, related_name="courses"
    )
    region = models.ForeignKey(
        BodyRegion, null=True, blank=True, on_delete=models.PROTECT, related_name="courses"
    )
    specialty = models.ForeignKey(
        Specialty, null=True, blank=True, on_delete=models.PROTECT, related_name="courses"
    )
    pathologies = models.ManyToManyField(Pathology, blank=True, related_name="courses")
    tags = models.ManyToManyField(Tag, blank=True, related_name="courses")

    level = models.CharField(
        max_length=16, choices=Level.choices, default=Level.INTERMEDIAIRE
    )
    language = models.CharField(max_length=2, choices=Locale.choices, default=Locale.FR)
    access = models.CharField(max_length=8, choices=Access.choices, default=Access.FREE)

    cover_url = models.URLField(blank=True, max_length=800)
    duration_min = models.PositiveIntegerField(default=0)
    certificate = models.BooleanField(default=True)

    rating_avg = models.FloatField(default=0)
    rating_count = models.PositiveIntegerField(default=0)
    enrolled_count = models.PositiveIntegerField(default=0)

    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "formation"
        verbose_name_plural = "formations"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(
                fields=["published", "access", "level"], name="course_filter_idx"
            ),
        ]


class CourseModule(UUIDModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=300)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "module"
        verbose_name_plural = "modules"
        ordering = ["position"]
        indexes = [
            models.Index(fields=["course", "position"], name="module_order_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.course.slug} / {self.title}"


class Lesson(UUIDModel):
    module = models.ForeignKey(
        CourseModule, on_delete=models.CASCADE, related_name="lessons"
    )
    title = models.CharField(max_length=300)
    type = models.CharField(max_length=8, choices=LessonType.choices)
    duration_min = models.PositiveIntegerField(default=0)
    position = models.PositiveIntegerField(default=0)

    content = models.TextField(blank=True, help_text="Leçons de type « lecture ».")
    video_url = models.URLField(blank=True, max_length=800)
    resource = models.ForeignKey(
        Resource,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="lessons",
        help_text="Leçon adossée à une ressource de la bibliothèque.",
    )
    tool = models.ForeignKey(
        "content.ClinicalTool",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="lessons",
        help_text="Leçon adossée à une fiche d'outil clinique.",
    )

    class Meta:
        verbose_name = "leçon"
        verbose_name_plural = "leçons"
        ordering = ["position"]
        indexes = [
            models.Index(fields=["module", "position"], name="lesson_order_idx"),
        ]

    def __str__(self) -> str:
        return self.title


class Quiz(UUIDModel):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name="quiz")
    pass_score = models.PositiveSmallIntegerField(
        default=0, help_text="Nombre de bonnes réponses exigées."
    )

    class Meta:
        verbose_name = "quiz"
        verbose_name_plural = "quiz"

    def __str__(self) -> str:
        return f"Quiz — {self.lesson.title}"


class QuizQuestion(UUIDModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    prompt = models.TextField()
    position = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "question de quiz"
        verbose_name_plural = "questions de quiz"
        ordering = ["position"]

    def __str__(self) -> str:
        return self.prompt[:80]


class QuizAnswer(UUIDModel):
    """
    `is_correct` ne doit jamais être exposé par l'API publique : la
    correction se fait côté serveur.
    """

    question = models.ForeignKey(
        QuizQuestion, on_delete=models.CASCADE, related_name="answers"
    )
    label = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "réponse de quiz"
        verbose_name_plural = "réponses de quiz"
        ordering = ["position"]

    def __str__(self) -> str:
        return self.label[:80]


# -------------------------------------------------------------- Webinaires

class Webinar(ContentBase):
    title = models.CharField(max_length=300)
    subtitle = models.CharField(max_length=300, blank=True)
    description = models.TextField()
    agenda = StringListField()

    speaker = models.ForeignKey(
        Author, null=True, blank=True, on_delete=models.SET_NULL, related_name="webinars"
    )
    region = models.ForeignKey(
        BodyRegion, null=True, blank=True, on_delete=models.PROTECT, related_name="webinars"
    )
    specialty = models.ForeignKey(
        Specialty, null=True, blank=True, on_delete=models.PROTECT, related_name="webinars"
    )
    pathologies = models.ManyToManyField(Pathology, blank=True, related_name="webinars")
    tags = models.ManyToManyField(Tag, blank=True, related_name="webinars")

    starts_at = models.DateTimeField()
    duration_min = models.PositiveIntegerField(default=60)
    # Fin calculée et stockée : le statut (à venir / en direct / replay /
    # terminé) devient un filtre SQL ordinaire, donc compatible avec la
    # pagination. Recalculée à chaque enregistrement.
    ends_at = models.DateTimeField(editable=False, null=True, db_index=True)
    live_url = models.URLField(blank=True, max_length=800)
    replay_url = models.URLField(blank=True, max_length=800)

    access = models.CharField(max_length=8, choices=Access.choices, default=Access.FREE)
    certificate = models.BooleanField(default=True)
    registered_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "webinaire"
        verbose_name_plural = "webinaires"
        ordering = ["-starts_at"]
        indexes = [
            models.Index(fields=["published", "starts_at"], name="webinar_sched_idx"),
        ]

    def save(self, *args, **kwargs):
        if self.starts_at is not None:
            self.ends_at = self.starts_at + timedelta(minutes=self.duration_min or 60)
        super().save(*args, **kwargs)

    @property
    def status(self) -> str:
        """Même logique que `webinarStatus()` côté front-end."""
        now = timezone.now()
        if self.ends_at is not None and self.starts_at <= now <= self.ends_at:
            return "live"
        if self.starts_at > now:
            return "upcoming"
        return "replay" if self.replay_url else "past"


# ---------------------------------------------------------- Outils cliniques

class ClinicalTool(ContentBase):
    name = models.CharField(max_length=300)
    subtitle = models.CharField(max_length=300, blank=True)
    description = models.TextField()
    type = models.CharField(max_length=16, choices=ToolType.choices, db_index=True)

    purpose = models.TextField()
    indications = StringListField()
    contraindications = StringListField()
    equipment = StringListField()
    procedure = StringListField()
    scoring = models.TextField(blank=True)
    interpretation = StringListField()
    psychometrics = models.TextField(
        blank=True, help_text="Qualités métrologiques : validité, fiabilité, sensibilité."
    )
    references = StringListField()

    region = models.ForeignKey(
        BodyRegion, null=True, blank=True, on_delete=models.PROTECT, related_name="tools"
    )
    specialty = models.ForeignKey(
        Specialty, null=True, blank=True, on_delete=models.PROTECT, related_name="tools"
    )
    pathologies = models.ManyToManyField(Pathology, blank=True, related_name="tools")

    access = models.CharField(max_length=8, choices=Access.choices, default=Access.FREE)
    file_url = models.URLField(blank=True, max_length=800)
    file_format = models.CharField(max_length=12, blank=True, default="pdf")
    file_size_kb = models.PositiveIntegerField(null=True, blank=True)
    download_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "outil clinique"
        verbose_name_plural = "outils cliniques"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["type", "region", "published"], name="tool_filter_idx"),
        ]


# ---------------------------------------------------------------- Exercices

class Exercise(ContentBase):
    name = models.CharField(max_length=300)
    goal = models.TextField()

    region = models.ForeignKey(
        BodyRegion, on_delete=models.PROTECT, related_name="exercises"
    )
    objective = models.CharField(
        max_length=40, db_index=True, help_text="mobilite, force, proprioception…"
    )
    difficulty = models.CharField(
        max_length=12, choices=Difficulty.choices, default=Difficulty.FACILE
    )

    target_muscles = StringListField()
    equipment = StringListField()
    steps = StringListField()

    sets = models.CharField(max_length=80, blank=True)
    reps = models.CharField(max_length=80, blank=True)
    hold = models.CharField(max_length=80, blank=True)
    frequency = models.CharField(max_length=80, blank=True)
    progression = models.TextField(blank=True)
    regression = models.TextField(blank=True)
    precautions = StringListField()

    video_url = models.URLField(blank=True, max_length=800)
    image_url = models.URLField(blank=True, max_length=800)
    references = StringListField()

    tags = models.ManyToManyField(Tag, blank=True, related_name="exercises")
    pathologies = models.ManyToManyField(Pathology, blank=True, related_name="exercises")

    class Meta:
        verbose_name = "exercice"
        verbose_name_plural = "exercices"
        ordering = ["name"]
        indexes = [
            models.Index(
                fields=["region", "objective", "difficulty"], name="exercise_filter_idx"
            ),
        ]


# ------------------------------------------------------------- Traductions

class Translation(UUIDModel):
    """
    Traduction d'un champ de contenu.

    Les contenus scientifiques gardent leur titre d'origine ; une traduction
    n'est servie que si elle existe — même logique que `item.i18n` côté
    front-end.
    """

    FIELD_CHOICES = [
        ("title", "Titre"),
        ("subtitle", "Sous-titre"),
        ("description", "Description"),
        ("summary", "Synthèse"),
        ("name", "Nom"),
        ("goal", "Objectif"),
        ("purpose", "But"),
    ]

    locale = models.CharField(max_length=2, choices=Locale.choices)
    field = models.CharField(max_length=32, choices=FIELD_CHOICES)
    value = models.TextField()

    resource = models.ForeignKey(
        Resource, null=True, blank=True, on_delete=models.CASCADE,
        related_name="translations",
    )
    course = models.ForeignKey(
        Course, null=True, blank=True, on_delete=models.CASCADE,
        related_name="translations",
    )
    webinar = models.ForeignKey(
        Webinar, null=True, blank=True, on_delete=models.CASCADE,
        related_name="translations",
    )
    tool = models.ForeignKey(
        ClinicalTool, null=True, blank=True, on_delete=models.CASCADE,
        related_name="translations",
    )
    exercise = models.ForeignKey(
        Exercise, null=True, blank=True, on_delete=models.CASCADE,
        related_name="translations",
    )
    pathology = models.ForeignKey(
        Pathology, null=True, blank=True, on_delete=models.CASCADE,
        related_name="translations",
    )

    TARGETS = ("resource", "course", "webinar", "tool", "exercise", "pathology")

    class Meta:
        verbose_name = "traduction"
        verbose_name_plural = "traductions"
        constraints = [
            # Une traduction porte sur exactement un contenu. MySQL traite les
            # NULL comme distincts : chaque contrainte d'unicité ne s'applique
            # donc qu'aux lignes visant ce type de contenu.
            models.UniqueConstraint(
                fields=["locale", "field", "resource"], name="translation_unique_resource"
            ),
            models.UniqueConstraint(
                fields=["locale", "field", "course"], name="translation_unique_course"
            ),
            models.UniqueConstraint(
                fields=["locale", "field", "webinar"], name="translation_unique_webinar"
            ),
            models.UniqueConstraint(
                fields=["locale", "field", "tool"], name="translation_unique_tool"
            ),
            models.UniqueConstraint(
                fields=["locale", "field", "exercise"], name="translation_unique_exercise"
            ),
            models.UniqueConstraint(
                fields=["locale", "field", "pathology"], name="translation_unique_pathology"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.field} [{self.locale}]"
