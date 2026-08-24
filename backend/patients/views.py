from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import (
    IsAuthenticated,
    SAFE_METHODS,
)

from .models import Patient
from .serializers import (
    PatientCreateSerializer,
    PatientReadSerializer,
    PatientUpdateSerializer,
)


class PatientSerializerSelectionMixin:

    serializer_class = PatientReadSerializer

    def get_serializer_class(self):

        if self.request.method == "POST":
            return PatientCreateSerializer

        if self.request.method in {
            "PUT",
            "PATCH",
        }:
            return PatientUpdateSerializer

        return PatientReadSerializer


class PatientAccessQuerysetMixin:

    def get_base_queryset(self):

        return Patient.objects.select_related(
            "created_by"
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
                    Q(created_by=user) |
                    Q(
                        appointments__doctor__user=user
                    )
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


class PatientListCreateView(
    PatientAccessQuerysetMixin,
    PatientSerializerSelectionMixin,
    generics.ListCreateAPIView
):

    permission_classes = [
        IsAuthenticated
    ]


    def perform_create(
        self,
        serializer
    ):

        serializer.save(
            created_by=self.request.user
        )



class PatientRetrieveUpdateDeleteView(
    PatientAccessQuerysetMixin,
    PatientSerializerSelectionMixin,
    generics.RetrieveUpdateDestroyAPIView
):

    permission_classes = [
        IsAuthenticated
    ]
