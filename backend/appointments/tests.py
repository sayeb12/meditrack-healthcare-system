from datetime import date, time, timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
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

    def create_lifecycle_appointment(
        self,
        appointment_status,
        appointment_time,
    ):

        return Appointment.objects.create(
            created_by=self.other_creator,
            patient=self.other_patient,
            doctor=self.doctor,
            appointment_date=(
                date.today() + timedelta(days=2)
            ),
            appointment_time=appointment_time,
            status=appointment_status,
            reason="Lifecycle appointment",
        )

    def post_lifecycle_action(
        self,
        appointment,
        action,
    ):

        return self.client.post(
            reverse(
                f"appointment-{action}",
                args=[appointment.pk]
            ),
            {},
            format="json",
        )

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

    def test_confirmed_status_is_available_after_migration(self):

        status_choices = dict(
            Appointment._meta
            .get_field("status")
            .choices
        )

        self.assertEqual(
            status_choices["confirmed"],
            "Confirmed"
        )

        self.creator_appointment.status = "confirmed"
        self.creator_appointment.save(
            update_fields=["status"]
        )
        self.creator_appointment.refresh_from_db()

        self.assertEqual(
            self.creator_appointment.status,
            "confirmed"
        )

    def test_all_valid_lifecycle_transitions(self):

        self.authenticate(self.doctor_user)

        transitions = [
            (
                "confirm",
                "scheduled",
                "confirmed",
            ),
            (
                "cancel",
                "scheduled",
                "cancelled",
            ),
            (
                "complete",
                "confirmed",
                "completed",
            ),
            (
                "cancel",
                "confirmed",
                "cancelled",
            ),
            (
                "no-show",
                "confirmed",
                "no_show",
            ),
        ]

        for index, transition in enumerate(transitions):
            action, source_status, target_status = transition

            with self.subTest(
                source=source_status,
                target=target_status,
            ):
                appointment = self.create_lifecycle_appointment(
                    source_status,
                    time(13, index),
                )

                response = self.post_lifecycle_action(
                    appointment,
                    action,
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_200_OK
                )
                self.assertEqual(
                    response.data["status"],
                    target_status
                )

                appointment.refresh_from_db()
                self.assertEqual(
                    appointment.status,
                    target_status
                )

    def test_invalid_lifecycle_transitions_are_rejected(self):

        self.authenticate(self.staff_doctor_user)

        invalid_transitions = [
            (
                "confirm",
                "confirmed",
            ),
            (
                "complete",
                "scheduled",
            ),
            (
                "no-show",
                "scheduled",
            ),
            (
                "cancel",
                "completed",
            ),
        ]

        for index, transition in enumerate(
            invalid_transitions
        ):
            action, source_status = transition

            with self.subTest(
                action=action,
                source=source_status,
            ):
                appointment = self.create_lifecycle_appointment(
                    source_status,
                    time(14, index),
                )

                response = self.post_lifecycle_action(
                    appointment,
                    action,
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST
                )
                self.assertIn("status", response.data)

                appointment.refresh_from_db()
                self.assertEqual(
                    appointment.status,
                    source_status
                )

    def test_creator_can_cancel_own_appointment(self):

        self.authenticate(self.creator)
        appointment_count = Appointment.objects.count()

        response = self.post_lifecycle_action(
            self.creator_appointment,
            "cancel",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            response.data["status"],
            "cancelled"
        )

        self.creator_appointment.refresh_from_db()
        self.assertEqual(
            self.creator_appointment.status,
            "cancelled"
        )
        self.assertEqual(
            Appointment.objects.count(),
            appointment_count
        )

    def test_creator_cannot_use_clinical_lifecycle_actions(self):

        self.authenticate(self.creator)

        actions = [
            (
                "confirm",
                "scheduled",
            ),
            (
                "complete",
                "confirmed",
            ),
            (
                "no-show",
                "confirmed",
            ),
        ]

        for index, action_details in enumerate(actions):
            action, appointment_status = action_details

            with self.subTest(action=action):
                appointment = Appointment.objects.create(
                    created_by=self.creator,
                    patient=self.creator_patient,
                    doctor=self.other_doctor,
                    appointment_date=(
                        date.today() + timedelta(days=2)
                    ),
                    appointment_time=time(15, index),
                    status=appointment_status,
                )

                response = self.post_lifecycle_action(
                    appointment,
                    action,
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_404_NOT_FOUND
                )

                appointment.refresh_from_db()
                self.assertEqual(
                    appointment.status,
                    appointment_status
                )

    def test_doctor_cannot_confirm_unassigned_created_appointment(self):

        self.authenticate(self.doctor_user)

        response = self.post_lifecycle_action(
            self.doctor_created_appointment,
            "confirm",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.doctor_created_appointment.refresh_from_db()
        self.assertEqual(
            self.doctor_created_appointment.status,
            "scheduled"
        )

    def test_staff_can_manage_unrelated_appointment_lifecycle(self):

        self.authenticate(self.staff_doctor_user)

        confirm_response = self.post_lifecycle_action(
            self.unrelated_appointment,
            "confirm",
        )
        complete_response = self.post_lifecycle_action(
            self.unrelated_appointment,
            "complete",
        )

        self.assertEqual(
            confirm_response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            complete_response.status_code,
            status.HTTP_200_OK
        )

        self.unrelated_appointment.refresh_from_db()
        self.assertEqual(
            self.unrelated_appointment.status,
            "completed"
        )

    def test_unrelated_user_cannot_cancel_appointment(self):

        self.authenticate(self.creator)

        response = self.post_lifecycle_action(
            self.assigned_appointment,
            "cancel",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.assigned_appointment.refresh_from_db()
        self.assertEqual(
            self.assigned_appointment.status,
            "scheduled"
        )

    def test_lifecycle_action_preserves_appointment_data(self):

        previous_updated_at = (
            timezone.now() - timedelta(days=1)
        )
        Appointment.objects.filter(
            pk=self.assigned_appointment.pk
        ).update(
            consultation_notes="Existing clinical notes",
            updated_at=previous_updated_at,
        )
        self.assigned_appointment.refresh_from_db()

        preserved_values = {
            "created_by_id": (
                self.assigned_appointment.created_by_id
            ),
            "patient_id": self.assigned_appointment.patient_id,
            "doctor_id": self.assigned_appointment.doctor_id,
            "appointment_date": (
                self.assigned_appointment.appointment_date
            ),
            "appointment_time": (
                self.assigned_appointment.appointment_time
            ),
            "reason": self.assigned_appointment.reason,
            "consultation_notes": (
                self.assigned_appointment.consultation_notes
            ),
            "created_at": self.assigned_appointment.created_at,
        }

        self.authenticate(self.doctor_user)
        response = self.post_lifecycle_action(
            self.assigned_appointment,
            "confirm",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assigned_appointment.refresh_from_db()

        for field, expected_value in preserved_values.items():
            self.assertEqual(
                getattr(self.assigned_appointment, field),
                expected_value,
            )

        self.assertEqual(
            self.assigned_appointment.status,
            "confirmed"
        )
        self.assertGreater(
            self.assigned_appointment.updated_at,
            previous_updated_at
        )

    def test_confirmed_appointment_keeps_time_slot_reserved(self):

        self.assigned_appointment.status = "confirmed"
        self.assigned_appointment.save(
            update_fields=["status"]
        )
        self.authenticate(self.creator)

        response = self.client.post(
            reverse("appointment-list-create"),
            {
                "patient": self.creator_patient.pk,
                "doctor": self.doctor.pk,
                "appointment_date": str(
                    self.assigned_appointment.appointment_date
                ),
                "appointment_time": "10:00",
                "reason": "Conflicting appointment",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn(
            "appointment_time",
            response.data
        )
