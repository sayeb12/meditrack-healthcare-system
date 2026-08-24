from django.urls import path

from .views import (
    PatientListCreateView,
    PatientRetrieveUpdateDeleteView,
    PatientRestoreView,
)


urlpatterns = [

    path(
        "",
        PatientListCreateView.as_view(),
        name="patient-list-create"
    ),


    path(
        "<int:pk>/restore/",
        PatientRestoreView.as_view(),
        name="patient-restore"
    ),


    path(
        "<int:pk>/",
        PatientRetrieveUpdateDeleteView.as_view(),
        name="patient-detail"
    ),

]
