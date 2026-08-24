import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router";

import {
    apiRequest,
    clearAuthSession,
    getRefreshToken,
} from "../api/client";

import useCurrentUser
    from "../hooks/useCurrentUser";

import AppointmentActionButtons
    from "../components/appointments/AppointmentActionButtons";

import AppointmentDetailsModal
    from "../components/appointments/AppointmentDetailsModal";

import AppointmentFormModal
    from "../components/appointments/AppointmentFormModal";

import AppointmentLifecycleModal
    from "../components/appointments/AppointmentLifecycleModal";

import "./DashboardPage.css";
import "./AppointmentsPage.css";


const normalizeList = (data) => {
    if (Array.isArray(data)) {
        return data;
    }

    if (
        Array.isArray(
            data?.results
        )
    ) {
        return data.results;
    }

    return [];
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


const isCreatedByUser = (
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


function AppointmentCrudButtons({
    appointment,
    user,
    onAction,
}) {
    if (!appointment || !user) {
        return null;
    }

    const creator =
        isCreatedByUser(
            appointment.created_by,
            user
        );

    const canEdit =
        user.is_staff === true ||
        creator;

    const canDelete = creator;

    if (!canEdit && !canDelete) {
        return null;
    }

    const patientName =
        appointment.patient_name ||
        "this patient";

    return (
        <div className="appointment-crud-buttons">
            {canEdit && (
                <button
                    type="button"
                    className="appointment-crud-edit"
                    onClick={() =>
                        onAction(
                            "edit",
                            appointment
                        )
                    }
                    aria-label={
                        `Edit appointment for ${patientName}`
                    }
                >
                    Edit
                </button>
            )}

            {canDelete && (
                <button
                    type="button"
                    className="appointment-crud-delete"
                    onClick={() =>
                        onAction(
                            "delete",
                            appointment
                        )
                    }
                    aria-label={
                        `Permanently delete appointment for ${patientName}`
                    }
                >
                    Delete
                </button>
            )}
        </div>
    );
}


const formatDate = (
    dateString
) => {
    if (!dateString) {
        return "Not provided";
    }

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
};


const formatTime = (
    timeString
) => {
    if (!timeString) {
        return "Not provided";
    }

    const [
        hour,
        minute,
    ] = timeString.split(":");

    const date =
        new Date();

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


const getStatusLabel = (
    status
) => {
    const labels = {
        scheduled: "Scheduled",
        confirmed: "Confirmed",
        completed: "Completed",
        cancelled: "Cancelled",
        no_show: "No Show",
    };

    return (
        labels[status] ||
        status
    );
};


function AppointmentsPage() {
    const navigate =
        useNavigate();


    const user =
        useCurrentUser();


    const [
        mobileMenuOpen,
        setMobileMenuOpen,
    ] = useState(false);


    const [
        appointments,
        setAppointments,
    ] = useState([]);


    const [
        patients,
        setPatients,
    ] = useState([]);


    const [
        doctors,
        setDoctors,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");


    const [
        searchTerm,
        setSearchTerm,
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter,
    ] = useState("all");


    const [
        formOpen,
        setFormOpen,
    ] = useState(false);


    const [
        editingAppointment,
        setEditingAppointment,
    ] = useState(null);


    const [
        selectedAppointment,
        setSelectedAppointment,
    ] = useState(null);


    const [
        appointmentToDelete,
        setAppointmentToDelete,
    ] = useState(null);


    const [
        deleting,
        setDeleting,
    ] = useState(false);


    const [
        lifecycleAppointment,
        setLifecycleAppointment,
    ] = useState(null);


    const [
        lifecycleAction,
        setLifecycleAction,
    ] = useState(null);


    const handleSessionError = (
        requestError
    ) => {
        if (
            requestError.status ===
            401
        ) {
            clearAuthSession();

            navigate(
                "/",
                {
                    replace: true,
                }
            );

            return true;
        }

        return false;
    };


    const loadAppointments =
        async () => {
            setLoading(true);
            setError("");

            try {
                const appointmentData =
                    await apiRequest(
                        "/appointments/"
                    );

                setAppointments(
                    normalizeList(
                        appointmentData
                    )
                );
            }

            catch (
                requestError
            ) {
                if (
                    handleSessionError(
                        requestError
                    )
                ) {
                    return;
                }

                setError(
                    requestError.message ||
                    "Unable to load appointments."
                );
            }

            finally {
                setLoading(false);
            }
        };


    const loadData =
        async () => {
            setLoading(true);
            setError("");

            try {
                const [
                    appointmentData,
                    patientData,
                    doctorData,
                ] =
                    await Promise.all([
                        apiRequest(
                            "/appointments/"
                        ),

                        apiRequest(
                            "/patients/"
                        ),

                        apiRequest(
                            "/doctors/"
                        ),
                    ]);


                setAppointments(
                    normalizeList(
                        appointmentData
                    )
                );

                setPatients(
                    normalizeList(
                        patientData
                    )
                );

                setDoctors(
                    normalizeList(
                        doctorData
                    )
                );
            }

            catch (
                requestError
            ) {
                if (
                    handleSessionError(
                        requestError
                    )
                ) {
                    return;
                }

                setError(
                    requestError.message ||
                    "Unable to load appointment data."
                );
            }

            finally {
                setLoading(false);
            }
        };


    useEffect(() => {
        loadData();
    }, []);


    const filteredAppointments =
        useMemo(
            () => {
                const query =
                    searchTerm
                        .trim()
                        .toLowerCase();


                return appointments.filter(
                    (
                        appointment
                    ) => {
                        const matchesStatus =
                            statusFilter ===
                            "all" ||
                            appointment.status ===
                            statusFilter;


                        if (
                            !matchesStatus
                        ) {
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
                                    .includes(
                                        query
                                    )
                        );
                    }
                );
            },
            [
                appointments,
                searchTerm,
                statusFilter,
            ]
        );


    const scheduledCount =
        useMemo(
            () =>
                appointments.filter(
                    (
                        appointment
                    ) =>
                        appointment.status ===
                        "scheduled"
                ).length,
            [appointments]
        );


    const canCreateAppointment =
        useMemo(
            () =>
                patients.some(
                    (patient) =>
                        isCreatedByUser(
                            patient.created_by,
                            user
                        )
                ),
            [patients, user]
        );


    const closeMobileMenu =
        () => {
            setMobileMenuOpen(
                false
            );
        };


    const goTo = (
        path
    ) => {
        closeMobileMenu();

        navigate(path);
    };


    const openCreateForm =
        () => {
            setEditingAppointment(
                null
            );

            setFormOpen(true);
        };


    const openEditForm = (
        appointment
    ) => {
        setEditingAppointment(
            appointment
        );

        setFormOpen(true);
    };


    const handleAppointmentAction = (
        action,
        appointment
    ) => {
        setSuccessMessage("");

        if (action === "edit") {
            setSelectedAppointment(null);
            openEditForm(appointment);
            return;
        }

        if (action === "delete") {
            setSelectedAppointment(null);
            setAppointmentToDelete(
                appointment
            );
            return;
        }

        setSelectedAppointment(null);
        setLifecycleAppointment(
            appointment
        );
        setLifecycleAction(action);
    };


    const closeLifecycleModal = () => {
        setLifecycleAppointment(null);
        setLifecycleAction(null);
    };


    const handleAppointmentChanged = async () => {
        closeLifecycleModal();

        setSuccessMessage(
            "Appointment updated successfully."
        );

        await loadAppointments();
    };


    const closeForm = () => {
        setFormOpen(false);
        setEditingAppointment(null);
    };


    const handleAppointmentSaved = async (
        payload,
        mode,
        appointment
    ) => {
        setSuccessMessage("");

        try {
            if (mode === "edit") {
                await apiRequest(
                    `/appointments/${appointment.id}/`,
                    {
                        method: "PATCH",
                        body: payload,
                    }
                );

                setSuccessMessage(
                    "Appointment updated successfully."
                );
            }

            else {
                await apiRequest(
                    "/appointments/",
                    {
                        method: "POST",
                        body: payload,
                    }
                );

                setSuccessMessage(
                    "Appointment created successfully."
                );
            }

            await loadAppointments();
        }

        catch (requestError) {
            handleSessionError(
                requestError
            );

            throw requestError;
        }
    };


    const handleDelete =
        async () => {
            if (
                !appointmentToDelete
            ) {
                return;
            }


            setDeleting(true);

            setError("");
            setSuccessMessage("");


            try {
                await apiRequest(
                    `/appointments/${appointmentToDelete.id}/`,
                    {
                        method:
                            "DELETE",
                    }
                );


                await loadAppointments();


                setSuccessMessage(
                    "Appointment deleted successfully."
                );


                setAppointmentToDelete(
                    null
                );
            }

            catch (
                requestError
            ) {
                if (
                    handleSessionError(
                        requestError
                    )
                ) {
                    return;
                }


                setError(
                    requestError.message ||
                    "Unable to delete appointment."
                );
            }

            finally {
                setDeleting(false);
            }
        };


    const handleLogout =
        async () => {
            const refreshToken =
                getRefreshToken();


            try {
                if (
                    refreshToken
                ) {
                    await apiRequest(
                        "/auth/logout/",
                        {
                            method:
                                "POST",

                            body: {
                                refresh:
                                    refreshToken,
                            },
                        }
                    );
                }
            }

            catch (
                logoutError
            ) {
                console.error(
                    "Logout request failed:",
                    logoutError
                );
            }

            finally {
                clearAuthSession();

                navigate(
                    "/",
                    {
                        replace: true,
                    }
                );
            }
        };


    return (
        <div className="dashboard-page appointments-page">

            <div
                className={
                    `dashboard-overlay ${
                        mobileMenuOpen
                            ? "visible"
                            : ""
                    }`
                }
                onClick={
                    closeMobileMenu
                }
            />


            <aside
                className={
                    `dashboard-sidebar ${
                        mobileMenuOpen
                            ? "open"
                            : ""
                    }`
                }
            >

                <div className="sidebar-brand">

                    <div className="sidebar-logo">
                        M
                    </div>


                    <div>
                        <strong>
                            MediTrack
                        </strong>

                        <span>
                            Healthcare System
                        </span>
                    </div>

                </div>


                <nav className="sidebar-nav">

                    <button
                        type="button"
                        className="nav-item"
                        onClick={() =>
                            goTo(
                                "/dashboard"
                            )
                        }
                    >
                        <span className="nav-icon">
                            D
                        </span>

                        <span>
                            Dashboard
                        </span>
                    </button>


                    <button
                        type="button"
                        className="nav-item"
                        onClick={() =>
                            goTo(
                                "/patients"
                            )
                        }
                    >
                        <span className="nav-icon">
                            P
                        </span>

                        <span>
                            Patients
                        </span>
                    </button>


                    <button
                        type="button"
                        className="nav-item"
                        onClick={() =>
                            goTo(
                                "/doctors"
                            )
                        }
                    >
                        <span className="nav-icon">
                            Dr
                        </span>

                        <span>
                            Doctors
                        </span>
                    </button>


                    <button
                        type="button"
                        className="nav-item active"
                        onClick={
                            closeMobileMenu
                        }
                    >
                        <span className="nav-icon">
                            A
                        </span>

                        <span>
                            Appointments
                        </span>
                    </button>

                </nav>


                <div className="sidebar-footer">

                    <div className="sidebar-user">

                        <div className="user-avatar">
                            {
                                user?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                "U"
                            }
                        </div>


                        <div className="sidebar-user-details">

                            <strong>
                                {
                                    user?.full_name ||
                                    "MediTrack User"
                                }
                            </strong>

                            <span>
                                {
                                    user?.email ||
                                    ""
                                }
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="logout-button"
                        onClick={
                            handleLogout
                        }
                    >
                        Sign Out
                    </button>

                </div>

            </aside>


            <main className="dashboard-main">

                <header className="dashboard-header">

                    <div className="header-left">

                        <button
                            type="button"
                            className="menu-button"
                            onClick={() =>
                                setMobileMenuOpen(
                                    true
                                )
                            }
                            aria-label="Open menu"
                        >
                            ☰
                        </button>


                        <div>
                            <span className="page-label">
                                Scheduling
                            </span>

                            <h1>
                                Appointments
                            </h1>
                        </div>

                    </div>


                    <div className="header-profile">

                        <div className="header-avatar">
                            {
                                user?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                "U"
                            }
                        </div>


                        <div className="header-profile-text">

                            <strong>
                                {
                                    user?.full_name ||
                                    "User"
                                }
                            </strong>

                            <span>
                                {
                                    user?.language ===
                                    "bn"
                                        ? "বাংলা"
                                        : "English"
                                }
                            </span>

                        </div>

                    </div>

                </header>


                <section className="appointments-hero">

                    <div>

                        <span className="appointments-hero-label">
                            Appointment Records
                        </span>

                        <h2>
                            Manage appointments
                        </h2>

                        <p>
                            Schedule consultations,
                            update appointment status
                            and manage consultation
                            information.
                        </p>

                    </div>


                    <div className="appointments-hero-actions">

                        <div className="scheduled-summary">

                            <strong>
                                {
                                    loading
                                        ? "..."
                                        : scheduledCount
                                }
                            </strong>

                            <span>
                                Scheduled
                            </span>

                        </div>


                        {canCreateAppointment && (
                            <button
                                type="button"
                                className="add-appointment-button"
                                onClick={
                                    openCreateForm
                                }
                            >
                                <span>
                                    +
                                </span>

                                New Appointment
                            </button>
                        )}

                    </div>

                </section>


                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}


                {successMessage && (
                    <div className="appointments-success">
                        {successMessage}
                    </div>
                )}


                <section className="appointments-content">

                    <div className="appointments-toolbar">

                        <div className="appointments-search">

                            <span>
                                🔍
                            </span>

                            <input
                                type="search"
                                value={
                                    searchTerm
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setSearchTerm(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                placeholder="Search patient, doctor, date or reason..."
                            />

                        </div>


                        <select
                            className="appointment-status-filter"
                            value={
                                statusFilter
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    setStatusFilter(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        >
                            <option value="all">
                                All Statuses
                            </option>

                            <option value="scheduled">
                                Scheduled
                            </option>

                            <option value="confirmed">
                                Confirmed
                            </option>

                            <option value="completed">
                                Completed
                            </option>

                            <option value="cancelled">
                                Cancelled
                            </option>

                            <option value="no_show">
                                No Show
                            </option>
                        </select>


                        <div className="appointment-count">

                            <strong>
                                {
                                    filteredAppointments.length
                                }
                            </strong>

                            <span>
                                {
                                    filteredAppointments.length ===
                                    1
                                        ? "Appointment"
                                        : "Appointments"
                                }
                            </span>

                        </div>

                    </div>


                    {
                        loading
                            ? (
                                <div className="appointments-loading">

                                    <div className="appointment-loading-spinner" />

                                    <span>
                                        Loading appointments...
                                    </span>

                                </div>
                            )
                            :
                            filteredAppointments.length ===
                            0
                                ? (
                                    <div className="appointments-empty">

                                        <div className="appointments-empty-icon">
                                            A
                                        </div>

                                        <h3>
                                            {
                                                searchTerm ||
                                                statusFilter !==
                                                "all"
                                                    ? "No matching appointments"
                                                    : "No appointments yet"
                                            }
                                        </h3>

                                        <p>
                                            {
                                                searchTerm ||
                                                statusFilter !==
                                                "all"
                                                    ? "Try changing your search or status filter."
                                                    : "Create your first appointment to begin scheduling consultations."
                                            }
                                        </p>

                                        {
                                            canCreateAppointment &&
                                            !searchTerm &&
                                            statusFilter ===
                                            "all" &&
                                            (
                                                <button
                                                    type="button"
                                                    onClick={
                                                        openCreateForm
                                                    }
                                                >
                                                    New Appointment
                                                </button>
                                            )
                                        }

                                    </div>
                                )
                                : (
                                    <>

                                        <div className="appointments-table-wrapper">

                                            <table className="appointments-table">

                                                <thead>
                                                    <tr>
                                                        <th>
                                                            Patient
                                                        </th>

                                                        <th>
                                                            Doctor
                                                        </th>

                                                        <th>
                                                            Date
                                                        </th>

                                                        <th>
                                                            Time
                                                        </th>

                                                        <th>
                                                            Status
                                                        </th>

                                                        <th>
                                                            Reason
                                                        </th>

                                                        <th>
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>


                                                <tbody>

                                                    {
                                                        filteredAppointments.map(
                                                            (
                                                                appointment
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        appointment.id
                                                                    }
                                                                >

                                                                    <td>

                                                                        <div className="appointment-person">

                                                                            <div className="appointment-person-avatar">
                                                                                P
                                                                            </div>


                                                                            <div>

                                                                                <strong>
                                                                                    {
                                                                                        appointment.patient_name
                                                                                    }
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
                                                                                {
                                                                                    appointment.doctor_name
                                                                                }
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
                                                                                    setSelectedAppointment(
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
                                                                                onAction={handleAppointmentAction}
                                                                            />


                                                                            <AppointmentCrudButtons
                                                                                appointment={appointment}
                                                                                user={user}
                                                                                onAction={handleAppointmentAction}
                                                                            />

                                                                        </div>

                                                                    </td>

                                                                </tr>
                                                            )
                                                        )
                                                    }

                                                </tbody>

                                            </table>

                                        </div>


                                        <div className="appointments-mobile-list">

                                            {
                                                filteredAppointments.map(
                                                    (
                                                        appointment
                                                    ) => (
                                                        <article
                                                            className="appointment-mobile-card"
                                                            key={
                                                                appointment.id
                                                            }
                                                        >

                                                            <div className="appointment-mobile-header">

                                                                <div>

                                                                    <strong>
                                                                        {
                                                                            appointment.patient_name
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        {
                                                                            appointment.doctor_name
                                                                        }
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

                                                                    <span>
                                                                        Date
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            formatDate(
                                                                                appointment.appointment_date
                                                                            )
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div>

                                                                    <span>
                                                                        Time
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            formatTime(
                                                                                appointment.appointment_time
                                                                            )
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div>

                                                                    <span>
                                                                        Specialization
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            appointment.doctor_specialization ||
                                                                            "General"
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div>

                                                                    <span>
                                                                        Reason
                                                                    </span>

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
                                                                        setSelectedAppointment(
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
                                                                    onAction={handleAppointmentAction}
                                                                />


                                                                <AppointmentCrudButtons
                                                                    appointment={appointment}
                                                                    user={user}
                                                                    onAction={handleAppointmentAction}
                                                                />

                                                            </div>

                                                        </article>
                                                    )
                                                )
                                            }

                                        </div>

                                    </>
                                )
                    }

                </section>

            </main>


            <AppointmentFormModal
                isOpen={formOpen}
                mode={
                    editingAppointment
                        ? "edit"
                        : "create"
                }
                appointment={editingAppointment}
                patients={patients}
                doctors={doctors}
                onClose={closeForm}
                onSaved={handleAppointmentSaved}
            />


            <AppointmentDetailsModal
                appointment={selectedAppointment}
                user={user}
                doctors={doctors}
                onClose={() =>
                    setSelectedAppointment(null)
                }
                onEdit={(appointment) =>
                    handleAppointmentAction(
                        "edit",
                        appointment
                    )
                }
                onDelete={(appointment) =>
                    handleAppointmentAction(
                        "delete",
                        appointment
                    )
                }
                onAction={handleAppointmentAction}
            />


            {appointmentToDelete && (

                <div
                    className="appointment-modal-backdrop"
                    onMouseDown={() => {
                        if (
                            !deleting
                        ) {
                            setAppointmentToDelete(
                                null
                            );
                        }
                    }}
                >

                    <div
                        className="appointment-modal appointment-delete-modal"
                        onMouseDown={
                            (
                                event
                            ) =>
                                event.stopPropagation()
                        }
                    >

                        <div className="appointment-delete-icon">
                            !
                        </div>


                        <h2>
                            Permanently Delete Appointment?
                        </h2>


                        <p>
                            Are you sure you want to
                            permanently delete the appointment for{" "}

                            <strong>
                                {
                                    appointmentToDelete.patient_name
                                }
                            </strong>

                            ? This action cannot be undone.
                            Use Cancel Appointment instead
                            when the record should be preserved.
                        </p>


                        <div className="appointment-delete-actions">

                            <button
                                type="button"
                                className="appointment-cancel-button"
                                disabled={
                                    deleting
                                }
                                onClick={() =>
                                    setAppointmentToDelete(
                                        null
                                    )
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="appointment-confirm-delete"
                                disabled={
                                    deleting
                                }
                                onClick={
                                    handleDelete
                                }
                            >
                                {
                                    deleting
                                        ? "Deleting..."
                                        : "Permanently Delete"
                                }
                            </button>

                        </div>

                    </div>

                </div>

            )}


            <AppointmentLifecycleModal
                isOpen={Boolean(
                    lifecycleAppointment &&
                    lifecycleAction
                )}
                appointment={lifecycleAppointment}
                action={lifecycleAction}
                onClose={closeLifecycleModal}
                onAppointmentChanged={handleAppointmentChanged}
            />

        </div>
    );
}


export default AppointmentsPage;
