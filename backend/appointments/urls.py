from django.urls import path

from .views import (
    AppointmentCancelView,
    AppointmentCompleteView,
    AppointmentConfirmView,
    AppointmentListCreateView,
    AppointmentNoShowView,
    AppointmentRetrieveUpdateDeleteView,
)


urlpatterns = [

    path(
        "",
        AppointmentListCreateView.as_view(),
        name="appointment-list-create"
    ),

    path(
        "<int:pk>/confirm/",
        AppointmentConfirmView.as_view(),
        name="appointment-confirm"
    ),

    path(
        "<int:pk>/cancel/",
        AppointmentCancelView.as_view(),
        name="appointment-cancel"
    ),

    path(
        "<int:pk>/complete/",
        AppointmentCompleteView.as_view(),
        name="appointment-complete"
    ),

    path(
        "<int:pk>/no-show/",
        AppointmentNoShowView.as_view(),
        name="appointment-no-show"
    ),

    path(
        "<int:pk>/",
        AppointmentRetrieveUpdateDeleteView.as_view(),
        name="appointment-detail"
    ),

]
