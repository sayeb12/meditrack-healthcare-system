from django.urls import path

from .views import (
    DoctorListCreateView,
    DoctorRetrieveUpdateDeleteView,
    DoctorRestoreView,
)


urlpatterns = [

    path(
        "",
        DoctorListCreateView.as_view(),
        name="doctor-list-create"
    ),

    path(
        "<int:pk>/restore/",
        DoctorRestoreView.as_view(),
        name="doctor-restore"
    ),

    path(
        "<int:pk>/",
        DoctorRetrieveUpdateDeleteView.as_view(),
        name="doctor-detail"
    ),

]
