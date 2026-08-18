from django.db import models
from accounts.models import User


class Doctor(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="doctor_profile"
    )

    specialization = models.CharField(
        max_length=100
    )

    license_number = models.CharField(
        max_length=100,
        unique=True
    )

    experience_years = models.PositiveIntegerField(
        default=0
    )

    is_available = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )


    def __str__(self):

        return self.user.full_name