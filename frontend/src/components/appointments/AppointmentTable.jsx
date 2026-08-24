import AppointmentActionButtons
    from "./AppointmentActionButtons";

import "./AppointmentTable.css";


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


function AppointmentTable({
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
        <div className="appointments-table-wrapper">
            <table className="appointments-table">
                <thead>
                    <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {appointments.map((appointment) => {
                        return (
                            <tr key={appointment.id}>
                                <td>
                                    <div className="appointment-person">
                                        <div className="appointment-person-avatar">
                                            P
                                        </div>

                                        <div>
                                            <strong>
                                                {appointment.patient_name}
                                            </strong>

                                            <span>
                                                Patient #{appointment.patient}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <div className="appointment-doctor">
                                        <strong>
                                            {appointment.doctor_name}
                                        </strong>

                                        <span>
                                            {
                                                appointment.doctor_specialization ||
                                                "General"
                                            }
                                        </span>
                                    </div>
                                </td>

                                <td>
                                    {
                                        formatDate(
                                            appointment.appointment_date
                                        )
                                    }
                                </td>

                                <td>
                                    {
                                        formatTime(
                                            appointment.appointment_time
                                        )
                                    }
                                </td>

                                <td>
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
                                </td>

                                <td>
                                    <span className="appointment-reason">
                                        {
                                            appointment.reason ||
                                            "Not provided"
                                        }
                                    </span>
                                </td>

                                <td>
                                    <div className="appointment-actions">
                                        <button
                                            type="button"
                                            className="appointment-view-action"
                                            onClick={() =>
                                                onView(
                                                    appointment
                                                )
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
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}


export default AppointmentTable;
