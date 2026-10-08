"""
Comptes — utilisateur à connexion par e-mail, profils métier et préférences.

Les six rôles du front-end sont hiérarchisés : chaque rôle contient les
droits du précédent. Les contrôles d'accès de l'API s'appuient sur
`has_role()` plutôt que sur une comparaison directe.
"""

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone

from config.enums import Locale, ProfileType, Role, UserStatus
from config.models import StringListField, UUIDModel

# Du moins au plus étendu. `has_role(X)` est vrai dès que le rôle de
# l'utilisateur est au moins aussi élevé que X.
ROLE_ORDER: list[str] = [
    Role.STUDENT,
    Role.PHYSIOTHERAPIST,
    Role.INSTRUCTOR,
    Role.CONTENT_EDITOR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
]


class UserManager(BaseUserManager):
    """Gestionnaire sans `username` : l'e-mail est l'identifiant."""

    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra):
        if not email:
            raise ValueError("Un compte exige une adresse e-mail.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.full_clean(exclude=["password"], validate_unique=False)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra):
        extra.setdefault("profile_type", ProfileType.PHYSIOTHERAPIST)
        extra.setdefault("role", Role.PHYSIOTHERAPIST)
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email: str, password: str | None = None, **extra):
        extra.setdefault("profile_type", ProfileType.PHYSIOTHERAPIST)
        extra.setdefault("first_name", "Administration")
        extra.setdefault("last_name", "KINEDOK")
        extra.update(
            role=Role.SUPER_ADMIN,
            status=UserStatus.ACTIVE,
            email_verified=True,
            is_staff=True,
            is_superuser=True,
        )
        return self._create_user(email, password, **extra)


class User(UUIDModel, AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, max_length=254)
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=40, blank=True)
    country = models.CharField(max_length=80, blank=True, db_index=True)
    city = models.CharField(max_length=120, blank=True)

    profile_type = models.CharField(max_length=20, choices=ProfileType.choices)
    role = models.CharField(
        max_length=20, choices=Role.choices, default=Role.PHYSIOTHERAPIST
    )
    status = models.CharField(
        max_length=12, choices=UserStatus.choices, default=UserStatus.ACTIVE
    )

    email_verified = models.BooleanField(default=False)
    locale = models.CharField(max_length=2, choices=Locale.choices, default=Locale.FR)
    avatar_url = models.URLField(blank=True, max_length=500)
    bio = models.TextField(blank=True)
    premium = models.BooleanField(default=False)
    newsletter = models.BooleanField(default=False)

    # Requis par l'administration Django ; `role` reste la source de vérité
    # applicative.
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = "membre"
        verbose_name_plural = "membres"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["role", "status"], name="user_role_status_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.lower()
        super().save(*args, **kwargs)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def get_full_name(self) -> str:
        return self.full_name

    def get_short_name(self) -> str:
        return self.first_name

    def has_role(self, minimum: str) -> bool:
        """Vrai si le rôle du compte atteint au moins `minimum`."""
        try:
            return ROLE_ORDER.index(self.role) >= ROLE_ORDER.index(minimum)
        except ValueError:
            return False

    @property
    def is_active(self) -> bool:
        """Un compte suspendu ou en attente ne peut pas ouvrir de session."""
        return self.status == UserStatus.ACTIVE

    def touch_login(self) -> None:
        self.last_login_at = timezone.now()
        self.save(update_fields=["last_login_at", "updated_at"])


class PhysiotherapistProfile(UUIDModel):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="physiotherapist_profile"
    )
    prof_status = models.CharField(max_length=80, blank=True)
    workplace = models.CharField(max_length=200, blank=True)
    experience_years = models.PositiveSmallIntegerField(null=True, blank=True)
    license_number = models.CharField(max_length=80, blank=True)
    website = models.URLField(blank=True, max_length=300)
    linkedin = models.URLField(blank=True, max_length=300)
    expertise = StringListField()
    languages = StringListField()

    class Meta:
        verbose_name = "profil kinésithérapeute"
        verbose_name_plural = "profils kinésithérapeute"

    def __str__(self) -> str:
        return f"Profil kiné — {self.user.email}"


class StudentProfile(UUIDModel):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    university = models.CharField(max_length=200, blank=True)
    academic_year = models.CharField(max_length=40, blank=True)
    graduation_year = models.PositiveSmallIntegerField(null=True, blank=True)
    interests = StringListField()
    languages = StringListField()

    class Meta:
        verbose_name = "profil étudiant"
        verbose_name_plural = "profils étudiant"

    def __str__(self) -> str:
        return f"Profil étudiant — {self.user.email}"


class UserSettings(UUIDModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="settings")
    notif_new_resources = models.BooleanField(default=True)
    notif_new_courses = models.BooleanField(default=True)
    notif_webinars = models.BooleanField(default=True)
    notif_newsletter = models.BooleanField(default=False)
    notif_product = models.BooleanField(default=True)
    public_profile = models.BooleanField(default=False)
    show_email = models.BooleanField(default=False)
    allow_analytics = models.BooleanField(default=True)

    class Meta:
        verbose_name = "préférences du membre"
        verbose_name_plural = "préférences des membres"

    def __str__(self) -> str:
        return f"Préférences — {self.user.email}"
