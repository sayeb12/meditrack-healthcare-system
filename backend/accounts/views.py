from math import ceil

from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.hashers import check_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import (
    force_bytes,
    force_str,
)
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode,
)

from rest_framework import status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken,
    BlacklistedToken,
)

from .models import User, VerificationCode
from .serializers import (
    RegisterSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    PasswordResetOTPSerializer,
    PasswordResetConfirmSerializer,
    ResendRegistrationOTPSerializer,
    ResendPasswordResetOTPSerializer,
)
from .otp_service import create_verification_code
from .notification_service import send_otp
from .validators import (
    normalize_bd_phone,
    validate_strong_password,
)

def find_user_by_identifier(identifier):

    identifier = identifier.strip()

    if "@" in identifier:

        return User.objects.filter(
            email__iexact=identifier
        ).first()

    try:

        normalized_phone = normalize_bd_phone(
            identifier
        )

    except DjangoValidationError:

        return None

    return User.objects.filter(
        phone_number=normalized_phone
    ).first()

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
                "is_staff": user.is_staff,
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

class ForgotPasswordView(APIView):

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        serializer = ForgotPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        identifier = serializer.validated_data[
            "identifier"
        ]

        user = find_user_by_identifier(
            identifier
        )

        if user and user.is_active:

            channel = (
                "email"
                if "@" in identifier
                else "phone"
            )

            verification, otp = (
                create_verification_code(
                    user=user,
                    purpose="password_reset",
                    channel=channel
                )
            )

            send_otp(
                user=user,
                otp=otp,
                channel=channel
            )

        return Response(
            {
                "message":
                    "If an active account exists "
                    "for that email or phone number, "
                    "a password reset OTP has been sent."
            },
            status=status.HTTP_200_OK
        )

