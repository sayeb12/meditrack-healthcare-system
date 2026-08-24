import {
    useCallback,
    useEffect,
} from "react";

import "./DeleteAppointmentModal.css";


const formatDate = (dateString) => {
    if (!dateString) {
        return "Date not provided";
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
        return "Time not provided";
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


function DeleteAppointmentModal({
    isOpen,
    appointment,
    onClose,
    onDeleteConfirmed,
    loading,
    error,
}) {
    const closeModal = useCallback(() => {
        if (!loading) {
            onClose();
        }
    }, [loading, onClose]);


    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

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
    }, [closeModal, isOpen]);


    if (!isOpen || !appointment) {
        return null;
    }

    const patientName =
        appointment.patient_name ||
        "Patient";

    const doctorName =
        appointment.doctor_name ||
        "Doctor";


    return (
        <div
            className="delete-appointment-modal-backdrop"
            onMouseDown={closeModal}
        >
            <div
                className="delete-appointment-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-appointment-title"
                aria-describedby="delete-appointment-warning"
                aria-busy={loading}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <button
                    type="button"
                    className="delete-appointment-close"
                    onClick={closeModal}
                    disabled={loading}
                    aria-label="Close delete appointment dialog"
                >
                    &times;
                </button>

                <div className="delete-appointment-icon">
                    !
                </div>

                <h2 id="delete-appointment-title">
                    Permanently Delete Appointment?
                </h2>

                <p id="delete-appointment-warning">
                    Are you sure you want to permanently
                    delete this appointment? This action
                    cannot be undone. Use Cancel Appointment
                    instead when the record should be
                    preserved.
                </p>

                <div className="delete-appointment-summary">
                    <strong>{patientName}</strong>

                    <span>
                        with {doctorName}
                    </span>

                    <small>
                        {
                            formatDate(
                                appointment.appointment_date
                            )
                        }
                        {" at "}
                        {
                            formatTime(
                                appointment.appointment_time
                            )
                        }
                    </small>
                </div>

                {error && (
                    <div
                        className="delete-appointment-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <div className="delete-appointment-actions">
                    <button
                        type="button"
                        className="delete-appointment-cancel"
                        onClick={closeModal}
                        disabled={loading}
                        autoFocus
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="delete-appointment-confirm"
                        onClick={onDeleteConfirmed}
                        disabled={loading}
                    >
                        {
                            loading
                                ? "Deleting..."
                                : "Permanently Delete"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}


export default DeleteAppointmentModal;
