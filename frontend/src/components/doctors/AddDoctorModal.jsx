import {
    useEffect,
    useState,
} from "react";

import {
    apiRequest,
} from "../../api/client";

import "./AddDoctorModal.css";


const EMPTY_FORM = {
    user: "",
    specialization: "",
    license_number: "",
    experience_years: "",
    is_available: true,
};


const normalizeList = (data) => {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
};


const getFieldMessage = (value) => {
    if (Array.isArray(value)) {
        return value.join(" ");
    }

    if (typeof value === "string") {
        return value;
    }

    return "";
};


function AddDoctorModal({
    isOpen,
    onClose,
    onDoctorCreated,
}) {
    const [eligibleUsers, setEligibleUsers] =
        useState([]);

    const [loadingUsers, setLoadingUsers] =
        useState(false);

    const [usersError, setUsersError] =
        useState("");

    const [reloadKey, setReloadKey] =
        useState(0);

    const [formData, setFormData] =
        useState(EMPTY_FORM);

    const [fieldErrors, setFieldErrors] =
        useState({});

    const [formError, setFormError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);


    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        let cancelled = false;

        const loadEligibleUsers =
            async () => {
                setLoadingUsers(true);
                setUsersError("");

                try {
                    const data =
                        await apiRequest(
                            "/users/eligible-doctors/"
                        );

                    if (!cancelled) {
                        setEligibleUsers(
                            normalizeList(data)
                        );
                    }
                }

                catch (error) {
                    if (cancelled) {
                        return;
                    }

                    setEligibleUsers([]);

                    if (error.status === 403) {
                        setUsersError(
                            "You do not have permission to create doctors."
                        );
                    }

                    else {
                        setUsersError(
                            error.message ||
                            "Unable to load eligible users."
                        );
                    }
                }

                finally {
                    if (!cancelled) {
                        setLoadingUsers(false);
                    }
                }
            };

        loadEligibleUsers();

        return () => {
            cancelled = true;
        };
    }, [isOpen, reloadKey]);


    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (
                event.key === "Escape" &&
                !submitting
            ) {
                onClose();
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
    }, [isOpen, onClose, submitting]);


    if (!isOpen) {
        return null;
    }


    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setFieldErrors({});
        setFormError("");
    };


    const closeModal = () => {
        if (submitting) {
            return;
        }

        resetForm();
        onClose();
    };


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

        if (!formData.user) {
            errors.user =
                "Select an existing user."
        }

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
            const doctor =
                await apiRequest(
                    "/doctors/",
                    {
                        method: "POST",
                        body: {
                            user: Number(
                                formData.user
                            ),
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
            onDoctorCreated(doctor);
            onClose();
        }

        catch (error) {
            const apiErrors =
                error.data || {};

            const nextFieldErrors = {};

            [
                "user",
                "specialization",
                "license_number",
                "experience_years",
                "is_available",
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

            if (error.status === 403) {
                setFormError(
                    "You do not have permission to create doctors."
                );
            }

            else if (
                Object.keys(nextFieldErrors)
                    .length === 0
            ) {
                setFormError(
                    error.message ||
                    "Unable to create doctor."
                );
            }
        }

        finally {
            setSubmitting(false);
        }
    };


    const hasEligibleUsers =
        eligibleUsers.length > 0;


    return (
        <div
            className="add-doctor-modal-backdrop"
            onMouseDown={closeModal}
        >
            <div
                className="add-doctor-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-doctor-title"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="add-doctor-modal-header">
                    <div>
                        <span>Doctor Management</span>

                        <h2 id="add-doctor-title">
                            Add Doctor
                        </h2>

                        <p>
                            Create a doctor profile for an
                            active MediTrack user.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="add-doctor-modal-close"
                        onClick={closeModal}
                        disabled={submitting}
                        aria-label="Close add doctor dialog"
                    >
                        ×
                    </button>
                </div>

                {loadingUsers
                    ? (
                        <div
                            className="add-doctor-modal-state"
                            role="status"
                        >
                            <div className="add-doctor-spinner" />
                            <p>Loading eligible users...</p>
                        </div>
                    )
                    : usersError
                        ? (
                            <div className="add-doctor-modal-state error">
                                <p>{usersError}</p>

                                <div className="add-doctor-state-actions">
                                    <button
                                        type="button"
                                        className="add-doctor-secondary-button"
                                        onClick={closeModal}
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        className="add-doctor-primary-button"
                                        onClick={() =>
                                            setReloadKey(
                                                (current) =>
                                                    current + 1
                                            )
                                        }
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )
                        : !hasEligibleUsers
                            ? (
                                <div className="add-doctor-modal-state empty">
                                    <div className="add-doctor-empty-icon">
                                        Dr
                                    </div>

                                    <h3>No eligible users</h3>

                                    <p>
                                        All active users already have
                                        doctor profiles, or no active
                                        users are available.
                                    </p>

                                    <button
                                        type="button"
                                        className="add-doctor-primary-button"
                                        onClick={closeModal}
                                    >
                                        Close
                                    </button>
                                </div>
                            )
                            : (
                                <form
                                    className="add-doctor-form"
                                    onSubmit={handleSubmit}
                                    noValidate
                                >
                                    {formError && (
                                        <div
                                            className="add-doctor-form-error"
                                            role="alert"
                                        >
                                            {formError}
                                        </div>
                                    )}

                                    <div className="add-doctor-field full-width">
                                        <label htmlFor="add-doctor-user">
                                            Existing User
                                            <span aria-hidden="true"> *</span>
                                        </label>

                                        <select
                                            id="add-doctor-user"
                                            name="user"
                                            value={formData.user}
                                            onChange={handleChange}
                                            aria-invalid={Boolean(
                                                fieldErrors.user
                                            )}
                                            aria-describedby={
                                                fieldErrors.user
                                                    ? "add-doctor-user-error"
                                                    : undefined
                                            }
                                            autoFocus
                                        >
                                            <option value="">
                                                Select an eligible user
                                            </option>

                                            {eligibleUsers.map(
                                                (eligibleUser) => (
                                                    <option
                                                        key={eligibleUser.id}
                                                        value={eligibleUser.id}
                                                    >
                                                        {eligibleUser.full_name}
                                                        {" — "}
                                                        {eligibleUser.email}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        {fieldErrors.user && (
                                            <span
                                                id="add-doctor-user-error"
                                                className="add-doctor-field-error"
                                            >
                                                {fieldErrors.user}
                                            </span>
                                        )}
                                    </div>

                                    <div className="add-doctor-field">
                                        <label htmlFor="add-doctor-specialization">
                                            Specialization
                                            <span aria-hidden="true"> *</span>
                                        </label>

                                        <input
                                            id="add-doctor-specialization"
                                            name="specialization"
                                            type="text"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            maxLength={100}
                                            placeholder="e.g. Cardiology"
                                            aria-invalid={Boolean(
                                                fieldErrors.specialization
                                            )}
                                            aria-describedby={
                                                fieldErrors.specialization
                                                    ? "add-doctor-specialization-error"
                                                    : undefined
                                            }
                                        />

                                        {fieldErrors.specialization && (
                                            <span
                                                id="add-doctor-specialization-error"
                                                className="add-doctor-field-error"
                                            >
                                                {fieldErrors.specialization}
                                            </span>
                                        )}
                                    </div>

                                    <div className="add-doctor-field">
                                        <label htmlFor="add-doctor-license">
                                            License Number
                                            <span aria-hidden="true"> *</span>
                                        </label>

                                        <input
                                            id="add-doctor-license"
                                            name="license_number"
                                            type="text"
                                            value={formData.license_number}
                                            onChange={handleChange}
                                            maxLength={100}
                                            placeholder="Enter license number"
                                            aria-invalid={Boolean(
                                                fieldErrors.license_number
                                            )}
                                            aria-describedby={
                                                fieldErrors.license_number
                                                    ? "add-doctor-license-error"
                                                    : undefined
                                            }
                                        />

                                        {fieldErrors.license_number && (
                                            <span
                                                id="add-doctor-license-error"
                                                className="add-doctor-field-error"
                                            >
                                                {fieldErrors.license_number}
                                            </span>
                                        )}
                                    </div>

                                    <div className="add-doctor-field">
                                        <label htmlFor="add-doctor-experience">
                                            Experience Years
                                        </label>

                                        <input
                                            id="add-doctor-experience"
                                            name="experience_years"
                                            type="number"
                                            min="0"
                                            step="1"
                                            inputMode="numeric"
                                            value={formData.experience_years}
                                            onChange={handleChange}
                                            placeholder="0"
                                            aria-invalid={Boolean(
                                                fieldErrors.experience_years
                                            )}
                                            aria-describedby={
                                                fieldErrors.experience_years
                                                    ? "add-doctor-experience-error"
                                                    : undefined
                                            }
                                        />

                                        {fieldErrors.experience_years && (
                                            <span
                                                id="add-doctor-experience-error"
                                                className="add-doctor-field-error"
                                            >
                                                {fieldErrors.experience_years}
                                            </span>
                                        )}
                                    </div>

                                    <div className="add-doctor-availability">
                                        <label htmlFor="add-doctor-available">
                                            <input
                                                id="add-doctor-available"
                                                name="is_available"
                                                type="checkbox"
                                                checked={formData.is_available}
                                                onChange={handleChange}
                                                aria-invalid={Boolean(
                                                    fieldErrors.is_available
                                                )}
                                                aria-describedby={
                                                    fieldErrors.is_available
                                                        ? "add-doctor-available-error"
                                                        : undefined
                                                }
                                            />

                                            <span>
                                                <strong>Available</strong>
                                                <small>
                                                    Allow this doctor to be
                                                    selected for appointments.
                                                </small>
                                            </span>
                                        </label>

                                        {fieldErrors.is_available && (
                                            <span
                                                id="add-doctor-available-error"
                                                className="add-doctor-field-error"
                                            >
                                                {fieldErrors.is_available}
                                            </span>
                                        )}
                                    </div>

                                    <div className="add-doctor-form-actions">
                                        <button
                                            type="button"
                                            className="add-doctor-secondary-button"
                                            onClick={closeModal}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="add-doctor-primary-button"
                                            disabled={submitting}
                                        >
                                            {submitting
                                                ? "Creating Doctor..."
                                                : "Create Doctor"}
                                        </button>
                                    </div>
                                </form>
                            )}
            </div>
        </div>
    );
}


export default AddDoctorModal;
