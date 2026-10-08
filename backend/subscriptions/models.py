"""
Abonnements — formules et demandes des membres.

Aucun paiement en ligne : le membre dépose une demande motivée, que
l'administration approuve ou refuse. L'accès premium s'ouvre à l'approbation.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone

from config.enums import PlanAudience, PlanInterval, SubscriptionStatus
from config.models import StringListField, UUIDModel


class Plan(UUIDModel):
    slug = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=200)
    tagline = models.CharField(max_length=300, blank=True)
    price_dzd = models.PositiveIntegerField(default=0)
    interval = models.CharField(
        max_length=8, choices=PlanInterval.choices, default=PlanInterval.MONTH
    )
    audience = models.CharField(
        max_length=20, choices=PlanAudience.choices, default=PlanAudience.ALL
    )
    features = StringListField()
    limits = models.TextField(blank=True, help_text="Ce que la formule ne couvre pas.")
    premium = models.BooleanField(
        default=False, help_text="Ouvre l'accès aux contenus premium."
    )
    highlighted = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)
    published = models.BooleanField(default=False)
    active = models.BooleanField(default=False)

    class Meta:
        verbose_name = "formule d'abonnement"
        verbose_name_plural = "formules d'abonnement"
        ordering = ["order", "price_dzd", "slug"]

    def __str__(self) -> str:
        return self.name


class Subscription(UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions"
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    status = models.CharField(
        max_length=12,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.INACTIVE,
        db_index=True,
    )
    motivation = models.TextField(blank=True, help_text="Motif de la demande.")
    promo_code = models.CharField(max_length=40, blank=True)

    requested_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="subscription_decisions",
    )
    decision_note = models.TextField(blank=True)

    class Meta:
        verbose_name = "abonnement"
        verbose_name_plural = "abonnements"
        ordering = ["-requested_at"]
        indexes = [
            models.Index(fields=["user", "status"], name="subscription_user_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.plan.slug} — {self.get_status_display()}"

    @property
    def is_current(self) -> bool:
        """Abonnement actif et non échu."""
        if self.status != SubscriptionStatus.ACTIVE:
            return False
        return self.ends_at is None or self.ends_at > timezone.now()
