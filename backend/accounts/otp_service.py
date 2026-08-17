import secrets

from django.contrib.auth.hashers import make_password
from django.utils import timezone

from datetime import timedelta

from .models import VerificationCode


def generate_otp():

    return str(
        secrets.randbelow(900000) + 100000
    )


def create_verification_code(
    user,
    purpose,
    channel
):

    VerificationCode.objects.filter(
        user=user,
        purpose=purpose,
        is_used=False
    ).update(
        is_used=True
    )

    otp = generate_otp()

    verification = VerificationCode.objects.create(
        user=user,
        code_hash=make_password(otp),
        purpose=purpose,
        channel=channel,
        expires_at=timezone.now() + timedelta(minutes=5)
    )

    return verification, otp