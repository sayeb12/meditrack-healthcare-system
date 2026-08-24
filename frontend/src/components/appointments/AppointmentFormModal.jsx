import {
    useCallback,
    useEffect,
    useState,
} from "react";

import "./AppointmentFormModal.css";


const EMPTY_FORM = {
    patient: "",
    doctor: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    consultation_notes: "",
};


const getTodayString = () => {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


const getInitialForm = (
    mode,
    appointment
) => {
    if (
        mode !== "edit" ||
        !appointment
    ) {
        return {
            ...EMPTY_FORM,
        };
    }

    return {
        patient: String(
            appointment.patient || ""
        ),
        doctor: String(
            appointment.doctor || ""
        ),
        appointment_date:
            appointment.appointment_date ||
            "",
        appointment_time:
            appointment.appointment_time
                ?.slice(0, 5) ||
            "",
        reason:
            appointment.reason || "",
        consultation_notes:
            appointment.consultation_notes ||
            "",
    };
};


function AppointmentFormDialog({
    mode,
    appointment,
    patients,
    doctors,
    onClose,
    onSaved,
}) {
    const [formData, setFormData] =
        useState(() =>
            getInitialForm(
                mode,
                appointment
            )
        );

    const [formError, setFormError] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    const isEdit = mode === "edit";


    const closeModal = useCallback(
        (force = false) => {
            if (
                saving &&
                force !== true
            ) {
                return;
            }

            setFormError("");
            onClose();
        },
        [onClose, saving]
    );


    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeModal();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [closeModal]);


    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));

        setFormError("");
    };


    const validateForm = () => {
        if (!formData.patient) {
            return "Please select a patient.";
        }

        if (!formData.doctor) {
            return "Please select a doctor.";
        }

        if (!formData.appointment_date) {
            return "Appointment date is required.";
        }

        if (!formData.appointment_time) {
            return "Appointment time is required.";
        }

        if (
            !isEdit &&
            formData.appointment_date <
                getTodayString()
        ) {
            return (
                "Appointment date cannot be in the past."
            );
        }

        if (!formData.reason.trim()) {
            return (
                "Please enter the reason for the appointment."
            );
        }

        return "";
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving) {
            return;
        }

        setFormError("");

        const validationError =
            validateForm();

        if (validationError) {
            setFormError(validationError);
            return;
        }

        const payload = {
            patient: Number(
                formData.patient
            ),
            doctor: Number(
                formData.doctor
            ),
            appointment_date:
                formData.appointment_date,
            appointment_time:
                formData.appointment_time,
            reason:
                formData.reason.trim(),
            consultation_notes:
                formData
                    .consultation_notes
                    .trim(),
        };

        if (!isEdit) {
            payload.status = "scheduled";
        }

        setSaving(true);

        try {
            await onSaved(
                payload,
                mode,
                appointment
            );

            closeModal(true);
        }

        catch (error) {
            setFormError(
                error.message ||
                "Unable to save appointment."
            );
        }

        finally {
            setSaving(false);
        }
    };


    return (
        <div
            className="appointment-form-modal-backdrop"
            onMouseDown={closeModal}
        >
            <div
                className="appointment-form-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="appointment-form-title"
                aria-busy={saving}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="appointment-form-modal-header">
                    <div>
                        <span>
                            {
                                isEdit
                                    ? "Update Schedule"
                                    : "New Schedule"
                            }
                        </span>

                        <h2 id="appointment-form-title">
                            {
                                isEdit
                                    ? "Edit Appointment"
                                    : "Create Appointment"
                            }
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="appointment-form-modal-close"
                        onClick={closeModal}
                        disabled={saving}
                        aria-label={
                            `Close ${isEdit ? "edit" : "create"} appointment dialog`
                        }
                    >
                        &times;
                    </button>
                </div>

                <form
                    className="appointment-form-content"
                    onSubmit={handleSubmit}
                >
                    <div className="appointment-form-fields">
                        <div className="appointment-form-field">
                            <label htmlFor="appointment-patient">
                                Patient <span>*</span>
                            </label>

                            <select
                                id="appointment-patient"
                                name="patient"
                                value={formData.patient}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Select patient
                                </option>

                                {patients.map((patient) => (
                                    <option
                                        key={patient.id}
                                        value={patient.id}
                                    >
                                        {patient.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="appointment-form-field">
                            <label htmlFor="appointment-doctor">
                                Doctor <span>*</span>
                            </label>

                            <select
                                id="appointment-doctor"
                                name="doctor"
                                value={formData.doctor}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Select doctor
                                </option>

                                {doctors.map((doctor) => (
                                    <option
                                        key={doctor.id}
                                        value={doctor.id}
                                        disabled={
                                            !doctor.is_available &&
                                            String(doctor.id) !==
                                                String(formData.doctor)
                                        }
                                    >
                                        {doctor.full_name}
                                        {" - "}
                                        {doctor.specialization}
                                        {
                                            !doctor.is_available
                                                ? " (Unavailable)"
                                                : ""
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="appointment-form-field">
                            <label htmlFor="appointment-date">
                                Date <span>*</span>
                            </label>

                            <input
                                id="appointment-date"
                                type="date"
                                name="appointment_date"
                                value={
                                    formData.appointment_date
                                }
                                min={
                                    isEdit
                                        ? undefined
                                        : getTodayString()
                                }
                                onChange={handleChange}
                            />
                        </div>

                        <div className="appointment-form-field">
                            <label htmlFor="appointment-time">
                                Time <span>*</span>
                            </label>

                            <input
                                id="appointment-time"
                                type="time"
                                name="appointment_time"
                                value={
                                    formData.appointment_time
                                }
                                onChange={handleChange}
                            />
                        </div>

                        <div className="appointment-form-field appointment-form-field-full">
                            <label htmlFor="appointment-reason">
                                Reason <span>*</span>
                            </label>

                            <textarea
                                id="appointment-reason"
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Reason for appointment"
                            />
                        </div>

                        <div className="appointment-form-field appointment-form-field-full">
                            <label htmlFor="appointment-notes">
                                Consultation Notes
                            </label>

                            <textarea
                                id="appointment-notes"
                                name="consultation_notes"
                                value={
                                    formData.consultation_notes
                                }
                                onChange={handleChange}
                                rows="4"
                                placeholder="Optional consultation notes"
                            />
                        </div>
                    </div>

                    {formError && (
                        <div
                            className="appointment-form-message"
                            role="alert"
                        >
                            {formError}
                        </div>
                    )}

                    <div className="appointment-form-modal-actions">
                        <button
                            type="button"
                            className="appointment-form-cancel"
                            onClick={closeModal}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="appointment-form-save"
                            disabled={saving}
                        >
                            {
                                saving
                                    ? "Saving..."
                                    : isEdit
                                        ? "Update Appointment"
                                        : "Create Appointment"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


function AppointmentFormModal({
    isOpen,
    mode,
    appointment,
    patients,
    doctors,
    onClose,
    onSaved,
}) {
    if (
        !isOpen ||
        !["create", "edit"].includes(mode) ||
        (mode === "edit" && !appointment)
    ) {
        return null;
    }

    return (
        <AppointmentFormDialog
            key={
                mode === "edit"
                    ? `edit-${appointment.id}`
                    : "create"
            }
            mode={mode}
            appointment={appointment}
            patients={patients}
            doctors={doctors}
            onClose={onClose}
            onSaved={onSaved}
        />
    );
}


export default AppointmentFormModal;
