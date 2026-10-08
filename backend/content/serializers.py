"""
Sérialiseurs de contenu.

L'API rend la **forme que le front-end connaît déjà** (`src/types.ts` :
`type`, `pathologies` en slugs, `format`, `sizeKb`, `downloads`,
`durationMinutes`, `dosage`, `i18n`…), en camelCase. Les pages, les cartes
et les filtres existants la consomment donc sans réécriture de leurs
modèles de données.

Deux règles de sécurité tenues ici :

- `fileUrl` n'est servi que si le visiteur a droit au contenu premium ;
- la bonne réponse d'un quiz (`answer`) n'est **jamais** sérialisée — la
  correction se fait côté serveur.
"""

from __future__ import annotations

from rest_framework import serializers

from .models import (
    Author,
    ClinicalTool,
    Course,
    Exercise,
    Pathology,
    Resource,
    Webinar,
)


def slugs(manager) -> list[str]:
    """
    Slugs d'une relation.

    `manager.all()` et non `values_list()` : seul le premier réutilise le
    cache de `prefetch_related`. Avec `values_list`, chaque carte d'une
    liste relançait une requête — le N+1 classique.
    """
    return sorted(item.slug for item in manager.all())


def i18n_of(instance) -> dict[str, dict[str, str]]:
    """Reconstruit `i18n: { en: { title: … } }` depuis la table Translation."""
    out: dict[str, dict[str, str]] = {}
    for translation in instance.translations.all():
        out.setdefault(translation.locale, {})[translation.field] = translation.value
    return out


class ContentSerializer(serializers.ModelSerializer):
    """Socle : slugs des relations, traductions, et garde premium."""

    pathologies = serializers.SerializerMethodField()
    i18n = serializers.SerializerMethodField()

    def get_pathologies(self, obj) -> list[str]:
        return slugs(obj.pathologies)

    def get_i18n(self, obj) -> dict:
        return i18n_of(obj)

    # -- accès premium -------------------------------------------------

    @property
    def may_read_premium(self) -> bool:
        """Vrai si le visiteur peut recevoir les liens de fichiers premium."""
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return False
        if user.premium:
            return True
        # Un éditeur de contenu doit pouvoir vérifier ce qu'il publie.
        return user.has_role("CONTENT_EDITOR")

    def gated_file_url(self, obj) -> str:
        if obj.access == "premium" and not self.may_read_premium:
            return ""
        return obj.file_url


class AuthorSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ("id", "slug", "firstName", "lastName", "name", "title",
                  "bio", "country", "city", "avatarUrl", "expertise")
        extra_kwargs = {}

    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    avatarUrl = serializers.CharField(source="avatar_url", read_only=True)

    def get_name(self, obj) -> str:
        return f"{obj.first_name} {obj.last_name}".strip()


# ----------------------------------------------------------- ressources

