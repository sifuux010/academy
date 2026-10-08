"""
Sérialiseurs des comptes.

Le front-end manipule un utilisateur « plat » (`PublicUser` dans
`src/model/account.ts`) qui mélange les champs du compte et ceux du profil
métier. L'API conserve cette forme : les profils restent deux tables
distinctes en base, mais sont aplatis à l'entrée comme à la sortie.

Les messages d'erreur reprennent les clés i18n déjà traduites par
l'interface (`auth.errors.*`), afin que le front les affiche sans table de
correspondance.
"""

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from config.enums import ProfileType

from .models import PhysiotherapistProfile, StudentProfile, User, UserSettings

# Champs du profil kinésithérapeute, puis du profil étudiant, tels que le
# front-end les connaît.
PHYSIO_FIELDS = (
    "prof_status", "workplace", "experience_years", "license_number",
    "website", "linkedin", "expertise",
)
STUDENT_FIELDS = ("university", "academic_year", "graduation_year", "interests")


class PublicUserSerializer(serializers.ModelSerializer):
    """Compte tel qu'exposé à l'interface : jamais de secret."""

    full_name = serializers.CharField(read_only=True)

    # Profil kinésithérapeute
    prof_status = serializers.SerializerMethodField()
    workplace = serializers.SerializerMethodField()
    experience_years = serializers.SerializerMethodField()
    license_number = serializers.SerializerMethodField()
    website = serializers.SerializerMethodField()
    linkedin = serializers.SerializerMethodField()
    expertise = serializers.SerializerMethodField()

    # Profil étudiant
    university = serializers.SerializerMethodField()
    academic_year = serializers.SerializerMethodField()
    graduation_year = serializers.SerializerMethodField()
    interests = serializers.SerializerMethodField()

    languages = serializers.SerializerMethodField()
    settings = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "first_name", "last_name", "full_name", "phone",
            "country", "city", "profile_type", "role", "status", "email_verified",
            "locale", "avatar_url", "bio", "premium", "newsletter",
            "created_at", "updated_at", "last_login_at",
            "prof_status", "workplace", "experience_years", "license_number",
            "website", "linkedin", "expertise",
            "university", "academic_year", "graduation_year", "interests",
            "languages", "settings",
        )
        read_only_fields = fields

    # -- profils ------------------------------------------------------

    def _physio(self, obj):
        return getattr(obj, "physiotherapist_profile", None)

    def _student(self, obj):
        return getattr(obj, "student_profile", None)

    def get_prof_status(self, obj):
        p = self._physio(obj)
        return p.prof_status if p else ""

    def get_workplace(self, obj):
        p = self._physio(obj)
        return p.workplace if p else ""

    def get_experience_years(self, obj):
        p = self._physio(obj)
        return p.experience_years if p else None

    def get_license_number(self, obj):
        p = self._physio(obj)
        return p.license_number if p else ""

    def get_website(self, obj):
        p = self._physio(obj)
        return p.website if p else ""

    def get_linkedin(self, obj):
        p = self._physio(obj)
        return p.linkedin if p else ""

    def get_expertise(self, obj):
        p = self._physio(obj)
        return p.expertise if p else []

    def get_university(self, obj):
        s = self._student(obj)
        return s.university if s else ""

    def get_academic_year(self, obj):
        s = self._student(obj)
        return s.academic_year if s else ""

    def get_graduation_year(self, obj):
        s = self._student(obj)
        return s.graduation_year if s else None

    def get_interests(self, obj):
        s = self._student(obj)
        return s.interests if s else []

    def get_languages(self, obj):
        profile = self._physio(obj) or self._student(obj)
        return profile.languages if profile else []

    def get_settings(self, obj):
        settings = getattr(obj, "settings", None)
        if settings is None:
            return None
        return {
            "notif_new_resources": settings.notif_new_resources,
            "notif_new_courses": settings.notif_new_courses,
            "notif_webinars": settings.notif_webinars,
            "notif_newsletter": settings.notif_newsletter,
            "notif_product": settings.notif_product,
            "public_profile": settings.public_profile,
            "show_email": settings.show_email,
            "allow_analytics": settings.allow_analytics,
        }


