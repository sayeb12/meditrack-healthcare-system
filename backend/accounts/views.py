from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer
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