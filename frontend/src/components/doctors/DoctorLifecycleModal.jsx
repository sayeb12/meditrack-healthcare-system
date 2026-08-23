import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    apiRequest,
} from "../../api/client";

import "./DoctorLifecycleModal.css";


const ACTION_DETAILS = {
    archive: {
        eyebrow: "Doctor Management",
        title: "Archive Doctor",
        message:
            "Are you sure you want to archive this doctor?",
        confirmLabel: "Confirm Archive",
        submittingLabel: "Archiving...",
        method: "DELETE",
        permissionError:
            "You do not have permission to archive doctors.",
        requestError:
            "Unable to archive doctor.",
    },
    restore: {
        eyebrow: "Doctor Management",
        title: "Restore Doctor",
        message:
            "Are you sure you want to restore this doctor?",
        confirmLabel: "Confirm Restore",
        submittingLabel: "Restoring...",
        method: "POST",
        permissionError:
            "You do not have permission to restore doctors.",
        requestError:
            "Unable to restore doctor.",
    },
};


function DoctorLifecycleDialog({
    doctor,
    action,
    onClose,
    onDoctorChanged,
}) {
    const [submitting, setSubmitting] =
        useState(false);

    const [apiError, setApiError] =
        useState("");

    const details =
        ACTION_DETAILS[action];


    const closeModal =
        useCallback(
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
            const endpoint =
                action === "archive"
                    ? `/doctors/${doctor.id}/`
                    : `/doctors/${doctor.id}/restore/`;

            const changedDoctor =
                await apiRequest(
                    endpoint,
                    {
                        method:
                            details.method,
                    }
                );

            onDoctorChanged(
                changedDoctor,
                action
            );

            closeModal(true);
        }

        catch (error) {
            if (error.status === 403) {
                setApiError(
                    details.permissionError
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
            className="doctor-lifecycle-modal-backdrop"
            onMouseDown={closeModal}
        >
            <div
                className={
                    `doctor-lifecycle-modal ${action}`
                }
                role="dialog"
                aria-modal="true"
                aria-labelledby="doctor-lifecycle-title"
                aria-describedby="doctor-lifecycle-message"
                aria-busy={submitting}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                <div className="doctor-lifecycle-modal-header">
                    <div>
                        <span>
                            {details.eyebrow}
                        </span>

                        <h2 id="doctor-lifecycle-title">
                            {details.title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="doctor-lifecycle-modal-close"
                        onClick={closeModal}
                        disabled={submitting}
                        aria-label={`Close ${details.title.toLowerCase()} dialog`}
                    >
                        ×
                    </button>
                </div>

                <div className="doctor-lifecycle-profile">
                    <div className="doctor-lifecycle-avatar">
                        {
                            doctor.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                            "D"
                        }
                    </div>

                    <div className="doctor-lifecycle-profile-text">
                        <strong>
                            {
                                doctor.full_name ||
                                "Doctor"
                            }
                        </strong>

                        <span>
                            {
                                doctor.specialization ||
                                "General"
                            }
                        </span>
                    </div>
                </div>

                <p
                    id="doctor-lifecycle-message"
                    className="doctor-lifecycle-message"
                >
                    {details.message}
                </p>

                {apiError && (
                    <div
                        className="doctor-lifecycle-error"
                        role="alert"
                    >
                        {apiError}
                    </div>
                )}

                <form
                    className="doctor-lifecycle-actions"
                    onSubmit={handleSubmit}
                >
                    <button
                        type="button"
                        className="doctor-lifecycle-cancel"
                        onClick={closeModal}
                        disabled={submitting}
                        autoFocus
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className={
                            `doctor-lifecycle-confirm ${action}`
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


function DoctorLifecycleModal({
    isOpen,
    doctor,
    action,
    onClose,
    onDoctorChanged,
}) {
    if (
        !isOpen ||
        !doctor ||
        !ACTION_DETAILS[action]
    ) {
        return null;
    }

    return (
        <DoctorLifecycleDialog
            key={`${action}-${doctor.id}`}
            doctor={doctor}
            action={action}
            onClose={onClose}
            onDoctorChanged={onDoctorChanged}
        />
    );
}


export default DoctorLifecycleModal;
