"""
Points d'entrée d'authentification — session Django, cookie HttpOnly.

Le front-end appelle d'abord `GET /api/auth/csrf/` pour obtenir le cookie
CSRF, puis envoie son jeton dans l'en-tête `X-CSRFToken` sur chaque requête
d'écriture. Aucun jeton n'est stocké en JavaScript.
"""

import base64
import binascii
import re
import uuid

from django.conf import settings as django_settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.middleware.csrf import get_token
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.enums import UserStatus

from .models import User, UserSettings
from .serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileUpdateSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    SettingsSerializer,
)

# Durée de session quand l'utilisateur n'a pas coché « se souvenir de moi » :
# la session expire à la fermeture du navigateur.
BROWSER_SESSION = 0


def user_payload(user: User) -> dict:
    return PublicUserSerializer(user).data


class CsrfView(APIView):
    """Pose le cookie CSRF. À appeler une fois au démarrage de l'application."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"csrf_token": get_token(request)})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # L'inscription ouvre directement une session, comme en front.
        login(request, user)
        user.touch_login()
        return Response(user_payload(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if user is None:
            # Un compte suspendu échoue ici aussi (`is_active` est faux) : on
            # distingue les deux cas pour que l'interface explique pourquoi.
            existing = User.objects.filter(email=email).first()
            if existing and existing.status == UserStatus.SUSPENDED:
                return Response(
                    {"detail": "auth.errors.accountSuspended"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response(
                {"detail": "auth.errors.badCredentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)
        if not serializer.validated_data.get("remember"):
            request.session.set_expiry(BROWSER_SESSION)
        user.touch_login()
        return Response(user_payload(user))


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """Compte courant : lecture, mise à jour, suppression."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(user_payload(request.user))

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            instance=request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.update(request.user, serializer.validated_data)
        return Response(user_payload(user))

    def delete(self, request):
        user = request.user
        logout(request)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


AVATAR_MIME_EXT = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
}
AVATAR_MAX_BYTES = 3 * 1024 * 1024
AVATAR_DATA_URL = re.compile(r"^data:(image/[\w.+-]+);base64,(.+)$", re.DOTALL)


class AvatarView(APIView):
    """Téléversement de la photo de profil (data URL base64 → fichier MEDIA)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        match = AVATAR_DATA_URL.match(str(request.data.get("data_url", "")))
        if not match:
            return Response(
                {"detail": "profile.avatar.invalid"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ext = AVATAR_MIME_EXT.get(match.group(1))
        if ext is None:
            return Response(
                {"detail": "profile.avatar.invalid"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            raw = base64.b64decode(match.group(2), validate=True)
        except (binascii.Error, ValueError):
            return Response(
                {"detail": "profile.avatar.invalid"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not raw or len(raw) > AVATAR_MAX_BYTES:
            return Response(
                {"detail": "profile.avatar.tooLarge"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = f"avatars/{request.user.id}-{uuid.uuid4().hex[:8]}.{ext}"
        saved = default_storage.save(name, ContentFile(raw))
        url = django_settings.MEDIA_URL + saved
        if not url.startswith("/"):
            url = "/" + url

        user = request.user
        user.avatar_url = url
        user.save(update_fields=["avatar_url", "updated_at"])
        return Response(user_payload(user))


class SettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings, _ = UserSettings.objects.get_or_create(user=request.user)
        return Response(SettingsSerializer(settings).data)

    def patch(self, request):
        settings, _ = UserSettings.objects.get_or_create(user=request.user)
        serializer = SettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # `newsletter` existe aussi sur le compte : les deux restent alignés.
        if "notif_newsletter" in serializer.validated_data:
            request.user.newsletter = serializer.validated_data["notif_newsletter"]
            request.user.save(update_fields=["newsletter", "updated_at"])
        return Response(serializer.data)


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            return Response(
                {"current_password": "auth.errors.badCredentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        # Changer de mot de passe ne doit pas déconnecter l'onglet courant.
        login(request, user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetRequestView(APIView):
    """
    Demande de réinitialisation.

    La réponse est identique que l'adresse existe ou non : elle ne révèle
    pas qui possède un compte.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        user = User.objects.filter(email=email).first()
        if user is not None:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            self.send_reset_email(user, uid, token)
        return Response(status=status.HTTP_202_ACCEPTED)

    def send_reset_email(self, user: User, uid: str, token: str) -> None:
        from django.conf import settings as django_settings
        from django.core.mail import send_mail

        base = django_settings.CSRF_TRUSTED_ORIGINS[0] if django_settings.CSRF_TRUSTED_ORIGINS else ""
        link = f"{base}/{user.locale}/mot-de-passe/{uid}/{token}"
        send_mail(
            subject="KINEDOK ACADÉMIE — réinitialisation du mot de passe",
            message=(
                f"Bonjour {user.first_name},\n\n"
                f"Pour choisir un nouveau mot de passe, ouvrez ce lien :\n{link}\n\n"
                "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."
            ),
            from_email=None,
            recipient_list=[user.email],
            fail_silently=True,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            uid = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {"detail": "auth.errors.resetInvalid"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not default_token_generator.check_token(user, data["token"]):
            return Response(
                {"detail": "auth.errors.resetInvalid"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(data["new_password"])
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
