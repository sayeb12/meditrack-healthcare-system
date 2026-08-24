import AppointmentActionButtons
    from "./AppointmentActionButtons";

import "./AppointmentMobileCards.css";


const formatDate = (dateString) => {
    if (!dateString) {
        return "Not provided";
    }

    return new Date(
        `${dateString}T00:00:00`
    ).toLocaleDateString(
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


function AppointmentMobileCards({
    appointments,
    user,
    doctors,
    onView,
    onEdit,
    onDelete,
    onAction,
}) {
    const handleAction = (
        action,
        selectedAppointment
    ) => {
        if (action === "edit") {
            onEdit(selectedAppointment);
            return;
        }

        if (action === "delete") {
            onDelete(selectedAppointment);
            return;
        }

        onAction(action, selectedAppointment);
    };

    return (
        <div className="appointments-mobile-list">
            {appointments.map((appointment) => {
                return (
                    <article
                        className="appointment-mobile-card"
                        key={appointment.id}
                    >
                        <div className="appointment-mobile-header">
                            <div>
                                <strong>
                                    {appointment.patient_name}
                                </strong>

                                <span>
                                    {appointment.doctor_name}
                                </span>
                            </div>

                            <span
                                className={
                                    `appointment-status-badge status-${appointment.status}`
                                }
                            >
                                {
                                    getStatusLabel(
                                        appointment.status
                                    )
                                }
                            </span>
                        </div>

                        <div className="appointment-mobile-details">
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
                                <span>Specialization</span>
                                <strong>
                                    {
                                        appointment.doctor_specialization ||
                                        "General"
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>Reason</span>
                                <strong>
                                    {
                                        appointment.reason ||
                                        "Not provided"
                                    }
                                </strong>
                            </div>
                        </div>

                        <div className="appointment-mobile-actions">
                            <button
                                type="button"
                                className="appointment-view-action"
                                onClick={() =>
                                    onView(appointment)
                                }
                            >
                                View
                            </button>

                            <AppointmentActionButtons
                                appointment={appointment}
                                user={user}
                                doctors={doctors}
                                onAction={handleAction}
                            />
                        </div>
                    </article>
                );
            })}
        </div>
    );
}


export default AppointmentMobileCards;
