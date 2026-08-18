from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Doctor
from .serializers import DoctorSerializer


class DoctorListCreateView(
    generics.ListCreateAPIView
):

    queryset = Doctor.objects.select_related(
        "user"
    ).all()

    serializer_class = DoctorSerializer

    permission_classes = [
        IsAuthenticated
    ]


class DoctorRetrieveUpdateDeleteView(
    generics.RetrieveUpdateDestroyAPIView
):

    queryset = Doctor.objects.select_related(
        "user"
    ).all()

    serializer_class = DoctorSerializer

    permission_classes = [
        IsAuthenticated
    ]