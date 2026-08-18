from rest_framework import serializers
from django.utils import timezone

from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):

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

        read_only_fields = [
            "id",
            "created_by",
            "patient_name",
            "doctor_name",
            "doctor_specialization",
            "created_at",
            "updated_at",
        ]

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

        if (
            request
            and patient
            and patient.created_by != request.user
        ):
            raise serializers.ValidationError({
                "patient":
                    "You cannot create an appointment "
                    "for another user's patient."
            })

        if doctor and not doctor.is_available:
            raise serializers.ValidationError({
                "doctor":
                    "This doctor is currently unavailable."
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