from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from doctors.models import Doctor

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


class EligibleDoctorUsersViewTests(TestCase):

    def setUp(self):

        self.client = APIClient()

        self.staff_user = self.create_user(
            "staff@example.com",
            "+8801700000010",
            "Staff User",
            is_staff=True,
        )

        self.normal_user = self.create_user(
            "normal@example.com",
            "+8801700000011",
            "Normal User",
        )

        self.eligible_user = self.create_user(
            "eligible@example.com",
            "+8801700000012",
            "Eligible User",
        )

        self.inactive_user = self.create_user(
            "inactive@example.com",
            "+8801700000013",
            "Inactive User",
            is_active=False,
        )

        self.doctor_user = self.create_user(
            "doctor@example.com",
            "+8801700000014",
            "Doctor User",
        )

        Doctor.objects.create(
            user=self.doctor_user,
            specialization="Cardiology",
            license_number="DOC-ELIGIBLE-001",
        )

        self.url = reverse(
            "eligible-doctor-users"
        )

    def create_user(
        self,
        email,
        phone_number,
        full_name,
        is_active=True,
        is_staff=False,
    ):

        return User.objects.create_user(
            email=email,
            phone_number=phone_number,
            full_name=full_name,
            password="StrongPass123!",
            is_active=is_active,
            is_staff=is_staff,
        )

    def get_as(self, user):

        self.client.force_authenticate(user=user)

        return self.client.get(self.url)

    def test_staff_can_access_endpoint(self):

        response = self.get_as(self.staff_user)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

    def test_normal_user_receives_forbidden(self):

        response = self.get_as(self.normal_user)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_anonymous_user_receives_unauthorized(self):

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_inactive_users_are_excluded(self):

        response = self.get_as(self.staff_user)

        returned_ids = {
            user["id"]
            for user in response.data
        }

        self.assertNotIn(
            self.inactive_user.id,
            returned_ids
        )

    def test_existing_doctors_are_excluded(self):

        response = self.get_as(self.staff_user)

        returned_ids = {
            user["id"]
            for user in response.data
        }

        self.assertNotIn(
            self.doctor_user.id,
            returned_ids
        )

    def test_response_fields_are_correct(self):

        response = self.get_as(self.staff_user)

        eligible_user = next(
            user
            for user in response.data
            if user["id"] ==
                self.eligible_user.id
        )

        self.assertEqual(
            set(eligible_user.keys()),
            {
                "id",
                "full_name",
                "email",
                "phone_number",
            }
        )

        self.assertEqual(
            eligible_user,
            {
                "id": self.eligible_user.id,
                "full_name":
                    self.eligible_user.full_name,
                "email": self.eligible_user.email,
                "phone_number":
                    self.eligible_user.phone_number,
            }
        )
