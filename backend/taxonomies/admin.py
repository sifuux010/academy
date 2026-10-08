from django.contrib import admin

from .models import BodyRegion, ResourceCategory, Specialty, Tag, TermLabel


class TermLabelInline(admin.TabularInline):
    model = TermLabel
    extra = 0
    fields = ("locale", "label")


class TermAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "labels_summary")
    list_editable = ("order",)
    search_fields = ("id", "labels__label")
    inlines = [TermLabelInline]

    @admin.display(description="libellés")
    def labels_summary(self, obj):
        return " · ".join(f"{l.locale}: {l.label}" for l in obj.labels.all()) or "—"


@admin.register(BodyRegion)
class BodyRegionAdmin(TermAdmin):
    inlines = [type("Inline", (TermLabelInline,), {"fk_name": "body_region"})]


@admin.register(Specialty)
class SpecialtyAdmin(TermAdmin):
    inlines = [type("Inline", (TermLabelInline,), {"fk_name": "specialty"})]


@admin.register(ResourceCategory)
class ResourceCategoryAdmin(TermAdmin):
    inlines = [type("Inline", (TermLabelInline,), {"fk_name": "resource_category"})]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("slug",)
    search_fields = ("slug",)
