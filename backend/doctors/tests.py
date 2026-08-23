from datetime import date, time, timedelta

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from appointments.models import Appointment
from patients.models import Patient

from .models import Doctor


class DoctorAPITests(TestCase):

    def setUp(self):

        self.staff_user = User.objects.create_user(
            email="staff@example.com",
            phone_number="+8801700000001",
            full_name="Staff User",
            password="StrongPass123!",
            is_active=True,
            is_staff=True,
        )

        self.doctor_user = User.objects.create_user(
            email="doctor@example.com",
            phone_number="+8801700000002",
            full_name="Existing Doctor",
            password="StrongPass123!",
            is_active=True,
        )

        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            specialization="Cardiology",
            license_number="DOC-001",
            experience_years=8,
            is_available=True,
        )

        self.client = APIClient()
        self.client.force_authenticate(
            user=self.staff_user
        )

    def doctor_payload(self, user, license_number):

        return {
            "user": getattr(user, "pk", user),
            "specialization": "Neurology",
            "license_number": license_number,
            "experience_years": 4,
            "is_available": True,
        }

    def test_get_preserves_doctor_response_fields(self):

        response = self.client.get(
            reverse(
                "doctor-detail",
                args=[self.doctor.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "user",
                "full_name",
                "email",
                "phone_number",
                "specialization",
                "license_number",
                "experience_years",
                "is_available",
                "is_archived",
                "created_at",
                "updated_at",
            }
        )

    def test_create_accepts_active_user_without_profile(self):

        user = User.objects.create_user(
            email="new-doctor@example.com",
            phone_number="+8801700000003",
            full_name="New Doctor",
            password="StrongPass123!",
            is_active=True,
        )

        response = self.client.post(
            reverse("doctor-list-create"),
            self.doctor_payload(user, "DOC-002"),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )
        self.assertEqual(
            response.data["phone_number"],
            user.phone_number
        )
        self.assertFalse(response.data["is_archived"])

    def test_create_rejects_inactive_user(self):

        user = User.objects.create_user(
            email="inactive@example.com",
            phone_number="+8801700000004",
            full_name="Inactive User",
            password="StrongPass123!",
            is_active=False,
        )

        response = self.client.post(
            reverse("doctor-list-create"),
            self.doctor_payload(user, "DOC-003"),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("user", response.data)

    def test_create_rejects_unknown_user(self):

        unknown_user_id = (
            User.objects.order_by("-pk").first().pk
            + 1
        )

        response = self.client.post(
            reverse("doctor-list-create"),
            self.doctor_payload(
                unknown_user_id,
                "DOC-005"
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("user", response.data)

    def test_create_rejects_user_with_doctor_profile(self):

        response = self.client.post(
            reverse("doctor-list-create"),
            self.doctor_payload(
                self.doctor_user,
                "DOC-004"
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("user", response.data)

    def test_update_rejects_user_reassignment(self):

        other_user = User.objects.create_user(
            email="other@example.com",
            phone_number="+8801700000005",
            full_name="Other User",
            password="StrongPass123!",
            is_active=True,
        )

        response = self.client.patch(
            reverse(
                "doctor-detail",
                args=[self.doctor.pk]
            ),
            {
                "user": other_user.pk,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("user", response.data)

        self.doctor.refresh_from_db()
        self.assertEqual(
            self.doctor.user_id,
            self.doctor_user.pk
        )

    def test_archived_doctors_are_excluded_from_list(self):

        self.doctor.is_archived = True
        self.doctor.save(
            update_fields=["is_archived"]
        )

        response = self.client.get(
            reverse("doctor-list-create")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(response.data, [])

    def test_delete_archives_doctor_without_deleting_it(self):

        response = self.client.delete(
            reverse(
                "doctor-detail",
                args=[self.doctor.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.doctor.refresh_from_db()
        self.assertTrue(self.doctor.is_archived)

    def test_staff_can_update_archive_status(self):

        response = self.client.patch(
            reverse(
                "doctor-detail",
                args=[self.doctor.pk]
            ),
            {
                "is_archived": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.doctor.refresh_from_db()
        self.assertTrue(self.doctor.is_archived)

    def test_non_staff_cannot_update_archive_status(self):

        self.client.force_authenticate(
            user=self.doctor_user
        )

        response = self.client.patch(
            reverse(
                "doctor-detail",
                args=[self.doctor.pk]
            ),
            {
                "is_archived": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )
        self.doctor.refresh_from_db()
        self.assertFalse(self.doctor.is_archived)

    def test_appointments_remain_after_doctor_is_archived(self):

        patient = Patient.objects.create(
            created_by=self.staff_user,
            full_name="Test Patient",
            gender="other",
            phone_number="+8801700000006",
        )

        appointment = Appointment.objects.create(
            created_by=self.staff_user,
            patient=patient,
            doctor=self.doctor,
            appointment_date=(
                date.today()
                + timedelta(days=1)
            ),
            appointment_time=time(10, 0),
        )

        response = self.client.delete(
            reverse(
                "doctor-detail",
                args=[self.doctor.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )
        self.assertTrue(
            Doctor.objects.filter(
                pk=self.doctor.pk,
                is_archived=True,
            ).exists()
        )
        self.assertTrue(
            Appointment.objects.filter(
                pk=appointment.pk,
                doctor=self.doctor,
            ).exists()
        )

    def test_staff_can_restore_archived_doctor(self):

        self.doctor.is_archived = True
        self.doctor.save(
            update_fields=["is_archived"]
        )

        response = self.client.post(
            reverse(
                "doctor-restore",
                args=[self.doctor.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertFalse(response.data["is_archived"])

        self.doctor.refresh_from_db()
        self.assertFalse(self.doctor.is_archived)

    def test_restoring_active_doctor_is_idempotent(self):

        doctor_count = Doctor.objects.count()

        response = self.client.post(
            reverse(
                "doctor-restore",
                args=[self.doctor.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(response.data["id"], self.doctor.pk)
        self.assertFalse(response.data["is_archived"])
        self.assertEqual(Doctor.objects.count(), doctor_count)

    def test_non_staff_cannot_restore_doctor(self):

        self.doctor.is_archived = True
        self.doctor.save(
            update_fields=["is_archived"]
        )
        self.client.force_authenticate(
            user=self.doctor_user
        )

        response = self.client.post(
            reverse(
                "doctor-restore",
                args=[self.doctor.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

        self.doctor.refresh_from_db()
        self.assertTrue(self.doctor.is_archived)

    def test_restored_doctor_appears_in_normal_list(self):

        self.doctor.is_archived = True
        self.doctor.save(
            update_fields=["is_archived"]
        )

        restore_response = self.client.post(
            reverse(
                "doctor-restore",
                args=[self.doctor.pk]
            )
        )
        response = self.client.get(
            reverse("doctor-list-create")
        )

        self.assertEqual(
            restore_response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertIn(
            self.doctor.pk,
            [doctor["id"] for doctor in response.data]
        )

    def test_staff_can_include_archived_doctors(self):

        self.doctor.is_archived = True
        self.doctor.save(
            update_fields=["is_archived"]
        )

        response = self.client.get(
            reverse("doctor-list-create"),
            {"include_archived": "true"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertIn(
            self.doctor.pk,
            [doctor["id"] for doctor in response.data]
        )

    def test_non_staff_cannot_include_archived_doctors(self):

        self.client.force_authenticate(
            user=self.doctor_user
        )

        response = self.client.get(
            reverse("doctor-list-create"),
            {"include_archived": "true"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_anonymous_user_cannot_include_archived_doctors(self):

        self.client.force_authenticate(user=None)

        response = self.client.get(
            reverse("doctor-list-create"),
            {"include_archived": "true"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_non_staff_cannot_retrieve_archived_doctor(self):

        self.doctor.is_archived = True
        self.doctor.save(
            update_fields=["is_archived"]
        )

        self.client.force_authenticate(
            user=self.doctor_user
        )

        response = self.client.get(
            reverse(
                "doctor-detail",
                args=[self.doctor.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_staff_can_retrieve_archived_doctor(self):

        self.doctor.is_archived = True
        self.doctor.save(
            update_fields=["is_archived"]
        )

        response = self.client.get(
            reverse(
                "doctor-detail",
                args=[self.doctor.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertTrue(response.data["is_archived"])

    def test_active_doctor_behavior_is_unchanged(self):

        self.client.force_authenticate(
            user=self.doctor_user
        )

        detail_response = self.client.get(
            reverse(
                "doctor-detail",
                args=[self.doctor.pk]
            )
        )
        list_response = self.client.get(
            reverse("doctor-list-create")
        )

        self.assertEqual(
            detail_response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            list_response.status_code,
            status.HTTP_200_OK
        )
        self.assertIn(
            self.doctor.pk,
            [doctor["id"] for doctor in list_response.data]
        )
