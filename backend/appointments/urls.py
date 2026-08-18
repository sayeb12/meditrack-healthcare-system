from django.urls import path

from .views import (
    AppointmentListCreateView,
    AppointmentRetrieveUpdateDeleteView,
)


urlpatterns = [

    path(
        "",
        AppointmentListCreateView.as_view(),
        name="appointment-list-create"
    ),

    path(
        "<int:pk>/",
        AppointmentRetrieveUpdateDeleteView.as_view(),
        name="appointment-detail"
    ),

]