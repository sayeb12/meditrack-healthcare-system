export const normalizeEmail = (value) => {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().toLowerCase();
};


export const normalizeId = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    return String(value);
};


export const isCreatedByUser = (
    createdBy,
    user
) => {
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


export const filterAppointments = (
    appointments,
    searchTerm,
    statusFilter
) => {
    const query =
        searchTerm
            .trim()
            .toLowerCase();

    return appointments.filter(
        (appointment) => {
            const matchesStatus =
                statusFilter === "all" ||
                appointment.status ===
                    statusFilter;

            if (!matchesStatus) {
                return false;
            }

            if (!query) {
                return true;
            }

            const values = [
                appointment.patient_name,
                appointment.doctor_name,
                appointment.doctor_specialization,
                appointment.appointment_date,
                appointment.appointment_time,
                appointment.status,
                appointment.reason,
            ];

            return values.some(
                (value) =>
                    String(
                        value || ""
                    )
                        .toLowerCase()
                        .includes(query)
            );
        }
    );
};


export const countAppointmentsByStatus = (
    appointments,
    status
) => {
    return appointments.filter(
        (appointment) =>
            appointment.status === status
    ).length;
};


export const canUserCreateAppointment = (
    patients,
    user
) => {
    return patients.some(
        (patient) =>
            isCreatedByUser(
                patient.created_by,
                user
            )
    );
};
