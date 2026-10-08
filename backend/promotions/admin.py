"""
Administration des mises en avant.

L'écran doit répondre d'un coup d'œil à « qu'est-ce qui est diffusé en ce
moment ? » : la colonne « en ligne » combine l'état actif et la fenêtre de
diffusion, qu'on oublie facilement de relire.
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import Banner, Partner, Shelf, ShelfItem, Sponsorship


class LiveMixin:
    @admin.display(description="en ligne", boolean=True)
    def live(self, obj):
        return obj.is_live


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ("name", "kind", "position", "active", "logo_preview")
    list_filter = ("kind", "active")
    list_editable = ("position", "active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="logo")
    def logo_preview(self, obj):
        if not obj.logo_url:
            return "—"
        return format_html(
            '<img src="{}" alt="" style="height:22px;max-width:120px;'
            'object-fit:contain" />',
            obj.logo_url,
        )


@admin.register(Banner)
class BannerAdmin(LiveMixin, admin.ModelAdmin):
    list_display = ("title", "placement", "theme", "position", "active",
                    "starts_at", "ends_at", "live")
    list_filter = ("placement", "theme", "active")
    list_editable = ("position", "active")
    search_fields = ("title", "body", "eyebrow")
    autocomplete_fields = ("partner",)
    fieldsets = (
        (None, {"fields": ("placement", "theme", "partner")}),
        ("Contenu", {"fields": ("eyebrow", "title", "body", "image_url")}),
        ("Action", {"fields": ("cta_label", "cta_href")}),
        ("Diffusion", {"fields": ("active", "position", "starts_at", "ends_at")}),
    )


class ShelfItemInline(admin.TabularInline):
    model = ShelfItem
    extra = 0
    fields = ("position", "section", "slug")
    ordering = ("position",)


@admin.register(Shelf)
class ShelfAdmin(LiveMixin, admin.ModelAdmin):
    list_display = ("title", "placement", "key", "source", "section", "limit",
                    "position", "active", "live")
    list_filter = ("placement", "source", "active")
    list_editable = ("position", "active")
    search_fields = ("title", "key", "subtitle")
    inlines = [ShelfItemInline]
    fieldsets = (
        (None, {"fields": ("placement", "key", "title", "subtitle")}),
        ("Action", {"fields": ("cta_label", "cta_href")}),
        ("Source", {
            "fields": ("source", "section", "limit", "filters"),
            "description": "« Sélection manuelle » utilise les entrées "
                           "ci-dessous ; les autres sources rejouent une "
                           "requête de liste.",
        }),
        ("Diffusion", {"fields": ("active", "position", "starts_at", "ends_at")}),
    )


@admin.register(Sponsorship)
class SponsorshipAdmin(LiveMixin, admin.ModelAdmin):
    list_display = ("slug", "section", "placement", "partner", "label", "weight",
                    "active", "live", "impressions", "clicks", "ctr")
    list_filter = ("placement", "section", "active", "partner")
    list_editable = ("weight", "active")
    search_fields = ("slug", "note", "partner__name")
    autocomplete_fields = ("partner",)
    readonly_fields = ("impressions", "clicks", "ctr")
    fieldsets = (
        (None, {"fields": ("placement", "section", "slug", "partner")}),
        ("Présentation", {
            "fields": ("label", "note"),
            "description": "La mention est toujours affichée sur la carte : "
                           "un contenu sponsorisé doit se reconnaître.",
        }),
        ("Diffusion", {
            "fields": ("active", "weight", "position", "starts_at", "ends_at",
                       "audience_filters"),
        }),
        ("Mesure", {"fields": ("impressions", "clicks", "ctr")}),
    )

    @admin.display(description="taux de clic")
    def ctr(self, obj):
        if not obj.impressions:
            return "—"
        return f"{obj.click_through_rate * 100:.1f} %"
