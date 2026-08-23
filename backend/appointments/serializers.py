from rest_framework import serializers
from django.utils import timezone

from .models import Appointment


class AppointmentReadSerializer(serializers.ModelSerializer):

    created_by = serializers.ReadOnlyField(
        source="created_by.email"
    )

    patient_name = serializers.ReadOnlyField(
        source="patient.full_name"
    )

    doctor_name = serializers.ReadOnlyField(
        source="doctor.user.full_name"
    )

    doctor_specialization = serializers.ReadOnlyField(
        source="doctor.specialization"
    )

    class Meta:

        model = Appointment

        fields = [
            "id",
            "created_by",
            "patient",
            "patient_name",
            "doctor",
            "doctor_name",
            "doctor_specialization",
            "appointment_date",
            "appointment_time",
            "status",
            "reason",
            "consultation_notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class AppointmentWriteValidationMixin:

    def validate(self, attrs):

        request = self.context.get("request")

        patient = attrs.get(
            "patient",
            getattr(self.instance, "patient", None)
        )

        doctor = attrs.get(
            "doctor",
            getattr(self.instance, "doctor", None)
        )

        appointment_date = attrs.get(
            "appointment_date",
            getattr(
                self.instance,
                "appointment_date",
                None
            )
        )

        appointment_time = attrs.get(
            "appointment_time",
            getattr(
                self.instance,
                "appointment_time",
                None
            )
        )

        if request and patient:
            user = request.user

            if self.instance is None:
                can_use_patient = (
                    patient.created_by_id == user.pk
                )

            else:
                can_use_patient = (
                    user.is_staff
                    or hasattr(user, "doctor_profile")
                    or patient.created_by_id == user.pk
                )

            if not can_use_patient:
                raise serializers.ValidationError({
                    "patient":
                        "You cannot create an appointment "
                        "for another user's patient."
                })

        today = timezone.localdate()

        current_time = (
            timezone.localtime()
            .time()
            .replace(tzinfo=None)
        )

        if appointment_date:

            if appointment_date < today:

                raise serializers.ValidationError({
                    "appointment_date":
                        "Appointment date cannot be in the past."
                })

            if (
                appointment_date == today
                and appointment_time
                and appointment_time <= current_time
            ):

                raise serializers.ValidationError({
                    "appointment_time":
                        "Appointment time must be in the future."
                })

        if (
            doctor
            and appointment_date
            and appointment_time
        ):

            existing_appointment = (
                Appointment.objects.filter(
                    doctor=doctor,
                    appointment_date=appointment_date,
                    appointment_time=appointment_time,
                    status="scheduled"
                )
            )

            if self.instance:

                existing_appointment = (
                    existing_appointment.exclude(
                        pk=self.instance.pk
                    )
                )

            if existing_appointment.exists():

                raise serializers.ValidationError({
                    "appointment_time":
                        "This doctor already has an "
                        "appointment at this time."
                })

        return attrs


class AppointmentCreateSerializer(
    AppointmentWriteValidationMixin,
    AppointmentReadSerializer
):

    class Meta(AppointmentReadSerializer.Meta):

        read_only_fields = [
            "id",
            "created_by",
            "patient_name",
            "doctor_name",
            "doctor_specialization",
            "created_at",
            "updated_at",
        ]

    def validate_doctor(self, doctor):

        if not doctor.user.is_active:
            raise serializers.ValidationError(
                "The selected doctor's account is inactive."
            )

        if doctor.is_archived:
            raise serializers.ValidationError(
                "The selected doctor is archived."
            )

        if not doctor.is_available:
            raise serializers.ValidationError(
                "This doctor is currently unavailable."
            )

        return doctor


class AppointmentUpdateSerializer(
    AppointmentCreateSerializer
):

    class Meta(AppointmentCreateSerializer.Meta):

        read_only_fields = [
            *AppointmentCreateSerializer.Meta.read_only_fields,
            "status",
        ]

    def validate(self, attrs):

        request = self.context.get("request")
        user = request.user
        errors = {}

        submitted_status = self.initial_data.get("status")

        if (
            submitted_status is not None
            and submitted_status != self.instance.status
        ):
            errors["status"] = (
                "Appointment status must be changed "
                "through a lifecycle action."
            )

        is_staff = user.is_staff
        is_doctor = hasattr(user, "doctor_profile")

        if is_doctor and not is_staff:
            patient = attrs.get("patient")
            doctor = attrs.get("doctor")

            if (
                patient
                and patient.pk != self.instance.patient_id
            ):
                errors["patient"] = (
                    "Doctors cannot reassign the patient."
                )

            if (
                doctor
                and doctor.pk != self.instance.doctor_id
            ):
                errors["doctor"] = (
                    "Doctors cannot reassign the doctor."
                )

        submitted_notes = self.initial_data.get(
            "consultation_notes"
        )

        if (
            submitted_notes is not None
            and submitted_notes != (
                self.instance.consultation_notes
            )
        ):
            is_assigned_doctor = (
                self.instance.doctor.user_id == user.pk
            )

            if not is_staff and not is_assigned_doctor:
                errors["consultation_notes"] = (
                    "Only staff or the assigned doctor can "
                    "update consultation notes."
                )

        if errors:
            raise serializers.ValidationError(errors)

        return super().validate(attrs)
