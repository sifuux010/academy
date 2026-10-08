"""
Activité des membres — favoris, téléchargements, consultations, inscriptions
aux formations et webinaires, progression, quiz, certificats, avis, recherches
et notifications.

Plusieurs modèles pointent vers « un contenu parmi cinq » par des clés
étrangères nullables. MySQL considérant deux NULL comme distincts, une
contrainte d'unicité sur (membre, contenu) ne contraint que les lignes qui
visent effectivement ce type de contenu : c'est exactement le comportement
attendu.
"""

from django.conf import settings
from django.db import models

from config.models import UUIDModel


class Favorite(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    resource = models.ForeignKey(
        "content.Resource", null=True, blank=True, on_delete=models.CASCADE,
        related_name="favorites",
    )
    course = models.ForeignKey(
        "content.Course", null=True, blank=True, on_delete=models.CASCADE,
        related_name="favorites",
    )
    webinar = models.ForeignKey(
        "content.Webinar", null=True, blank=True, on_delete=models.CASCADE,
        related_name="favorites",
    )
    tool = models.ForeignKey(
        "content.ClinicalTool", null=True, blank=True, on_delete=models.CASCADE,
        related_name="favorites",
    )
    exercise = models.ForeignKey(
        "content.Exercise", null=True, blank=True, on_delete=models.CASCADE,
        related_name="favorites",
    )

    TARGETS = ("resource", "course", "webinar", "tool", "exercise")

    class Meta:
        verbose_name = "favori"
        verbose_name_plural = "favoris"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"], name="favorite_user_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "resource"], name="favorite_unique_resource"
            ),
            models.UniqueConstraint(
                fields=["user", "course"], name="favorite_unique_course"
            ),
            models.UniqueConstraint(
                fields=["user", "webinar"], name="favorite_unique_webinar"
            ),
            models.UniqueConstraint(fields=["user", "tool"], name="favorite_unique_tool"),
            models.UniqueConstraint(
                fields=["user", "exercise"], name="favorite_unique_exercise"
            ),
        ]

    def __str__(self) -> str:
        return f"Favori — {self.user_id}"


class Download(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="downloads"
    )
    resource = models.ForeignKey(
        "content.Resource", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="downloads",
    )
    tool = models.ForeignKey(
        "content.ClinicalTool", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="downloads",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "téléchargement"
        verbose_name_plural = "téléchargements"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"], name="download_user_idx"),
        ]


class ResourceView(UUIDModel):
    """Consultation d'une ressource — anonyme si le visiteur n'est pas connecté."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="resource_views",
    )
    resource = models.ForeignKey(
        "content.Resource", on_delete=models.CASCADE, related_name="resource_views"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "consultation"
        verbose_name_plural = "consultations"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["resource", "created_at"], name="view_resource_idx"),
        ]


class Enrollment(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments"
    )
    course = models.ForeignKey(
        "content.Course", on_delete=models.CASCADE, related_name="enrollments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "inscription à une formation"
        verbose_name_plural = "inscriptions aux formations"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "course"], name="enrollment_unique"
            ),
        ]


class LessonProgress(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lesson_progress"
    )
    lesson = models.ForeignKey(
        "content.Lesson", on_delete=models.CASCADE, related_name="progress"
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "progression"
        verbose_name_plural = "progressions"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "lesson"], name="lesson_progress_unique"
            ),
        ]


class QuizAttempt(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    quiz = models.ForeignKey(
        "content.Quiz", on_delete=models.CASCADE, related_name="attempts"
    )
    score = models.PositiveSmallIntegerField()
    total = models.PositiveSmallIntegerField()
    passed = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "tentative de quiz"
        verbose_name_plural = "tentatives de quiz"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "quiz"], name="attempt_user_quiz_idx"),
        ]


class WebinarRegistration(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="registrations"
    )
    webinar = models.ForeignKey(
        "content.Webinar", on_delete=models.CASCADE, related_name="registrations"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    attended_at = models.DateTimeField(null=True, blank=True)
    reminded_24h = models.BooleanField(default=False)
    reminded_1h = models.BooleanField(default=False)

    class Meta:
        verbose_name = "inscription à un webinaire"
        verbose_name_plural = "inscriptions aux webinaires"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "webinar"], name="webinar_registration_unique"
            ),
        ]


class Certificate(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="certificates"
    )
    course = models.ForeignKey(
        "content.Course", on_delete=models.CASCADE, related_name="certificates"
    )
    reference = models.CharField(max_length=64, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    pdf_url = models.URLField(blank=True, max_length=800)

    class Meta:
        verbose_name = "certificat"
        verbose_name_plural = "certificats"
        ordering = ["-issued_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "course"], name="certificate_unique"
            ),
        ]

    def __str__(self) -> str:
        return self.reference


class Review(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    course = models.ForeignKey(
        "content.Course", on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "avis"
        verbose_name_plural = "avis"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "course"], name="review_unique"),
            models.CheckConstraint(
                check=models.Q(rating__gte=1, rating__lte=5),
                name="review_rating_range",
            ),
        ]


class SearchHistory(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="searches"
    )
    query = models.CharField(max_length=300)
    results = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "recherche"
        verbose_name_plural = "recherches"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"], name="search_user_idx"),
        ]


class Notification(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    kind = models.CharField(max_length=40)
    title = models.CharField(max_length=300)
    body = models.TextField(blank=True)
    url = models.CharField(max_length=500, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "notification"
        verbose_name_plural = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "read_at"], name="notification_user_idx"),
        ]

    def __str__(self) -> str:
        return self.title
