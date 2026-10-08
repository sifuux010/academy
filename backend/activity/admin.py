"""
Administration de l'activité des membres.

Ces tables sont des journaux : l'administration les expose en lecture pour
le support, sans permettre de les réécrire à la main.
"""

from django.contrib import admin

from .models import (
    Certificate,
    Download,
    Enrollment,
    Favorite,
    LessonProgress,
    Notification,
    QuizAttempt,
    ResourceView,
    Review,
    SearchHistory,
    WebinarRegistration,
)


class ReadOnlyLogAdmin(admin.ModelAdmin):
    """Journal consultable, non modifiable."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(Favorite)
class FavoriteAdmin(ReadOnlyLogAdmin):
    list_display = ("user", "target", "created_at")
    search_fields = ("user__email",)
    date_hierarchy = "created_at"

    @admin.display(description="contenu")
    def target(self, obj):
        for name in Favorite.TARGETS:
            value = getattr(obj, name, None)
            if value is not None:
                return f"{name} — {value}"
        return "—"


@admin.register(Download)
class DownloadAdmin(ReadOnlyLogAdmin):
    list_display = ("user", "resource", "tool", "created_at")
    search_fields = ("user__email",)
    date_hierarchy = "created_at"


@admin.register(ResourceView)
class ResourceViewAdmin(ReadOnlyLogAdmin):
    list_display = ("resource", "user", "created_at")
    search_fields = ("resource__title", "user__email")
    date_hierarchy = "created_at"


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "created_at", "completed_at")
    list_filter = ("course",)
    search_fields = ("user__email", "course__title")
    autocomplete_fields = ("user", "course")
    date_hierarchy = "created_at"


@admin.register(LessonProgress)
class LessonProgressAdmin(ReadOnlyLogAdmin):
    list_display = ("user", "lesson", "completed_at")
    search_fields = ("user__email", "lesson__title")


@admin.register(QuizAttempt)
class QuizAttemptAdmin(ReadOnlyLogAdmin):
    list_display = ("user", "quiz", "score", "total", "passed", "created_at")
    list_filter = ("passed",)
    search_fields = ("user__email",)
    date_hierarchy = "created_at"


@admin.register(WebinarRegistration)
class WebinarRegistrationAdmin(admin.ModelAdmin):
    list_display = ("user", "webinar", "created_at", "attended_at",
                    "reminded_24h", "reminded_1h")
    list_filter = ("webinar",)
    search_fields = ("user__email", "webinar__title")
    autocomplete_fields = ("user", "webinar")
    date_hierarchy = "created_at"


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("reference", "user", "course", "issued_at")
    search_fields = ("reference", "user__email", "course__title")
    autocomplete_fields = ("user", "course")
    readonly_fields = ("issued_at",)
    date_hierarchy = "issued_at"


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("course", "user", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("user__email", "course__title", "comment")
    date_hierarchy = "created_at"


@admin.register(SearchHistory)
class SearchHistoryAdmin(ReadOnlyLogAdmin):
    list_display = ("query", "user", "results", "created_at")
    search_fields = ("query", "user__email")
    date_hierarchy = "created_at"


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "kind", "read_at", "created_at")
    list_filter = ("kind",)
    search_fields = ("title", "body", "user__email")
    autocomplete_fields = ("user",)
    date_hierarchy = "created_at"
