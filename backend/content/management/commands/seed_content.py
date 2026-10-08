"""
Reprise du jeu de contenus de référence dans la base.

Source : les JSON produits par `backend/seed/export.mjs` depuis les fichiers
TypeScript du front-end. La commande est **idempotente** — elle se relance
sans créer de doublon, en s'appuyant sur les slugs.

    node --experimental-strip-types backend/seed/export.mjs
    python manage.py seed_content

Les écarts de nommage entre le front-end et la base sont traités ici, en un
seul endroit : `durationMinutes` → `duration_min`, `downloads` →
`download_count`, `type` → `category`, `dosage.{sets,reps,hold,frequency}`
→ quatre colonnes, `i18n.<locale>.<champ>` → table `Translation`.
"""

from __future__ import annotations

import json
from datetime import datetime, time
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from config.enums import PlanAudience, PlanInterval
from content.models import (
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
    Translation,
    Webinar,
)
from subscriptions.models import Plan
from taxonomies.models import BodyRegion, ResourceCategory, Specialty, Tag

SEED_DIR = Path(__file__).resolve().parents[3] / "seed" / "data"

# Groupes de `taxonomies.json` qui deviennent des tables de référence. Les
# autres (pays, rôles, recherches rapides…) restent des listes d'interface.
TAXONOMY_TABLES = {
    "regions": BodyRegion,
    "specialties": Specialty,
    "resourceTypes": ResourceCategory,
}


def load(name: str) -> Any:
    path = SEED_DIR / f"{name}.json"
    if not path.exists():
        raise CommandError(
            f"{path} est absent. Lancez d'abord :\n"
            f"    node --experimental-strip-types backend/seed/export.mjs"
        )
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def as_datetime(value: str | None):
    """Accepte `2025-03-14` comme `2025-03-14T09:00:00Z`."""
    if not value:
        return None
    text = str(value).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        try:
            parsed = datetime.combine(
                datetime.strptime(text[:10], "%Y-%m-%d").date(), time()
            )
        except ValueError:
            return None
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_default_timezone())
    return parsed


