"""Routes d'activité des membres — toutes sous /api/activity/."""

from django.urls import path

from . import views

app_name = "activity"

urlpatterns = [
    path("state/", views.StateView.as_view(), name="state"),
    path("favorites/toggle/", views.FavoriteToggleView.as_view(), name="favorite-toggle"),
    path("downloads/", views.DownloadView.as_view(), name="download"),
    path("views/", views.ViewRecordView.as_view(), name="view"),
    path("enroll/", views.EnrollView.as_view(), name="enroll"),
    path("progress/toggle/", views.LessonToggleView.as_view(), name="progress-toggle"),
    path("quiz/", views.QuizAttemptView.as_view(), name="quiz"),
    path("webinars/toggle/", views.WebinarToggleView.as_view(), name="webinar-toggle"),
    path("search/", views.SearchRecordView.as_view(), name="search"),
    path("certificates/", views.CertificateListView.as_view(), name="certificates"),
    path(
        "certificates/verify/<str:reference>/",
        views.CertificateVerifyView.as_view(),
        name="certificate-verify",
    ),
]
