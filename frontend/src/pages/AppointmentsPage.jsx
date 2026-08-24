import {
    useCallback,
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

import useAppointments
    from "../hooks/useAppointments";

import {
    canUserCreateAppointment,
    countAppointmentsByStatus,
    filterAppointments,
} from "../utils/appointmentHelpers";

import AppointmentDetailsModal
    from "../components/appointments/AppointmentDetailsModal";

import AppointmentFormModal
    from "../components/appointments/AppointmentFormModal";

import AppointmentLifecycleModal
    from "../components/appointments/AppointmentLifecycleModal";

import AppointmentMobileCards
    from "../components/appointments/AppointmentMobileCards";

import AppointmentTable
    from "../components/appointments/AppointmentTable";

import DeleteAppointmentModal
    from "../components/appointments/DeleteAppointmentModal";

import "./DashboardPage.css";
import "./AppointmentsPage.css";


function AppointmentsPage() {
    const navigate =
        useNavigate();


    const user =
        useCurrentUser();


    const {
        appointments,
        patients,
        doctors,
        loading,
        error,
        loadData,
        refreshAppointments,
        createAppointment,
        updateAppointment,
        deleteAppointment,
    } = useAppointments();


    const [
        mobileMenuOpen,
        setMobileMenuOpen,
    ] = useState(false);


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
        deleteError,
        setDeleteError,
    ] = useState("");


    const [
        lifecycleAppointment,
        setLifecycleAppointment,
    ] = useState(null);


    const [
        lifecycleAction,
        setLifecycleAction,
    ] = useState(null);


    const handleSessionError = useCallback(
        (requestError) => {
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
        },
        [navigate]
    );


    useEffect(() => {
        loadData().catch(
            handleSessionError
        );
    }, [handleSessionError, loadData]);


    const filteredAppointments =
        useMemo(
            () =>
                filterAppointments(
                    appointments,
                    searchTerm,
                    statusFilter
                ),
            [
                appointments,
                searchTerm,
                statusFilter,
            ]
        );


    const scheduledCount =
        useMemo(
            () =>
                countAppointmentsByStatus(
                    appointments,
                    "scheduled"
                ),
            [appointments]
        );


    const canCreateAppointment =
        useMemo(
            () =>
                canUserCreateAppointment(
                    patients,
                    user
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
            setDeleteError("");
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

        try {
            await refreshAppointments();
        }

        catch (requestError) {
            handleSessionError(
                requestError
            );
        }
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
                await updateAppointment(
                    appointment.id,
                    payload
                );

                setSuccessMessage(
                    "Appointment updated successfully."
                );
            }

            else {
                await createAppointment(
                    payload
                );

                setSuccessMessage(
                    "Appointment created successfully."
                );
            }

            try {
                await refreshAppointments();
            }

            catch (requestError) {
                handleSessionError(
                    requestError
                );
            }
        }

        catch (requestError) {
            handleSessionError(
                requestError
            );

            throw requestError;
        }
    };


    const closeDeleteModal = () => {
        if (deleting) {
            return;
        }

        setAppointmentToDelete(null);
        setDeleteError("");
    };


    const handleDelete =
        async () => {
            if (
                !appointmentToDelete
            ) {
                return;
            }


            setDeleting(true);

            setDeleteError("");
            setSuccessMessage("");


            try {
                await deleteAppointment(
                    appointmentToDelete.id
                );


                try {
                    await refreshAppointments();
                }

                catch (requestError) {
                    handleSessionError(
                        requestError
                    );
                }


                setSuccessMessage(
                    "Appointment deleted successfully."
                );


                setAppointmentToDelete(
                    null
                );

                setDeleteError("");
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


                setDeleteError(
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

                                        <AppointmentTable
                                            appointments={filteredAppointments}
                                            user={user}
                                            doctors={doctors}
                                            onView={setSelectedAppointment}
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


                                        <AppointmentMobileCards
                                            appointments={filteredAppointments}
                                            user={user}
                                            doctors={doctors}
                                            onView={setSelectedAppointment}
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


            <DeleteAppointmentModal
                isOpen={Boolean(
                    appointmentToDelete
                )}
                appointment={appointmentToDelete}
                onClose={closeDeleteModal}
                onDeleteConfirmed={handleDelete}
                loading={deleting}
                error={deleteError}
            />


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
