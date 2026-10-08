"""
Met en place une page d'accueil de départ : partenaires, bannières, rayons
et un contenu sponsorisé d'exemple.

Idempotent — les objets sont repérés par leur clé naturelle. À lancer après
`seed_content`, dont il réutilise les contenus réels.

    python manage.py seed_promotions
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from content.models import ClinicalTool, Course, Resource, Webinar
from promotions.models import Banner, Partner, Placement, Shelf, ShelfItem, Sponsorship, Theme

PARTNERS = [
    ("universite-alger", "Université d'Alger — Faculté de médecine", "university", 0),
    ("chu-mustapha", "CHU Mustapha Pacha", "hospital", 1),
    ("sakd", "Société algérienne de kinésithérapie du sport", "society", 2),
    ("inesm", "Institut national supérieur en sciences du mouvement", "university", 3),
    ("ordre-kine", "Ordre national des kinésithérapeutes", "society", 4),
]

# Visuels du carrousel. Les deux images claires prennent l'habillage
# `light` : sur elles, un texte blanc ne passerait pas.
BANNERS = [
    {
        "key": "bibliotheque",
        "theme": Theme.DARK,
        "image_url": "/hero/hero1.webp",
        "eyebrow": "Bibliothèque scientifique",
        "title": "Des protocoles fondés sur les preuves",
        "body": "42 ressources relues, avec leurs références.",
        "cta_label": "Explorer la bibliothèque",
        "cta_href": "/bibliotheque",
        "position": 0,
    },
    {
        "key": "outils",
        "theme": Theme.LIGHT,
        "image_url": "/hero/hero2.webp",
        "eyebrow": "Outils cliniques",
        "title": "67 tests, scores et bilans",
        "body": "Cotation, interprétation et qualités métrologiques.",
        "cta_label": "Ouvrir les outils",
        "cta_href": "/outils",
        "position": 1,
    },
    {
        "key": "formations",
        "theme": Theme.LIGHT,
        "image_url": "/hero/hero3.webp",
        "eyebrow": "Formations",
        "title": "Progressez à votre rythme",
        "body": "Modules, quiz corrigés et certificat de réussite.",
        "cta_label": "Voir les formations",
        "cta_href": "/formations",
        "position": 2,
    },
]

FEATURED_SHELVES = [
    {
        "key": "populaires",
        "title": "Les plus consultés",
        "subtitle": "Ce que lisent vos confrères en ce moment.",
        "section": "resources",
        "source": "popular",
        "cta_label": "Toute la bibliothèque",
        "cta_href": "/bibliotheque",
        "limit": 6,
        "position": 0,
    },
    {
        "key": "nouveautes",
        "title": "Nouveautés",
        "subtitle": "Les dernières ressources mises en ligne.",
        "section": "resources",
        "source": "newest",
        "cta_label": "Trier par date",
        "cta_href": "/bibliotheque?sort=newest",
        "limit": 6,
        "position": 1,
    },
    {
        "key": "formations-suivies",
        "title": "Formations les plus suivies",
        "subtitle": "Modules, quiz et certificat de réussite.",
        "section": "courses",
        "source": "popular",
        "cta_label": "Toutes les formations",
        "cta_href": "/formations",
        "limit": 6,
        "position": 2,
    },
    {
        "key": "webinaires",
        "title": "Prochains webinaires",
        "subtitle": "Sessions en direct et replays.",
        "section": "webinars",
        "source": "newest",
        "cta_label": "Tous les webinaires",
        "cta_href": "/webinaires",
        "limit": 6,
        "position": 3,
    },
]

# Parcours par spécialité : un onglet par spécialité, alimenté par filtre.
CAREER_SHELVES = [
    ("musculosquelettique", "Musculosquelettique", 0),
    ("sport", "Sport", 1),
    ("neurologie", "Neurologie", 2),
    ("cardioresp", "Cardio-respiratoire", 3),
    ("pediatrie", "Pédiatrie", 4),
    ("geriatrie", "Gériatrie", 5),
]


class Command(BaseCommand):
    help = "Installe une page d'accueil de départ (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        partners = self.seed_partners()
        counts = {
            "partenaires": len(partners),
            "bannières": self.seed_banners(partners),
            "rayons": self.seed_featured(),
            "parcours": self.seed_career(),
            "sponsorisés": self.seed_sponsorships(partners),
        }
        width = max(len(k) for k in counts)
        for label, number in counts.items():
            self.stdout.write(f"  {label.ljust(width)}  {number}")
        self.stdout.write(self.style.SUCCESS("Page d'accueil installée."))

    def seed_partners(self) -> dict[str, Partner]:
        out = {}
        for slug, name, kind, position in PARTNERS:
            partner, _ = Partner.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "kind": kind, "position": position,
                          "active": True},
            )
            out[slug] = partner
        return out

    def seed_banners(self, partners: dict[str, Partner]) -> int:
        for data in BANNERS:
            key = data.pop("key") if "key" in data else data["title"]
            Banner.objects.update_or_create(
                placement=Placement.HOME_HERO,
                title=data["title"],
                defaults={**data, "active": True},
            )
            data["key"] = key
        return len(BANNERS)

    def seed_featured(self) -> int:
        for data in FEATURED_SHELVES:
            Shelf.objects.update_or_create(
                placement=Placement.HOME_FEATURED,
                key=data["key"],
                defaults={**{k: v for k, v in data.items() if k != "key"},
                          "active": True},
            )
        return len(FEATURED_SHELVES)

    def seed_career(self) -> int:
        """
        Un onglet par spécialité, alimenté par un filtre sur les formations.

        Une spécialité sans formation publiée est sautée : un onglet vide
        n'apprend rien au visiteur.
        """
        created = 0
        for key, title, position in CAREER_SHELVES:
            if not Course.objects.filter(published=True, specialty_id=key).exists():
                Shelf.objects.filter(
                    placement=Placement.HOME_CAREER, key=key
                ).delete()
                continue
            Shelf.objects.update_or_create(
                placement=Placement.HOME_CAREER,
                key=key,
                defaults={
                    "title": title,
                    "subtitle": "Formations, protocoles et bilans de la spécialité.",
                    "section": "courses",
                    "source": "popular",
                    "filters": {"specialty": [key]},
                    "limit": 4,
                    "position": position,
                    "cta_label": "Voir la spécialité",
                    "cta_href": f"/formations?specialty={key}",
                    "active": True,
                },
            )
            created += 1
        return created

    def seed_sponsorships(self, partners: dict[str, Partner]) -> int:
        """Un exemple par emplacement, pour que le système se voie en situation."""
        examples = []

        course = Course.objects.filter(published=True).order_by("-enrolled_count").first()
        if course:
            examples.append((Placement.COURSES_TOP, "courses", course.slug,
                             "sakd", "Partenaire", "Formation certifiante"))

        resource = Resource.objects.filter(
            published=True, category_id="protocole"
        ).order_by("-views").first()
        if resource:
            examples.append((Placement.LIBRARY_TOP, "resources", resource.slug,
                             "chu-mustapha", "Sponsorisé", "Protocole recommandé"))

        tool = ClinicalTool.objects.filter(published=True, type="bilan").first()
        if tool:
            examples.append((Placement.HOME_FEATURED, "tools", tool.slug,
                             "universite-alger", "Partenaire", "Bilan de référence"))

        for placement, section, slug, partner_slug, label, note in examples:
            Sponsorship.objects.update_or_create(
                placement=placement,
                section=section,
                slug=slug,
                defaults={
                    "partner": partners.get(partner_slug),
                    "label": label,
                    "note": note,
                    "weight": 10,
                    "active": True,
                },
            )
        return len(examples)
