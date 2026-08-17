from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.utils import timezone
from .models import User, VerificationCode

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    RegisterSerializer,
    VerifyOTPSerializer,
)
from .otp_service import create_verification_code
from .notification_service import send_otp


class RegisterView(APIView):

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        serializer = RegisterSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        otp_channel = serializer.validated_data[
            "otp_channel"
        ]

        user = serializer.save()

        verification, otp = create_verification_code(
            user=user,
            purpose="registration",
            channel=otp_channel
        )

        send_otp(
            user=user,
            otp=otp,
            channel=otp_channel
        )

        return Response(
            {
                "message":
                    "Registration successful. "
                    "Please verify your OTP.",

                "user_id":
                    user.id,

                "otp_channel":
                    otp_channel
            },
            status=status.HTTP_201_CREATED
        )

class VerifyOTPView(APIView):

    permission_classes = [
        AllowAny
    ]

    MAX_ATTEMPTS = 5

    def post(self, request):

        serializer = VerifyOTPSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user_id = serializer.validated_data[
            "user_id"
        ]

        otp = serializer.validated_data[
            "otp"
        ]

        try:

            user = User.objects.get(
                id=user_id
            )

        except User.DoesNotExist:

            return Response(
                {
                    "detail":
                    "Invalid verification request."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.is_active:

            return Response(
                {
                    "message":
                    "Account is already verified."
                },
                status=status.HTTP_200_OK
            )

        with transaction.atomic():

            verification = (
                VerificationCode.objects
                .select_for_update()
                .filter(
                    user=user,
                    purpose="registration",
                    is_used=False
                )
                .order_by("-created_at")
                .first()
            )

            if verification is None:

                return Response(
                    {
                        "detail":
                        "No active verification code found."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if timezone.now() > verification.expires_at:

                return Response(
                    {
                        "otp": [
                            "OTP has expired."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if verification.attempts >= self.MAX_ATTEMPTS:

                return Response(
                    {
                        "otp": [
                            "Maximum OTP attempts exceeded."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not check_password(
                otp,
                verification.code_hash
            ):

                verification.attempts += 1

                if (
                    verification.attempts
                    >= self.MAX_ATTEMPTS
                ):
                    verification.is_used = True

                verification.save(
                    update_fields=[
                        "attempts",
                        "is_used"
                    ]
                )

                remaining_attempts = max(
                    0,
                    self.MAX_ATTEMPTS
                    - verification.attempts
                )

                return Response(
                    {
                        "otp": [
                            (
                                "Invalid OTP. "
                                f"{remaining_attempts} "
                                "attempts remaining."
                            )
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            verification.is_used = True

            verification.save(
                update_fields=[
                    "is_used"
                ]
            )

            user.is_active = True

            user.save(
                update_fields=[
                    "is_active"
                ]
            )

        return Response(
            {
                "message":
                "Account verified successfully."
            },
            status=status.HTTP_200_OK
        )