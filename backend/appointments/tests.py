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

    def test_doctor_can_update_notes_on_assigned_appointment(self):

        self.authenticate(self.doctor_user)

        response = self.client.patch(
            reverse(
                "appointment-detail",
                args=[self.assigned_appointment.pk]
            ),
            {
                "consultation_notes": "Doctor clinical notes",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assigned_appointment.refresh_from_db()
        self.assertEqual(
            self.assigned_appointment.consultation_notes,
            "Doctor clinical notes"
        )

    def test_staff_has_broader_update_access(self):

        self.authenticate(self.staff_doctor_user)

        response = self.client.patch(
            reverse(
                "appointment-detail",
                args=[self.creator_appointment.pk]
            ),
            {
                "reason": "Staff updated reason",
                "consultation_notes": "Staff clinical notes",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.creator_appointment.refresh_from_db()
        self.assertEqual(
            self.creator_appointment.reason,
            "Staff updated reason"
        )
        self.assertEqual(
            self.creator_appointment.consultation_notes,
            "Staff clinical notes"
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

    def test_get_preserves_read_serializer_response_fields(self):

        self.authenticate(self.creator)

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
            set(response.data.keys()),
            {
                "id",
                "created_by",
                "patient",
                "patient_name",
                "doctor",
                "doctor_name",
                "doctor_specialization",
                "appointment_date",
                "appointment_time",
                "status",
                "reason",
                "consultation_notes",
                "created_at",
                "updated_at",
            }
        )
        self.assertEqual(
            response.data["created_by"],
            self.creator.email
        )
        self.assertEqual(
            response.data["patient_name"],
            self.creator_patient.full_name
        )

    def test_create_still_works(self):

        self.authenticate(self.creator)

        response = self.client.post(
            reverse("appointment-list-create"),
            {
                "patient": self.creator_patient.pk,
                "doctor": self.doctor.pk,
                "appointment_date": str(
                    date.today() + timedelta(days=2)
                ),
                "appointment_time": "13:00",
                "status": "scheduled",
                "reason": "New appointment",
                "consultation_notes": "",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )
        self.assertEqual(
            response.data["patient_name"],
            self.creator_patient.full_name
        )
        self.assertEqual(
            response.data["doctor_name"],
            self.doctor_user.full_name
        )

    def test_created_by_remains_automatic(self):

        self.authenticate(self.creator)

        response = self.client.post(
            reverse("appointment-list-create"),
            {
                "created_by": self.other_creator.email,
                "patient": self.creator_patient.pk,
                "doctor": self.doctor.pk,
                "appointment_date": str(
                    date.today() + timedelta(days=2)
                ),
                "appointment_time": "14:00",
                "reason": "Automatic creator",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        appointment = Appointment.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            appointment.created_by,
            self.creator
        )
        self.assertEqual(
            response.data["created_by"],
            self.creator.email
        )

    def test_doctor_cannot_reassign_patient_or_doctor(self):

        self.authenticate(self.doctor_user)

        response = self.client.patch(
            reverse(
                "appointment-detail",
                args=[self.assigned_appointment.pk]
            ),
            {
                "patient": self.doctor_patient.pk,
                "doctor": self.other_doctor.pk,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("patient", response.data)
        self.assertIn("doctor", response.data)

        self.assigned_appointment.refresh_from_db()
        self.assertEqual(
            self.assigned_appointment.patient,
            self.other_patient
        )
        self.assertEqual(
            self.assigned_appointment.doctor,
            self.doctor
        )

    def test_creator_cannot_update_consultation_notes(self):

        self.authenticate(self.creator)

        response = self.client.patch(
            reverse(
                "appointment-detail",
                args=[self.creator_appointment.pk]
            ),
            {
                "consultation_notes": "Creator notes",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn(
            "consultation_notes",
            response.data
        )

        self.creator_appointment.refresh_from_db()
        self.assertEqual(
            self.creator_appointment.consultation_notes,
            ""
        )

    def test_creator_can_update_with_unchanged_protected_fields(self):

        self.authenticate(self.creator)

        response = self.client.patch(
            reverse(
                "appointment-detail",
                args=[self.creator_appointment.pk]
            ),
            {
                "reason": "Updated creator reason",
                "status": self.creator_appointment.status,
                "consultation_notes": (
                    self.creator_appointment.consultation_notes
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.creator_appointment.refresh_from_db()
        self.assertEqual(
            self.creator_appointment.reason,
            "Updated creator reason"
        )
        self.assertEqual(
            self.creator_appointment.status,
            "scheduled"
        )
        self.assertEqual(
            self.creator_appointment.consultation_notes,
            ""
        )

    def test_staff_can_reassign_patient_and_doctor(self):

        self.authenticate(self.staff_doctor_user)

        response = self.client.patch(
            reverse(
                "appointment-detail",
                args=[self.creator_appointment.pk]
            ),
            {
                "patient": self.other_patient.pk,
                "doctor": self.doctor.pk,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.creator_appointment.refresh_from_db()
        self.assertEqual(
            self.creator_appointment.patient,
            self.other_patient
        )
        self.assertEqual(
            self.creator_appointment.doctor,
            self.doctor
        )

    def test_status_cannot_be_changed_through_patch(self):

        self.authenticate(self.staff_doctor_user)

        response = self.client.patch(
            reverse(
                "appointment-detail",
                args=[self.creator_appointment.pk]
            ),
            {
                "status": "completed",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("status", response.data)

        self.creator_appointment.refresh_from_db()
        self.assertEqual(
            self.creator_appointment.status,
            "scheduled"
        )

    def test_archived_doctor_cannot_be_selected(self):

        self.other_doctor.is_archived = True
        self.other_doctor.save(
            update_fields=["is_archived"]
        )
        self.authenticate(self.creator)

        response = self.client.post(
            reverse("appointment-list-create"),
            {
                "patient": self.creator_patient.pk,
                "doctor": self.other_doctor.pk,
                "appointment_date": str(
                    date.today() + timedelta(days=2)
                ),
                "appointment_time": "15:00",
                "reason": "Archived doctor appointment",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("doctor", response.data)

    def test_inactive_or_unavailable_doctor_cannot_be_selected(self):

        self.authenticate(self.creator)

        cases = [
            (
                "inactive",
                {
                    "user_active": False,
                    "doctor_available": True,
                },
            ),
            (
                "unavailable",
                {
                    "user_active": True,
                    "doctor_available": False,
                },
            ),
        ]

        for label, doctor_state in cases:
            with self.subTest(label=label):
                self.other_doctor_user.is_active = (
                    doctor_state["user_active"]
                )
                self.other_doctor_user.save(
                    update_fields=["is_active"]
                )

                self.other_doctor.is_available = (
                    doctor_state["doctor_available"]
                )
                self.other_doctor.save(
                    update_fields=["is_available"]
                )

                response = self.client.post(
                    reverse("appointment-list-create"),
                    {
                        "patient": self.creator_patient.pk,
                        "doctor": self.other_doctor.pk,
                        "appointment_date": str(
                            date.today() + timedelta(days=2)
                        ),
                        "appointment_time": "16:00",
                        "reason": f"{label} doctor appointment",
                    },
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST
                )
                self.assertIn("doctor", response.data)
