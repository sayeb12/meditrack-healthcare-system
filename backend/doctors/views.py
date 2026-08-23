from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import (
    IsAdminUser,
    IsAuthenticated,
)
from rest_framework.response import Response

from .models import Doctor
from .permissions import IsStaffOrReadOnly
from .serializers import (
    DoctorReadSerializer,
    DoctorWriteSerializer,
)


class DoctorSerializerSelectionMixin:

    serializer_class = DoctorReadSerializer

    def get_serializer_class(self):

        if self.request.method in {
            "POST",
            "PUT",
            "PATCH",
        }:
            return DoctorWriteSerializer

        return DoctorReadSerializer


class DoctorListCreateView(
    DoctorSerializerSelectionMixin,
    generics.ListCreateAPIView
):
    queryset = (
        Doctor.objects
        .select_related("user")
        .order_by("user__full_name")
    )

    permission_classes = [
        IsAuthenticated,
        IsStaffOrReadOnly,
    ]

    def get_queryset(self):

        queryset = super().get_queryset()
        include_archived = (
            self.request.query_params
            .get("include_archived", "")
            .lower()
            == "true"
        )

        if include_archived:
            if not self.request.user.is_staff:
                raise PermissionDenied(
                    "Only staff users can view archived doctors."
                )

            return queryset

        return queryset.filter(is_archived=False)


class DoctorRetrieveUpdateDeleteView(
    DoctorSerializerSelectionMixin,
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = (
        Doctor.objects
        .select_related("user")
        .all()
    )

    permission_classes = [
        IsAuthenticated,
        IsStaffOrReadOnly,
    ]

    def get_queryset(self):

        queryset = super().get_queryset()

        if (
            self.request.method in {"GET", "HEAD"}
            and not self.request.user.is_staff
        ):
            return queryset.filter(is_archived=False)

        return queryset

    def perform_destroy(self, instance):

        instance.is_archived = True
        instance.save(
            update_fields=[
                "is_archived",
                "updated_at",
            ]
        )


class DoctorRestoreView(generics.GenericAPIView):
    queryset = (
        Doctor.objects
        .select_related("user")
        .all()
    )

    serializer_class = DoctorReadSerializer

    permission_classes = [
        IsAuthenticated,
        IsAdminUser,
    ]

    def post(self, request, *args, **kwargs):

        doctor = self.get_object()

        if doctor.is_archived:
            doctor.is_archived = False
            doctor.save(
                update_fields=[
                    "is_archived",
                    "updated_at",
                ]
            )

        serializer = self.get_serializer(doctor)

        return Response(serializer.data)
