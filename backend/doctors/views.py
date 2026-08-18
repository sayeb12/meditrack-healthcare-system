from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Doctor
from .permissions import IsStaffOrReadOnly
from .serializers import DoctorSerializer


class DoctorListCreateView(
    generics.ListCreateAPIView
):
    queryset = (
        Doctor.objects
        .select_related("user")
        .all()
        .order_by("user__full_name")
    )

    serializer_class = DoctorSerializer

    permission_classes = [
        IsAuthenticated,
        IsStaffOrReadOnly,
    ]


class DoctorRetrieveUpdateDeleteView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = (
        Doctor.objects
        .select_related("user")
        .all()
    )

    serializer_class = DoctorSerializer

    permission_classes = [
        IsAuthenticated,
        IsStaffOrReadOnly,
    ]