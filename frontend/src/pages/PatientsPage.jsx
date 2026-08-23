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

import {
    isValidBDPhone,
    isValidEmail,
} from "../utils/validators";

import "./DashboardPage.css";
import "./PatientsPage.css";


const EMPTY_FORM = {
    full_name: "",
    date_of_birth: "",
    gender: "",
    phone_number: "",
    email: "",
    address: "",
    blood_group: "",
    medical_notes: "",
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


const formatGender = (
    gender
) => {
    if (!gender) {
        return "Not provided";
    }

    return (
        gender.charAt(0).toUpperCase() +
        gender.slice(1)
    );
};


function PatientsPage() {
    const navigate =
        useNavigate();


    const user =
        useCurrentUser();


    const [
        mobileMenuOpen,
        setMobileMenuOpen,
    ] = useState(false);


    const [
        patients,
        setPatients,
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
        formOpen,
        setFormOpen,
    ] = useState(false);


    const [
        editingPatient,
        setEditingPatient,
    ] = useState(null);


    const [
        formData,
        setFormData,
    ] = useState(
        EMPTY_FORM
    );


    const [
        formError,
        setFormError,
    ] = useState("");


    const [
        saving,
        setSaving,
    ] = useState(false);


    const [
        selectedPatient,
        setSelectedPatient,
    ] = useState(null);


    const [
        patientToDelete,
        setPatientToDelete,
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


    const loadPatients =
        async () => {
            setLoading(true);
            setError("");

            try {
                const data =
                    await apiRequest(
                        "/patients/"
                    );

                setPatients(
                    normalizeList(
                        data
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
                    "Unable to load patients."
                );
            }

            finally {
                setLoading(false);
            }
        };


    useEffect(() => {
        loadPatients();
    }, []);


    const filteredPatients =
        useMemo(
            () => {
                const query =
                    searchTerm
                        .trim()
                        .toLowerCase();


                if (!query) {
                    return patients;
                }


                return patients.filter(
                    (patient) => {
                        const values = [
                            patient.full_name,
                            patient.phone_number,
                            patient.email,
                            patient.blood_group,
                            patient.gender,
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
                patients,
                searchTerm,
            ]
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
            setEditingPatient(
                null
            );

            setFormData({
                ...EMPTY_FORM,
            });

            setFormError("");

            setFormOpen(true);
        };


    const openEditForm = (
        patient
    ) => {
        setEditingPatient(
            patient
        );


        setFormData({
            full_name:
                patient.full_name || "",

            date_of_birth:
                patient.date_of_birth || "",

            gender:
                patient.gender || "",

            phone_number:
                patient.phone_number || "",

            email:
                patient.email || "",

            address:
                patient.address || "",

            blood_group:
                patient.blood_group || "",

            medical_notes:
                patient.medical_notes || "",
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

            setEditingPatient(
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
            if (
                !formData.full_name.trim()
            ) {
                return (
                    "Patient full name is required."
                );
            }


            if (
                !formData.gender
            ) {
                return (
                    "Please select the patient's gender."
                );
            }


            if (
                !formData.phone_number.trim()
            ) {
                return (
                    "Phone number is required."
                );
            }


            if (
                !isValidBDPhone(
                    formData.phone_number
                )
            ) {
                return (
                    "Enter a valid Bangladesh phone number."
                );
            }


            if (
                formData.email.trim() &&
                !isValidEmail(
                    formData.email
                )
            ) {
                return (
                    "Enter a valid email address."
                );
            }


            if (
                formData.date_of_birth
            ) {
                const birthDate =
                    new Date(
                        `${formData.date_of_birth}T00:00:00`
                    );

                const today =
                    new Date();

                today.setHours(
                    23,
                    59,
                    59,
                    999
                );


                if (
                    birthDate >
                    today
                ) {
                    return (
                        "Date of birth cannot be in the future."
                    );
                }
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
                full_name:
                    formData.full_name.trim(),

                date_of_birth:
                    formData.date_of_birth ||
                    null,

                gender:
                    formData.gender,

                phone_number:
                    formData.phone_number.trim(),

                email:
                    formData.email.trim(),

                address:
                    formData.address.trim(),

                blood_group:
                    formData.blood_group,

                medical_notes:
                    formData.medical_notes.trim(),
            };


            try {
                if (
                    editingPatient
                ) {
                    await apiRequest(
                        `/patients/${editingPatient.id}/`,
                        {
                            method:
                                "PATCH",

                            body:
                                payload,
                        }
                    );


                    setSuccessMessage(
                        "Patient updated successfully."
                    );
                }

                else {
                    await apiRequest(
                        "/patients/",
                        {
                            method:
                                "POST",

                            body:
                                payload,
                        }
                    );


                    setSuccessMessage(
                        "Patient added successfully."
                    );
                }


                setFormOpen(false);

                setEditingPatient(
                    null
                );

                setFormData({
                    ...EMPTY_FORM,
                });


                await loadPatients();
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
                    "Unable to save patient."
                );
            }

            finally {
                setSaving(false);
            }
        };


    const handleDelete =
        async () => {
            if (
                !patientToDelete
            ) {
                return;
            }


            setDeleting(true);

            setError("");

            setSuccessMessage("");


            try {
                await apiRequest(
                    `/patients/${patientToDelete.id}/`,
                    {
                        method:
                            "DELETE",
                    }
                );


                setPatients(
                    (current) =>
                        current.filter(
                            (patient) =>
                                patient.id !==
                                patientToDelete.id
                        )
                );


                setSuccessMessage(
                    "Patient deleted successfully."
                );


                setPatientToDelete(
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
                    "Unable to delete patient."
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
        <div className="dashboard-page patients-page">


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
                        className="nav-item active"
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
                                Management
                            </span>

                            <h1>
                                Patients
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


                <section className="patients-hero">

                    <div>

                        <span className="patients-hero-label">
                            Patient Records
                        </span>

                        <h2>
                            Manage your patients
                        </h2>

                        <p>
                            Add, view, update and
                            securely manage patient
                            information.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="add-patient-button"
                        onClick={
                            openCreateForm
                        }
                    >
                        <span>
                            +
                        </span>

                        Add Patient
                    </button>

                </section>


                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}


                {successMessage && (
                    <div className="patients-success">
                        {successMessage}
                    </div>
                )}


                <section className="patients-content">

                    <div className="patients-toolbar">

                        <div className="patients-search">

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
                                placeholder="Search by name, phone, email, blood group..."
                            />

                        </div>


                        <div className="patient-count">

                            <strong>
                                {
                                    filteredPatients.length
                                }
                            </strong>

                            <span>
                                {
                                    filteredPatients.length ===
                                    1
                                        ? "Patient"
                                        : "Patients"
                                }
                            </span>

                        </div>

                    </div>


                    {
                        loading
                            ? (
                                <div className="patients-loading">

                                    <div className="loading-spinner" />

                                    <span>
                                        Loading patients...
                                    </span>

                                </div>
                            )
                            :
                            filteredPatients.length ===
                            0
                                ? (
                                    <div className="patients-empty">

                                        <div className="patients-empty-icon">
                                            P
                                        </div>


                                        <h3>
                                            {
                                                searchTerm
                                                    ? "No matching patients"
                                                    : "No patients yet"
                                            }
                                        </h3>


                                        <p>
                                            {
                                                searchTerm
                                                    ? "Try another search term."
                                                    : "Add your first patient to start managing patient records."
                                            }
                                        </p>


                                        {
                                            !searchTerm &&
                                            (
                                                <button
                                                    type="button"
                                                    onClick={
                                                        openCreateForm
                                                    }
                                                >
                                                    Add Patient
                                                </button>
                                            )
                                        }

                                    </div>
                                )
                                : (
                                    <>

                                        <div className="patients-table-wrapper">

                                            <table className="patients-table">

                                                <thead>

                                                    <tr>

                                                        <th>
                                                            Patient
                                                        </th>

                                                        <th>
                                                            Contact
                                                        </th>

                                                        <th>
                                                            Gender
                                                        </th>

                                                        <th>
                                                            Blood Group
                                                        </th>

                                                        <th>
                                                            Date of Birth
                                                        </th>

                                                        <th>
                                                            Actions
                                                        </th>

                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {
                                                        filteredPatients.map(
                                                            (
                                                                patient
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        patient.id
                                                                    }
                                                                >

                                                                    <td>

                                                                        <div className="patient-name-cell">

                                                                            <div className="patient-table-avatar">
                                                                                {
                                                                                    patient.full_name
                                                                                        ?.charAt(0)
                                                                                        ?.toUpperCase() ||
                                                                                    "P"
                                                                                }
                                                                            </div>


                                                                            <div>

                                                                                <strong>
                                                                                    {
                                                                                        patient.full_name
                                                                                    }
                                                                                </strong>

                                                                                <span>
                                                                                    ID #{patient.id}
                                                                                </span>

                                                                            </div>

                                                                        </div>

                                                                    </td>


                                                                    <td>

                                                                        <div className="patient-contact">

                                                                            <strong>
                                                                                {
                                                                                    patient.phone_number
                                                                                }
                                                                            </strong>

                                                                            <span>
                                                                                {
                                                                                    patient.email ||
                                                                                    "No email"
                                                                                }
                                                                            </span>

                                                                        </div>

                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            formatGender(
                                                                                patient.gender
                                                                            )
                                                                        }
                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            patient.blood_group
                                                                                ? (
                                                                                    <span className="blood-badge">
                                                                                        {
                                                                                            patient.blood_group
                                                                                        }
                                                                                    </span>
                                                                                )
                                                                                : (
                                                                                    <span className="not-provided">
                                                                                        Not provided
                                                                                    </span>
                                                                                )
                                                                        }

                                                                    </td>


                                                                    <td>
                                                                        {
                                                                            formatDate(
                                                                                patient.date_of_birth
                                                                            )
                                                                        }
                                                                    </td>


                                                                    <td>

                                                                        <div className="patient-actions">

                                                                            <button
                                                                                type="button"
                                                                                className="view-action"
                                                                                onClick={() =>
                                                                                    setSelectedPatient(
                                                                                        patient
                                                                                    )
                                                                                }
                                                                            >
                                                                                View
                                                                            </button>


                                                                            <button
                                                                                type="button"
                                                                                className="edit-action"
                                                                                onClick={() =>
                                                                                    openEditForm(
                                                                                        patient
                                                                                    )
                                                                                }
                                                                            >
                                                                                Edit
                                                                            </button>


                                                                            <button
                                                                                type="button"
                                                                                className="delete-action"
                                                                                onClick={() =>
                                                                                    setPatientToDelete(
                                                                                        patient
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


                                        <div className="patients-mobile-list">

                                            {
                                                filteredPatients.map(
                                                    (
                                                        patient
                                                    ) => (
                                                        <article
                                                            className="patient-mobile-card"
                                                            key={
                                                                patient.id
                                                            }
                                                        >

                                                            <div className="mobile-patient-header">

                                                                <div className="patient-name-cell">

                                                                    <div className="patient-table-avatar">
                                                                        {
                                                                            patient.full_name
                                                                                ?.charAt(0)
                                                                                ?.toUpperCase() ||
                                                                            "P"
                                                                        }
                                                                    </div>


                                                                    <div>

                                                                        <strong>
                                                                            {
                                                                                patient.full_name
                                                                            }
                                                                        </strong>

                                                                        <span>
                                                                            ID #{patient.id}
                                                                        </span>

                                                                    </div>

                                                                </div>


                                                                {
                                                                    patient.blood_group &&
                                                                    (
                                                                        <span className="blood-badge">
                                                                            {
                                                                                patient.blood_group
                                                                            }
                                                                        </span>
                                                                    )
                                                                }

                                                            </div>


                                                            <div className="mobile-patient-details">

                                                                <div>

                                                                    <span>
                                                                        Phone
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            patient.phone_number
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div>

                                                                    <span>
                                                                        Gender
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            formatGender(
                                                                                patient.gender
                                                                            )
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div>

                                                                    <span>
                                                                        Date of Birth
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            formatDate(
                                                                                patient.date_of_birth
                                                                            )
                                                                        }
                                                                    </strong>

                                                                </div>


                                                                <div>

                                                                    <span>
                                                                        Email
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            patient.email ||
                                                                            "Not provided"
                                                                        }
                                                                    </strong>

                                                                </div>

                                                            </div>


                                                            <div className="mobile-patient-actions">

                                                                <button
                                                                    type="button"
                                                                    className="view-action"
                                                                    onClick={() =>
                                                                        setSelectedPatient(
                                                                            patient
                                                                        )
                                                                    }
                                                                >
                                                                    View
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="edit-action"
                                                                    onClick={() =>
                                                                        openEditForm(
                                                                            patient
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="delete-action"
                                                                    onClick={() =>
                                                                        setPatientToDelete(
                                                                            patient
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
                    className="patient-modal-backdrop"
                    onMouseDown={
                        closeForm
                    }
                >

                    <div
                        className="patient-modal patient-form-modal"
                        onMouseDown={
                            (
                                event
                            ) =>
                                event.stopPropagation()
                        }
                    >

                        <div className="patient-modal-header">

                            <div>

                                <span>
                                    {
                                        editingPatient
                                            ? "Update Record"
                                            : "New Record"
                                    }
                                </span>

                                <h2>
                                    {
                                        editingPatient
                                            ? "Edit Patient"
                                            : "Add Patient"
                                    }
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="modal-close-button"
                                onClick={
                                    closeForm
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>


                        <form
                            className="patient-form"
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="patient-form-grid">

                                <div className="form-group form-group-full">

                                    <label>
                                        Full Name
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        name="full_name"
                                        value={
                                            formData.full_name
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Enter patient full name"
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Date of Birth
                                    </label>

                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={
                                            formData.date_of_birth
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Gender
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <select
                                        name="gender"
                                        value={
                                            formData.gender
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    >
                                        <option value="">
                                            Select gender
                                        </option>

                                        <option value="male">
                                            Male
                                        </option>

                                        <option value="female">
                                            Female
                                        </option>

                                        <option value="other">
                                            Other
                                        </option>
                                    </select>

                                </div>


                                <div className="form-group">

                                    <label>
                                        Phone Number
                                        <span>
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={
                                            formData.phone_number
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="01712345678"
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={
                                            formData.email
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="patient@example.com"
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Blood Group
                                    </label>

                                    <select
                                        name="blood_group"
                                        value={
                                            formData.blood_group
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                    >
                                        <option value="">
                                            Select blood group
                                        </option>

                                        <option value="A+">
                                            A+
                                        </option>

                                        <option value="A-">
                                            A-
                                        </option>

                                        <option value="B+">
                                            B+
                                        </option>

                                        <option value="B-">
                                            B-
                                        </option>

                                        <option value="AB+">
                                            AB+
                                        </option>

                                        <option value="AB-">
                                            AB-
                                        </option>

                                        <option value="O+">
                                            O+
                                        </option>

                                        <option value="O-">
                                            O-
                                        </option>
                                    </select>

                                </div>


                                <div className="form-group form-group-full">

                                    <label>
                                        Address
                                    </label>

                                    <textarea
                                        name="address"
                                        value={
                                            formData.address
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Enter patient address"
                                        rows="3"
                                    />

                                </div>


                                <div className="form-group form-group-full">

                                    <label>
                                        Medical Notes
                                    </label>

                                    <textarea
                                        name="medical_notes"
                                        value={
                                            formData.medical_notes
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Optional medical notes"
                                        rows="4"
                                    />

                                </div>

                            </div>


                            {formError && (
                                <div className="patient-form-error">
                                    {formError}
                                </div>
                            )}


                            <div className="patient-form-actions">

                                <button
                                    type="button"
                                    className="patient-cancel-button"
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
                                    className="patient-save-button"
                                    disabled={
                                        saving
                                    }
                                >
                                    {
                                        saving
                                            ? "Saving..."
                                            :
                                            editingPatient
                                                ? "Update Patient"
                                                : "Add Patient"
                                    }
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}


            {selectedPatient && (
                <div
                    className="patient-modal-backdrop"
                    onMouseDown={() =>
                        setSelectedPatient(
                            null
                        )
                    }
                >

                    <div
                        className="patient-modal patient-details-modal"
                        onMouseDown={
                            (
                                event
                            ) =>
                                event.stopPropagation()
                        }
                    >

                        <div className="patient-modal-header">

                            <div>

                                <span>
                                    Patient Record
                                </span>

                                <h2>
                                    Patient Details
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="modal-close-button"
                                onClick={() =>
                                    setSelectedPatient(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>


                        <div className="details-patient-heading">

                            <div className="details-patient-avatar">
                                {
                                    selectedPatient.full_name
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                    "P"
                                }
                            </div>


                            <div>

                                <h3>
                                    {
                                        selectedPatient.full_name
                                    }
                                </h3>

                                <span>
                                    Patient ID #{selectedPatient.id}
                                </span>

                            </div>

                        </div>


                        <div className="patient-details-grid">

                            <div>

                                <span>
                                    Phone Number
                                </span>

                                <strong>
                                    {
                                        selectedPatient.phone_number
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Email
                                </span>

                                <strong>
                                    {
                                        selectedPatient.email ||
                                        "Not provided"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Gender
                                </span>

                                <strong>
                                    {
                                        formatGender(
                                            selectedPatient.gender
                                        )
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Date of Birth
                                </span>

                                <strong>
                                    {
                                        formatDate(
                                            selectedPatient.date_of_birth
                                        )
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Blood Group
                                </span>

                                <strong>
                                    {
                                        selectedPatient.blood_group ||
                                        "Not provided"
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Created By
                                </span>

                                <strong>
                                    {
                                        selectedPatient.created_by ||
                                        "Current user"
                                    }
                                </strong>

                            </div>


                            <div className="detail-full">

                                <span>
                                    Address
                                </span>

                                <strong>
                                    {
                                        selectedPatient.address ||
                                        "Not provided"
                                    }
                                </strong>

                            </div>


                            <div className="detail-full">

                                <span>
                                    Medical Notes
                                </span>

                                <p>
                                    {
                                        selectedPatient.medical_notes ||
                                        "No medical notes recorded."
                                    }
                                </p>

                            </div>

                        </div>


                        <div className="details-actions">

                            <button
                                type="button"
                                className="patient-cancel-button"
                                onClick={() =>
                                    setSelectedPatient(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>


                            <button
                                type="button"
                                className="patient-save-button"
                                onClick={() => {

                                    const patient =
                                        selectedPatient;

                                    setSelectedPatient(
                                        null
                                    );

                                    openEditForm(
                                        patient
                                    );
                                }}
                            >
                                Edit Patient
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {patientToDelete && (
                <div
                    className="patient-modal-backdrop"
                    onMouseDown={() => {

                        if (
                            !deleting
                        ) {
                            setPatientToDelete(
                                null
                            );
                        }
                    }}
                >

                    <div
                        className="patient-modal delete-confirmation-modal"
                        onMouseDown={
                            (
                                event
                            ) =>
                                event.stopPropagation()
                        }
                    >

                        <div className="delete-warning-icon">
                            !
                        </div>


                        <h2>
                            Delete Patient?
                        </h2>


                        <p>
                            Are you sure you want to
                            delete{" "}

                            <strong>
                                {
                                    patientToDelete.full_name
                                }
                            </strong>

                            ? This action cannot be undone.
                        </p>


                        <div className="delete-modal-actions">

                            <button
                                type="button"
                                className="patient-cancel-button"
                                disabled={
                                    deleting
                                }
                                onClick={() =>
                                    setPatientToDelete(
                                        null
                                    )
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="confirm-delete-button"
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
                                        : "Delete Patient"
                                }
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}


export default PatientsPage;
