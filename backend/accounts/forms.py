"""Formulaires d'administration — l'identifiant est l'e-mail, pas un `username`."""

from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm

from .models import User


class UserCreationForm(BaseUserCreationForm):
    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "profile_type", "role")


class UserChangeForm(BaseUserChangeForm):
    class Meta:
        model = User
        fields = "__all__"
