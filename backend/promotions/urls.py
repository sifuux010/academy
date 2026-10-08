"""Routes des mises en avant — toutes sous /api/promotions/."""

from django.urls import path

from . import views

app_name = "promotions"

urlpatterns = [
    path("home/", views.HomeView.as_view(), name="home"),
    path("sponsored/", views.SponsoredView.as_view(), name="sponsored"),
    path(
        "sponsored/<uuid:pk>/click/",
        views.SponsoredClickView.as_view(),
        name="sponsored-click",
    ),
]
