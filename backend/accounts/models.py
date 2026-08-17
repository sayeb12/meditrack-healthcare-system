from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager
)

from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):

    def create_user(
        self,
        email,
        phone_number,
        full_name,
        password=None,
        **extra_fields
    ):

        if not email:
            raise ValueError(
                "Email is required"
            )

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            phone_number=phone_number,
            full_name=full_name,
            **extra_fields
        )

        user.set_password(password)

        user.save(using=self._db)

        return user


    def create_superuser(
        self,
        email,
        phone_number,
        full_name,
        password=None,
        **extra_fields
    ):

        extra_fields.setdefault(
            "is_staff",
            True
        )

        extra_fields.setdefault(
            "is_superuser",
            True
        )

        extra_fields.setdefault(
            "is_active",
            True
        )

        return self.create_user(
            email,
            phone_number,
            full_name,
            password,
            **extra_fields
        )



class User(
    AbstractBaseUser,
    PermissionsMixin
):

    full_name = models.CharField(
        max_length=150
    )


    email = models.EmailField(
        unique=True
    )


    phone_number = models.CharField(
        max_length=14,
        unique=True
    )


    language = models.CharField(
        max_length=10,
        default="en"
    )


    is_active = models.BooleanField(
    default=False
    )


    is_staff = models.BooleanField(
        default=False
    )


    created_at = models.DateTimeField(
        default=timezone.now
    )


    updated_at = models.DateTimeField(
        auto_now=True
    )


    objects = UserManager()


    USERNAME_FIELD = "email"


    REQUIRED_FIELDS = [
        "phone_number",
        "full_name"
    ]


    def __str__(self):
        return self.email

class VerificationCode(models.Model):

    PURPOSE_CHOICES = [
        ("registration", "Registration"),
        ("password_reset", "Password Reset"),
    ]

    CHANNEL_CHOICES = [
        ("email", "Email"),
        ("phone", "Phone"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="verification_codes"
    )

    code_hash = models.CharField(
        max_length=255
    )

    purpose = models.CharField(
        max_length=30,
        choices=PURPOSE_CHOICES
    )

    channel = models.CharField(
        max_length=10,
        choices=CHANNEL_CHOICES
    )

    expires_at = models.DateTimeField()

    is_used = models.BooleanField(
        default=False
    )

    attempts = models.PositiveSmallIntegerField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.email} - {self.purpose}"