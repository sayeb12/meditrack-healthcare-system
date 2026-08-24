from django.db.models import Q
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import (
    IsAdminUser,
    IsAuthenticated,
    SAFE_METHODS,
)
from rest_framework.response import Response

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
                .filter(is_archived=False)
                .distinct()
            )

        return queryset.filter(
            created_by=user,
            is_archived=False,
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


    def get_queryset(self):

        queryset = super().get_queryset()

        if self.request.method not in SAFE_METHODS:
            return queryset

        include_archived = (
            self.request.query_params
            .get("include_archived", "")
            .lower()
            == "true"
        )

        if include_archived:
            if not self.request.user.is_staff:
                raise PermissionDenied(
                    "Only staff users can view archived patients."
                )

            return queryset

        return queryset.filter(is_archived=False)


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


    def perform_destroy(self, instance):

        instance.is_archived = True
        instance.save(
            update_fields=[
                "is_archived",
                "updated_at",
            ]
        )


class PatientRestoreView(generics.GenericAPIView):

    queryset = (
        Patient.objects
        .select_related("created_by")
        .all()
    )

    serializer_class = PatientReadSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminUser,
    ]

    def post(self, request, *args, **kwargs):

        patient = self.get_object()

        if patient.is_archived:
            patient.is_archived = False
            patient.save(
                update_fields=[
                    "is_archived",
                    "updated_at",
                ]
            )

        serializer = self.get_serializer(patient)

        return Response(serializer.data)
