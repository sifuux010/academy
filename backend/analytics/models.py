"""
Journal d'événements produit — remplace `src/lib/analytics.ts`.

Le journal est volontairement dénormalisé : il doit survivre à la
suppression d'un compte, donc `user` passe à NULL sans effacer la ligne.
"""

from django.conf import settings
from django.db import models

from config.enums import Locale
from config.models import UUIDModel


class AnalyticsEvent(UUIDModel):
    name = models.CharField(max_length=80, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="analytics_events",
    )
    locale = models.CharField(max_length=2, choices=Locale.choices, blank=True)
    payload = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "événement"
        verbose_name_plural = "événements"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["name", "created_at"], name="event_name_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.name} @ {self.created_at:%Y-%m-%d %H:%M}"
