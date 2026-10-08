"""
Briques de modèle réutilisées par toutes les applications.

`StringListField` remplace les colonnes `String[]` du schéma PostgreSQL :
MySQL n'a pas de type tableau, les listes sont donc stockées en JSON
(MySQL 8 valide et indexe le JSON nativement).
"""

import uuid

from django.core.exceptions import ValidationError
from django.db import models


class StringListField(models.JSONField):
    """Liste de chaînes — équivalent MySQL d'une colonne `text[]`."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("default", list)
        kwargs.setdefault("blank", True)
        super().__init__(*args, **kwargs)

    def validate(self, value, model_instance):
        super().validate(value, model_instance)
        if value is None:
            return
        if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
            raise ValidationError("Ce champ attend une liste de chaînes de caractères.")

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        if kwargs.get("default") is list:
            del kwargs["default"]
        if kwargs.get("blank") is True:
            del kwargs["blank"]
        return name, path, args, kwargs


class UUIDModel(models.Model):
    """Clé primaire UUID, comme dans le schéma Prisma."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PublishableModel(models.Model):
    """Contenu éditorial : brouillon par défaut, publication explicite."""

    published = models.BooleanField(default=False, db_index=True)

    class Meta:
        abstract = True
