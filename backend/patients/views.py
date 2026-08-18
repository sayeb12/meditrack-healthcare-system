from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Patient
from .serializers import PatientSerializer


class PatientListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = PatientSerializer

    permission_classes = [
        IsAuthenticated
    ]


    def get_queryset(self):

        return Patient.objects.filter(
            created_by=self.request.user
        )


    def perform_create(
        self,
        serializer
    ):

        serializer.save(
            created_by=self.request.user
        )



class PatientRetrieveUpdateDeleteView(
    generics.RetrieveUpdateDestroyAPIView
):

    serializer_class = PatientSerializer

    permission_classes = [
        IsAuthenticated
    ]


    def get_queryset(self):

        return Patient.objects.filter(
            created_by=self.request.user
        )