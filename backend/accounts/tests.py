"""
Tests du socle d'authentification.

Ils vérifient le contrat que le front-end va consommer : forme aplatie du
compte, rôles hiérarchisés, session par cookie, protection CSRF, et les
refus attendus (compte suspendu, mauvais mot de passe, e-mail déjà pris).
"""

from django.test import TestCase
from django.urls import reverse

from config.enums import ProfileType, Role, UserStatus

from .models import PhysiotherapistProfile, StudentProfile, User, UserSettings


class RoleHierarchyTests(TestCase):
    def test_has_role_is_inclusive_upwards(self):
        admin = User(role=Role.ADMIN)
        self.assertTrue(admin.has_role(Role.STUDENT))
        self.assertTrue(admin.has_role(Role.CONTENT_EDITOR))
        self.assertTrue(admin.has_role(Role.ADMIN))
        self.assertFalse(admin.has_role(Role.SUPER_ADMIN))

    def test_unknown_role_never_grants(self):
        self.assertFalse(User(role="NOPE").has_role(Role.STUDENT))

    def test_suspended_account_is_not_active(self):
        self.assertFalse(User(status=UserStatus.SUSPENDED).is_active)
        self.assertTrue(User(status=UserStatus.ACTIVE).is_active)


class UserManagerTests(TestCase):
    def test_create_user_lowercases_email_and_hashes_password(self):
        user = User.objects.create_user(
            email="Demo@Kinedokdz.COM", password="Demo2024!",
            first_name="Demo", last_name="Compte",
        )
        self.assertEqual(user.email, "demo@kinedokdz.com")
        self.assertNotEqual(user.password, "Demo2024!")
        self.assertTrue(user.check_password("Demo2024!"))
        self.assertTrue(user.password.startswith("argon2"))

    def test_create_superuser_is_super_admin_and_staff(self):
        user = User.objects.create_superuser(
            email="master@kinedokdz.com", password="KinedokMaster2026!"
        )
        self.assertEqual(user.role, Role.SUPER_ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.has_role(Role.SUPER_ADMIN))

    def test_email_is_required(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="x")