class ResourceListSerializer(ContentSerializer):
    type = serializers.CharField(source="category_id", read_only=True)
    region = serializers.CharField(source="region_id", read_only=True)
    specialty = serializers.CharField(source="specialty_id", read_only=True)
    authorId = serializers.CharField(source="author.slug", read_only=True, default=None)
    authorName = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    format = serializers.CharField(source="file_format", read_only=True)
    sizeKb = serializers.IntegerField(source="file_size_kb", read_only=True)
    downloads = serializers.IntegerField(source="download_count", read_only=True)
    publishedAt = serializers.DateTimeField(source="published_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Resource
        fields = (
            "id", "slug", "type", "title", "subtitle", "description",
            "authorId", "publishedAt", "updatedAt", "pathologies", "region",
            "specialty", "level", "language", "tags", "format", "sizeKb",
            "pages", "access", "views", "downloads", "published", "i18n",
            "authorName",
        )

    def get_tags(self, obj) -> list[str]:
        return slugs(obj.tags)

    def get_authorName(self, obj) -> str:
        return str(obj.author) if obj.author_id else ""


class ResourceDetailSerializer(ResourceListSerializer):
    """Fiche complète : résumé, points clés, références, lien de fichier."""

    keyPoints = serializers.SerializerMethodField()
    references = serializers.SerializerMethodField()
    fileUrl = serializers.SerializerMethodField()
    author = AuthorSerializer(read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta(ResourceListSerializer.Meta):
        fields = ResourceListSerializer.Meta.fields + (
            "abstract", "keyPoints", "references", "fileUrl", "author", "updatedAt",
        )

    def get_keyPoints(self, obj) -> list[dict]:
        return [
            {"id": str(point.id), "icon": point.icon, "title": point.title,
             "text": point.text}
            for point in obj.key_point_set.all()
        ]

    def get_references(self, obj) -> list[dict]:
        return [
            {"id": str(ref.id), "citation": ref.citation, "source": ref.source,
             "url": ref.url}
            for ref in obj.reference_set.all()
        ]

    def get_fileUrl(self, obj) -> str:
        return self.gated_file_url(obj)


# ----------------------------------------------------------- formations

class LessonSerializer(serializers.Serializer):
    """Leçon — la structure du quiz est servie sans ses bonnes réponses."""

    id = serializers.CharField()
    title = serializers.CharField()
    type = serializers.CharField()
    duration = serializers.IntegerField(source="duration_min")
    content = serializers.CharField()
    resourceSlug = serializers.SerializerMethodField()
    toolSlug = serializers.SerializerMethodField()
    quiz = serializers.SerializerMethodField()

    def get_resourceSlug(self, obj) -> str | None:
        return obj.resource.slug if obj.resource_id else None

    def get_toolSlug(self, obj) -> str | None:
        return obj.tool.slug if obj.tool_id else None

    def get_quiz(self, obj):
        quiz = getattr(obj, "quiz", None)
        if quiz is None:
            return None
        return {
            "id": str(quiz.id),
            "passScore": quiz.pass_score,
            "questions": [
                {
                    "id": str(question.id),
                    "q": question.prompt,
                    # `answer` est volontairement absent : la correction est
                    # faite par le serveur (POST /api/quiz/<id>/attempt/).
                    "options": [a.label for a in question.answers.all()],
                }
                for question in quiz.questions.all()
            ],
        }


class CourseModuleSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    lessons = serializers.SerializerMethodField()

    def get_lessons(self, obj):
        return LessonSerializer(obj.lessons.all(), many=True, context=self.context).data


class CourseListSerializer(ContentSerializer):
    region = serializers.CharField(source="region_id", read_only=True)
    specialty = serializers.CharField(source="specialty_id", read_only=True)
    instructorId = serializers.CharField(
        source="instructor.slug", read_only=True, default=None
    )
    instructorName = serializers.SerializerMethodField()
    durationMinutes = serializers.IntegerField(source="duration_min", read_only=True)
    rating = serializers.FloatField(source="rating_avg", read_only=True)
    ratingCount = serializers.IntegerField(source="rating_count", read_only=True)
    enrolledCount = serializers.IntegerField(source="enrolled_count", read_only=True)
    coverUrl = serializers.CharField(source="cover_url", read_only=True)
    publishedAt = serializers.DateTimeField(source="published_at", read_only=True)
    tags = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id", "slug", "title", "subtitle", "description", "instructorId",
            "level", "language", "durationMinutes", "access", "rating",
            "ratingCount", "enrolledCount", "region", "specialty",
            "pathologies", "tags", "certificate", "coverUrl", "publishedAt",
            "published", "stats", "i18n", "instructorName",
        )

    def get_tags(self, obj) -> list[str]:
        return slugs(obj.tags)

    def get_instructorName(self, obj) -> str:
        return str(obj.instructor) if obj.instructor_id else ""

    def get_stats(self, obj) -> dict:
        """Compteurs affichés sur les cartes, sans charger toutes les leçons."""
        modules = list(obj.modules.all())
        lessons = [lesson for module in modules for lesson in module.lessons.all()]
        return {
            "modules": len(modules),
            "lessons": len(lessons),
            "minutes": sum(lesson.duration_min for lesson in lessons),
        }


class CourseDetailSerializer(CourseListSerializer):
    objectives = serializers.ListField(read_only=True)
    prerequisites = serializers.ListField(read_only=True)
    modules = serializers.SerializerMethodField()
    instructor = AuthorSerializer(read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + (
            "objectives", "audience", "prerequisites", "modules", "instructor",
        )

    def get_modules(self, obj):
        return CourseModuleSerializer(
            obj.modules.all(), many=True, context=self.context
        ).data


# ----------------------------------------------------------- webinaires

class WebinarListSerializer(ContentSerializer):
    region = serializers.CharField(source="region_id", read_only=True)
    specialty = serializers.CharField(source="specialty_id", read_only=True)
    speakerId = serializers.CharField(source="speaker.slug", read_only=True, default=None)
    speakerName = serializers.SerializerMethodField()
    startsAt = serializers.DateTimeField(source="starts_at", read_only=True)
    endsAt = serializers.DateTimeField(source="ends_at", read_only=True)
    durationMinutes = serializers.IntegerField(source="duration_min", read_only=True)
    registeredCount = serializers.IntegerField(source="registered_count", read_only=True)
    liveUrl = serializers.SerializerMethodField()
    replayUrl = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Webinar
        fields = (
            "id", "slug", "title", "subtitle", "description", "speakerId",
            "startsAt", "endsAt", "durationMinutes", "status", "liveUrl",
            "replayUrl", "registeredCount", "access", "region", "specialty",
            "pathologies", "tags", "certificate", "published", "i18n",
            "speakerName",
        )

    def get_tags(self, obj) -> list[str]:
        return slugs(obj.tags)

    def get_speakerName(self, obj) -> str:
        return str(obj.speaker) if obj.speaker_id else ""

    def _gated(self, obj, value: str) -> str:
        if obj.access == "premium" and not self.may_read_premium:
            return ""
        return value

    def get_liveUrl(self, obj) -> str:
        return self._gated(obj, obj.live_url)

    def get_replayUrl(self, obj) -> str:
        return self._gated(obj, obj.replay_url)


class WebinarDetailSerializer(WebinarListSerializer):
    agenda = serializers.ListField(read_only=True)
    speaker = AuthorSerializer(read_only=True)

    class Meta(WebinarListSerializer.Meta):
        fields = WebinarListSerializer.Meta.fields + ("agenda", "speaker")


# ------------------------------------------------------ outils cliniques

class ToolListSerializer(ContentSerializer):
    region = serializers.CharField(source="region_id", read_only=True)
    specialty = serializers.CharField(source="specialty_id", read_only=True)
    format = serializers.CharField(source="file_format", read_only=True)
    sizeKb = serializers.IntegerField(source="file_size_kb", read_only=True)
    downloads = serializers.IntegerField(source="download_count", read_only=True)

    class Meta:
        model = ClinicalTool
        fields = (
            "id", "slug", "type", "name", "subtitle", "description",
            "pathologies", "region", "specialty", "format", "sizeKb",
            "downloads", "access", "published", "i18n",
        )


class ToolDetailSerializer(ToolListSerializer):
    """Fiche clinique complète."""

    fileUrl = serializers.SerializerMethodField()

    class Meta(ToolListSerializer.Meta):
        fields = ToolListSerializer.Meta.fields + (
            "purpose", "indications", "contraindications", "equipment",
            "procedure", "scoring", "interpretation", "psychometrics",
            "references", "fileUrl",
        )

    def get_fileUrl(self, obj) -> str:
        return self.gated_file_url(obj)


# -------------------------------------------------------------- exercices

class ExerciseListSerializer(ContentSerializer):
    region = serializers.CharField(source="region_id", read_only=True)
    targetMuscles = serializers.ListField(source="target_muscles", read_only=True)
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = (
            "id", "slug", "name", "region", "objective", "difficulty",
            "targetMuscles", "equipment", "goal", "pathologies", "tags",
            "published", "i18n",
        )

    def get_tags(self, obj) -> list[str]:
        return slugs(obj.tags)


class ExerciseDetailSerializer(ExerciseListSerializer):
    dosage = serializers.SerializerMethodField()
    videoUrl = serializers.CharField(source="video_url", read_only=True)
    imageUrl = serializers.CharField(source="image_url", read_only=True)

    class Meta(ExerciseListSerializer.Meta):
        fields = ExerciseListSerializer.Meta.fields + (
            "steps", "dosage", "progression", "regression", "precautions",
            "references", "videoUrl", "imageUrl",
        )

    def get_dosage(self, obj) -> dict:
        """Les quatre colonnes redeviennent l'objet `dosage` du front-end."""
        return {
            "sets": obj.sets,
            "reps": obj.reps,
            "hold": obj.hold,
            "frequency": obj.frequency,
        }


# ------------------------------------------------------------ pathologies

class PathologyListSerializer(ContentSerializer):
    region = serializers.CharField(source="region_id", read_only=True)
    specialty = serializers.CharField(source="specialty_id", read_only=True)

    class Meta:
        model = Pathology
        fields = (
            "id", "slug", "name", "region", "specialty", "aliases", "summary",
            "published", "i18n",
        )

    def get_pathologies(self, obj):  # une pathologie n'en référence pas d'autres
        return []


class PathologyDetailSerializer(PathologyListSerializer):
    redFlags = serializers.ListField(source="red_flags", read_only=True)
    keyFacts = serializers.ListField(source="key_facts", read_only=True)

    class Meta(PathologyListSerializer.Meta):
        fields = PathologyListSerializer.Meta.fields + (
            "epidemiology", "presentation", "redFlags", "management",
            "keyFacts", "evidence",
        )


SERIALIZERS: dict[str, tuple[type, type]] = {
    "resources": (ResourceListSerializer, ResourceDetailSerializer),
    "courses": (CourseListSerializer, CourseDetailSerializer),
    "webinars": (WebinarListSerializer, WebinarDetailSerializer),
    "tools": (ToolListSerializer, ToolDetailSerializer),
    "exercises": (ExerciseListSerializer, ExerciseDetailSerializer),
    "pathologies": (PathologyListSerializer, PathologyDetailSerializer),
}
