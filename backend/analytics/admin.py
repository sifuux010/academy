"""Administration du journal d'événements — lecture seule."""

from django.contrib import admin

from .models import AnalyticsEvent


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "locale", "created_at")
    list_filter = ("name", "locale")
    search_fields = ("name", "user__email")
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
