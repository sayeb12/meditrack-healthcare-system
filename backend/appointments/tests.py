from datetime import date, time, timedelta

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from doctors.models import Doctor
from patients.models import Patient

from .models import Appointment


class AppointmentReadAccessTests(TestCase):

    def setUp(self):

        self.creator = self.create_user(
            "creator@example.com",
            "+8801700000101",
            "Appointment Creator",
        )

        self.other_creator = self.create_user(
            "other@example.com",
            "+8801700000102",
            "Other Creator",
        )

        self.doctor_user = self.create_user(
            "doctor@example.com",
            "+8801700000103",
            "Assigned Doctor",
        )

        self.other_doctor_user = self.create_user(
            "other-doctor@example.com",
            "+8801700000104",
            "Other Doctor",
        )

        self.staff_doctor_user = self.create_user(
            "staff-doctor@example.com",
            "+8801700000105",
            "Staff Doctor",
            is_staff=True,
        )

        self.doctor = self.create_doctor(
            self.doctor_user,
            "READ-DOC-001",
        )

        self.other_doctor = self.create_doctor(
            self.other_doctor_user,
            "READ-DOC-002",
        )

        self.staff_doctor = self.create_doctor(
            self.staff_doctor_user,
            "READ-DOC-003",
        )

        self.creator_patient = self.create_patient(
            self.creator,
            "Creator Patient",
            "+8801700000201",
        )

        self.other_patient = self.create_patient(
            self.other_creator,
            "Other Patient",
            "+8801700000202",
        )

        self.doctor_patient = self.create_patient(
            self.doctor_user,
            "Doctor-created Patient",
            "+8801700000203",
        )

        appointment_date = (
            date.today() + timedelta(days=1)
        )

        self.creator_appointment = Appointment.objects.create(
            created_by=self.creator,
            patient=self.creator_patient,
            doctor=self.other_doctor,
            appointment_date=appointment_date,
            appointment_time=time(9, 0),
            reason="Creator appointment",
        )

        self.assigned_appointment = Appointment.objects.create(
            created_by=self.other_creator,
            patient=self.other_patient,
            doctor=self.doctor,
            appointment_date=appointment_date,
            appointment_time=time(10, 0),
            reason="Assigned appointment",
        )

        self.unrelated_appointment = Appointment.objects.create(
            created_by=self.other_creator,
            patient=self.other_patient,
            doctor=self.other_doctor,
            appointment_date=appointment_date,
            appointment_time=time(11, 0),
            reason="Unrelated appointment",
        )

        self.doctor_created_appointment = (
            Appointment.objects.create(
                created_by=self.doctor_user,
                patient=self.doctor_patient,
                doctor=self.other_doctor,
                appointment_date=appointment_date,
                appointment_time=time(12, 0),
                reason="Doctor-created appointment",
            )
        )

        self.client = APIClient()

    def create_user(
        self,
        email,
        phone_number,
        full_name,
        is_staff=False,
    ):

        return User.objects.create_user(
            email=email,
            phone_number=phone_number,
            full_name=full_name,
            password="StrongPass123!",
            is_active=True,
            is_staff=is_staff,
        )

    def create_doctor(
        self,
        user,
        license_number,
    ):

        return Doctor.objects.create(
            user=user,
            specialization="General Medicine",
            license_number=license_number,
            experience_years=5,
            is_available=True,
        )

    def create_patient(
        self,
        created_by,
        full_name,
        phone_number,
    ):

        return Patient.objects.create(
            created_by=created_by,
            full_name=full_name,
            gender="other",
            phone_number=phone_number,
        )

    def authenticate(self, user):

        self.client.force_authenticate(user=user)

    def response_ids(self, response):

        data = response.data

        if isinstance(data, dict):
            data = data.get("results", [])

        return {
            appointment["id"]
            for appointment in data
        }

    def test_anonymous_user_receives_401(self):

        response = self.client.get(
            reverse("appointment-list-create")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_staff_can_list_all_appointments(self):

        self.authenticate(self.staff_doctor_user)

        response = self.client.get(
            reverse("appointment-list-create")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            self.response_ids(response),
            set(
                Appointment.objects.values_list(
                    "id",
                    flat=True,
                )
            )
        )

    def test_staff_can_retrieve_any_appointment(self):

        self.authenticate(self.staff_doctor_user)

        response = self.client.get(
            reverse(
                "appointment-detail",
                args=[self.creator_appointment.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            response.data["id"],
            self.creator_appointment.pk
        )

    def test_doctor_can_list_assigned_and_created_appointments(self):

        self.authenticate(self.doctor_user)

        response = self.client.get(
            reverse("appointment-list-create")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            self.response_ids(response),
            {
                self.assigned_appointment.pk,
                self.doctor_created_appointment.pk,
            }
        )

    def test_doctor_cannot_access_unrelated_appointment(self):

        self.authenticate(self.doctor_user)

        response = self.client.get(
            reverse(
                "appointment-detail",
                args=[self.unrelated_appointment.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_creator_can_still_access_own_appointment(self):

        self.authenticate(self.creator)

        list_response = self.client.get(
            reverse("appointment-list-create")
        )
        detail_response = self.client.get(
            reverse(
                "appointment-detail",
                args=[self.creator_appointment.pk]
            )
        )

        self.assertEqual(
            list_response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            self.response_ids(list_response),
            {self.creator_appointment.pk}
        )
        self.assertEqual(
            detail_response.status_code,
            status.HTTP_200_OK
        )

    def test_creator_cannot_access_another_users_appointment(self):

        self.authenticate(self.creator)

        response = self.client.get(
            reverse(
                "appointment-detail",
                args=[self.unrelated_appointment.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_staff_doctor_account_uses_staff_access(self):

        self.authenticate(self.staff_doctor_user)

        response = self.client.get(
            reverse("appointment-list-create")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertIn(
            self.unrelated_appointment.pk,
            self.response_ids(response)
        )

    def test_doctor_cannot_update_assigned_appointment(self):

        self.authenticate(self.doctor_user)

        response = self.client.patch(
            reverse(
                "appointment-detail",
                args=[self.assigned_appointment.pk]
            ),
            {
                "reason": "Doctor update attempt",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.assigned_appointment.refresh_from_db()
        self.assertEqual(
            self.assigned_appointment.reason,
            "Assigned appointment"
        )

    def test_staff_cannot_update_appointment_they_did_not_create(self):

        self.authenticate(self.staff_doctor_user)

        response = self.client.patch(
            reverse(
                "appointment-detail",
                args=[self.creator_appointment.pk]
            ),
            {
                "reason": "Staff update attempt",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.creator_appointment.refresh_from_db()
        self.assertEqual(
            self.creator_appointment.reason,
            "Creator appointment"
        )

    def test_staff_cannot_delete_appointment_they_did_not_create(self):

        self.authenticate(self.staff_doctor_user)

        response = self.client.delete(
            reverse(
                "appointment-detail",
                args=[self.creator_appointment.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )
        self.assertTrue(
            Appointment.objects.filter(
                pk=self.creator_appointment.pk
            ).exists()
        )
