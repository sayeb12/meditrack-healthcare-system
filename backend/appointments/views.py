from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import (
    IsAuthenticated,
    SAFE_METHODS,
)

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentAccessQuerysetMixin:

    def get_base_queryset(self):

        return (
            Appointment.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "created_by"
            )
        )

    def get_read_queryset(self):

        queryset = self.get_base_queryset()
        user = self.request.user

        if user.is_staff:
            return queryset

        if hasattr(user, "doctor_profile"):
            return (
                queryset
                .filter(
                    Q(doctor__user=user) |
                    Q(created_by=user)
                )
                .distinct()
            )

        return queryset.filter(
            created_by=user
        )

    def get_queryset(self):

        if self.request.method in SAFE_METHODS:
            return self.get_read_queryset()

        return self.get_base_queryset().filter(
            created_by=self.request.user
        )


class AppointmentListCreateView(
    AppointmentAccessQuerysetMixin,
    generics.ListCreateAPIView
):

    serializer_class = AppointmentSerializer

    permission_classes = [
        IsAuthenticated
    ]
    def get_queryset(self):

        return (
            super()
            .get_queryset()
            .order_by(
                "appointment_date",
                "appointment_time"
            )
        )

    def perform_create(
        self,
        serializer
    ):

        serializer.save(
            created_by=self.request.user
        )


class AppointmentRetrieveUpdateDeleteView(
    AppointmentAccessQuerysetMixin,
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = AppointmentSerializer

    permission_classes = [
        IsAuthenticated
    ]
