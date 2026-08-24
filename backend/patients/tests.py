from datetime import date, time, timedelta

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from appointments.models import Appointment
from doctors.models import Doctor

from .models import Patient


class PatientAPICharacterizationTests(TestCase):

    def setUp(self):

        self.user_a = User.objects.create_user(
            email="owner-a@example.com",
            phone_number="+8801700000001",
            full_name="Owner A",
            password="StrongPass123!",
            is_active=True,
        )

        self.user_b = User.objects.create_user(
            email="owner-b@example.com",
            phone_number="+8801700000002",
            full_name="Owner B",
            password="StrongPass123!",
            is_active=True,
        )

        self.staff_user = User.objects.create_user(
            email="staff@example.com",
            phone_number="+8801700000003",
            full_name="Staff User",
            password="StrongPass123!",
            is_active=True,
            is_staff=True,
        )

        self.doctor_user = User.objects.create_user(
            email="doctor@example.com",
            phone_number="+8801700000004",
            full_name="Doctor User",
            password="StrongPass123!",
            is_active=True,
        )

        self.patient_a = Patient.objects.create(
            created_by=self.user_a,
            full_name="Patient A",
            date_of_birth="1990-01-01",
            gender="female",
            phone_number="01700000001",
            email="patient-a@example.com",
            address="Dhaka",
            blood_group="A+",
            medical_notes="Owner A patient",
        )

        self.patient_b = Patient.objects.create(
            created_by=self.user_b,
            full_name="Patient B",
            gender="male",
            phone_number="01700000002",
            email="patient-b@example.com",
        )

        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            specialization="Cardiology",
            license_number="PATIENT-READ-001",
            experience_years=5,
            is_available=True,
        )

        self.assigned_appointment = (
            Appointment.objects.create(
                created_by=self.user_a,
                patient=self.patient_a,
                doctor=self.doctor,
                appointment_date=(
                    date.today() + timedelta(days=1)
                ),
                appointment_time=time(10, 0),
            )
        )

        self.client = APIClient()


    def patient_payload(self, **overrides):

        payload = {
            "full_name": "New Patient",
            "date_of_birth": "1995-05-15",
            "gender": "other",
            "phone_number": "01700000003",
            "email": "new-patient@example.com",
            "address": "Chattogram",
            "blood_group": "O+",
            "medical_notes": "Initial notes",
        }

        payload.update(overrides)

        return payload


    def authenticate(self, user):

        self.client.force_authenticate(user=user)


    def test_anonymous_user_cannot_list_patients(self):

        response = self.client.get(
            reverse("patient-list-create")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


    def test_anonymous_user_cannot_create_patient(self):

        response = self.client.post(
            reverse("patient-list-create"),
            self.patient_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


    def test_owner_can_list_own_patients(self):

        self.authenticate(self.user_a)

        response = self.client.get(
            reverse("patient-list-create")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            [patient["id"] for patient in response.data],
            [self.patient_a.pk]
        )


    def test_owner_can_retrieve_own_patient(self):

        self.authenticate(self.user_a)

        response = self.client.get(
            reverse(
                "patient-detail",
                args=[self.patient_a.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            response.data["id"],
            self.patient_a.pk
        )


    def test_owner_can_update_own_patient(self):

        self.authenticate(self.user_a)

        response = self.client.patch(
            reverse(
                "patient-detail",
                args=[self.patient_a.pk]
            ),
            {
                "full_name": "Updated Patient A",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.patient_a.refresh_from_db()
        self.assertEqual(
            self.patient_a.full_name,
            "Updated Patient A"
        )


    def test_owner_can_permanently_delete_own_patient(self):

        self.authenticate(self.user_a)

        response = self.client.delete(
            reverse(
                "patient-detail",
                args=[self.patient_a.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )
        self.assertFalse(
            Patient.objects.filter(
                pk=self.patient_a.pk
            ).exists()
        )


    def test_user_list_excludes_other_users_patients(self):

        self.authenticate(self.user_a)

        response = self.client.get(
            reverse("patient-list-create")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertNotIn(
            self.patient_b.pk,
            [patient["id"] for patient in response.data]
        )


    def test_user_cannot_retrieve_another_users_patient(self):

        self.authenticate(self.user_a)

        response = self.client.get(
            reverse(
                "patient-detail",
                args=[self.patient_b.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )


    def test_user_cannot_update_another_users_patient(self):

        self.authenticate(self.user_a)

        response = self.client.patch(
            reverse(
                "patient-detail",
                args=[self.patient_b.pk]
            ),
            {
                "full_name": "Unauthorized Update",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.patient_b.refresh_from_db()
        self.assertEqual(
            self.patient_b.full_name,
            "Patient B"
        )


    def test_user_cannot_delete_another_users_patient(self):

        self.authenticate(self.user_a)

        response = self.client.delete(
            reverse(
                "patient-detail",
                args=[self.patient_b.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )
        self.assertTrue(
            Patient.objects.filter(
                pk=self.patient_b.pk
            ).exists()
        )


    def test_staff_can_list_all_patients(self):

        self.authenticate(self.staff_user)

        response = self.client.get(
            reverse("patient-list-create")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            {
                patient["id"]
                for patient in response.data
            },
            {
                self.patient_a.pk,
                self.patient_b.pk,
            }
        )


    def test_staff_can_retrieve_any_patient(self):

        self.authenticate(self.staff_user)

        response = self.client.get(
            reverse(
                "patient-detail",
                args=[self.patient_b.pk]
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(
            response.data["id"],
            self.patient_b.pk
        )


    def test_doctor_can_read_assigned_patient(self):

        self.authenticate(self.doctor_user)

        list_response = self.client.get(
            reverse("patient-list-create")
        )
        detail_response = self.client.get(
            reverse(
                "patient-detail",
                args=[self.patient_a.pk]
            )
        )

        self.assertEqual(
            list_response.status_code,
            status.HTTP_200_OK
        )
        self.assertIn(
            self.patient_a.pk,
            [
                patient["id"]
                for patient in list_response.data
            ]
        )
        self.assertEqual(
            detail_response.status_code,
            status.HTTP_200_OK
        )


    def test_doctor_cannot_read_unrelated_patient(self):

        self.authenticate(self.doctor_user)

        list_response = self.client.get(
            reverse("patient-list-create")
        )
        detail_response = self.client.get(
            reverse(
                "patient-detail",
                args=[self.patient_b.pk]
            )
        )

        self.assertEqual(
            list_response.status_code,
            status.HTTP_200_OK
        )
        self.assertNotIn(
            self.patient_b.pk,
            [
                patient["id"]
                for patient in list_response.data
            ]
        )
        self.assertEqual(
            detail_response.status_code,
            status.HTTP_404_NOT_FOUND
        )


    def test_staff_write_access_remains_creator_scoped(self):

        self.authenticate(self.staff_user)

        update_response = self.client.patch(
            reverse(
                "patient-detail",
                args=[self.patient_b.pk]
            ),
            {
                "full_name": "Staff Update",
            },
            format="json",
        )
        delete_response = self.client.delete(
            reverse(
                "patient-detail",
                args=[self.patient_b.pk]
            )
        )

        self.assertEqual(
            update_response.status_code,
            status.HTTP_404_NOT_FOUND
        )
        self.assertEqual(
            delete_response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.patient_b.refresh_from_db()
        self.assertEqual(
            self.patient_b.full_name,
            "Patient B"
        )


    def test_assigned_doctor_write_access_remains_creator_scoped(self):

        self.authenticate(self.doctor_user)

        update_response = self.client.patch(
            reverse(
                "patient-detail",
                args=[self.patient_a.pk]
            ),
            {
                "full_name": "Doctor Update",
            },
            format="json",
        )
        delete_response = self.client.delete(
            reverse(
                "patient-detail",
                args=[self.patient_a.pk]
            )
        )

        self.assertEqual(
            update_response.status_code,
            status.HTTP_404_NOT_FOUND
        )
        self.assertEqual(
            delete_response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.patient_a.refresh_from_db()
        self.assertEqual(
            self.patient_a.full_name,
            "Patient A"
        )


    def test_staff_can_still_create_patient_owned_by_staff(self):

        self.authenticate(self.staff_user)

        response = self.client.post(
            reverse("patient-list-create"),
            self.patient_payload(
                phone_number="01700000005"
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        patient = Patient.objects.get(
            pk=response.data["id"]
        )
        self.assertEqual(
            patient.created_by,
            self.staff_user
        )


    def test_created_by_is_assigned_to_authenticated_user(self):

        self.authenticate(self.user_a)

        response = self.client.post(
            reverse("patient-list-create"),
            self.patient_payload(),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        patient = Patient.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            patient.created_by,
            self.user_a
        )
        self.assertEqual(
            response.data["created_by"],
            self.user_a.email
        )


    def test_client_cannot_assign_another_owner(self):

        self.authenticate(self.user_a)

        response = self.client.post(
            reverse("patient-list-create"),
            self.patient_payload(
                created_by=self.user_b.pk
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        patient = Patient.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            patient.created_by,
            self.user_a
        )
        self.assertNotEqual(
            patient.created_by,
            self.user_b
        )


    def test_create_requires_required_fields(self):

        self.authenticate(self.user_a)

        response = self.client.post(
            reverse("patient-list-create"),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("full_name", response.data)
        self.assertIn("gender", response.data)
        self.assertIn("phone_number", response.data)


    def test_create_rejects_invalid_gender_choice(self):

        self.authenticate(self.user_a)

        response = self.client.post(
            reverse("patient-list-create"),
            self.patient_payload(
                gender="invalid"
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("gender", response.data)


    def test_create_rejects_invalid_email_format(self):

        self.authenticate(self.user_a)

        response = self.client.post(
            reverse("patient-list-create"),
            self.patient_payload(
                email="not-an-email"
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )
        self.assertIn("email", response.data)
