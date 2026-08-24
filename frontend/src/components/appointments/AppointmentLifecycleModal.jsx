import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    apiRequest,
} from "../../api/client";

import "./AppointmentLifecycleModal.css";


const ACTION_DETAILS = {
    confirm: {
        title: "Confirm Appointment",
        message: "Confirm this appointment?",
        confirmLabel: "Confirm Appointment",
        submittingLabel: "Confirming...",
        endpoint: "confirm",
        permissionError:
            "You do not have permission to confirm this appointment.",
        requestError:
            "Unable to confirm this appointment.",
    },
    cancel: {
        title: "Cancel Appointment",
        message: "Cancel this appointment?",
        confirmLabel: "Cancel Appointment",
        submittingLabel: "Cancelling...",
        endpoint: "cancel",
        permissionError:
            "You do not have permission to cancel this appointment.",
        requestError:
            "Unable to cancel this appointment.",
    },
    complete: {
        title: "Complete Appointment",
        message: "Mark this appointment as completed?",
        confirmLabel: "Mark Completed",
        submittingLabel: "Completing...",
        endpoint: "complete",
        permissionError:
            "You do not have permission to complete this appointment.",
        requestError:
            "Unable to complete this appointment.",
    },
    no_show: {
        title: "Mark No-show",
        message: "Mark this appointment as no-show?",
        confirmLabel: "Mark No-show",
        submittingLabel: "Updating...",
        endpoint: "no-show",
        permissionError:
            "You do not have permission to mark this appointment as no-show.",
        requestError:
            "Unable to mark this appointment as no-show.",
    },
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


const getValidationMessage = (
    error,
    fallback
) => {
    const statusError =
        error.data?.status;

    if (Array.isArray(statusError)) {
        return statusError.join(" ");
    }

    if (typeof statusError === "string") {
        return statusError;
    }

    const nonFieldError =
        error.data?.non_field_errors;

    if (Array.isArray(nonFieldError)) {
        return nonFieldError.join(" ");
    }

    if (typeof nonFieldError === "string") {
        return nonFieldError;
    }

    return error.message || fallback;
};


function AppointmentLifecycleDialog({
    appointment,
    action,
    onClose,
    onAppointmentChanged,
}) {
    const [submitting, setSubmitting] =
        useState(false);

    const [apiError, setApiError] =
        useState("");

    const details = ACTION_DETAILS[action];


    const closeModal = useCallback(
        (force = false) => {
            if (
                submitting &&
                force !== true
            ) {
                return;
            }

            setApiError("");
            onClose();
        },
        [onClose, submitting]
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


    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setApiError("");
        setSubmitting(true);

        try {
            const changedAppointment =
                await apiRequest(
                    `/appointments/${appointment.id}/${details.endpoint}/`,
                    {
                        method: "POST",
                    }
                );

            onAppointmentChanged(
                changedAppointment,
                action
            );

            closeModal(true);
        }

        catch (error) {
            if (error.status === 400) {
                setApiError(
                    getValidationMessage(
                        error,
                        details.requestError
                    )
                );
            }

            else if (error.status === 403) {
                setApiError(
                    details.permissionError
                );
            }

            else if (error.status === 404) {
                setApiError(
                    "This appointment could not be found or is no longer available to you."
                );
            }

            else {
                setApiError(
                    error.message ||
                    details.requestError
                );
            }
        }

        finally {
            setSubmitting(false);
        }
    };


    return (
        <div
            className="appointment-lifecycle-modal-backdrop"
            onMouseDown={closeModal}
        >
            <div
                className={
                    `appointment-lifecycle-modal ${action}`
                }
                role="dialog"
                aria-modal="true"
                aria-labelledby="appointment-lifecycle-title"
                aria-describedby="appointment-lifecycle-message"
                aria-busy={submitting}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="appointment-lifecycle-modal-header">
                    <div>
                        <span>
                            Appointment Management
                        </span>

                        <h2 id="appointment-lifecycle-title">
                            {details.title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="appointment-lifecycle-modal-close"
                        onClick={closeModal}
                        disabled={submitting}
                        aria-label={`Close ${details.title.toLowerCase()} dialog`}
                    >
                        &times;
                    </button>
                </div>

                <div className="appointment-lifecycle-summary">
                    <div className="appointment-lifecycle-avatar">
                        {
                            appointment.patient_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                            "A"
                        }
                    </div>

                    <div className="appointment-lifecycle-summary-text">
                        <strong>
                            {
                                appointment.patient_name ||
                                "Patient"
                            }
                        </strong>

                        <span>
                            with{
                                " "
                            }{
                                appointment.doctor_name ||
                                "Doctor"
                            }
                        </span>
                    </div>
                </div>

                <div className="appointment-lifecycle-schedule">
                    <div>
                        <span>Date</span>

                        <strong>
                            {formatDate(
                                appointment.appointment_date
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Time</span>

                        <strong>
                            {formatTime(
                                appointment.appointment_time
                            )}
                        </strong>
                    </div>
                </div>

                <p
                    id="appointment-lifecycle-message"
                    className="appointment-lifecycle-message"
                >
                    {details.message}
                </p>

                {apiError && (
                    <div
                        className="appointment-lifecycle-error"
                        role="alert"
                    >
                        {apiError}
                    </div>
                )}

                <form
                    className="appointment-lifecycle-actions"
                    onSubmit={handleSubmit}
                >
                    <button
                        type="button"
                        className="appointment-lifecycle-cancel"
                        onClick={closeModal}
                        disabled={submitting}
                        autoFocus
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className={
                            `appointment-lifecycle-confirm ${action}`
                        }
                        disabled={submitting}
                    >
                        {
                            submitting
                                ? details.submittingLabel
                                : details.confirmLabel
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}


function AppointmentLifecycleModal({
    isOpen,
    appointment,
    action,
    onClose,
    onAppointmentChanged,
}) {
    if (
        !isOpen ||
        !appointment ||
        !ACTION_DETAILS[action]
    ) {
        return null;
    }

    return (
        <AppointmentLifecycleDialog
            key={`${action}-${appointment.id}`}
            appointment={appointment}
            action={action}
            onClose={onClose}
            onAppointmentChanged={onAppointmentChanged}
        />
    );
}


export default AppointmentLifecycleModal;
