import {
    useEffect,
} from "react";

import AppointmentActionButtons
    from "./AppointmentActionButtons";

import "./AppointmentDetailsModal.css";


const normalizeEmail = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().toLowerCase();
};


const normalizeId = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    return String(value);
};


const isAppointmentCreator = (
    appointment,
    user
) => {
    const createdBy =
        appointment?.created_by;

    if (!createdBy || !user) {
        return false;
    }

    if (typeof createdBy === "object") {
        const creatorId =
            normalizeId(createdBy.id);

        const userId =
            normalizeId(user.id);

        if (
            creatorId &&
            userId &&
            creatorId === userId
        ) {
            return true;
        }

        const creatorEmail =
            normalizeEmail(
                createdBy.email
            );

        const userEmail =
            normalizeEmail(user.email);

        return Boolean(
            creatorEmail &&
            userEmail &&
            creatorEmail === userEmail
        );
    }

    if (typeof createdBy === "number") {
        return (
            normalizeId(createdBy) ===
            normalizeId(user.id)
        );
    }

    const creatorEmail =
        normalizeEmail(createdBy);

    const userEmail =
        normalizeEmail(user.email);

    return Boolean(
        creatorEmail &&
        userEmail &&
        creatorEmail === userEmail
    );
};


const formatDate = (dateString) => {
    if (!dateString) {
        return "Not provided";
    }

    const date = new Date(
        `${dateString}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
};


const formatTime = (timeString) => {
    if (!timeString) {
        return "Not provided";
    }

    const [hour, minute] =
        timeString.split(":");

    const date = new Date();

    date.setHours(
        Number(hour),
        Number(minute),
        0,
        0
    );

    if (Number.isNaN(date.getTime())) {
        return timeString;
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit",
        }
    );
};


const getStatusLabel = (status) => {
    const labels = {
        scheduled: "Scheduled",
        confirmed: "Confirmed",
        completed: "Completed",
        cancelled: "Cancelled",
        no_show: "No Show",
    };

    return labels[status] || status;
};


function AppointmentDetailsModal({
    appointment,
    user,
    doctors,
    onClose,
    onEdit,
    onDelete,
    onAction,
}) {
    useEffect(() => {
        if (!appointment) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
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
    }, [appointment, onClose]);


    if (!appointment) {
        return null;
    }

    const creator =
        isAppointmentCreator(
            appointment,
            user
        );

    const canEdit =
        user?.is_staff === true ||
        creator;

    const canDelete = creator;

    const patientName =
        appointment.patient_name ||
        "Patient";

    const doctorName =
        appointment.doctor_name ||
        "Doctor";


    return (
        <div
            className="appointment-details-modal-backdrop"
            onMouseDown={onClose}
        >
            <div
                className="appointment-details-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="appointment-details-title"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="appointment-details-modal-header">
                    <div>
                        <span>
                            Appointment Record
                        </span>

                        <h2 id="appointment-details-title">
                            Appointment Details
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="appointment-details-modal-close"
                        onClick={onClose}
                        aria-label="Close appointment details"
                    >
                        &times;
                    </button>
                </div>

                <div className="appointment-details-heading">
                    <div className="appointment-details-icon">
                        {
                            patientName
                                .charAt(0)
                                .toUpperCase()
                        }
                    </div>

                    <div>
                        <h3>{patientName}</h3>

                        <p>
                            with {doctorName}
                        </p>

                        <span
                            className={
                                `appointment-details-status-badge status-${appointment.status}`
                            }
                        >
                            {
                                getStatusLabel(
                                    appointment.status
                                )
                            }
                        </span>
                    </div>
                </div>

                <div className="appointment-details-grid">
                    <div>
                        <span>Patient</span>
                        <strong>{patientName}</strong>
                    </div>

                    <div>
                        <span>Doctor</span>
                        <strong>{doctorName}</strong>
                    </div>

                    <div>
                        <span>Specialization</span>
                        <strong>
                            {
                                appointment.doctor_specialization ||
                                "Not provided"
                            }
                        </strong>
                    </div>

                    <div>
                        <span>Date</span>
                        <strong>
                            {
                                formatDate(
                                    appointment.appointment_date
                                )
                            }
                        </strong>
                    </div>

                    <div>
                        <span>Time</span>
                        <strong>
                            {
                                formatTime(
                                    appointment.appointment_time
                                )
                            }
                        </strong>
                    </div>

                    <div>
                        <span>Status</span>
                        <strong>
                            {
                                getStatusLabel(
                                    appointment.status
                                )
                            }
                        </strong>
                    </div>

                    <div className="appointment-details-full">
                        <span>Reason</span>
                        <p>
                            {
                                appointment.reason ||
                                "Not provided"
                            }
                        </p>
                    </div>

                    <div className="appointment-details-full">
                        <span>
                            Consultation Notes
                        </span>
                        <p>
                            {
                                appointment.consultation_notes ||
                                "No consultation notes recorded."
                            }
                        </p>
                    </div>
                </div>

                <div className="appointment-details-actions">
                    <button
                        type="button"
                        className="appointment-details-close-action"
                        onClick={onClose}
                    >
                        Close
                    </button>

                    <AppointmentActionButtons
                        appointment={appointment}
                        user={user}
                        doctors={doctors}
                        onAction={onAction}
                    />

                    {(canEdit || canDelete) && (
                        <div className="appointment-details-crud-actions">
                            {canEdit && (
                                <button
                                    type="button"
                                    className="appointment-details-edit-action"
                                    onClick={() =>
                                        onEdit(
                                            appointment
                                        )
                                    }
                                >
                                    Edit
                                </button>
                            )}

                            {canDelete && (
                                <button
                                    type="button"
                                    className="appointment-details-delete-action"
                                    onClick={() =>
                                        onDelete(
                                            appointment
                                        )
                                    }
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


export default AppointmentDetailsModal;
