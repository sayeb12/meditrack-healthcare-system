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


const normalizeList = (
    data
) => {

    if (
        Array.isArray(data)
    ) {
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


const formatTime = (
    time
) => {

    if (!time) {
        return "";
    }


    const [
        hours,
        minutes,
    ] = time.split(":");


    const date =
        new Date();


    date.setHours(
        Number(hours),
        Number(minutes),
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


const formatAppointmentDate = (
    dateString
) => {

    if (!dateString) {
        return {
            day: "",
            month: "",
        };
    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return {

        day:
            date.toLocaleDateString(
                undefined,
                {
                    day: "2-digit",
                }
            ),

        month:
            date.toLocaleDateString(
                undefined,
                {
                    month: "short",
                }
            ),
    };
};


function DashboardPage() {

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
        patients,
        setPatients,
    ] = useState([]);


    const [
        doctors,
        setDoctors,
    ] = useState([]);


    const [
        appointments,
        setAppointments,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    useEffect(() => {

        let cancelled =
            false;


        const loadDashboardData =
            async () => {

                setLoading(
                    true
                );

                setError("");


                try {

                    const [
                        patientData,
                        doctorData,
                        appointmentData,
                    ] =
                        await Promise.all([
                            apiRequest(
                                "/patients/"
                            ),

                            apiRequest(
                                "/doctors/"
                            ),

                            apiRequest(
                                "/appointments/"
                            ),
                        ]);


                    if (cancelled) {
                        return;
                    }


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


                    setAppointments(
                        normalizeList(
                            appointmentData
                        )
                    );

                }

                catch (
                    requestError
                ) {

                    if (cancelled) {
                        return;
                    }


                    if (
                        requestError.status ===
                        401
                    ) {

                        clearAuthSession();


                        navigate(
                            "/",
                            {
                                replace:
                                    true,
                            }
                        );


                        return;
                    }


                    setError(
                        requestError.message ||
                        "Unable to load dashboard data."
                    );

                }

                finally {

                    if (
                        !cancelled
                    ) {

                        setLoading(
                            false
                        );
                    }
                }
            };


        loadDashboardData();


        return () => {

            cancelled =
                true;
        };

    }, [navigate]);


    const availableDoctors =
        useMemo(
            () =>
                doctors.filter(
                    (doctor) =>
                        doctor.is_available
                ).length,
            [doctors]
        );


    const scheduledAppointments =
        useMemo(
            () =>
                appointments.filter(
                    (
                        appointment
                    ) =>
                        appointment.status ===
                        "scheduled"
                ),
            [appointments]
        );


    const completedAppointments =
        useMemo(
            () =>
                appointments.filter(
                    (
                        appointment
                    ) =>
                        appointment.status ===
                        "completed"
                ),
            [appointments]
        );


    const upcomingAppointments =
        useMemo(
            () => {

                const now =
                    new Date();


                return appointments
                    .filter(
                        (
                            appointment
                        ) => {

                            if (
                                appointment.status !==
                                "scheduled"
                            ) {

                                return false;
                            }


                            const dateTime =
                                new Date(
                                    `${appointment.appointment_date}T${appointment.appointment_time}`
                                );


                            return (
                                dateTime >=
                                now
                            );
                        }
                    )
                    .sort(
                        (
                            first,
                            second
                        ) => {

                            const firstDate =
                                new Date(
                                    `${first.appointment_date}T${first.appointment_time}`
                                );


                            const secondDate =
                                new Date(
                                    `${second.appointment_date}T${second.appointment_time}`
                                );


                            return (
                                firstDate -
                                secondDate
                            );
                        }
                    )
                    .slice(
                        0,
                        5
                    );

            },
            [appointments]
        );


    const closeMobileMenu =
        () => {

            setMobileMenuOpen(
                false
            );
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
                        replace:
                            true,
                    }
                );
            }
        };


    return (

        <div className="dashboard-page">


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
                        className="nav-item active"
                        onClick={
                            closeMobileMenu
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
                        onClick={() => {

                            closeMobileMenu();

                            navigate(
                                "/patients"
                            );
                        }}
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
                    >

                        <span className="nav-icon">
                            Dr
                        </span>

                        <span>
                            Doctors
                        </span>

                        <span className="nav-tag">
                            Soon
                        </span>

                    </button>


                    <button
                        type="button"
                        className="nav-item"
                    >

                        <span className="nav-icon">
                            A
                        </span>

                        <span>
                            Appointments
                        </span>

                        <span className="nav-tag">
                            Soon
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
                                Overview
                            </span>

                            <h1>
                                Dashboard
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


                <section className="welcome-card">

                    <div>

                        <span className="welcome-label">
                            Welcome Back
                        </span>


                        <h2>
                            {
                                user?.full_name ||
                                "MediTrack User"
                            }
                        </h2>


                        <p>
                            Manage patients,
                            doctors and appointments
                            from your healthcare
                            workspace.
                        </p>

                    </div>


                    <div className="welcome-logo">
                        MediTrack
                    </div>

                </section>


                {error && (

                    <div className="dashboard-error">
                        {error}
                    </div>

                )}


                <section className="stats-grid">

                    <article className="stat-card">

                        <div className="stat-icon">
                            P
                        </div>


                        <div>

                            <span>
                                Total Patients
                            </span>

                            <strong>
                                {
                                    loading
                                        ? "..."
                                        : patients.length
                                }
                            </strong>

                        </div>

                    </article>


                    <article className="stat-card">

                        <div className="stat-icon">
                            Dr
                        </div>


                        <div>

                            <span>
                                Available Doctors
                            </span>

                            <strong>
                                {
                                    loading
                                        ? "..."
                                        : availableDoctors
                                }
                            </strong>

                        </div>

                    </article>


                    <article className="stat-card">

                        <div className="stat-icon">
                            A
                        </div>


                        <div>

                            <span>
                                Scheduled
                            </span>

                            <strong>
                                {
                                    loading
                                        ? "..."
                                        : scheduledAppointments.length
                                }
                            </strong>

                        </div>

                    </article>


                    <article className="stat-card">

                        <div className="stat-icon">
                            ✓
                        </div>


                        <div>

                            <span>
                                Completed
                            </span>

                            <strong>
                                {
                                    loading
                                        ? "..."
                                        : completedAppointments.length
                                }
                            </strong>

                        </div>

                    </article>

                </section>


                <section className="dashboard-grid">

                    <article className="dashboard-panel">

                        <div className="panel-header">

                            <div>

                                <span>
                                    Schedule
                                </span>

                                <h2>
                                    Upcoming Appointments
                                </h2>

                            </div>

                        </div>


                        {
                            loading
                                ? (

                                    <div className="empty-state">

                                        <strong>
                                            Loading dashboard...
                                        </strong>

                                    </div>

                                )
                                :
                                upcomingAppointments.length ===
                                0
                                    ? (

                                        <div className="empty-state">

                                            <div className="empty-icon">
                                                A
                                            </div>


                                            <strong>
                                                No upcoming appointments
                                            </strong>


                                            <p>
                                                Your scheduled
                                                appointments will
                                                appear here.
                                            </p>

                                        </div>

                                    )
                                    : (

                                        <div className="appointment-list">

                                            {
                                                upcomingAppointments.map(
                                                    (
                                                        appointment
                                                    ) => {

                                                        const date =
                                                            formatAppointmentDate(
                                                                appointment.appointment_date
                                                            );


                                                        return (

                                                            <div
                                                                className="appointment-item"
                                                                key={
                                                                    appointment.id
                                                                }
                                                            >

                                                                <div className="appointment-date">

                                                                    <strong>
                                                                        {
                                                                            date.day
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        {
                                                                            date.month
                                                                        }
                                                                    </span>

                                                                </div>


                                                                <div className="appointment-info">

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


                                                                    <small>
                                                                        {
                                                                            formatTime(
                                                                                appointment.appointment_time
                                                                            )
                                                                        }
                                                                    </small>

                                                                </div>


                                                                <span className="appointment-status">
                                                                    Scheduled
                                                                </span>

                                                            </div>

                                                        );
                                                    }
                                                )
                                            }

                                        </div>

                                    )
                        }

                    </article>


                    <article className="dashboard-panel">

                        <div className="panel-header">

                            <div>

                                <span>
                                    System
                                </span>

                                <h2>
                                    Quick Summary
                                </h2>

                            </div>

                        </div>


                        <div className="summary-list">

                            <div className="summary-item">

                                <span>
                                    Registered Patients
                                </span>

                                <strong>
                                    {
                                        loading
                                            ? "..."
                                            : patients.length
                                    }
                                </strong>

                            </div>


                            <div className="summary-item">

                                <span>
                                    Total Doctors
                                </span>

                                <strong>
                                    {
                                        loading
                                            ? "..."
                                            : doctors.length
                                    }
                                </strong>

                            </div>


                            <div className="summary-item">

                                <span>
                                    Available Doctors
                                </span>

                                <strong>
                                    {
                                        loading
                                            ? "..."
                                            : availableDoctors
                                    }
                                </strong>

                            </div>


                            <div className="summary-item">

                                <span>
                                    All Appointments
                                </span>

                                <strong>
                                    {
                                        loading
                                            ? "..."
                                            : appointments.length
                                    }
                                </strong>

                            </div>


                            <div className="summary-item">

                                <span>
                                    Scheduled
                                </span>

                                <strong>
                                    {
                                        loading
                                            ? "..."
                                            : scheduledAppointments.length
                                    }
                                </strong>

                            </div>


                            <div className="summary-item">

                                <span>
                                    Completed
                                </span>

                                <strong>
                                    {
                                        loading
                                            ? "..."
                                            : completedAppointments.length
                                    }
                                </strong>

                            </div>

                        </div>

                    </article>

                </section>

            </main>

        </div>
    );
}


export default DashboardPage;