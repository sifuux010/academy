"""
Tests de l'API de contenu.

Ils vérifient le contrat que le front-end consomme : forme des réponses,
sémantique des filtres (OU dans un groupe, ET entre groupes), tris,
pagination, facettes, et les deux garanties de sécurité — pas de bonne
réponse de quiz dans le JSON, pas de lien de fichier premium pour qui n'y a
pas droit.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from config.enums import Role
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
from content.search import build_search_text, normalize, query_words
from taxonomies.models import BodyRegion, ResourceCategory, Specialty, Tag


class NormalizeTests(TestCase):
    def test_strips_latin_accents_and_lowercases(self):
        self.assertEqual(normalize("Rééducation ACTIVE"), "reeducation active")

    def test_expands_ligatures(self):
        self.assertEqual(normalize("œdème"), "oedeme")
        self.assertEqual(normalize("Æsculape"), "aesculape")

    def test_strips_arabic_diacritics(self):
        self.assertEqual(normalize("أَلَمٌ"), normalize("ألم"))

    def test_query_below_two_characters_is_ignored(self):
        self.assertEqual(query_words("a"), [])
        self.assertEqual(query_words(" "), [])
        self.assertEqual(query_words("ab"), ["ab"])


class ContentFixture(TestCase):
    """Jeu minimal mais complet : deux régions, deux types, trois ressources."""

    @classmethod
    def setUpTestData(cls):
        cls.rachis = BodyRegion.objects.create(id="rachis", order=0)
        cls.genou = BodyRegion.objects.create(id="genou", order=1)
        cls.msk = Specialty.objects.create(id="musculosquelettique", order=0)
        cls.sport = Specialty.objects.create(id="sport", order=1)
        cls.protocole = ResourceCategory.objects.create(id="protocole", order=0)
        cls.guide = ResourceCategory.objects.create(id="guide", order=1)

        cls.author = Author.objects.create(
            slug="amina-belkacem", first_name="Amina", last_name="Belkacem"
        )

        cls.lombalgie = Pathology.objects.create(
            slug="lombalgie-commune", name="Lombalgie commune",
            summary="Douleur lombaire non spécifique.",
            region=cls.rachis, specialty=cls.msk, published=True,
            aliases=["mal de dos", "lumbago"],
        )
        cls.tendinopathie = Pathology.objects.create(
            slug="tendinopathie-patellaire", name="Tendinopathie patellaire",
            summary="Douleur du tendon rotulien.",
            region=cls.genou, specialty=cls.sport, published=True,
            aliases=["tendinopathie rotulienne", "jumper's knee"],
        )
        for pathology in (cls.lombalgie, cls.tendinopathie):
            pathology.reindex_search()

        cls.tag_exercice = Tag.objects.create(slug="exercice-therapeutique")

        cls.r1 = Resource.objects.create(
            slug="protocole-lombalgie", title="Protocole lombalgie active",
            description="Reprise d'activité progressive.", category=cls.protocole,
            author=cls.author, region=cls.rachis, specialty=cls.msk,
            level="intermediaire", language="fr", access="free",
            views=100, download_count=10, published=True,
            published_at=timezone.now() - timedelta(days=1),
        )
        cls.r1.pathologies.set([cls.lombalgie])
        cls.r1.tags.set([cls.tag_exercice])
        Translation.objects.create(
            locale="en", field="title", resource=cls.r1,
            value="Active low back pain protocol",
        )
        cls.r1.reindex_search()

        cls.r2 = Resource.objects.create(
            slug="guide-genou", title="Guide du genou douloureux",
            description="Démarche diagnostique.", category=cls.guide,
            region=cls.genou, specialty=cls.sport, level="debutant",
            language="fr", access="free", views=5, download_count=1,
            published=True, published_at=timezone.now() - timedelta(days=10),
        )
        cls.r2.pathologies.set([cls.tendinopathie])
        cls.r2.reindex_search()

        # Brouillon : ne doit jamais sortir de l'API publique.
        cls.draft = Resource.objects.create(
            slug="brouillon", title="Brouillon invisible",
            description="Pas encore publié.", category=cls.guide,
            published=False,
        )
        cls.draft.reindex_search()

        # Ressource premium avec un lien de fichier, pour tester la garde.
        cls.premium = Resource.objects.create(
            slug="premium-rachis", title="Dossier rachis premium",
            description="Réservé aux abonnés.", category=cls.protocole,
            access="premium", file_url="https://example.org/premium.pdf",
            published=True, published_at=timezone.now(),
        )
        cls.premium.reindex_search()


class ListShapeTests(ContentFixture):
    def test_list_has_the_shape_the_front_end_expects(self):
        body = self.client.get("/api/content/resources/").json()
        for key in ("items", "total", "page", "pages", "perPage", "sort",
                    "query", "filters", "facets", "section"):
            self.assertIn(key, body)
        self.assertEqual(body["section"], "resources")

    def test_drafts_are_never_listed(self):
        body = self.client.get("/api/content/resources/").json()
        slugs = [item["slug"] for item in body["items"]]
        self.assertNotIn("brouillon", slugs)
        self.assertEqual(body["total"], 3)

    def test_items_use_front_end_field_names(self):
        body = self.client.get("/api/content/resources/?q=protocole lombalgie").json()
        item = body["items"][0]
        self.assertEqual(item["type"], "protocole")
        self.assertEqual(item["region"], "rachis")
        self.assertEqual(item["pathologies"], ["lombalgie-commune"])
        self.assertEqual(item["tags"], ["exercice-therapeutique"])
        self.assertIn("downloads", item)
        self.assertIn("publishedAt", item)
        self.assertNotIn("download_count", item)
        self.assertNotIn("published_at", item)

    def test_translations_are_returned_as_i18n(self):
        body = self.client.get("/api/content/resources/?q=protocole lombalgie").json()
        self.assertEqual(
            body["items"][0]["i18n"],
            {"en": {"title": "Active low back pain protocol"}},
        )

    def test_unknown_section_is_404(self):
        self.assertEqual(self.client.get("/api/content/inexistant/").status_code, 404)


class FilterTests(ContentFixture):
    def test_single_filter(self):
        body = self.client.get("/api/content/resources/?type=guide").json()
        self.assertEqual(body["total"], 1)
        self.assertEqual(body["items"][0]["slug"], "guide-genou")

    def test_two_values_of_one_filter_are_or(self):
        body = self.client.get("/api/content/resources/?type=guide&type=protocole").json()
        self.assertEqual(body["total"], 3)

    def test_two_different_filters_are_and(self):
        both = self.client.get(
            "/api/content/resources/?type=guide&region=rachis"
        ).json()
        self.assertEqual(both["total"], 0)

    def test_pathology_filter_crosses_the_relation(self):
        body = self.client.get(
            "/api/content/resources/?pathology=lombalgie-commune"
        ).json()
        self.assertEqual(body["total"], 1)
        self.assertEqual(body["items"][0]["slug"], "protocole-lombalgie")

    def test_pathology_filter_does_not_duplicate_rows(self):
        # Une ressource rattachée à deux pathologies, toutes deux filtrées,
        # ne doit apparaître qu'une fois.
        self.r1.pathologies.set([self.lombalgie, self.tendinopathie])
        body = self.client.get(
            "/api/content/resources/"
            "?pathology=lombalgie-commune&pathology=tendinopathie-patellaire"
        ).json()
        slugs = [item["slug"] for item in body["items"]]
        self.assertEqual(len(slugs), len(set(slugs)))

    def test_unknown_filter_key_is_ignored(self):
        body = self.client.get("/api/content/resources/?couleur=bleu").json()
        self.assertEqual(body["total"], 3)


class SearchTests(ContentFixture):
    def test_search_is_accent_insensitive(self):
        body = self.client.get("/api/content/resources/?q=reprise d'activite").json()
        self.assertEqual(body["total"], 1)

    def test_search_requires_every_word(self):
        self.assertEqual(
            self.client.get("/api/content/resources/?q=protocole lombalgie").json()["total"], 1
        )
        self.assertEqual(
            self.client.get("/api/content/resources/?q=protocole zebre").json()["total"], 0
        )

    def test_search_reaches_translations(self):
        body = self.client.get("/api/content/resources/?q=low back pain").json()
        self.assertEqual(body["total"], 1)

    def test_search_reaches_the_author_name(self):
        body = self.client.get("/api/content/resources/?q=belkacem").json()
        self.assertEqual(body["total"], 1)

    def test_search_reaches_pathology_synonyms(self):
        # « rotulienne » n'est que dans les alias de « Tendinopathie patellaire ».
        body = self.client.get("/api/content/resources/?q=rotulienne").json()
        self.assertEqual(body["total"], 1)
        self.assertEqual(body["items"][0]["slug"], "guide-genou")

    def test_too_short_a_query_is_ignored(self):
        body = self.client.get("/api/content/resources/?q=a").json()
        self.assertEqual(body["total"], 3)

    def test_global_search_covers_every_section(self):
        body = self.client.get("/api/content/search/?q=rotulienne").json()
        self.assertGreaterEqual(body["total"], 2)
        self.assertIn("pathologies", body["sections"])
        self.assertIn("resources", body["sections"])

    def test_global_search_without_query_returns_nothing(self):
        body = self.client.get("/api/content/search/?q=").json()
        self.assertEqual(body["total"], 0)
        self.assertEqual(body["sections"], {})

    def test_index_covers_expected_sources(self):
        index = build_search_text(self.r1)
        for fragment in ("protocole lombalgie active", "belkacem",
                         "exercice-therapeutique", "mal de dos",
                         "active low back pain"):
            self.assertIn(fragment, index)


class SortTests(ContentFixture):
    def test_newest_first_by_default(self):
        body = self.client.get("/api/content/resources/").json()
        self.assertEqual(body["sort"], "newest")
        self.assertEqual(body["items"][0]["slug"], "premium-rachis")

    def test_oldest_reverses(self):
        body = self.client.get("/api/content/resources/?sort=oldest").json()
        self.assertEqual(body["items"][0]["slug"], "guide-genou")

    def test_popular_uses_views_plus_downloads(self):
        body = self.client.get("/api/content/resources/?sort=popular").json()
        self.assertEqual(body["items"][0]["slug"], "protocole-lombalgie")

    def test_az_sorts_alphabetically(self):
        body = self.client.get("/api/content/resources/?sort=az").json()
        titles = [item["title"] for item in body["items"]]
        self.assertEqual(titles, sorted(titles))

    def test_unknown_sort_falls_back_to_default(self):
        body = self.client.get("/api/content/resources/?sort=nimportequoi").json()
        self.assertEqual(body["sort"], "newest")


class PaginationTests(ContentFixture):
    def test_per_page_splits_the_result(self):
        body = self.client.get("/api/content/resources/?perPage=2").json()
        self.assertEqual(body["total"], 3)
        self.assertEqual(body["pages"], 2)
        self.assertEqual(len(body["items"]), 2)

    def test_page_beyond_the_last_is_clamped(self):
        body = self.client.get("/api/content/resources/?perPage=2&page=99").json()
        self.assertEqual(body["page"], 2)
        self.assertEqual(len(body["items"]), 1)

    def test_page_zero_or_garbage_becomes_one(self):
        self.assertEqual(self.client.get("/api/content/resources/?page=0").json()["page"], 1)
        self.assertEqual(
            self.client.get("/api/content/resources/?page=abc").json()["page"], 1
        )

    def test_per_page_is_capped(self):
        body = self.client.get("/api/content/resources/?perPage=100000").json()
        self.assertLessEqual(body["perPage"], 100)


class FacetTests(ContentFixture):
    def test_facets_count_each_value(self):
        facets = self.client.get("/api/content/resources/").json()["facets"]
        self.assertEqual(facets["type"], {"protocole": 2, "guide": 1})

    def test_a_facet_ignores_its_own_filter(self):
        # En filtrant sur « guide », le compte des autres types reste visible.
        facets = self.client.get("/api/content/resources/?type=guide").json()["facets"]
        self.assertEqual(facets["type"], {"protocole": 2, "guide": 1})

    def test_a_facet_respects_the_other_filters(self):
        facets = self.client.get("/api/content/resources/?region=genou").json()["facets"]
        self.assertEqual(facets["type"], {"guide": 1})

    def test_facets_can_be_switched_off(self):
        body = self.client.get("/api/content/resources/?facets=0").json()
        self.assertEqual(body["facets"], {})


class WebinarStatusTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        now = timezone.now()
        cls.upcoming = Webinar.objects.create(
            slug="a-venir", title="À venir", description="",
            starts_at=now + timedelta(days=3), duration_min=60, published=True,
        )
        cls.live = Webinar.objects.create(
            slug="en-direct", title="En direct", description="",
            starts_at=now - timedelta(minutes=10), duration_min=60, published=True,
        )
        cls.replay = Webinar.objects.create(
            slug="replay", title="Replay", description="",
            starts_at=now - timedelta(days=5), duration_min=60,
            replay_url="https://example.org/replay", published=True,
        )
        cls.past = Webinar.objects.create(
            slug="termine", title="Terminé", description="",
            starts_at=now - timedelta(days=5), duration_min=60, published=True,
        )

    def test_ends_at_is_computed_on_save(self):
        self.assertEqual(
            self.upcoming.ends_at, self.upcoming.starts_at + timedelta(minutes=60)
        )

    def test_status_property_matches_the_front_end_rules(self):
        self.assertEqual(self.upcoming.status, "upcoming")
        self.assertEqual(self.live.status, "live")
        self.assertEqual(self.replay.status, "replay")
        self.assertEqual(self.past.status, "past")

    def test_status_filter_is_done_in_sql(self):
        for value, slug in (("upcoming", "a-venir"), ("live", "en-direct"),
                            ("replay", "replay"), ("past", "termine")):
            body = self.client.get(f"/api/content/webinars/?status={value}").json()
            self.assertEqual(body["total"], 1, value)
            self.assertEqual(body["items"][0]["slug"], slug)

    def test_status_filter_accepts_several_values(self):
        body = self.client.get(
            "/api/content/webinars/?status=upcoming&status=live"
        ).json()
        self.assertEqual(body["total"], 2)

    def test_status_facet_is_counted(self):
        facets = self.client.get("/api/content/webinars/").json()["facets"]
        self.assertEqual(facets["status"],
                         {"upcoming": 1, "live": 1, "replay": 1, "past": 1})

    def test_status_is_serialized(self):
        body = self.client.get("/api/content/webinars/?status=live").json()
        self.assertEqual(body["items"][0]["status"], "live")


class QuizSecurityTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.course = Course.objects.create(
            slug="formation", title="Formation", description="", published=True
        )
        module = CourseModule.objects.create(course=cls.course, title="Module", position=0)
        lesson = Lesson.objects.create(
            module=module, title="Quiz final", type="quiz", position=0, duration_min=10
        )
        quiz = Quiz.objects.create(lesson=lesson, pass_score=1)
        question = QuizQuestion.objects.create(
            quiz=quiz, prompt="Quelle est la bonne réponse ?", position=0
        )
        QuizAnswer.objects.create(question=question, label="Bonne", is_correct=True, position=0)
        QuizAnswer.objects.create(question=question, label="Mauvaise", is_correct=False, position=1)

    def test_quiz_structure_is_served(self):
        body = self.client.get("/api/content/courses/formation/").json()
        quiz = body["modules"][0]["lessons"][0]["quiz"]
        self.assertEqual(quiz["passScore"], 1)
        self.assertEqual(quiz["questions"][0]["options"], ["Bonne", "Mauvaise"])

    def test_the_correct_answer_never_leaves_the_server(self):
        import json

        raw = json.dumps(self.client.get("/api/content/courses/formation/").json())
        self.assertNotIn("is_correct", raw)
        self.assertNotIn("isCorrect", raw)
        question = self.client.get(
            "/api/content/courses/formation/"
        ).json()["modules"][0]["lessons"][0]["quiz"]["questions"][0]
        self.assertNotIn("answer", question)

    def test_course_stats_count_modules_and_minutes(self):
        body = self.client.get("/api/content/courses/formation/").json()
        self.assertEqual(body["stats"], {"modules": 1, "lessons": 1, "minutes": 10})


class PremiumGateTests(ContentFixture):
    def test_anonymous_visitor_gets_no_premium_file_url(self):
        body = self.client.get("/api/content/resources/premium-rachis/").json()
        self.assertEqual(body["access"], "premium")
        self.assertEqual(body["fileUrl"], "")

    def test_free_member_gets_no_premium_file_url(self):
        user = User.objects.create_user(
            email="libre@example.com", password="Kinedok2026!",
            first_name="Libre", last_name="Compte",
        )
        self.client.force_login(user)
        body = self.client.get("/api/content/resources/premium-rachis/").json()
        self.assertEqual(body["fileUrl"], "")

    def test_premium_member_gets_the_file_url(self):
        user = User.objects.create_user(
            email="abonne@example.com", password="Kinedok2026!",
            first_name="Abonné", last_name="Compte", premium=True,
        )
        self.client.force_login(user)
        body = self.client.get("/api/content/resources/premium-rachis/").json()
        self.assertEqual(body["fileUrl"], "https://example.org/premium.pdf")

    def test_content_editor_can_check_what_it_publishes(self):
        user = User.objects.create_user(
            email="editeur@example.com", password="Kinedok2026!",
            first_name="Éditeur", last_name="Compte", role=Role.CONTENT_EDITOR,
        )
        self.client.force_login(user)
        body = self.client.get("/api/content/resources/premium-rachis/").json()
        self.assertEqual(body["fileUrl"], "https://example.org/premium.pdf")

    def test_free_content_file_url_is_always_served(self):
        self.r2.file_url = "https://example.org/libre.pdf"
        self.r2.save()
        body = self.client.get("/api/content/resources/guide-genou/").json()
        self.assertEqual(body["fileUrl"], "https://example.org/libre.pdf")


class PathologyHubTests(ContentFixture):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.bilan = ClinicalTool.objects.create(
            slug="bilan-lombaire", name="Bilan lombaire", description="",
            type="bilan", purpose="Évaluer", published=True,
        )
        cls.bilan.pathologies.set([cls.lombalgie])
        cls.test_tool = ClinicalTool.objects.create(
            slug="test-schober", name="Test de Schober", description="",
            type="test", purpose="Mesurer", published=True,
        )
        cls.test_tool.pathologies.set([cls.lombalgie])
        cls.exercise = Exercise.objects.create(
            slug="gainage", name="Gainage", goal="Stabiliser",
            region=cls.rachis, objective="controle", published=True,
        )
        cls.exercise.pathologies.set([cls.lombalgie])

    def test_hub_separates_protocols_and_assessments(self):
        body = self.client.get("/api/content/pathologies/lombalgie-commune/hub/").json()
        self.assertEqual(body["pathology"]["slug"], "lombalgie-commune")
        self.assertEqual([r["slug"] for r in body["protocols"]], ["protocole-lombalgie"])
        self.assertEqual([t["slug"] for t in body["assessments"]], ["bilan-lombaire"])
        self.assertEqual([t["slug"] for t in body["tools"]], ["test-schober"])
        self.assertEqual([e["slug"] for e in body["exercises"]], ["gainage"])

    def test_hub_404_for_an_unknown_pathology(self):
        self.assertEqual(
            self.client.get("/api/content/pathologies/inconnue/hub/").status_code, 404
        )


class TaxonomyAndMetaTests(ContentFixture):
    def test_taxonomies_serve_keys_not_labels(self):
        body = self.client.get("/api/content/taxonomies/").json()
        self.assertIn("rachis", body["regions"])
        self.assertIn("protocole", body["resourceTypes"])

    def test_taxonomies_respect_the_declared_order(self):
        body = self.client.get("/api/content/taxonomies/").json()
        self.assertEqual(body["regions"][:2], ["rachis", "genou"])

    def test_authors_are_listed_with_a_display_name(self):
        body = self.client.get("/api/content/authors/").json()
        self.assertEqual(body["total"], 1)
        self.assertEqual(body["items"][0]["name"], "Amina Belkacem")

    def test_stats_count_only_published_content(self):
        body = self.client.get("/api/content/stats/").json()
        self.assertEqual(body["resources"], 3)
        self.assertEqual(body["pathologies"], 2)


class ExerciseShapeTests(ContentFixture):
    def test_dosage_is_rebuilt_as_an_object(self):
        exercise = Exercise.objects.create(
            slug="squat", name="Squat", goal="Renforcer", region=self.genou,
            objective="force", published=True, sets="3", reps="12",
            hold="", frequency="3×/semaine",
        )
        body = self.client.get(f"/api/content/exercises/{exercise.slug}/").json()
        self.assertEqual(
            body["dosage"],
            {"sets": "3", "reps": "12", "hold": "", "frequency": "3×/semaine"},
        )
        self.assertEqual(body["targetMuscles"], [])
