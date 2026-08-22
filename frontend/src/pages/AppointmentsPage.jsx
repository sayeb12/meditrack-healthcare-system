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

import "./DashboardPage.css";
import "./AppointmentsPage.css";


const EMPTY_FORM = {
    patient: "",
    doctor: "",
    appointment_date: "",
    appointment_time: "",
    status: "scheduled",
    reason: "",
    consultation_notes: "",
};


const getStoredUser = () => {
    try {
        const storedUser =
            localStorage.getItem(
                "meditrack_user"
            );

        if (!storedUser) {
            return null;
        }

        return JSON.parse(
            storedUser
        );
    }

    catch {
        return null;
    }
};


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


const getTodayString = () => {
    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
};


const getStatusLabel = (
    status
) => {
    const labels = {
        scheduled: "Scheduled",
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


    const [user] =
        useState(
            getStoredUser
        );


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
        formData,
        setFormData,
    ] = useState({
        ...EMPTY_FORM,
    });


    const [
        formError,
        setFormError,
    ] = useState("");


    const [
        saving,
        setSaving,
    ] = useState(false);


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

            setFormData({
                ...EMPTY_FORM,
            });

            setFormError("");

            setFormOpen(true);
        };


    const openEditForm = (
        appointment
    ) => {
        setEditingAppointment(
            appointment
        );

        setFormData({
            patient:
                String(
                    appointment.patient ||
                    ""
                ),

            doctor:
                String(
                    appointment.doctor ||
                    ""
                ),

            appointment_date:
                appointment.appointment_date ||
                "",

            appointment_time:
                appointment.appointment_time
                    ?.slice(
                        0,
                        5
                    ) ||
                "",

            status:
                appointment.status ||
                "scheduled",

            reason:
                appointment.reason ||
                "",

            consultation_notes:
                appointment.consultation_notes ||
                "",
        });

        setFormError("");

        setFormOpen(true);
    };


    const closeForm =
        () => {
            if (saving) {
                return;
            }

            setFormOpen(false);

            setEditingAppointment(
                null
            );

            setFormData({
                ...EMPTY_FORM,
            });

            setFormError("");
        };


    const handleFormChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setFormData(
            (current) => ({
                ...current,
                [name]: value,
            })
        );
    };


    const validateForm =
        () => {
            if (!formData.patient) {
                return (
                    "Please select a patient."
                );
            }


            if (!formData.doctor) {
                return (
                    "Please select a doctor."
                );
            }


            if (
                !formData.appointment_date
            ) {
                return (
                    "Appointment date is required."
                );
            }


            if (
                !formData.appointment_time
            ) {
                return (
                    "Appointment time is required."
                );
            }


            if (
                !editingAppointment &&
                formData.appointment_date <
                getTodayString()
            ) {
                return (
                    "Appointment date cannot be in the past."
                );
            }


            if (
                !formData.reason.trim()
            ) {
                return (
                    "Please enter the reason for the appointment."
                );
            }


            return "";
        };


    const handleSubmit =
        async (
            event
        ) => {
            event.preventDefault();

            setFormError("");
            setSuccessMessage("");


            const validationError =
                validateForm();


            if (
                validationError
            ) {
                setFormError(
                    validationError
                );

                return;
            }


            setSaving(true);


            const payload = {
                patient:
                    Number(
                        formData.patient
                    ),

                doctor:
                    Number(
                        formData.doctor
                    ),

                appointment_date:
                    formData.appointment_date,

                appointment_time:
                    formData.appointment_time,

                status:
                    formData.status,

                reason:
                    formData.reason.trim(),

                consultation_notes:
                    formData
                        .consultation_notes
                        .trim(),
            };


            try {
                if (
                    editingAppointment
                ) {
                    await apiRequest(
                        `/appointments/${editingAppointment.id}/`,
                        {
                            method:
                                "PATCH",

                            body:
                                payload,
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
                            method:
                                "POST",

                            body:
                                payload,
                        }
                    );


                    setSuccessMessage(
                        "Appointment created successfully."
                    );
                }


                setFormOpen(false);

                setEditingAppointment(
                    null
                );

                setFormData({
                    ...EMPTY_FORM,
                });


                await loadData();
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


                setFormError(
                    requestError.message ||
                    "Unable to save appointment."
                );
            }

            finally {
                setSaving(false);
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


                setAppointments(
                    (current) =>
                        current.filter(
                            (
                                appointment
                            ) =>
                                appointment.id !==
                                appointmentToDelete.id
                        )
                );


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


                                                                            <button
                                                                                type="button"
                                                                                className="appointment-edit-action"
                                                                                onClick={() =>
                                                                                    openEditForm(
                                                                                        appointment
                                                                                    )
                                                                                }
                                                                            >
                                                                                Edit
                                                                            </button>


                                                                            <button
                                                                                type="button"
                                                                                className="appointment-delete-action"
                                                                                onClick={() =>
                                                                                    setAppointmentToDelete(
                                                                                        appointment
                                                                                    )
                                                                                }
                                                                            >
                                                                                Delete
                                                                            </button>

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


                                                                <button
                                                                    type="button"
                                                                    className="appointment-edit-action"
                                                                    onClick={() =>
                                                                        openEditForm(
                                                                            appointment
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="appointment-delete-action"
                                                                    onClick={() =>
                                                                        setAppointmentToDelete(
                                                                            appointment
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>

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


            {formOpen && (

                <div
                    className="appointment-modal-backdrop"
                    onMouseDown={
                        closeForm
                    }
                >

                    <div
                        className="appointment-modal appointment-form-modal"
                        onMouseDown={
                            (
                                event
                            ) =>
                                event.stopPropagation()
                        }
                    >

                        <div className="appointment-modal-header">

                            <div>

                                <span>
                                    {
                                        editingAppointment
                                            ? "Update Schedule"
                                            : "New Schedule"
                                    }
                                </span>

                                <h2>
                                    {
                                        editingAppointment
                                            ? "Edit Appointment"
                                            : "Create Appointment"
                                    }
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="appointment-modal-close"
                                onClick={
                                    closeForm
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>


                        <form
                            className="appointment-form"
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="appointment-form-grid">

                                <div className="appointment-form-group">

                                    <label>
                                        Patient
                                        <span>
                                            *
                                        </span>
                                    </label>


                                    <select
                                        name="patient"
                                        value={
                                            formData.patient
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    >
                                        <option value="">
                                            Select patient
                                        </option>

                                        {
                                            patients.map(
                                                (
                                                    patient
                                                ) => (
                                                    <option
                                                        key={
                                                            patient.id
                                                        }
                                                        value={
                                                            patient.id
                                                        }
                                                    >
                                                        {
                                                            patient.full_name
                                                        }
                                                    </option>
                                                )
                                            )
                                        }
                                    </select>

                                </div>


                                <div className="appointment-form-group">

                                    <label>
                                        Doctor
                                        <span>
                                            *
                                        </span>
                                    </label>


                                    <select
                                        name="doctor"
                                        value={
                                            formData.doctor
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    >
                                        <option value="">
                                            Select doctor
                                        </option>

                                        {
                                            doctors.map(
                                                (
                                                    doctor
                                                ) => (
                                                    <option
                                                        key={
                                                            doctor.id
                                                        }
                                                        value={
                                                            doctor.id
                                                        }
                                                        disabled={
                                                            !doctor.is_available &&
                                                            String(
                                                                doctor.id
                                                            ) !==
                                                            String(
                                                                formData.doctor
                                                            )
                                                        }
                                                    >
                                                        {
                                                            doctor.full_name
                                                        }
                                                        {" - "}
                                                        {
                                                            doctor.specialization
                                                        }
                                                        {
                                                            !doctor.is_available
                                                                ? " (Unavailable)"
                                                                : ""
                                                        }
                                                    </option>
                                                )
                                            )
                                        }
                                    </select>

                                </div>


                                <div className="appointment-form-group">

                                    <label>
                                        Date
                                        <span>
                                            *
                                        </span>
                                    </label>


                                    <input
                                        type="date"
                                        name="appointment_date"
                                        value={
                                            formData.appointment_date
                                        }
                                        min={
                                            editingAppointment
                                                ? undefined
                                                : getTodayString()
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    />

                                </div>


                                <div className="appointment-form-group">

                                    <label>
                                        Time
                                        <span>
                                            *
                                        </span>
                                    </label>


                                    <input
                                        type="time"
                                        name="appointment_time"
                                        value={
                                            formData.appointment_time
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    />

                                </div>


                                <div className="appointment-form-group appointment-form-full">

                                    <label>
                                        Status
                                    </label>


                                    <select
                                        name="status"
                                        value={
                                            formData.status
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    >
                                        <option value="scheduled">
                                            Scheduled
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

                                </div>


                                <div className="appointment-form-group appointment-form-full">

                                    <label>
                                        Reason
                                        <span>
                                            *
                                        </span>
                                    </label>


                                    <textarea
                                        name="reason"
                                        value={
                                            formData.reason
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="3"
                                        placeholder="Reason for appointment"
                                    />

                                </div>


                                <div className="appointment-form-group appointment-form-full">

                                    <label>
                                        Consultation Notes
                                    </label>


                                    <textarea
                                        name="consultation_notes"
                                        value={
                                            formData.consultation_notes
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        rows="4"
                                        placeholder="Optional consultation notes"
                                    />

                                </div>

                            </div>


                            {formError && (
                                <div className="appointment-form-error">
                                    {formError}
                                </div>
                            )}


                            <div className="appointment-form-actions">

                                <button
                                    type="button"
                                    className="appointment-cancel-button"
                                    onClick={
                                        closeForm
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="appointment-save-button"
                                    disabled={
                                        saving
                                    }
                                >
                                    {
                                        saving
                                            ? "Saving..."
                                            :
                                            editingAppointment
                                                ? "Update Appointment"
                                                : "Create Appointment"
                                    }
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {selectedAppointment && (

                <div
                    className="appointment-modal-backdrop"
                    onMouseDown={() =>
                        setSelectedAppointment(
                            null
                        )
                    }
                >

                    <div
                        className="appointment-modal appointment-details-modal"
                        onMouseDown={
                            (
                                event
                            ) =>
                                event.stopPropagation()
                        }
                    >

                        <div className="appointment-modal-header">

                            <div>

                                <span>
                                    Appointment Record
                                </span>

                                <h2>
                                    Appointment Details
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="appointment-modal-close"
                                onClick={() =>
                                    setSelectedAppointment(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>


                        <div className="appointment-details-heading">

                            <div className="appointment-details-icon">
                                A
                            </div>


                            <div>

                                <h3>
                                    {
                                        selectedAppointment.patient_name
                                    }
                                </h3>

                                <p>
                                    with{" "}
                                    {
                                        selectedAppointment.doctor_name
                                    }
                                </p>

                                <span
                                    className={
                                        `appointment-status-badge status-${selectedAppointment.status}`
                                    }
                                >
                                    {
                                        getStatusLabel(
                                            selectedAppointment.status
                                        )
                                    }
                                </span>

                            </div>

                        </div>


                        <div className="appointment-details-grid">

                            <div>

                                <span>
                                    Patient
                                </span>

                                <strong>
                                    {
                                        selectedAppointment.patient_name
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Doctor
                                </span>

                                <strong>
                                    {
                                        selectedAppointment.doctor_name
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Specialization
                                </span>

                                <strong>
                                    {
                                        selectedAppointment.doctor_specialization ||
                                        "Not provided"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Date
                                </span>

                                <strong>
                                    {
                                        formatDate(
                                            selectedAppointment.appointment_date
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
                                            selectedAppointment.appointment_time
                                        )
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {
                                        getStatusLabel(
                                            selectedAppointment.status
                                        )
                                    }
                                </strong>

                            </div>


                            <div className="appointment-detail-full">

                                <span>
                                    Reason
                                </span>

                                <p>
                                    {
                                        selectedAppointment.reason ||
                                        "Not provided"
                                    }
                                </p>

                            </div>


                            <div className="appointment-detail-full">

                                <span>
                                    Consultation Notes
                                </span>

                                <p>
                                    {
                                        selectedAppointment.consultation_notes ||
                                        "No consultation notes recorded."
                                    }
                                </p>

                            </div>

                        </div>


                        <div className="appointment-details-actions">

                            <button
                                type="button"
                                className="appointment-cancel-button"
                                onClick={() =>
                                    setSelectedAppointment(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>


                            <button
                                type="button"
                                className="appointment-save-button"
                                onClick={() => {
                                    const appointment =
                                        selectedAppointment;

                                    setSelectedAppointment(
                                        null
                                    );

                                    openEditForm(
                                        appointment
                                    );
                                }}
                            >
                                Edit Appointment
                            </button>

                        </div>

                    </div>

                </div>

            )}


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
                            Delete Appointment?
                        </h2>


                        <p>
                            Are you sure you want to
                            delete the appointment for{" "}

                            <strong>
                                {
                                    appointmentToDelete.patient_name
                                }
                            </strong>

                            ? This action cannot be undone.
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
                                        : "Delete Appointment"
                                }
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default AppointmentsPage;