class RegistrationTests(TestCase):
    url = "/api/auth/register/"

    def payload(self, **over):
        base = {
            "profile_type": ProfileType.PHYSIOTHERAPIST,
            "first_name": "Amel",
            "last_name": "Benali",
            "email": "amel@example.com",
            "password": "Kinedok2026!",
            "password_confirm": "Kinedok2026!",
            "country": "DZ",
            "terms": True,
            "workplace": "CHU Alger",
            "experience_years": 6,
        }
        base.update(over)
        return base

    def test_registration_creates_profile_settings_and_session(self):
        response = self.client.post(self.url, self.payload(), "application/json")
        self.assertEqual(response.status_code, 201, response.content)
        body = response.json()

        self.assertEqual(body["email"], "amel@example.com")
        self.assertEqual(body["role"], Role.PHYSIOTHERAPIST)
        # Forme aplatie attendue par le front-end.
        self.assertEqual(body["workplace"], "CHU Alger")
        self.assertEqual(body["experience_years"], 6)
        self.assertNotIn("password", body)

        user = User.objects.get(email="amel@example.com")
        self.assertTrue(PhysiotherapistProfile.objects.filter(user=user).exists())
        self.assertTrue(UserSettings.objects.filter(user=user).exists())
        # La session est ouverte dans la foulée.
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

    def test_student_registration_creates_student_profile(self):
        response = self.client.post(
            self.url,
            self.payload(
                profile_type=ProfileType.STUDENT,
                email="etud@example.com",
                university="Université d'Alger",
                academic_year="3",
            ),
            "application/json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()["role"], Role.STUDENT)
        self.assertEqual(response.json()["university"], "Université d'Alger")
        user = User.objects.get(email="etud@example.com")
        self.assertTrue(StudentProfile.objects.filter(user=user).exists())

    def test_role_cannot_be_chosen_by_the_client(self):
        response = self.client.post(
            self.url, self.payload(role=Role.SUPER_ADMIN), "application/json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["role"], Role.PHYSIOTHERAPIST)

    def test_duplicate_email_is_refused_with_i18n_key(self):
        User.objects.create_user(
            email="amel@example.com", password="Kinedok2026!",
            first_name="A", last_name="B",
        )
        response = self.client.post(self.url, self.payload(), "application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("auth.errors.emailTaken", str(response.json()["email"]))

    def test_password_mismatch_is_refused(self):
        response = self.client.post(
            self.url, self.payload(password_confirm="Autre2026!"), "application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("auth.errors.passwordMismatch", str(response.json()))

    def test_weak_password_is_refused(self):
        response = self.client.post(
            self.url,
            self.payload(password="12345678", password_confirm="12345678"),
            "application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("auth.errors.passwordWeak", str(response.json()))

    def test_terms_must_be_accepted(self):
        response = self.client.post(self.url, self.payload(terms=False), "application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("auth.errors.termsRequired", str(response.json()))


class LoginTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="demo@kinedokdz.com", password="Demo2024!",
            first_name="Demo", last_name="Compte",
        )

    def test_login_opens_session_and_records_last_login(self):
        self.assertIsNone(self.user.last_login_at)
        response = self.client.post(
            "/api/auth/login/",
            {"email": "Demo@Kinedokdz.com", "password": "Demo2024!", "remember": True},
            "application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["email"], "demo@kinedokdz.com")
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.last_login_at)
        self.assertIn("ka_session", response.cookies)

    def test_without_remember_the_session_ends_with_the_browser(self):
        self.client.post(
            "/api/auth/login/",
            {"email": "demo@kinedokdz.com", "password": "Demo2024!"},
            "application/json",
        )
        self.assertTrue(self.client.session.get_expire_at_browser_close())

    def test_bad_password_returns_401_with_i18n_key(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "demo@kinedokdz.com", "password": "faux"},
            "application/json",
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "auth.errors.badCredentials")

    def test_suspended_account_is_told_why(self):
        self.user.status = UserStatus.SUSPENDED
        self.user.save()
        response = self.client.post(
            "/api/auth/login/",
            {"email": "demo@kinedokdz.com", "password": "Demo2024!"},
            "application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"], "auth.errors.accountSuspended")

    def test_unknown_email_does_not_leak_existence(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": "inconnu@example.com", "password": "Demo2024!"},
            "application/json",
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "auth.errors.badCredentials")

    def test_logout_closes_the_session(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 403)


class MeTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="demo@kinedokdz.com", password="Demo2024!",
            first_name="Demo", last_name="Compte",
            profile_type=ProfileType.PHYSIOTHERAPIST,
        )
        UserSettings.objects.create(user=self.user)
        self.client.force_login(self.user)

    def test_me_requires_authentication(self):
        self.client.logout()
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 403)

    def test_me_exposes_no_secret(self):
        body = self.client.get("/api/auth/me/").json()
        for leak in ("password", "password_hash", "salt", "is_superuser"):
            self.assertNotIn(leak, body)

    def test_patch_updates_account_and_profile_fields(self):
        response = self.client.patch(
            "/api/auth/me/",
            {"city": "Oran", "workplace": "Cabinet libéral",
             "expertise": ["sport", "rachis"], "languages": ["fr", "ar"]},
            "application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertEqual(body["city"], "Oran")
        self.assertEqual(body["workplace"], "Cabinet libéral")
        self.assertEqual(body["expertise"], ["sport", "rachis"])
        self.assertEqual(body["languages"], ["fr", "ar"])

    def test_patch_cannot_escalate_role_or_premium(self):
        self.client.patch(
            "/api/auth/me/",
            {"role": Role.SUPER_ADMIN, "premium": True, "status": UserStatus.ACTIVE},
            "application/json",
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, Role.PHYSIOTHERAPIST)
        self.assertFalse(self.user.premium)

    def test_delete_removes_the_account(self):
        self.assertEqual(self.client.delete("/api/auth/me/").status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())

    def test_settings_patch_keeps_newsletter_aligned(self):
        response = self.client.patch(
            "/api/auth/me/settings/", {"notif_newsletter": True}, "application/json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.newsletter)


class PasswordTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="demo@kinedokdz.com", password="Demo2024!",
            first_name="Demo", last_name="Compte",
        )

    def test_change_password_requires_the_current_one(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/auth/password/change/",
            {"current_password": "faux", "new_password": "Nouveau2026!"},
            "application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Demo2024!"))

    def test_change_password_keeps_the_session_open(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/auth/password/change/",
            {"current_password": "Demo2024!", "new_password": "Nouveau2026!"},
            "application/json",
        )
        self.assertEqual(response.status_code, 204, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Nouveau2026!"))
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

    def test_reset_request_answers_the_same_for_unknown_email(self):
        known = self.client.post(
            "/api/auth/password/reset/", {"email": "demo@kinedokdz.com"},
            "application/json",
        )
        unknown = self.client.post(
            "/api/auth/password/reset/", {"email": "personne@example.com"},
            "application/json",
        )
        self.assertEqual(known.status_code, 202)
        self.assertEqual(unknown.status_code, 202)
        self.assertEqual(known.content, unknown.content)

    def test_reset_confirm_sets_the_new_password(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        response = self.client.post(
            "/api/auth/password/reset/confirm/",
            {
                "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
                "token": default_token_generator.make_token(self.user),
                "new_password": "Nouveau2026!",
            },
            "application/json",
        )
        self.assertEqual(response.status_code, 204, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Nouveau2026!"))

    def test_reset_confirm_refuses_a_bad_token(self):
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        response = self.client.post(
            "/api/auth/password/reset/confirm/",
            {
                "uid": urlsafe_base64_encode(force_bytes(self.user.pk)),
                "token": "invalide",
                "new_password": "Nouveau2026!",
            },
            "application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "auth.errors.resetInvalid")


class CsrfTests(TestCase):
    def test_csrf_endpoint_sets_the_cookie(self):
        response = self.client.get("/api/auth/csrf/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("ka_csrftoken", response.cookies)

    def test_write_without_csrf_token_is_rejected(self):
        # `enforce_csrf_checks` reproduit le navigateur : sans en-tête
        # X-CSRFToken, une écriture de session doit échouer.
        from django.test import Client

        strict = Client(enforce_csrf_checks=True)
        user = User.objects.create_user(
            email="demo@kinedokdz.com", password="Demo2024!",
            first_name="Demo", last_name="Compte",
        )
        strict.force_login(user)
        response = strict.patch("/api/auth/me/", {"city": "Oran"}, "application/json")
        self.assertEqual(response.status_code, 403)

    def test_write_with_csrf_token_succeeds(self):
        from django.test import Client

        strict = Client(enforce_csrf_checks=True)
        user = User.objects.create_user(
            email="demo@kinedokdz.com", password="Demo2024!",
            first_name="Demo", last_name="Compte",
        )
        strict.force_login(user)
        token = strict.get("/api/auth/csrf/").json()["csrf_token"]
        response = strict.patch(
            "/api/auth/me/", {"city": "Oran"}, "application/json",
            headers={"x-csrftoken": token},
        )
        self.assertEqual(response.status_code, 200, response.content)


class HealthTests(TestCase):
    def test_health_is_public(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
