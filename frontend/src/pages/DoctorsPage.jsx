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

import AddDoctorModal
    from "../components/doctors/AddDoctorModal";

import EditDoctorModal
    from "../components/doctors/EditDoctorModal";

import "./DashboardPage.css";
import "./DoctorsPage.css";


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


function DoctorsPage() {
    const navigate =
        useNavigate();


    const user =
        useCurrentUser();


    const [
        mobileMenuOpen,
        setMobileMenuOpen,
    ] = useState(false);


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
        searchTerm,
        setSearchTerm,
    ] = useState("");


    const [
        selectedDoctor,
        setSelectedDoctor,
    ] = useState(null);


    const [
        addDoctorOpen,
        setAddDoctorOpen,
    ] = useState(false);


    const [
        editingDoctor,
        setEditingDoctor,
    ] = useState(null);


    const loadDoctors =
        useCallback(
            async (
                shouldApply = () => true
            ) => {
                setLoading(true);

                setError("");


                try {
                    const data =
                        await apiRequest(
                            "/doctors/"
                        );


                    if (!shouldApply()) {
                        return;
                    }


                    setDoctors(
                        normalizeList(
                            data
                        )
                    );
                }

                catch (
                    requestError
                ) {
                    if (!shouldApply()) {
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
                                replace: true,
                            }
                        );

                        return;
                    }


                    setError(
                        requestError.message ||
                        "Unable to load doctors."
                    );
                }

                finally {
                    if (shouldApply()) {
                        setLoading(false);
                    }
                }
            },
            [navigate]
        );


    useEffect(() => {
        let cancelled =
            false;


        const loadInitialDoctors =
            async () => {
                await loadDoctors(
                    () => !cancelled
                );
            };


        loadInitialDoctors();


        return () => {
            cancelled =
                true;
        };

    }, [loadDoctors]);


    const handleDoctorsRefresh =
        useCallback(
            () => {
                setAddDoctorOpen(false);

                return loadDoctors();
            },
            [loadDoctors]
        );


    const handleDoctorUpdated =
        useCallback(
            () => {
                setEditingDoctor(null);

                return loadDoctors();
            },
            [loadDoctors]
        );


    const filteredDoctors =
        useMemo(
            () => {
                const query =
                    searchTerm
                        .trim()
                        .toLowerCase();


                if (!query) {
                    return doctors;
                }


                return doctors.filter(
                    (doctor) => {
                        const values = [
                            doctor.full_name,
                            doctor.email,
                            doctor.phone_number,
                            doctor.specialization,
                            doctor.license_number,
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
                doctors,
                searchTerm,
            ]
        );


    const availableDoctors =
        useMemo(
            () =>
                doctors.filter(
                    (doctor) =>
                        doctor.is_available
                ).length,
            [doctors]
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
        <div className="dashboard-page doctors-page">

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
                        className="nav-item active"
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
                        className="nav-item"
                        onClick={() =>
                            goTo(
                                "/appointments"
                            )
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
                                Directory
                            </span>

                            <h1>
                                Doctors
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


                <section className="doctors-hero">

                    <div>

                        <span className="doctors-hero-label">
                            Medical Team
                        </span>

                        <h2>
                            Find your doctors
                        </h2>

                        <p>
                            Browse available doctors,
                            specializations and
                            professional information.
                        </p>

                    </div>


                    <div className="doctor-availability-summary">

                        <strong>
                            {
                                loading
                                    ? "..."
                                    : availableDoctors
                            }
                        </strong>

                        <span>
                            Available
                        </span>

                    </div>

                </section>


                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}


                <section className="doctors-content">

                    <div className="doctors-toolbar">

                        <div className="doctors-search">

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
                                placeholder="Search name, specialization, email or license..."
                            />

                        </div>


                        <div className="doctors-toolbar-actions">

                            <div className="doctor-count">

                                <strong>
                                    {
                                        filteredDoctors.length
                                    }
                                </strong>

                                <span>
                                    {
                                        filteredDoctors.length ===
                                        1
                                            ? "Doctor"
                                            : "Doctors"
                                    }
                                </span>

                            </div>


                            {user?.is_staff === true && (
                                <button
                                    type="button"
                                    className="doctor-add-button"
                                    onClick={() =>
                                        setAddDoctorOpen(
                                            true
                                        )
                                    }
                                >
                                    Add Doctor
                                </button>
                            )}

                        </div>

                    </div>


                    {
                        loading
                            ? (
                                <div className="doctors-loading">

                                    <div className="doctor-loading-spinner" />

                                    <span>
                                        Loading doctors...
                                    </span>

                                </div>
                            )
                            :
                            filteredDoctors.length ===
                            0
                                ? (
                                    <div className="doctors-empty">

                                        <div className="doctors-empty-icon">
                                            Dr
                                        </div>

                                        <h3>
                                            {
                                                searchTerm
                                                    ? "No matching doctors"
                                                    : "No doctors available"
                                            }
                                        </h3>

                                        <p>
                                            {
                                                searchTerm
                                                    ? "Try a different search term."
                                                    : "Doctor profiles will appear here when available."
                                            }
                                        </p>

                                    </div>
                                )
                                : (
                                    <>

                                        <div className="doctors-table-wrapper">

                                            <table className="doctors-table">

                                                <thead>

                                                    <tr>
                                                        <th>
                                                            Doctor
                                                        </th>

                                                        <th>
                                                            Specialization
                                                        </th>

                                                        <th>
                                                            Contact
                                                        </th>

                                                        <th>
                                                            Experience
                                                        </th>

                                                        <th>
                                                            License
                                                        </th>

                                                        <th>
                                                            Status
                                                        </th>

                                                        <th>
                                                            Action
                                                        </th>
                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {
                                                        filteredDoctors.map(
                                                            (
                                                                doctor
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        doctor.id
                                                                    }
                                                                >

                                                                    <td>

                                                                        <div className="doctor-name-cell">

                                                                            <div className="doctor-avatar">
                                                                                {
                                                                                    doctor.full_name
                                                                                        ?.charAt(0)
                                                                                        ?.toUpperCase() ||
                                                                                    "D"
                                                                                }
                                                                            </div>


                                                                            <div>

                                                                                <strong>
                                                                                    {
                                                                                        doctor.full_name
                                                                                    }
                                                                                </strong>

                                                                                <span>
                                                                                    Doctor ID #{doctor.id}
                                                                                </span>

                                                                            </div>

                                                                        </div>

                                                                    </td>


                                                                    <td>

                                                                        <span className="specialization-badge">
                                                                            {
                                                                                doctor.specialization ||
                                                                                "General"
                                                                            }
                                                                        </span>

                                                                    </td>


                                                                    <td>

                                                                        <div className="doctor-contact">

                                                                            <strong>
                                                                                {
                                                                                    doctor.phone_number ||
                                                                                    "No phone"
                                                                                }
                                                                            </strong>

                                                                            <span>
                                                                                {
                                                                                    doctor.email ||
                                                                                    "No email"
                                                                                }
                                                                            </span>

                                                                        </div>

                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            doctor.experience_years
                                                                        }{" "}
                                                                        {
                                                                            Number(
                                                                                doctor.experience_years
                                                                            ) ===
                                                                            1
                                                                                ? "year"
                                                                                : "years"
                                                                        }
                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            doctor.license_number
                                                                        }
                                                                    </td>


                                                                    <td>

                                                                        <span
                                                                            className={
                                                                                `doctor-status ${
                                                                                    doctor.is_available
                                                                                        ? "available"
                                                                                        : "unavailable"
                                                                                }`
                                                                            }
                                                                        >
                                                                            {
                                                                                doctor.is_available
                                                                                    ? "Available"
                                                                                    : "Unavailable"
                                                                            }
                                                                        </span>

                                                                    </td>


                                                                    <td>

                                                                        <div className="doctor-row-actions">

                                                                            <button
                                                                                type="button"
                                                                                className="doctor-view-button"
                                                                                onClick={() =>
                                                                                    setSelectedDoctor(
                                                                                        doctor
                                                                                    )
                                                                                }
                                                                            >
                                                                                View
                                                                            </button>


                                                                            {user?.is_staff === true && (
                                                                                <button
                                                                                    type="button"
                                                                                    className="doctor-edit-button"
                                                                                    onClick={() =>
                                                                                        setEditingDoctor(
                                                                                            doctor
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    Edit
                                                                                </button>
                                                                            )}

                                                                        </div>

                                                                    </td>

                                                                </tr>
                                                            )
                                                        )
                                                    }

                                                </tbody>

                                            </table>

                                        </div>


                                        <div className="doctors-mobile-list">

                                            {
                                                filteredDoctors.map(
                                                    (
                                                        doctor
                                                    ) => (
                                                        <article
                                                            className="doctor-mobile-card"
                                                            key={
                                                                doctor.id
                                                            }
                                                        >

                                                            <div className="doctor-mobile-heading">

                                                                <div className="doctor-name-cell">

                                                                    <div className="doctor-avatar">
                                                                        {
                                                                            doctor.full_name
                                                                                ?.charAt(0)
                                                                                ?.toUpperCase() ||
                                                                            "D"
                                                                        }
                                                                    </div>


                                                                    <div>

                                                                        <strong>
                                                                            {
                                                                                doctor.full_name
                                                                            }
                                                                        </strong>

                                                                        <span>
                                                                            ID #{doctor.id}
                                                                        </span>

                                                                    </div>

                                                                </div>


                                                                <span
                                                                    className={
                                                                        `doctor-status ${
                                                                            doctor.is_available
                                                                                ? "available"
                                                                                : "unavailable"
                                                                        }`
                                                                    }
                                                                >
                                                                    {
                                                                        doctor.is_available
                                                                            ? "Available"
                                                                            : "Unavailable"
                                                                    }
                                                                </span>

                                                            </div>


                                                            <span className="mobile-specialization">
                                                                {
                                                                    doctor.specialization ||
                                                                    "General"
                                                                }
                                                            </span>


                                                            <div className="doctor-mobile-details">

                                                                <div>

                                                                    <span>
                                                                        Experience
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            doctor.experience_years
                                                                        }{" "}
                                                                        years
                                                                    </strong>

                                                                </div>


                                                                <div>

                                                                    <span>
                                                                        License
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            doctor.license_number
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div>

                                                                    <span>
                                                                        Phone
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            doctor.phone_number ||
                                                                            "Not provided"
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div>

                                                                    <span>
                                                                        Email
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            doctor.email ||
                                                                            "Not provided"
                                                                        }
                                                                    </strong>

                                                                </div>

                                                            </div>


                                                            <div className="doctor-mobile-actions">

                                                                <button
                                                                    type="button"
                                                                    className="doctor-mobile-view"
                                                                    onClick={() =>
                                                                        setSelectedDoctor(
                                                                            doctor
                                                                        )
                                                                    }
                                                                >
                                                                    View Doctor
                                                                </button>


                                                                {user?.is_staff === true && (
                                                                    <button
                                                                        type="button"
                                                                        className="doctor-mobile-edit"
                                                                        onClick={() =>
                                                                            setEditingDoctor(
                                                                                doctor
                                                                            )
                                                                        }
                                                                    >
                                                                        Edit Doctor
                                                                    </button>
                                                                )}

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


            <AddDoctorModal
                isOpen={addDoctorOpen}
                onClose={() =>
                    setAddDoctorOpen(false)
                }
                onDoctorCreated={
                    handleDoctorsRefresh
                }
            />


            <EditDoctorModal
                isOpen={Boolean(
                    editingDoctor
                )}
                doctor={editingDoctor}
                onClose={() =>
                    setEditingDoctor(null)
                }
                onDoctorUpdated={
                    handleDoctorUpdated
                }
            />


            {selectedDoctor && (
                <div
                    className="doctor-modal-backdrop"
                    onMouseDown={() =>
                        setSelectedDoctor(
                            null
                        )
                    }
                >

                    <div
                        className="doctor-modal"
                        onMouseDown={
                            (
                                event
                            ) =>
                                event.stopPropagation()
                        }
                    >

                        <div className="doctor-modal-header">

                            <div>

                                <span>
                                    Doctor Profile
                                </span>

                                <h2>
                                    Doctor Details
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="doctor-modal-close"
                                onClick={() =>
                                    setSelectedDoctor(
                                        null
                                    )
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>


                        <div className="doctor-profile-heading">

                            <div className="doctor-profile-avatar">
                                {
                                    selectedDoctor.full_name
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                    "D"
                                }
                            </div>


                            <div>

                                <h3>
                                    {
                                        selectedDoctor.full_name
                                    }
                                </h3>

                                <p>
                                    {
                                        selectedDoctor.specialization ||
                                        "General"
                                    }
                                </p>

                                <span
                                    className={
                                        `doctor-status ${
                                            selectedDoctor.is_available
                                                ? "available"
                                                : "unavailable"
                                        }`
                                    }
                                >
                                    {
                                        selectedDoctor.is_available
                                            ? "Available"
                                            : "Unavailable"
                                    }
                                </span>

                            </div>

                        </div>


                        <div className="doctor-details-grid">

                            <div>

                                <span>
                                    Email
                                </span>

                                <strong>
                                    {
                                        selectedDoctor.email ||
                                        "Not provided"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Phone Number
                                </span>

                                <strong>
                                    {
                                        selectedDoctor.phone_number ||
                                        "Not provided"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Specialization
                                </span>

                                <strong>
                                    {
                                        selectedDoctor.specialization ||
                                        "General"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Experience
                                </span>

                                <strong>
                                    {
                                        selectedDoctor.experience_years
                                    }{" "}
                                    years
                                </strong>

                            </div>


                            <div className="doctor-detail-full">

                                <span>
                                    License Number
                                </span>

                                <strong>
                                    {
                                        selectedDoctor.license_number
                                    }
                                </strong>

                            </div>

                        </div>


                        <button
                            type="button"
                            className="doctor-details-close"
                            onClick={() =>
                                setSelectedDoctor(
                                    null
                                )
                            }
                        >
                            Close
                        </button>

                    </div>

                </div>
            )}

        </div>
    );
}


export default DoctorsPage;
