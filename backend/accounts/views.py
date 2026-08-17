from django.contrib.auth.hashers import check_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, VerificationCode
from .serializers import (
    RegisterSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
)
from .otp_service import create_verification_code
from .notification_service import send_otp
from .validators import normalize_bd_phone

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

class LoginView(APIView):

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        identifier = serializer.validated_data[
            "identifier"
        ].strip()

        password = serializer.validated_data[
            "password"
        ]

        user = None

        # Try email login first
        if "@" in identifier:

            user = User.objects.filter(
                email__iexact=identifier
            ).first()

        else:

            # Otherwise treat the identifier as
            # a Bangladesh phone number
            try:

                normalized_phone = normalize_bd_phone(
                    identifier
                )

            except DjangoValidationError:

                normalized_phone = None

            if normalized_phone:

                user = User.objects.filter(
                    phone_number=normalized_phone
                ).first()

        # Do not reveal whether the account exists
        if user is None:

            return Response(
                {
                    "detail":
                    "Invalid email/phone number or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):

            return Response(
                {
                    "detail":
                    "Invalid email/phone number or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:

            return Response(
                {
                    "detail":
                    "Your account has not been verified."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message":
                    "Login successful.",

                "user": {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "language": user.language,
                },

                "tokens": {
                    "access": str(
                        refresh.access_token
                    ),

                    "refresh": str(
                        refresh
                    ),
                }
            },
            status=status.HTTP_200_OK
        )

class CurrentUserView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        user = request.user

        return Response(
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone_number": user.phone_number,
                "language": user.language,
            },
            status=status.HTTP_200_OK
        )

class LogoutView(APIView):

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        refresh_token = request.data.get(
            "refresh"
        )

        if not refresh_token:

            return Response(
                {
                    "detail":
                    "Refresh token is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            token = RefreshToken(
                refresh_token
            )

            token.blacklist()

        except TokenError:

            return Response(
                {
                    "detail":
                    "Invalid or expired refresh token."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "message":
                    "Logout successful."
            },
            status=status.HTTP_200_OK
        )