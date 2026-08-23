from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import User


class CurrentUserViewTests(TestCase):

    def setUp(self):

        self.client = APIClient()

    def create_user(self, **extra_fields):

        return User.objects.create_user(
            email=extra_fields.pop(
                "email",
                "user@example.com"
            ),
            phone_number=extra_fields.pop(
                "phone_number",
                "+8801700000001"
            ),
            full_name=extra_fields.pop(
                "full_name",
                "Test User"
            ),
            password="StrongPass123!",
            is_active=True,
            **extra_fields
        )

    def get_current_user(self, user):

        self.client.force_authenticate(user=user)

        return self.client.get(
            reverse("current-user")
        )

    def test_authenticated_staff_user_receives_is_staff(self):

        user = self.create_user(
            is_staff=True
        )

        response = self.get_current_user(user)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertTrue(response.data["is_staff"])

    def test_normal_user_receives_false_is_staff(self):

        user = self.create_user()

        response = self.get_current_user(user)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertFalse(response.data["is_staff"])

    def test_existing_current_user_fields_remain_available(self):

        user = self.create_user(
            email="existing@example.com",
            phone_number="+8801700000002",
            full_name="Existing User",
            language="bn",
        )

        response = self.get_current_user(user)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(response.data["id"], user.id)
        self.assertEqual(
            response.data["full_name"],
            user.full_name
        )
        self.assertEqual(
            response.data["email"],
            user.email
        )
        self.assertEqual(
            response.data["phone_number"],
            user.phone_number
        )
        self.assertEqual(
            response.data["language"],
            user.language
        )