class RegisterSerializer(serializers.Serializer):
    """Inscription en deux temps : type de profil, puis champs métier."""

    profile_type = serializers.ChoiceField(choices=ProfileType.choices)
    first_name = serializers.CharField(max_length=120)
    last_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    country = serializers.CharField(max_length=80)
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    terms = serializers.BooleanField()
    newsletter = serializers.BooleanField(required=False, default=False)
    locale = serializers.CharField(max_length=2, required=False, default="fr")

    # Profil étudiant
    university = serializers.CharField(required=False, allow_blank=True)
    academic_year = serializers.CharField(required=False, allow_blank=True)
    graduation_year = serializers.IntegerField(required=False, allow_null=True)

    # Profil kinésithérapeute
    prof_status = serializers.CharField(required=False, allow_blank=True)
    workplace = serializers.CharField(required=False, allow_blank=True)
    experience_years = serializers.IntegerField(required=False, allow_null=True)

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("auth.errors.emailTaken")
        return value

    def validate_terms(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("auth.errors.termsRequired")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "auth.errors.passwordMismatch"}
            )
        try:
            validate_password(attrs["password"])
        except DjangoValidationError:
            # Le front affiche sa propre règle (8 caractères, lettre + chiffre).
            raise serializers.ValidationError({"password": "auth.errors.passwordWeak"})
        return attrs

    def create(self, validated):
        profile_type = validated["profile_type"]
        student_extra = {
            "university": validated.pop("university", ""),
            "academic_year": validated.pop("academic_year", ""),
            "graduation_year": validated.pop("graduation_year", None),
        }
        physio_extra = {
            "prof_status": validated.pop("prof_status", ""),
            "workplace": validated.pop("workplace", ""),
            "experience_years": validated.pop("experience_years", None),
        }
        validated.pop("terms", None)
        password = validated.pop("password")

        # Le rôle découle du type de profil : il n'est jamais choisi par le client.
        role = ("STUDENT" if profile_type == ProfileType.STUDENT
                else "PHYSIOTHERAPIST")

        user = User.objects.create_user(password=password, role=role, **validated)
        UserSettings.objects.create(
            user=user, notif_newsletter=user.newsletter
        )
        if profile_type == ProfileType.STUDENT:
            StudentProfile.objects.create(user=user, **student_extra)
        else:
            PhysiotherapistProfile.objects.create(user=user, **physio_extra)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember = serializers.BooleanField(required=False, default=False)


class ProfileUpdateSerializer(serializers.Serializer):
    """Mise à jour du profil — aucun champ sensible (rôle, statut, premium)."""

    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(max_length=120, required=False)
    last_name = serializers.CharField(max_length=120, required=False)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    country = serializers.CharField(max_length=80, required=False, allow_blank=True)
    city = serializers.CharField(max_length=120, required=False, allow_blank=True)
    locale = serializers.CharField(max_length=2, required=False)
    avatar_url = serializers.URLField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    newsletter = serializers.BooleanField(required=False)

    prof_status = serializers.CharField(required=False, allow_blank=True)
    workplace = serializers.CharField(required=False, allow_blank=True)
    experience_years = serializers.IntegerField(required=False, allow_null=True)
    license_number = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    linkedin = serializers.URLField(required=False, allow_blank=True)
    expertise = serializers.ListField(
        child=serializers.CharField(), required=False
    )

    university = serializers.CharField(required=False, allow_blank=True)
    academic_year = serializers.CharField(required=False, allow_blank=True)
    graduation_year = serializers.IntegerField(required=False, allow_null=True)
    interests = serializers.ListField(child=serializers.CharField(), required=False)

    languages = serializers.ListField(child=serializers.CharField(), required=False)

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        qs = User.objects.filter(email=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("auth.errors.emailTaken")
        return value

    def update(self, user: User, validated):
        physio_patch, student_patch, shared_patch = {}, {}, {}
        for key in list(validated):
            if key in PHYSIO_FIELDS:
                physio_patch[key] = validated.pop(key)
            elif key in STUDENT_FIELDS:
                student_patch[key] = validated.pop(key)
            elif key == "languages":
                shared_patch[key] = validated.pop(key)

        for field, value in validated.items():
            setattr(user, field, value)
        user.save()

        if user.profile_type == ProfileType.STUDENT:
            profile, _ = StudentProfile.objects.get_or_create(user=user)
            patch = {**student_patch, **shared_patch}
        else:
            profile, _ = PhysiotherapistProfile.objects.get_or_create(user=user)
            patch = {**physio_patch, **shared_patch}

        if patch:
            for field, value in patch.items():
                setattr(profile, field, value)
            profile.save()
        return user


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = (
            "notif_new_resources", "notif_new_courses", "notif_webinars",
            "notif_newsletter", "notif_product", "public_profile", "show_email",
            "allow_analytics",
        )


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value: str) -> str:
        try:
            validate_password(value, self.context["request"].user)
        except DjangoValidationError:
            raise serializers.ValidationError("auth.errors.passwordWeak")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value: str) -> str:
        try:
            validate_password(value)
        except DjangoValidationError:
            raise serializers.ValidationError("auth.errors.passwordWeak")
        return value


class AdminUserSerializer(PublicUserSerializer):
    """Vue administration : mêmes champs, plus les compteurs d'activité."""

    class Meta(PublicUserSerializer.Meta):
        fields = PublicUserSerializer.Meta.fields
        read_only_fields = fields
