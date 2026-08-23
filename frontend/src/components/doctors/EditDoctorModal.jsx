import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    apiRequest,
} from "../../api/client";

import "./EditDoctorModal.css";


const getInitialForm = (doctor) => ({
    specialization:
        doctor.specialization || "",
    license_number:
        doctor.license_number || "",
    experience_years:
        doctor.experience_years ?? "",
    is_available:
        Boolean(doctor.is_available),
});


const getFieldMessage = (value) => {
    if (Array.isArray(value)) {
        return value.join(" ");
    }

    if (typeof value === "string") {
        return value;
    }

    return "";
};


function EditDoctorForm({
    doctor,
    onClose,
    onDoctorUpdated,
}) {
    const [formData, setFormData] =
        useState(
            () => getInitialForm(doctor)
        );

    const [fieldErrors, setFieldErrors] =
        useState({});

    const [formError, setFormError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);


    const resetForm =
        useCallback(() => {
            setFormData(
                getInitialForm(doctor)
            );
            setFieldErrors({});
            setFormError("");
        }, [doctor]);


    const closeModal =
        useCallback(() => {
            if (submitting) {
                return;
            }

            resetForm();
            onClose();
        }, [
            onClose,
            resetForm,
            submitting,
        ]);


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
            checked,
            type,
        } = event.target;

        setFormData((current) => ({
            ...current,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));

        setFieldErrors((current) => ({
            ...current,
            [name]: "",
        }));

        setFormError("");
    };


    const validateForm = () => {
        const errors = {};

        if (!formData.specialization.trim()) {
            errors.specialization =
                "Specialization is required.";
        }

        if (!formData.license_number.trim()) {
            errors.license_number =
                "License number is required.";
        }

        if (formData.experience_years !== "") {
            const experience =
                Number(formData.experience_years);

            if (
                !Number.isInteger(experience) ||
                experience < 0
            ) {
                errors.experience_years =
                    "Experience must be a non-negative whole number.";
            }
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        try {
            const updatedDoctor =
                await apiRequest(
                    `/doctors/${doctor.id}/`,
                    {
                        method: "PATCH",
                        body: {
                            specialization:
                                formData.specialization
                                    .trim(),
                            license_number:
                                formData.license_number
                                    .trim(),
                            experience_years:
                                formData.experience_years ===
                                ""
                                    ? 0
                                    : Number(
                                        formData.experience_years
                                    ),
                            is_available:
                                formData.is_available,
                        },
                    }
                );

            resetForm();
            onDoctorUpdated(updatedDoctor);
            onClose();
        }

        catch (error) {
            const apiErrors =
                error.data || {};

            const nextFieldErrors = {};

            [
                "license_number",
                "specialization",
                "experience_years",
            ].forEach((field) => {
                const message =
                    getFieldMessage(
                        apiErrors[field]
                    );

                if (message) {
                    nextFieldErrors[field] =
                        message;
                }
            });

            setFieldErrors(nextFieldErrors);

            const nonFieldError =
                getFieldMessage(
                    apiErrors.non_field_errors
                );

            if (error.status === 403) {
                setFormError(
                    "You do not have permission to edit doctors."
                );
            }

            else if (nonFieldError) {
                setFormError(nonFieldError);
            }

            else if (
                Object.keys(nextFieldErrors)
                    .length === 0
            ) {
                setFormError(
                    error.message ||
                    "Unable to update doctor."
                );
            }
        }

        finally {
            setSubmitting(false);
        }
    };


    return (
        <div
            className="edit-doctor-modal-backdrop"
            onMouseDown={closeModal}
        >
            <div
                className="edit-doctor-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-doctor-title"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="edit-doctor-modal-header">
                    <div>
                        <span>Doctor Management</span>

                        <h2 id="edit-doctor-title">
                            Edit Doctor
                        </h2>

                        <p>
                            Update professional information and
                            appointment availability.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="edit-doctor-modal-close"
                        onClick={closeModal}
                        disabled={submitting}
                        aria-label="Close edit doctor dialog"
                    >
                        ×
                    </button>
                </div>

                <section
                    className="edit-doctor-account"
                    aria-label="Doctor account information"
                >
                    <div className="edit-doctor-account-avatar">
                        {
                            doctor.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                            "D"
                        }
                    </div>

                    <dl className="edit-doctor-account-details">
                        <div>
                            <dt>Full Name</dt>
                            <dd>
                                {doctor.full_name || "Not provided"}
                            </dd>
                        </div>

                        <div>
                            <dt>Email</dt>
                            <dd>
                                {doctor.email || "Not provided"}
                            </dd>
                        </div>

                        <div>
                            <dt>Phone Number</dt>
                            <dd>
                                {doctor.phone_number || "Not provided"}
                            </dd>
                        </div>
                    </dl>
                </section>

                <form
                    className="edit-doctor-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    {formError && (
                        <div
                            className="edit-doctor-form-error"
                            role="alert"
                        >
                            {formError}
                        </div>
                    )}

                    <div className="edit-doctor-field">
                        <label htmlFor="edit-doctor-specialization">
                            Specialization
                            <span aria-hidden="true"> *</span>
                        </label>

                        <input
                            id="edit-doctor-specialization"
                            name="specialization"
                            type="text"
                            value={formData.specialization}
                            onChange={handleChange}
                            maxLength={100}
                            aria-invalid={Boolean(
                                fieldErrors.specialization
                            )}
                            aria-describedby={
                                fieldErrors.specialization
                                    ? "edit-doctor-specialization-error"
                                    : undefined
                            }
                            autoFocus
                        />

                        {fieldErrors.specialization && (
                            <span
                                id="edit-doctor-specialization-error"
                                className="edit-doctor-field-error"
                            >
                                {fieldErrors.specialization}
                            </span>
                        )}
                    </div>

                    <div className="edit-doctor-field">
                        <label htmlFor="edit-doctor-license">
                            License Number
                            <span aria-hidden="true"> *</span>
                        </label>

                        <input
                            id="edit-doctor-license"
                            name="license_number"
                            type="text"
                            value={formData.license_number}
                            onChange={handleChange}
                            maxLength={100}
                            aria-invalid={Boolean(
                                fieldErrors.license_number
                            )}
                            aria-describedby={
                                fieldErrors.license_number
                                    ? "edit-doctor-license-error"
                                    : undefined
                            }
                        />

                        {fieldErrors.license_number && (
                            <span
                                id="edit-doctor-license-error"
                                className="edit-doctor-field-error"
                            >
                                {fieldErrors.license_number}
                            </span>
                        )}
                    </div>

                    <div className="edit-doctor-field">
                        <label htmlFor="edit-doctor-experience">
                            Experience Years
                        </label>

                        <input
                            id="edit-doctor-experience"
                            name="experience_years"
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={formData.experience_years}
                            onChange={handleChange}
                            aria-invalid={Boolean(
                                fieldErrors.experience_years
                            )}
                            aria-describedby={
                                fieldErrors.experience_years
                                    ? "edit-doctor-experience-error"
                                    : undefined
                            }
                        />

                        {fieldErrors.experience_years && (
                            <span
                                id="edit-doctor-experience-error"
                                className="edit-doctor-field-error"
                            >
                                {fieldErrors.experience_years}
                            </span>
                        )}
                    </div>

                    <div className="edit-doctor-availability">
                        <label htmlFor="edit-doctor-available">
                            <input
                                id="edit-doctor-available"
                                name="is_available"
                                type="checkbox"
                                checked={formData.is_available}
                                onChange={handleChange}
                            />

                            <span>
                                <strong>Available</strong>
                                <small>
                                    Allow this doctor to be selected
                                    for appointments.
                                </small>
                            </span>
                        </label>
                    </div>

                    <div className="edit-doctor-form-actions">
                        <button
                            type="button"
                            className="edit-doctor-secondary-button"
                            onClick={closeModal}
                            disabled={submitting}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="edit-doctor-primary-button"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Saving Changes..."
                                : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


function EditDoctorModal({
    isOpen,
    doctor,
    onClose,
    onDoctorUpdated,
}) {
    if (!isOpen || !doctor) {
        return null;
    }

    return (
        <EditDoctorForm
            key={doctor.id}
            doctor={doctor}
            onClose={onClose}
            onDoctorUpdated={onDoctorUpdated}
        />
    );
}


export default EditDoctorModal;
