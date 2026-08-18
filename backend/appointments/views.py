from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = AppointmentSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return (
            Appointment.objects
            .filter(
                created_by=self.request.user
            )
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "created_by"
            )
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
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = AppointmentSerializer

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):

        return (
            Appointment.objects
            .filter(
                created_by=self.request.user
            )
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "created_by"
            )
        )