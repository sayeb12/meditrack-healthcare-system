from rest_framework import serializers

from .models import Doctor


class DoctorSerializer(serializers.ModelSerializer):

    full_name = serializers.ReadOnlyField(
        source="user.full_name"
    )

    email = serializers.ReadOnlyField(
        source="user.email"
    )

    phone_number = serializers.ReadOnlyField(
        source="user.phone_number"
    )

    class Meta:

        model = Doctor

        fields = [
            "id",
            "user",
            "full_name",
            "email",
            "phone_number",
            "specialization",
            "license_number",
            "experience_years",
            "is_available",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "full_name",
            "email",
            "phone_number",
            "created_at",
            "updated_at",
        ]
        