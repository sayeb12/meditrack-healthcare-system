from rest_framework import serializers

from .models import Patient


class PatientSerializer(serializers.ModelSerializer):

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
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
        ]