class VerifyPasswordResetOTPView(APIView):

    permission_classes = [
        AllowAny
    ]

    MAX_ATTEMPTS = 5

    def post(self, request):

        serializer = PasswordResetOTPSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        identifier = serializer.validated_data[
            "identifier"
        ]

        otp = serializer.validated_data[
            "otp"
        ]

        user = find_user_by_identifier(
            identifier
        )

        if not user or not user.is_active:

            return Response(
                {
                    "detail":
                        "Invalid or expired "
                        "verification request."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            verification = (
                VerificationCode.objects
                .select_for_update()
                .filter(
                    user=user,
                    purpose="password_reset",
                    is_used=False
                )
                .order_by("-created_at")
                .first()
            )

            if verification is None:

                return Response(
                    {
                        "detail":
                            "Invalid or expired "
                            "verification request."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if timezone.now() > verification.expires_at:

                verification.is_used = True

                verification.save(
                    update_fields=[
                        "is_used"
                    ]
                )

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

        uid = urlsafe_base64_encode(
            force_bytes(user.pk)
        )

        reset_token = (
            default_token_generator.make_token(
                user
            )
        )

        return Response(
            {
                "message":
                    "OTP verified successfully.",

                "uid":
                    uid,

                "reset_token":
                    reset_token
            },
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(APIView):

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        serializer = (
            PasswordResetConfirmSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        uid = serializer.validated_data[
            "uid"
        ]

        reset_token = serializer.validated_data[
            "reset_token"
        ]

        new_password = serializer.validated_data[
            "new_password"
        ]

        try:

            user_id = force_str(
                urlsafe_base64_decode(uid)
            )

            user = User.objects.get(
                pk=user_id
            )

        except (
            ValueError,
            TypeError,
            OverflowError,
            User.DoesNotExist
        ):

            return Response(
                {
                    "detail":
                        "Invalid or expired reset request."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(
            user,
            reset_token
        ):

            return Response(
                {
                    "detail":
                        "Invalid or expired reset request."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.check_password(
            new_password
        ):

            return Response(
                {
                    "new_password": [
                        "New password must be different "
                        "from the current password."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            validate_strong_password(
                new_password,
                user=user
            )

        except DjangoValidationError as error:

            return Response(
                {
                    "new_password":
                        error.messages
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            user.set_password(
                new_password
            )

            user.save(
                update_fields=[
                    "password"
                ]
            )

            VerificationCode.objects.filter(
                user=user,
                purpose="password_reset",
                is_used=False
            ).update(
                is_used=True
            )

            outstanding_tokens = (
                OutstandingToken.objects.filter(
                    user=user
                )
            )

            for outstanding_token in outstanding_tokens:

                BlacklistedToken.objects.get_or_create(
                    token=outstanding_token
                )

        return Response(
            {
                "message":
                    "Password reset successfully. "
                    "Please log in with your new password."
            },
            status=status.HTTP_200_OK
        )

class ResendRegistrationOTPView(APIView):

    permission_classes = [
        AllowAny
    ]

    COOLDOWN_SECONDS = 60

    def post(self, request):

        serializer = ResendRegistrationOTPSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        identifier = serializer.validated_data[
            "identifier"
        ]

        otp_channel = serializer.validated_data[
            "otp_channel"
        ]

        user = find_user_by_identifier(
            identifier
        )

        if user is None:

            return Response(
                {
                    "message":
                        "If an unverified account exists, "
                        "a new OTP has been sent."
                },
                status=status.HTTP_200_OK
            )

        if user.is_active:

            return Response(
                {
                    "detail":
                        "This account is already verified."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        last_verification = (
            VerificationCode.objects
            .filter(
                user=user,
                purpose="registration"
            )
            .order_by("-created_at")
            .first()
        )

        if last_verification:

            elapsed_seconds = (
                timezone.now()
                - last_verification.created_at
            ).total_seconds()

            if elapsed_seconds < self.COOLDOWN_SECONDS:

                retry_after = ceil(
                    self.COOLDOWN_SECONDS
                    - elapsed_seconds
                )

                return Response(
                    {
                        "detail":
                            "Please wait before requesting "
                            "another OTP.",

                        "retry_after":
                            retry_after
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )

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
                    "A new verification OTP has been sent.",

                "user_id":
                    user.id,

                "otp_channel":
                    otp_channel,

                "resend_available_in":
                    self.COOLDOWN_SECONDS
            },
            status=status.HTTP_200_OK
        )

class ResendPasswordResetOTPView(APIView):

    permission_classes = [
        AllowAny
    ]


    COOLDOWN_SECONDS = 60


    def post(self, request):

        serializer = ResendPasswordResetOTPSerializer(
            data=request.data
        )


        serializer.is_valid(
            raise_exception=True
        )


        identifier = serializer.validated_data[
            "identifier"
        ]


        user = find_user_by_identifier(
            identifier
        )


        if user is None or not user.is_active:

            return Response(
                {
                    "message":
                        "If an active account exists "
                        "for that email or phone number, "
                        "a new password reset OTP has been sent."
                },
                status=status.HTTP_200_OK
            )


        last_verification = (
            VerificationCode.objects
            .filter(
                user=user,
                purpose="password_reset"
            )
            .order_by("-created_at")
            .first()
        )


        if last_verification:

            elapsed_seconds = (
                timezone.now()
                -
                last_verification.created_at
            ).total_seconds()


            if elapsed_seconds < self.COOLDOWN_SECONDS:

                retry_after = ceil(
                    self.COOLDOWN_SECONDS
                    -
                    elapsed_seconds
                )


                return Response(
                    {
                        "detail":
                            "Please wait before requesting "
                            "another OTP.",

                        "retry_after":
                            retry_after
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )


        channel = (
            "email"
            if "@" in identifier
            else "phone"
        )


        verification, otp = create_verification_code(
            user=user,
            purpose="password_reset",
            channel=channel
        )


        send_otp(
            user=user,
            otp=otp,
            channel=channel
        )


        return Response(
            {
                "message":
                    "A new password reset OTP has been sent.",

                "resend_available_in":
                    self.COOLDOWN_SECONDS
            },
            status=status.HTTP_200_OK
        )
