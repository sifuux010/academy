"""
API d'activité des membres — favoris, téléchargements, consultations,
inscriptions, progression, quiz, webinaires, certificats, recherches.

Le front-end garde un état unique (`UserState`) lu de façon synchrone pendant
le rendu. `GET /api/activity/state/` renvoie cet état complet au démarrage ;
chaque mutation a son point d'entrée dédié et renvoie de quoi mettre à jour
l'état en mémoire. Le certificat est délivré **côté serveur** dès qu'une
formation est terminée à 100 % : la référence est autoritaire et vérifiable.
"""

from __future__ import annotations

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import UserSettings
from content.models import (
    ClinicalTool,
    Course,
    Exercise,
    Lesson,
    Quiz,
    Resource,
    Webinar,
)

from .models import (
    Certificate,
    Download,
    Enrollment,
    Favorite,
    LessonProgress,
    QuizAttempt,
    ResourceView,
    SearchHistory,
    WebinarRegistration,
)

# collection du front  ->  (modèle, nom du champ FK sur Favorite/Download)
FAVORITE_TARGETS = (
    ("resources", "resource", Resource),
    ("courses", "course", Course),
    ("webinars", "webinar", Webinar),
    ("tools", "tool", ClinicalTool),
    ("exercises", "exercise", Exercise),
)


def iso(value) -> str:
    return value.isoformat() if value else ""


# --------------------------------------------------------- état complet


def state_payload(user) -> dict:
    favorites = []
    for fav in user.favorites.all():
        for collection, field, _model in FAVORITE_TARGETS:
            target = getattr(fav, f"{field}_id")
            if target:
                favorites.append(
                    {"collection": collection, "id": str(target), "at": iso(fav.created_at)}
                )
                break

    downloads = []
    for dl in user.downloads.all():
        if dl.resource_id:
            downloads.append({"collection": "resources", "id": str(dl.resource_id), "at": iso(dl.created_at)})
        elif dl.tool_id:
            downloads.append({"collection": "tools", "id": str(dl.tool_id), "at": iso(dl.created_at)})

    viewed = [
        {"collection": "resources", "id": str(v.resource_id), "at": iso(v.created_at)}
        for v in user.resource_views.all()[:60]
    ]

    enrollments = {
        str(e.course_id): {"at": iso(e.created_at)} for e in user.enrollments.all()
    }

    progress: dict[str, dict[str, str]] = {}
    for p in user.lesson_progress.select_related("lesson__module").all():
        if p.completed_at is None:
            continue
        course_id = str(p.lesson.module.course_id)
        progress.setdefault(course_id, {})[str(p.lesson_id)] = iso(p.completed_at)

    quiz_scores: dict[str, dict] = {}
    for a in user.quiz_attempts.select_related("quiz__lesson__module").order_by("created_at"):
        lesson = a.quiz.lesson
        quiz_scores[str(lesson.id)] = {
            "courseId": str(lesson.module.course_id),
            "score": a.score,
            "total": a.total,
            "at": iso(a.created_at),
        }

    webinar_regs = [
        {"id": str(r.webinar_id), "at": iso(r.created_at)} for r in user.registrations.all()
    ]

    certificates = [
        {"courseId": str(c.course_id), "ref": c.reference, "at": iso(c.issued_at)}
        for c in user.certificates.all()
    ]

    searches = list(user.searches.values_list("query", flat=True)[:8])

    settings = UserSettings.objects.get_or_create(user=user)[0]

    return {
        "favorites": favorites,
        "downloads": downloads,
        "viewed": viewed,
        "enrollments": enrollments,
        "progress": progress,
        "quizScores": quiz_scores,
        "webinarRegistrations": webinar_regs,
        "certificates": certificates,
        "searchHistory": searches,
        "settings": {
            "notifications": {
                "newResources": settings.notif_new_resources,
                "newCourses": settings.notif_new_courses,
                "webinarReminders": settings.notif_webinars,
                "newsletter": settings.notif_newsletter,
                "productUpdates": settings.notif_product,
            },
            "privacy": {
                "publicProfile": settings.public_profile,
                "showEmail": settings.show_email,
                "analytics": settings.allow_analytics,
            },
        },
    }


class StateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(state_payload(request.user))


# ------------------------------------------------------------- favoris


class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        collection = request.data.get("collection")
        item_id = request.data.get("id")
        match = next((t for t in FAVORITE_TARGETS if t[0] == collection), None)
        if match is None or not item_id:
            return Response({"detail": "content.errors.unknownSection"}, status=400)
        _collection, field, model = match
        if not model.objects.filter(pk=item_id).exists():
            return Response({"detail": "common.toast.genericError"}, status=404)

        existing = Favorite.objects.filter(user=request.user, **{field: item_id}).first()
        if existing:
            existing.delete()
            return Response({"added": False})
        Favorite.objects.create(user=request.user, **{field: item_id})
        return Response({"added": True})


# -------------------------------------------------------- téléchargements


class DownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        collection = request.data.get("collection")
        item_id = request.data.get("id")
        if collection == "resources" and Resource.objects.filter(pk=item_id).exists():
            Download.objects.create(user=request.user, resource_id=item_id)
        elif collection == "tools" and ClinicalTool.objects.filter(pk=item_id).exists():
            Download.objects.create(user=request.user, tool_id=item_id)
        else:
            return Response({"detail": "common.toast.genericError"}, status=400)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------- consultations


class ViewRecordView(APIView):
    permission_classes = [AllowAny]  # une consultation anonyme reste comptée

    def post(self, request):
        item_id = request.data.get("id")
        if not Resource.objects.filter(pk=item_id).exists():
            return Response(status=status.HTTP_204_NO_CONTENT)
        ResourceView.objects.create(
            resource_id=item_id,
            user=request.user if request.user.is_authenticated else None,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# ------------------------------------------------------------ formations


def issue_certificate_if_complete(user, course) -> tuple[Certificate | None, bool]:
    """Délivre le certificat si la formation est terminée à 100 %."""
    if not course.certificate:
        return None, False
    total = Lesson.objects.filter(module__course=course).count()
    if total == 0:
        return None, False
    done = LessonProgress.objects.filter(
        user=user, lesson__module__course=course, completed_at__isnull=False
    ).count()
    if done < total:
        return None, False

    existing = Certificate.objects.filter(user=user, course=course).first()
    if existing:
        return existing, False

    year = timezone.now().year
    base = f"KA-{year}-{course.slug[:12].upper()}-{str(user.id)[:4].upper()}"
    reference = base
    suffix = 1
    while Certificate.objects.filter(reference=reference).exists():
        suffix += 1
        reference = f"{base}-{suffix}"
    certificate = Certificate.objects.create(user=user, course=course, reference=reference)
    Enrollment.objects.filter(user=user, course=course, completed_at__isnull=True).update(
        completed_at=timezone.now()
    )
    return certificate, True


def certificate_payload(certificate: Certificate | None) -> dict | None:
    if certificate is None:
        return None
    return {
        "courseId": str(certificate.course_id),
        "ref": certificate.reference,
        "at": iso(certificate.issued_at),
    }


class EnrollView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        course = get_object_or_404(Course, pk=request.data.get("courseId"))
        _, created = Enrollment.objects.get_or_create(user=request.user, course=course)
        return Response({"enrolled": True, "already": not created})


class LessonToggleView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        course = get_object_or_404(Course, pk=request.data.get("courseId"))
        lesson = get_object_or_404(
            Lesson, pk=request.data.get("lessonId"), module__course=course
        )
        # L'ouverture d'une leçon vaut inscription (comme en front).
        Enrollment.objects.get_or_create(user=request.user, course=course)

        row = LessonProgress.objects.filter(user=request.user, lesson=lesson).first()
        if row and row.completed_at is not None:
            row.delete()
            done = False
        else:
            LessonProgress.objects.update_or_create(
                user=request.user, lesson=lesson,
                defaults={"completed_at": timezone.now()},
            )
            done = True

        certificate, newly = issue_certificate_if_complete(request.user, course)
        return Response(
            {
                "done": done,
                "certificate": certificate_payload(certificate),
                "newlyIssued": newly,
            }
        )


class QuizAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lesson_id = request.data.get("lessonId")
        quiz = get_object_or_404(Quiz, lesson_id=lesson_id)
        try:
            score = int(request.data.get("score"))
            total = int(request.data.get("total"))
        except (TypeError, ValueError):
            return Response({"detail": "common.toast.genericError"}, status=400)
        QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            score=score,
            total=total,
            passed=score >= quiz.pass_score,
        )
        return Response({"saved": True})


# ------------------------------------------------------------ webinaires


class WebinarToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        webinar = get_object_or_404(Webinar, pk=request.data.get("webinarId"))
        existing = WebinarRegistration.objects.filter(
            user=request.user, webinar=webinar
        ).first()
        if existing:
            existing.delete()
            return Response({"registered": False})
        WebinarRegistration.objects.create(user=request.user, webinar=webinar)
        return Response({"registered": True})


# -------------------------------------------------------------- recherche


class SearchRecordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = str(request.data.get("query", "")).strip()[:300]
        if len(query) < 2:
            return Response(status=status.HTTP_204_NO_CONTENT)
        try:
            results = int(request.data.get("results", 0))
        except (TypeError, ValueError):
            results = 0
        SearchHistory.objects.create(user=request.user, query=query, results=results)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ------------------------------------------------------------ certificats


class CertificateListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            [certificate_payload(c) for c in request.user.certificates.all()]
        )


class CertificateVerifyView(APIView):
    """Vérification publique d'un certificat par sa référence."""

    permission_classes = [AllowAny]

    def get(self, request, reference: str):
        certificate = (
            Certificate.objects.select_related("user", "course")
            .filter(reference=reference)
            .first()
        )
        if certificate is None:
            return Response({"valid": False}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "valid": True,
                "reference": certificate.reference,
                "issuedAt": iso(certificate.issued_at),
                "courseTitle": certificate.course.title,
                "courseSlug": certificate.course.slug,
                "holder": certificate.user.full_name,
            }
        )
