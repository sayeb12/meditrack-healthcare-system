from rest_framework import serializers

from .models import Patient


class PatientReadSerializer(serializers.ModelSerializer):

    created_by = serializers.ReadOnlyField(
        source="created_by.email"
    )


    class Meta:

        model = Patient

        fields = [
            "id",
            "created_by",
            "full_name",
            "date_of_birth",
            "gender",
            "phone_number",
            "email",
            "address",
            "blood_group",
            "medical_notes",
            "is_archived",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "full_name",
            "date_of_birth",
            "gender",
            "phone_number",
            "email",
            "address",
            "blood_group",
            "medical_notes",
            "is_archived",
            "created_at",
            "updated_at",
        ]


class PatientCreateSerializer(PatientReadSerializer):

    class Meta(PatientReadSerializer.Meta):

        read_only_fields = [
            "id",
            "created_by",
            "is_archived",
            "created_at",
            "updated_at",
        ]


class PatientUpdateSerializer(PatientCreateSerializer):

    class Meta(PatientCreateSerializer.Meta):

        pass
