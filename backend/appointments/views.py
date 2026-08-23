from django.db import transaction
from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import (
    IsAuthenticated,
    SAFE_METHODS,
)
from rest_framework.response import Response

from .models import Appointment
from .serializers import (
    AppointmentCreateSerializer,
    AppointmentLifecycleSerializer,
    AppointmentReadSerializer,
    AppointmentUpdateSerializer,
)


class AppointmentSerializerSelectionMixin:

    serializer_class = AppointmentReadSerializer

    def get_serializer_class(self):

        if self.request.method == "POST":
            return AppointmentCreateSerializer

        if self.request.method in {"PUT", "PATCH"}:
            return AppointmentUpdateSerializer

        return AppointmentReadSerializer


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

        if self.request.method in {"PUT", "PATCH"}:
            return self.get_read_queryset()

        return self.get_base_queryset().filter(
            created_by=self.request.user
        )


class AppointmentListCreateView(
    AppointmentAccessQuerysetMixin,
    AppointmentSerializerSelectionMixin,
    generics.ListCreateAPIView
):

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
    AppointmentSerializerSelectionMixin,
    generics.RetrieveUpdateDestroyAPIView
):

    permission_classes = [
        IsAuthenticated
    ]


class AppointmentLifecycleView(
    AppointmentAccessQuerysetMixin,
    generics.GenericAPIView
):

    serializer_class = AppointmentLifecycleSerializer

    permission_classes = [
        IsAuthenticated
    ]

    target_status = None
    allowed_source_statuses = ()
    creator_allowed = False

    def get_queryset(self):

        queryset = self.get_base_queryset()
        user = self.request.user

        if not user.is_staff:
            access_filter = Q(doctor__user=user)

            if self.creator_allowed:
                access_filter |= Q(created_by=user)

            queryset = queryset.filter(access_filter)

        return queryset.select_for_update()

    def get_serializer_context(self):

        context = super().get_serializer_context()
        context.update({
            "target_status": self.target_status,
            "allowed_source_statuses": (
                self.allowed_source_statuses
            ),
        })

        return context

    def post(self, request, *args, **kwargs):

        with transaction.atomic():
            appointment = self.get_object()
            serializer = self.get_serializer(
                appointment,
                data=request.data,
            )
            serializer.is_valid(
                raise_exception=True
            )
            appointment = serializer.save()

        response_serializer = AppointmentReadSerializer(
            appointment,
            context={
                "request": request,
            },
        )

        return Response(response_serializer.data)


class AppointmentConfirmView(AppointmentLifecycleView):

    target_status = "confirmed"
    allowed_source_statuses = (
        "scheduled",
    )


class AppointmentCancelView(AppointmentLifecycleView):

    target_status = "cancelled"
    allowed_source_statuses = (
        "scheduled",
        "confirmed",
    )
    creator_allowed = True


class AppointmentCompleteView(AppointmentLifecycleView):

    target_status = "completed"
    allowed_source_statuses = (
        "confirmed",
    )


class AppointmentNoShowView(AppointmentLifecycleView):

    target_status = "no_show"
    allowed_source_statuses = (
        "confirmed",
    )