class Command(BaseCommand):
    help = "Charge le jeu de contenus de référence (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Vide les tables de contenu avant la reprise.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            self.flush()

        counts = {
            "taxonomies": self.seed_taxonomies(),
            "auteurs": self.seed_authors(),
            "pathologies": self.seed_pathologies(),
            "ressources": self.seed_resources(),
            "formations": self.seed_courses(),
            "webinaires": self.seed_webinars(),
            "outils": self.seed_tools(),
            "exercices": self.seed_exercises(),
            "formules": self.seed_plans(),
        }
        # Les leçons référencent ressources et outils : une fois tout chargé.
        counts["leçons liées"] = self.link_lessons()

        width = max(len(k) for k in counts)
        for label, number in counts.items():
            self.stdout.write(f"  {label.ljust(width)}  {number}")
        self.stdout.write(self.style.SUCCESS("Jeu de contenus en base."))

    # ----------------------------------------------------------- remise à zéro

    def flush(self) -> None:
        for model in (
            Translation, QuizAnswer, QuizQuestion, Quiz, Lesson, CourseModule,
            Resource, Course, Webinar, ClinicalTool, Exercise, Pathology, Author,
            Plan, Tag, BodyRegion, Specialty, ResourceCategory,
        ):
            model.objects.all().delete()
        self.stdout.write(self.style.WARNING("Tables de contenu vidées."))

    # -------------------------------------------------------------- taxonomies

    def seed_taxonomies(self) -> int:
        taxonomies = load("taxonomies")
        total = 0
        for group, model in TAXONOMY_TABLES.items():
            for order, key in enumerate(taxonomies[group]):
                model.objects.update_or_create(id=key, defaults={"order": order})
                total += 1
        return total

    def tags_for(self, slugs: list[str]) -> list[Tag]:
        out = []
        for slug in slugs or []:
            tag, _ = Tag.objects.get_or_create(slug=slug)
            out.append(tag)
        return out

    # ------------------------------------------------------------------ auteurs

    def seed_authors(self) -> int:
        for item in load("authors"):
            Author.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "first_name": item.get("firstName", ""),
                    "last_name": item.get("lastName", ""),
                    "title": item.get("title", ""),
                    "bio": item.get("bio", ""),
                    "country": item.get("country", ""),
                    "city": item.get("city", ""),
                    "expertise": item.get("expertise", []),
                },
            )
        # Index slug d'origine → auteur, pour les `authorId` des contenus.
        self.authors_by_legacy_id = {
            item["id"]: Author.objects.get(slug=item["slug"])
            for item in load("authors")
        }
        return len(self.authors_by_legacy_id)

    # -------------------------------------------------------------- pathologies

    def seed_pathologies(self) -> int:
        items = load("pathologies")
        for item in items:
            pathology, _ = Pathology.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "summary": item.get("summary", ""),
                    "epidemiology": item.get("epidemiology", ""),
                    "presentation": item.get("presentation", []),
                    "red_flags": item.get("redFlags", []),
                    "management": item.get("management", []),
                    "key_facts": item.get("keyFacts", []),
                    "evidence": item.get("evidence", "") or "",
                    "aliases": item.get("aliases", []),
                    "region_id": item["region"],
                    "specialty_id": item["specialty"],
                    "published": item.get("published", True),
                },
            )
            self.save_translations(item, pathology, "pathology")
            pathology.reindex_search()
        return len(items)

    def pathologies_for(self, slugs: list[str]) -> list[Pathology]:
        return list(Pathology.objects.filter(slug__in=slugs or []))

    # ---------------------------------------------------------------- ressources

    def seed_resources(self) -> int:
        items = load("resources")
        for item in items:
            resource, _ = Resource.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "title": item["title"],
                    "subtitle": item.get("subtitle", "") or "",
                    "description": item.get("description", ""),
                    "abstract": item.get("abstract", "") or "",
                    "key_points": item.get("keyPoints", []),
                    "references": item.get("references", []),
                    "category_id": item["type"],
                    "author": self.authors_by_legacy_id.get(item.get("authorId")),
                    "region_id": item.get("region") or None,
                    "specialty_id": item.get("specialty") or None,
                    "level": item.get("level", "intermediaire"),
                    "language": item.get("language", "fr"),
                    "access": item.get("access", "free"),
                    "file_url": item.get("fileUrl", "") or "",
                    "file_format": item.get("format", "pdf"),
                    "file_size_kb": item.get("sizeKb"),
                    "pages": item.get("pages"),
                    "views": item.get("views", 0),
                    "download_count": item.get("downloads", 0),
                    "published": item.get("published", True),
                    "published_at": as_datetime(item.get("publishedAt")),
                },
            )
            resource.tags.set(self.tags_for(item.get("tags", [])))
            resource.pathologies.set(self.pathologies_for(item.get("pathologies", [])))
            self.save_translations(item, resource, "resource")
            resource.reindex_search()
        return len(items)

    # ---------------------------------------------------------------- formations

    def seed_courses(self) -> int:
        items = load("courses")
        for item in items:
            course, _ = Course.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "title": item["title"],
                    "subtitle": item.get("subtitle", "") or "",
                    "description": item.get("description", ""),
                    "objectives": item.get("objectives", []),
                    "audience": item.get("audience", "") or "",
                    "prerequisites": item.get("prerequisites", []),
                    "instructor": self.authors_by_legacy_id.get(item.get("instructorId")),
                    "region_id": item.get("region") or None,
                    "specialty_id": item.get("specialty") or None,
                    "level": item.get("level", "intermediaire"),
                    "language": item.get("language", "fr"),
                    "access": item.get("access", "free"),
                    "cover_url": item.get("coverUrl", "") or "",
                    "duration_min": item.get("durationMinutes", 0),
                    "certificate": item.get("certificate", True),
                    "rating_avg": item.get("rating", 0) or 0,
                    "rating_count": item.get("ratingCount", 0),
                    "enrolled_count": item.get("enrolledCount", 0),
                    "published": item.get("published", True),
                    "published_at": as_datetime(item.get("publishedAt")),
                },
            )
            course.tags.set(self.tags_for(item.get("tags", [])))
            course.pathologies.set(self.pathologies_for(item.get("pathologies", [])))
            self.save_translations(item, course, "course")
            course.reindex_search()
            self.seed_modules(course, item.get("modules", []))
        return len(items)

    def seed_modules(self, course: Course, modules: list[dict]) -> None:
        # Les modules n'ont pas de slug : on repart de leur position.
        course.modules.all().delete()
        for m_index, module_data in enumerate(modules):
            module = CourseModule.objects.create(
                course=course, title=module_data.get("title", ""), position=m_index
            )
            for l_index, lesson_data in enumerate(module_data.get("lessons", [])):
                lesson = Lesson.objects.create(
                    module=module,
                    title=lesson_data.get("title", ""),
                    type=lesson_data.get("type", "text"),
                    duration_min=lesson_data.get("duration", 0),
                    position=l_index,
                    content=lesson_data.get("content", "") or "",
                    video_url=lesson_data.get("videoUrl", "") or "",
                )
                # Les liens vers ressources et outils sont résolus plus tard :
                # ces contenus ne sont pas encore tous chargés.
                self.pending_lesson_links.append(
                    (lesson.pk, lesson_data.get("resourceSlug"), lesson_data.get("toolSlug"))
                )
                if lesson_data.get("quiz"):
                    self.seed_quiz(lesson, lesson_data["quiz"])

    def seed_quiz(self, lesson: Lesson, quiz_data: dict) -> None:
        quiz = Quiz.objects.create(
            lesson=lesson, pass_score=quiz_data.get("passScore", 0)
        )
        for q_index, question_data in enumerate(quiz_data.get("questions", [])):
            question = QuizQuestion.objects.create(
                quiz=quiz, prompt=question_data.get("q", ""), position=q_index
            )
            correct = question_data.get("answer")
            for a_index, label in enumerate(question_data.get("options", [])):
                QuizAnswer.objects.create(
                    question=question,
                    label=label,
                    is_correct=(a_index == correct),
                    position=a_index,
                )

    def link_lessons(self) -> int:
        """Rattache les leçons à leur ressource ou à leur fiche d'outil."""
        resources = {r.slug: r for r in Resource.objects.all()}
        tools = {t.slug: t for t in ClinicalTool.objects.all()}
        linked = 0
        for lesson_pk, resource_slug, tool_slug in self.pending_lesson_links:
            resource = resources.get(resource_slug) if resource_slug else None
            tool = tools.get(tool_slug) if tool_slug else None
            if resource is None and tool is None:
                continue
            Lesson.objects.filter(pk=lesson_pk).update(resource=resource, tool=tool)
            linked += 1
        return linked

    # ---------------------------------------------------------------- webinaires

    def seed_webinars(self) -> int:
        items = load("webinars")
        for item in items:
            webinar, _ = Webinar.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "title": item["title"],
                    "subtitle": item.get("subtitle", "") or "",
                    "description": item.get("description", ""),
                    "agenda": item.get("agenda", []),
                    "speaker": self.authors_by_legacy_id.get(item.get("speakerId")),
                    "region_id": item.get("region") or None,
                    "specialty_id": item.get("specialty") or None,
                    "starts_at": as_datetime(item.get("startsAt")) or timezone.now(),
                    "duration_min": item.get("durationMinutes", 60),
                    "live_url": item.get("liveUrl", "") or "",
                    "replay_url": item.get("replayUrl", "") or "",
                    "access": item.get("access", "free"),
                    "certificate": item.get("certificate", True),
                    "registered_count": item.get("registeredCount", 0),
                    "published": item.get("published", True),
                },
            )
            webinar.tags.set(self.tags_for(item.get("tags", [])))
            webinar.pathologies.set(self.pathologies_for(item.get("pathologies", [])))
            self.save_translations(item, webinar, "webinar")
            webinar.reindex_search()
        return len(items)

    # ------------------------------------------------------------------- outils

    def seed_tools(self) -> int:
        items = load("tools")
        for item in items:
            tool, _ = ClinicalTool.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "subtitle": item.get("subtitle", "") or "",
                    "description": item.get("description", ""),
                    "type": item["type"],
                    "purpose": item.get("purpose", ""),
                    "indications": item.get("indications", []),
                    "contraindications": item.get("contraindications", []),
                    "equipment": item.get("equipment", []),
                    "procedure": item.get("procedure", []),
                    "scoring": item.get("scoring", "") or "",
                    "interpretation": item.get("interpretation", []),
                    "psychometrics": item.get("psychometrics", "") or "",
                    "references": item.get("references", []),
                    "region_id": item.get("region") or None,
                    "specialty_id": item.get("specialty") or None,
                    "access": item.get("access", "free"),
                    "file_url": item.get("fileUrl", "") or "",
                    "file_format": item.get("format", "pdf"),
                    "file_size_kb": item.get("sizeKb"),
                    "download_count": item.get("downloads", 0),
                    "published": item.get("published", True),
                },
            )
            tool.pathologies.set(self.pathologies_for(item.get("pathologies", [])))
            self.save_translations(item, tool, "tool")
            tool.reindex_search()
        return len(items)

    # ---------------------------------------------------------------- exercices

    def seed_exercises(self) -> int:
        items = load("exercises")
        for item in items:
            dosage = item.get("dosage") or {}
            exercise, _ = Exercise.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "goal": item.get("goal", ""),
                    "region_id": item["region"],
                    "objective": item.get("objective", ""),
                    "difficulty": item.get("difficulty", "facile"),
                    "target_muscles": item.get("targetMuscles", []),
                    "equipment": item.get("equipment", []),
                    "steps": item.get("steps", []),
                    "sets": str(dosage.get("sets", "") or ""),
                    "reps": str(dosage.get("reps", "") or ""),
                    "hold": str(dosage.get("hold", "") or ""),
                    "frequency": str(dosage.get("frequency", "") or ""),
                    "progression": item.get("progression", "") or "",
                    "regression": item.get("regression", "") or "",
                    "precautions": item.get("precautions", []),
                    "video_url": item.get("videoUrl", "") or "",
                    "image_url": item.get("imageUrl", "") or "",
                    "references": item.get("references", []),
                    # Le jeu de données n'a pas de drapeau : ces exercices sont
                    # du contenu validé, donc publié.
                    "published": item.get("published", True),
                },
            )
            exercise.tags.set(self.tags_for(item.get("tags", [])))
            exercise.pathologies.set(self.pathologies_for(item.get("pathologies", [])))
            self.save_translations(item, exercise, "exercise")
            exercise.reindex_search()
        return len(items)

    # ----------------------------------------------------------------- formules

    def seed_plans(self) -> int:
        items = load("plans")
        valid_intervals = set(PlanInterval.values)
        valid_audiences = set(PlanAudience.values)
        for item in items:
            interval = item.get("interval", "month")
            audience = item.get("audience", "all")
            Plan.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "tagline": item.get("tagline", "") or "",
                    "price_dzd": item.get("priceDzd", 0),
                    "interval": interval if interval in valid_intervals else "month",
                    "audience": audience if audience in valid_audiences else "all",
                    "features": item.get("features", []),
                    "limits": item.get("limits", "") or "",
                    "premium": item.get("premium", False),
                    "highlighted": item.get("highlighted", False),
                    "order": item.get("order", 0),
                    "published": item.get("published", True),
                    "active": item.get("published", True),
                },
            )
        return len(items)

    # -------------------------------------------------------------- traductions

    def save_translations(self, item: dict, target, field_name: str) -> None:
        """`i18n: { en: { title: … } }` → une ligne `Translation` par champ."""
        for locale, fields in (item.get("i18n") or {}).items():
            for field, value in (fields or {}).items():
                if not value:
                    continue
                Translation.objects.update_or_create(
                    locale=locale,
                    field=field,
                    **{field_name: target},
                    defaults={"value": value},
                )

    # ------------------------------------------------------------------- état

    pending_lesson_links: list[tuple] = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pending_lesson_links = []
        self.authors_by_legacy_id = {}
