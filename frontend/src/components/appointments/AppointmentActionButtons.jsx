import "./AppointmentActionButtons.css";


const ACTION_DETAILS = {
    confirm: {
        label: "Confirm",
        className: "appointment-action-confirm",
    },
    cancel: {
        label: "Cancel",
        className: "appointment-action-cancel",
    },
    complete: {
        label: "Complete",
        className: "appointment-action-complete",
    },
    no_show: {
        label: "No-show",
        className: "appointment-action-danger",
    },
    edit: {
        label: "Edit",
        className: "appointment-action-edit",
    },
    delete: {
        label: "Delete",
        className: "appointment-action-danger",
    },
};


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


const getRelatedId = (value) => {
    if (
        value &&
        typeof value === "object"
    ) {
        return normalizeId(value.id);
    }

    return normalizeId(value);
};


const isAppointmentCreator = (
    appointment,
    user
) => {
    if (!appointment || !user) {
        return false;
    }

    const createdBy =
        appointment.created_by;

    if (
        createdBy &&
        typeof createdBy === "object"
    ) {
        const creatorId =
            getRelatedId(createdBy);

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

    if (
        typeof createdBy === "number"
    ) {
        const creatorId =
            normalizeId(createdBy);

        const userId =
            normalizeId(user.id);

        return Boolean(
            creatorId &&
            userId &&
            creatorId === userId
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


const isAssignedDoctor = (
    appointment,
    user,
    doctors
) => {
    if (
        !appointment ||
        !user ||
        !Array.isArray(doctors)
    ) {
        return false;
    }

    const appointmentDoctorId =
        getRelatedId(
            appointment.doctor
        );

    const userId =
        normalizeId(user.id);

    if (!appointmentDoctorId || !userId) {
        return false;
    }

    const matchingDoctor = doctors.find(
        (doctor) =>
            normalizeId(doctor?.id) ===
            appointmentDoctorId
    );

    if (!matchingDoctor) {
        return false;
    }

    return (
        getRelatedId(
            matchingDoctor.user
        ) === userId
    );
};


const getVisibleActions = (
    appointment,
    user,
    doctors
) => {
    const appointmentStatus =
        appointment?.status;

    if (
        appointmentStatus !== "scheduled" &&
        appointmentStatus !== "confirmed"
    ) {
        return [];
    }

    const isStaff =
        user?.is_staff === true;

    const creator =
        isAppointmentCreator(
            appointment,
            user
        );

    const assignedDoctor =
        isAssignedDoctor(
            appointment,
            user,
            doctors
        );

    if (isStaff) {
        if (appointmentStatus === "scheduled") {
            return [
                "confirm",
                "cancel",
                "edit",
                "delete",
            ];
        }

        return [
            "complete",
            "cancel",
            "no_show",
            "edit",
            "delete",
        ];
    }

    const actions = [];

    if (assignedDoctor) {
        if (appointmentStatus === "scheduled") {
            actions.push(
                "confirm",
                "cancel"
            );
        }

        else {
            actions.push(
                "complete",
                "cancel",
                "no_show"
            );
        }
    }

    if (creator) {
        if (
            appointmentStatus === "scheduled"
        ) {
            actions.push(
                "cancel",
                "edit",
                "delete"
            );
        }

        else {
            actions.push("cancel");
        }
    }

    return [...new Set(actions)];
};


function AppointmentActionButtons({
    appointment,
    user,
    doctors,
    onAction,
}) {
    if (!appointment) {
        return null;
    }

    const visibleActions =
        getVisibleActions(
            appointment,
            user,
            doctors
        );

    if (visibleActions.length === 0) {
        return null;
    }

    const patientName =
        appointment.patient_name ||
        "this patient";

    return (
        <div className="appointment-action-buttons">
            {visibleActions.map((action) => {
                const details =
                    ACTION_DETAILS[action];

                return (
                    <button
                        key={action}
                        type="button"
                        className={
                            `appointment-action-button ${details.className}`
                        }
                        onClick={() => {
                            if (
                                typeof onAction ===
                                "function"
                            ) {
                                onAction(
                                    action,
                                    appointment
                                );
                            }
                        }}
                        aria-label={
                            `${details.label} appointment for ${patientName}`
                        }
                    >
                        {details.label}
                    </button>
                );
            })}
        </div>
    );
}


export default AppointmentActionButtons;
