"""Administration des abonnements — approbation et refus des demandes."""

from django.contrib import admin
from django.utils import timezone

from config.enums import SubscriptionStatus

from .models import Plan, Subscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "price_dzd", "interval", "active")
    list_filter = ("active", "interval")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "status", "requested_at", "started_at",
                    "ends_at", "decided_by")
    list_filter = ("status", "plan")
    search_fields = ("user__email", "promo_code", "motivation")
    autocomplete_fields = ("user", "plan")
    readonly_fields = ("requested_at", "decided_at", "decided_by")
    date_hierarchy = "requested_at"
    actions = ("approve", "reject")

    @admin.action(description="Approuver les demandes sélectionnées")
    def approve(self, request, queryset):
        now = timezone.now()
        updated = 0
        for subscription in queryset.exclude(status=SubscriptionStatus.ACTIVE):
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.started_at = now
            subscription.decided_at = now
            subscription.decided_by = request.user
            subscription.save()
            subscription.user.premium = True
            subscription.user.save(update_fields=["premium", "updated_at"])
            updated += 1
        self.message_user(request, f"{updated} demande(s) approuvée(s).")

    @admin.action(description="Refuser les demandes sélectionnées")
    def reject(self, request, queryset):
        now = timezone.now()
        updated = queryset.exclude(status=SubscriptionStatus.REJECTED).update(
            status=SubscriptionStatus.REJECTED, decided_at=now, decided_by=request.user
        )
        self.message_user(request, f"{updated} demande(s) refusée(s).")
