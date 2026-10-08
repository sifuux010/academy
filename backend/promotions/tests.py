"""
Tests des mises en avant.

L'essentiel porte sur ce qui se voit : une bannière hors de sa fenêtre ne
doit pas sortir, un sponsor dont le contenu a été dépublié ne doit rien
afficher, et une carte sponsorisée ne doit jamais perdre sa mention.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from content.models import Course, Resource
from promotions.models import (
    Banner,
    Partner,
    Placement,
    Shelf,
    ShelfItem,
    Sponsorship,
)
from taxonomies.models import ResourceCategory, Specialty


class Fixture(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = ResourceCategory.objects.create(id="protocole", order=0)
        cls.sport = Specialty.objects.create(id="sport", order=0)
        cls.partner = Partner.objects.create(
            slug="sakd", name="Société algérienne de kinésithérapie du sport",
            kind="society", position=0,
        )
        now = timezone.now()
        cls.r1 = Resource.objects.create(
            slug="protocole-lca", title="Protocole LCA", description="",
            category=cls.category, published=True, views=500,
            published_at=now - timedelta(days=1),
        )
        cls.r2 = Resource.objects.create(
            slug="protocole-epaule", title="Protocole épaule", description="",
            category=cls.category, published=True, views=10,
            published_at=now - timedelta(days=5),
        )
        cls.course = Course.objects.create(
            slug="rééducation-sport", title="Rééducation du sportif",
            description="", specialty=cls.sport, published=True,
            enrolled_count=300, published_at=now,
        )


class BannerTests(Fixture):
    def test_live_banner_is_served(self):
        Banner.objects.create(
            placement=Placement.HOME_HERO, title="En ligne", active=True
        )
        body = self.client.get("/api/promotions/home/").json()
        self.assertEqual([b["title"] for b in body["banners"]], ["En ligne"])

    def test_inactive_banner_is_hidden(self):
        Banner.objects.create(
            placement=Placement.HOME_HERO, title="Désactivée", active=False
        )
        self.assertEqual(self.client.get("/api/promotions/home/").json()["banners"], [])

    def test_banner_before_its_window_is_hidden(self):
        Banner.objects.create(
            placement=Placement.HOME_HERO, title="Plus tard", active=True,
            starts_at=timezone.now() + timedelta(days=2),
        )
        self.assertEqual(self.client.get("/api/promotions/home/").json()["banners"], [])

    def test_expired_banner_is_hidden(self):
        Banner.objects.create(
            placement=Placement.HOME_HERO, title="Terminée", active=True,
            ends_at=timezone.now() - timedelta(hours=1),
        )
        self.assertEqual(self.client.get("/api/promotions/home/").json()["banners"], [])

    def test_banners_follow_their_position(self):
        Banner.objects.create(placement=Placement.HOME_HERO, title="B", position=1)
        Banner.objects.create(placement=Placement.HOME_HERO, title="A", position=0)
        body = self.client.get("/api/promotions/home/").json()
        self.assertEqual([b["title"] for b in body["banners"]], ["A", "B"])

    def test_a_banner_of_another_placement_is_not_in_the_carousel(self):
        Banner.objects.create(placement=Placement.LIBRARY_TOP, title="Ailleurs")
        self.assertEqual(self.client.get("/api/promotions/home/").json()["banners"], [])

    def test_end_before_start_is_refused(self):
        from django.core.exceptions import ValidationError

        now = timezone.now()
        banner = Banner(
            placement=Placement.HOME_HERO, title="Incohérente",
            starts_at=now, ends_at=now - timedelta(days=1),
        )
        with self.assertRaises(ValidationError):
            banner.full_clean()


class ShelfTests(Fixture):
    def test_popular_shelf_orders_by_popularity(self):
        Shelf.objects.create(
            placement=Placement.HOME_FEATURED, key="populaires", title="Populaires",
            section="resources", source="popular", limit=5,
        )
        shelf = self.client.get("/api/promotions/home/").json()["shelves"][0]
        self.assertEqual([i["slug"] for i in shelf["items"]],
                         ["protocole-lca", "protocole-epaule"])

    def test_newest_shelf_orders_by_date(self):
        Shelf.objects.create(
            placement=Placement.HOME_FEATURED, key="nouveautes", title="Nouveautés",
            section="resources", source="newest", limit=5,
        )
        shelf = self.client.get("/api/promotions/home/").json()["shelves"][0]
        self.assertEqual(shelf["items"][0]["slug"], "protocole-lca")

    def test_shelf_limit_is_respected(self):
        Shelf.objects.create(
            placement=Placement.HOME_FEATURED, key="limite", title="Limité",
            section="resources", source="newest", limit=1,
        )
        shelf = self.client.get("/api/promotions/home/").json()["shelves"][0]
        self.assertEqual(len(shelf["items"]), 1)

    def test_manual_shelf_keeps_the_editor_order(self):
        shelf = Shelf.objects.create(
            placement=Placement.HOME_FEATURED, key="selection", title="Sélection",
            source="manual",
        )
        ShelfItem.objects.create(shelf=shelf, section="resources",
                                 slug="protocole-epaule", position=0)
        ShelfItem.objects.create(shelf=shelf, section="resources",
                                 slug="protocole-lca", position=1)
        served = self.client.get("/api/promotions/home/").json()["shelves"][0]
        self.assertEqual([i["slug"] for i in served["items"]],
                         ["protocole-epaule", "protocole-lca"])

    def test_manual_shelf_can_mix_sections(self):
        shelf = Shelf.objects.create(
            placement=Placement.HOME_FEATURED, key="mixte", title="Mixte",
            source="manual",
        )
        ShelfItem.objects.create(shelf=shelf, section="courses",
                                 slug=self.course.slug, position=0)
        ShelfItem.objects.create(shelf=shelf, section="resources",
                                 slug="protocole-lca", position=1)
        served = self.client.get("/api/promotions/home/").json()["shelves"][0]
        self.assertEqual([i["section"] for i in served["items"]],
                         ["courses", "resources"])

    def test_manual_shelf_skips_unpublished_content(self):
        shelf = Shelf.objects.create(
            placement=Placement.HOME_FEATURED, key="selection", title="Sélection",
            source="manual",
        )
        ShelfItem.objects.create(shelf=shelf, section="resources",
                                 slug="protocole-lca", position=0)
        self.r1.published = False
        self.r1.save()
        served = self.client.get("/api/promotions/home/").json()["shelves"][0]
        self.assertEqual(served["items"], [])

    def test_shelf_filters_narrow_an_automatic_source(self):
        Shelf.objects.create(
            placement=Placement.HOME_CAREER, key="sport", title="Sport",
            section="courses", source="popular", filters={"specialty": ["sport"]},
            limit=4,
        )
        career = self.client.get("/api/promotions/home/").json()["career"][0]
        self.assertEqual([i["slug"] for i in career["items"]], [self.course.slug])

    def test_two_shelves_cannot_share_a_key_in_one_placement(self):
        from django.db.utils import IntegrityError

        Shelf.objects.create(placement=Placement.HOME_FEATURED, key="x", title="A")
        with self.assertRaises(IntegrityError):
            Shelf.objects.create(placement=Placement.HOME_FEATURED, key="x", title="B")


class SponsorshipTests(Fixture):
    def make(self, **over):
        data = {
            "placement": Placement.LIBRARY_TOP,
            "section": "resources",
            "slug": "protocole-lca",
            "partner": self.partner,
            "label": "Sponsorisé",
            "note": "Protocole recommandé",
            "weight": 10,
        }
        data.update(over)
        return Sponsorship.objects.create(**data)

    def test_sponsored_item_is_resolved_and_labelled(self):
        self.make()
        body = self.client.get(
            "/api/promotions/sponsored/?placement=library_top"
        ).json()
        entry = body["items"][0]
        self.assertEqual(entry["label"], "Sponsorisé")
        self.assertEqual(entry["note"], "Protocole recommandé")
        self.assertEqual(entry["item"]["slug"], "protocole-lca")
        self.assertEqual(entry["partner"]["slug"], "sakd")

    def test_label_is_always_present(self):
        # Même vidé, le modèle retombe sur sa valeur par défaut : une carte
        # sponsorisée ne doit jamais passer pour un résultat ordinaire.
        sponsorship = self.make()
        self.assertTrue(sponsorship.label)

    def test_unpublished_content_shows_nothing(self):
        self.make()
        self.r1.published = False
        self.r1.save()
        body = self.client.get(
            "/api/promotions/sponsored/?placement=library_top"
        ).json()
        self.assertEqual(body["items"], [])

    def test_expired_sponsorship_disappears(self):
        self.make(ends_at=timezone.now() - timedelta(minutes=1))
        body = self.client.get(
            "/api/promotions/sponsored/?placement=library_top"
        ).json()
        self.assertEqual(body["items"], [])

    def test_heavier_weight_comes_first(self):
        self.make(slug="protocole-lca", weight=5)
        self.make(slug="protocole-epaule", weight=50)
        body = self.client.get(
            "/api/promotions/sponsored/?placement=library_top"
        ).json()
        self.assertEqual([i["item"]["slug"] for i in body["items"]],
                         ["protocole-epaule", "protocole-lca"])

    def test_serving_counts_an_impression(self):
        sponsorship = self.make()
        self.client.get("/api/promotions/sponsored/?placement=library_top")
        self.client.get("/api/promotions/sponsored/?placement=library_top")
        sponsorship.refresh_from_db()
        self.assertEqual(sponsorship.impressions, 2)

    def test_an_unresolved_sponsorship_counts_no_impression(self):
        sponsorship = self.make()
        self.r1.published = False
        self.r1.save()
        self.client.get("/api/promotions/sponsored/?placement=library_top")
        sponsorship.refresh_from_db()
        self.assertEqual(sponsorship.impressions, 0)

    def test_click_is_recorded(self):
        sponsorship = self.make()
        response = self.client.post(
            f"/api/promotions/sponsored/{sponsorship.id}/click/"
        )
        self.assertEqual(response.status_code, 204)
        sponsorship.refresh_from_db()
        self.assertEqual(sponsorship.clicks, 1)

    def test_click_on_an_unknown_id_is_404(self):
        import uuid

        response = self.client.post(
            f"/api/promotions/sponsored/{uuid.uuid4()}/click/"
        )
        self.assertEqual(response.status_code, 404)

    def test_click_through_rate(self):
        sponsorship = self.make()
        Sponsorship.objects.filter(pk=sponsorship.pk).update(impressions=200, clicks=5)
        sponsorship.refresh_from_db()
        self.assertEqual(sponsorship.click_through_rate, 0.025)
        self.assertEqual(Sponsorship(impressions=0).click_through_rate, 0.0)

    def test_unknown_placement_is_refused(self):
        response = self.client.get("/api/promotions/sponsored/?placement=nimportequoi")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"],
                         "promotions.errors.unknownPlacement")

    def test_a_placement_does_not_leak_into_another(self):
        self.make(placement=Placement.COURSES_TOP, section="courses",
                  slug=self.course.slug)
        body = self.client.get(
            "/api/promotions/sponsored/?placement=library_top"
        ).json()
        self.assertEqual(body["items"], [])


class HomePayloadTests(Fixture):
    def test_home_answers_everything_in_one_request(self):
        Banner.objects.create(placement=Placement.HOME_HERO, title="Bannière")
        Shelf.objects.create(
            placement=Placement.HOME_FEATURED, key="populaires", title="Populaires",
            section="resources", source="popular",
        )
        # Garde-fou anti-N+1 : ce nombre ne doit pas croître avec le nombre
        # de contenus servis. S'il augmente après un changement de
        # sérialiseur, c'est qu'un `prefetch_related` a été contourné.
        with self.assertNumQueries(16):
            body = self.client.get("/api/promotions/home/").json()
        self.assertEqual(len(body["banners"]), 1)
        self.assertEqual(len(body["shelves"]), 1)
        self.assertEqual(len(body["partners"]), 1)
        self.assertEqual(body["stats"]["resources"], 2)

    def test_inactive_partner_is_not_listed(self):
        self.partner.active = False
        self.partner.save()
        self.assertEqual(self.client.get("/api/promotions/home/").json()["partners"], [])
