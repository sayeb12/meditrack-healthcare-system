from rest_framework import serializers

from accounts.models import User

from .models import Doctor


class DoctorReadSerializer(serializers.ModelSerializer):

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


class DoctorWriteSerializer(DoctorReadSerializer):

    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all()
    )

    class Meta(DoctorReadSerializer.Meta):

        read_only_fields = [
            "id",
            "full_name",
            "email",
            "phone_number",
            "created_at",
            "updated_at",
        ]

    def validate_user(self, user):

        if self.instance is not None:

            if user.pk != self.instance.user_id:
                raise serializers.ValidationError(
                    "The user assigned to a doctor profile "
                    "cannot be changed."
                )

            return user

        if not user.is_active:
            raise serializers.ValidationError(
                "The selected user must be active."
            )

        if Doctor.objects.filter(user=user).exists():
            raise serializers.ValidationError(
                "The selected user already has a doctor profile."
            )

        return user
