"""
Énumérations partagées — reprises telles quelles du modèle front-end
(`src/model/*.ts`) et du schéma Prisma, valeurs identiques pour que les
réponses de l'API soient consommées sans traduction de codes.
"""

from django.db import models


class Role(models.TextChoices):
    STUDENT = "STUDENT", "Étudiant"
    PHYSIOTHERAPIST = "PHYSIOTHERAPIST", "Kinésithérapeute"
    INSTRUCTOR = "INSTRUCTOR", "Formateur"
    CONTENT_EDITOR = "CONTENT_EDITOR", "Éditeur de contenu"
    ADMIN = "ADMIN", "Administration"
    SUPER_ADMIN = "SUPER_ADMIN", "Administration principale"


class ProfileType(models.TextChoices):
    STUDENT = "STUDENT", "Étudiant"
    PHYSIOTHERAPIST = "PHYSIOTHERAPIST", "Kinésithérapeute"


class UserStatus(models.TextChoices):
    ACTIVE = "active", "Actif"
    SUSPENDED = "suspended", "Suspendu"
    PENDING = "pending", "En attente"


class Access(models.TextChoices):
    FREE = "free", "Libre"
    PREMIUM = "premium", "Premium"


class Level(models.TextChoices):
    ETUDIANT = "etudiant", "Étudiant"
    DEBUTANT = "debutant", "Débutant"
    INTERMEDIAIRE = "intermediaire", "Intermédiaire"
    AVANCE = "avance", "Avancé"
    EXPERT = "expert", "Expert"


class Difficulty(models.TextChoices):
    FACILE = "facile", "Facile"
    MODERE = "modere", "Modéré"
    DIFFICILE = "difficile", "Difficile"


class LessonType(models.TextChoices):
    VIDEO = "video", "Vidéo"
    PDF = "pdf", "PDF"
    TEXT = "text", "Lecture"
    QUIZ = "quiz", "Quiz"


class ToolType(models.TextChoices):
    TEST = "test", "Test ou mesure"
    QUESTIONNAIRE = "questionnaire", "Questionnaire"
    SCORE = "score", "Score"
    BILAN = "bilan", "Bilan"


class Locale(models.TextChoices):
    FR = "fr", "Français"
    EN = "en", "English"
    AR = "ar", "العربية"


class PlanInterval(models.TextChoices):
    FREE = "free", "Gratuit"
    MONTH = "month", "Mensuel"
    YEAR = "year", "Annuel"
    QUOTE = "quote", "Sur devis"


class PlanAudience(models.TextChoices):
    ALL = "all", "Tous"
    STUDENT = "STUDENT", "Étudiants"
    PHYSIOTHERAPIST = "PHYSIOTHERAPIST", "Kinésithérapeutes"


class SubscriptionStatus(models.TextChoices):
    INACTIVE = "inactive", "Inactif"
    PENDING = "pending", "En attente"
    ACTIVE = "active", "Actif"
    REJECTED = "rejected", "Refusé"
    CANCELLED = "cancelled", "Résilié"
    EXPIRED = "expired", "Expiré"
