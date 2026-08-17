from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers

from .models import User
from .validators import (
    normalize_bd_phone,
    validate_strong_password
)


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False
    )

    confirm_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False
    )

    otp_channel = serializers.ChoiceField(
        choices=["email", "phone"],
        write_only=True
    )

    class Meta:

        model = User

        fields = [
            "full_name",
            "email",
            "phone_number",
            "password",
            "confirm_password",
            "language",
            "otp_channel",
        ]

    def validate_email(self, value):

        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate_phone_number(self, value):

        try:
            phone_number = normalize_bd_phone(value)

        except DjangoValidationError as error:

            raise serializers.ValidationError(
                error.messages
            )

        if User.objects.filter(
            phone_number=phone_number
        ).exists():

            raise serializers.ValidationError(
                "An account with this phone number already exists."
            )

        return phone_number

    def validate_language(self, value):

        if value not in ["en", "bn"]:

            raise serializers.ValidationError(
                "Language must be 'en' or 'bn'."
            )

        return value

    def validate(self, attrs):

        password = attrs.get("password")
        confirm_password = attrs.get(
            "confirm_password"
        )

        if password != confirm_password:

            raise serializers.ValidationError({
                "confirm_password":
                "Passwords do not match."
            })

        temporary_user = User(
            full_name=attrs.get("full_name", ""),
            email=attrs.get("email", "")
        )

        try:

            validate_strong_password(
                password,
                user=temporary_user
            )

        except DjangoValidationError as error:

            raise serializers.ValidationError({
                "password": error.messages
            })

        return attrs

    def create(self, validated_data):

        validated_data.pop(
            "confirm_password"
        )

        validated_data.pop(
            "otp_channel"
        )

        user = User.objects.create_user(
            email=validated_data["email"],
            phone_number=validated_data["phone_number"],
            full_name=validated_data["full_name"],
            password=validated_data["password"],
            language=validated_data.get(
                "language",
                "en"
            ),
            is_active=False
        )

        return user

class VerifyOTPSerializer(serializers.Serializer):

    user_id = serializers.IntegerField()

    otp = serializers.RegexField(
        regex=r"^\d{6}$",
        error_messages={
            "invalid": "OTP must contain exactly 6 digits."
        }
    )

class LoginSerializer(serializers.Serializer):

    identifier = serializers.CharField()

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False
    )