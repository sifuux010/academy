"""
Reconstruit l'index de recherche de tous les contenus.

À lancer après un import massif, ou après avoir modifié `build_search_text()`.

    python manage.py reindex_search
"""

from django.core.management.base import BaseCommand

from content.models import (
    ClinicalTool,
    Course,
    Exercise,
    Pathology,
    Resource,
    Webinar,
)

MODELS = (Resource, Course, Webinar, ClinicalTool, Exercise, Pathology)


class Command(BaseCommand):
    help = "Reconstruit la colonne search_text de chaque contenu."

    def handle(self, *args, **options):
        for model in MODELS:
            queryset = model.objects.all().prefetch_related("pathologies", "translations")
            if hasattr(model, "tags"):
                queryset = queryset.prefetch_related("tags")
            count = 0
            for item in queryset:
                item.reindex_search()
                count += 1
            self.stdout.write(f"  {model.__name__.ljust(14)} {count}")
        self.stdout.write(self.style.SUCCESS("Index de recherche reconstruit."))
