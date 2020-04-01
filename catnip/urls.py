from django.views.generic.base import RedirectView
from django.urls import path
from django.conf import settings
from catnip import views


urlpatterns = [
    # Views
    path("", RedirectView.as_view(url=settings.LOGIN_URL), name="home"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("summary/", views.ApplicationView.as_view(), name="summary"),
    path(
        "summary-charts/",
        views.ApplicationView.as_view(),
        name="summary-charts",
    ),
    path("scope/", views.ApplicationView.as_view(), name="scope"),
    path(
        "rating-modules/",
        views.ApplicationView.as_view(),
        name="rating-modules",
    ),
    path("hashmap/", views.ApplicationView.as_view(), name="hashmap"),
    # API
    # Projects API endpoints
    path("api/projects/", views.ProjectsAPI.as_view()),
    # Summary API endpoints
    path("api/summary/", views.SummaryAPI.as_view()),
    # Hashmap API endpoints
    path("api/hashmap/service/", views.HashmapServiceAPI.as_view()),
    path("api/hashmap/group/", views.HashmapGroupAPI.as_view()),
    path("api/hashmap/field/", views.HashmapFieldAPI.as_view()),
    path("api/hashmap/mapping/", views.HashmapMappingAPI.as_view()),
    path("api/hashmap/threshold/", views.HashmapThresholdAPI.as_view()),
    # Rating Modules API endpoints
    path("api/rating-modules/", views.RatingModulesAPI.as_view()),
    # Scope API endpoints
    path("api/scope/", views.ScopeAPI.as_view()),
]
