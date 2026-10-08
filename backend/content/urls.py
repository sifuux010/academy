"""Routes de contenu — toutes sous /api/content/."""

from django.urls import path

from . import views

app_name = "content"

urlpatterns = [
    # Les routes fixes passent avant la route générique <section>.
    path("taxonomies/", views.TaxonomiesView.as_view(), name="taxonomies"),
    path("authors/", views.AuthorsView.as_view(), name="authors"),
    path("search/", views.GlobalSearchView.as_view(), name="search"),
    path("stats/", views.StatsView.as_view(), name="stats"),
    path("plans/", views.PlansView.as_view(), name="plans"),
    path(
        "pathologies/<slug:slug>/hub/",
        views.PathologyHubView.as_view(),
        name="pathology-hub",
    ),
    path("<str:section>/", views.SectionListView.as_view(), name="section-list"),
    path(
        "<str:section>/<slug:slug>/",
        views.SectionDetailView.as_view(),
        name="section-detail",
    ),
]
