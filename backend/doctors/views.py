from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

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
        .all()
        .order_by("user__full_name")
    )

    permission_classes = [
        IsAuthenticated,
        IsStaffOrReadOnly,
    ]


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
