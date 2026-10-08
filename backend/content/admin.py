"""
Administration des contenus.

L'administration Django sert d'outil d'édition pour l'équipe scientifique :
les six sections y sont complètes, avec les leçons et les quiz en ligne sous
leur formation.
"""

from django.contrib import admin

from .models import (
    Author,
    ClinicalTool,
    Course,
    CourseModule,
    Exercise,
    Lesson,
    Pathology,
    Quiz,
    QuizAnswer,
    QuizQuestion,
    Resource,
    ResourceKeyPoint,
    ResourceReference,
    Translation,
    Webinar,
)


class TranslationInline(admin.TabularInline):
    model = Translation
    extra = 0
    fields = ("locale", "field", "value")


def translation_inline_for(field_name: str):
    """Les traductions pointent vers un contenu parmi six : il faut nommer la clé."""
    return type(
        f"{field_name.capitalize()}TranslationInline",
        (TranslationInline,),
        {"fk_name": field_name},
    )


@admin.register(Pathology)
class PathologyAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "specialty", "published", "updated_at")
    list_filter = ("published", "region", "specialty")
    search_fields = ("name", "slug", "summary", "aliases")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [translation_inline_for("pathology")]
    fieldsets = (
        (None, {"fields": ("name", "slug", "published")}),
        ("Classement", {"fields": ("region", "specialty")}),
        ("Contenu", {"fields": ("summary", "epidemiology", "presentation", "red_flags",
                                "management", "key_facts", "evidence", "aliases")}),
    )


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("__str__", "title", "country", "user")
    search_fields = ("first_name", "last_name", "title", "slug")
    prepopulated_fields = {"slug": ("first_name", "last_name")}
    autocomplete_fields = ("user",)


class KeyPointInline(admin.TabularInline):
    """Points clés de la fiche, dans l'ordre d'affichage."""

    model = ResourceKeyPoint
    extra = 0
    fields = ("position", "icon", "title", "text")
    ordering = ("position",)


class ReferenceInline(admin.TabularInline):
    """
    Références bibliographiques.

    `citation` porte auteurs, année et titre ; `source` la revue. La
    fiche les met en forme différemment, d'où les deux champs.
    """

    model = ResourceReference
    extra = 0
    fields = ("position", "citation", "source", "url")
    ordering = ("position",)


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "level", "access", "language",
                    "published", "views", "download_count")
    list_filter = ("published", "category", "level", "access", "language",
                   "region", "specialty")
    search_fields = ("title", "subtitle", "slug", "description", "abstract")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("author", "category", "region", "specialty")
    filter_horizontal = ("tags", "pathologies")
    readonly_fields = ("views", "download_count", "created_at", "updated_at")
    inlines = [KeyPointInline, ReferenceInline, translation_inline_for("resource")]
    date_hierarchy = "published_at"
    fieldsets = (
        (None, {"fields": ("title", "slug", "subtitle", "published", "published_at")}),
        ("Classement", {
            "fields": ("category", "author", "region", "specialty", "level",
                       "language", "access", "tags", "pathologies"),
        }),
        ("Contenu", {"fields": ("description", "abstract")}),
        ("Fichier", {
            "fields": ("file_url", "file_format", "file_size_kb", "pages"),
            "description": "Ce que la fiche affiche dans ses détails techniques.",
        }),
        ("Mesure", {
            "fields": ("views", "download_count", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ("position", "title", "type", "duration_min", "video_url", "resource")
    autocomplete_fields = ("resource",)
    ordering = ("position",)


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "position")
    list_filter = ("course",)
    search_fields = ("title", "course__title")
    autocomplete_fields = ("course",)
    inlines = [LessonInline]


class CourseModuleInline(admin.TabularInline):
    model = CourseModule
    extra = 0
    fields = ("position", "title")
    ordering = ("position",)
    show_change_link = True


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "instructor", "level", "access", "duration_min",
                    "enrolled_count", "rating_avg", "published")
    list_filter = ("published", "level", "access", "language", "certificate",
                   "region", "specialty")
    search_fields = ("title", "subtitle", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("instructor", "region", "specialty")
    filter_horizontal = ("pathologies",)
    readonly_fields = ("rating_avg", "rating_count", "enrolled_count",
                       "created_at", "updated_at")
    inlines = [CourseModuleInline, translation_inline_for("course")]
    date_hierarchy = "published_at"


class QuizAnswerInline(admin.TabularInline):
    model = QuizAnswer
    extra = 0
    fields = ("position", "label", "is_correct")
    ordering = ("position",)


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ("__str__", "quiz", "position")
    search_fields = ("prompt",)
    inlines = [QuizAnswerInline]


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 0
    fields = ("position", "prompt")
    ordering = ("position",)
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("__str__", "pass_score")
    search_fields = ("lesson__title",)
    autocomplete_fields = ("lesson",)
    inlines = [QuizQuestionInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "type", "duration_min", "position")
    list_filter = ("type",)
    search_fields = ("title", "module__title", "module__course__title")
    autocomplete_fields = ("module", "resource")


@admin.register(Webinar)
class WebinarAdmin(admin.ModelAdmin):
    list_display = ("title", "speaker", "starts_at", "duration_min", "access",
                    "registered_count", "published")
    list_filter = ("published", "access", "certificate", "region", "specialty")
    search_fields = ("title", "subtitle", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("speaker", "region", "specialty")
    filter_horizontal = ("pathologies",)
    readonly_fields = ("registered_count", "created_at", "updated_at")
    inlines = [translation_inline_for("webinar")]
    date_hierarchy = "starts_at"


@admin.register(ClinicalTool)
class ClinicalToolAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "region", "access", "download_count", "published")
    list_filter = ("published", "type", "access", "region", "specialty")
    search_fields = ("name", "subtitle", "slug", "description", "purpose")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("region", "specialty")
    filter_horizontal = ("pathologies",)
    readonly_fields = ("download_count", "created_at", "updated_at")
    inlines = [translation_inline_for("tool")]
    fieldsets = (
        (None, {"fields": ("name", "slug", "subtitle", "type", "published", "access")}),
        ("Classement", {"fields": ("region", "specialty", "pathologies")}),
        ("Fiche clinique", {"fields": ("description", "purpose", "indications",
                                       "contraindications", "equipment", "procedure",
                                       "scoring", "interpretation", "psychometrics",
                                       "references")}),
        ("Fichier", {"fields": ("file_url", "file_format", "file_size_kb",
                                "download_count")}),
        ("Horodatage", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("name", "region", "objective", "difficulty", "published")
    list_filter = ("published", "difficulty", "region", "objective")
    search_fields = ("name", "slug", "goal")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("region",)
    filter_horizontal = ("tags", "pathologies")
    inlines = [translation_inline_for("exercise")]
    fieldsets = (
        (None, {"fields": ("name", "slug", "published")}),
        ("Classement", {"fields": ("region", "objective", "difficulty", "tags",
                                   "pathologies")}),
        ("Exécution", {"fields": ("goal", "target_muscles", "equipment", "steps",
                                  "precautions")}),
        ("Dosage", {"fields": ("sets", "reps", "hold", "frequency", "progression",
                               "regression")}),
        ("Médias", {"fields": ("video_url", "image_url", "references")}),
    )


@admin.register(Translation)
class TranslationAdmin(admin.ModelAdmin):
    list_display = ("field", "locale", "target", "value")
    list_filter = ("locale", "field")
    search_fields = ("value",)

    @admin.display(description="contenu")
    def target(self, obj):
        for name in Translation.TARGETS:
            value = getattr(obj, name, None)
            if value is not None:
                return f"{name} — {value}"
        return "—"
