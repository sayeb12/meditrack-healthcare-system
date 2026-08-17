from django.conf import settings
from django.core.mail import send_mail


def send_otp(user, otp, channel):

    if channel == "email":

        send_mail(
            subject="MediTrack Verification Code",
            message=(
                f"Your MediTrack verification code "
                f"is {otp}. It expires in 5 minutes."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False
        )

        return

    if channel == "phone":

        if settings.DEBUG:

            print(
                f"[DEV SMS] OTP for "
                f"{user.phone_number}: {otp}"
            )

            return

        raise RuntimeError(
            "SMS provider has not been configured."
        )