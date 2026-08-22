import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router";

import {
    generateSecurePassword,
    getPasswordRules,
    getPasswordStrength,
} from "../utils/validators";

import "./ForgotPasswordPage.css";


const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api";


const getErrorMessage = (data) => {

    if (!data) {
        return "Something went wrong.";
    }


    if (typeof data.detail === "string") {
        return data.detail;
    }


    if (typeof data.message === "string") {
        return data.message;
    }


    for (const value of Object.values(data)) {

        if (Array.isArray(value)) {
            return value.join(" ");
        }


        if (typeof value === "string") {
            return value;
        }
    }


    return "Something went wrong.";
};



function ForgotPasswordPage() {

    const navigate = useNavigate();


    const [
        step,
        setStep,
    ] = useState(1);



    const [
        identifier,
        setIdentifier,
    ] = useState("");



    const [
        otp,
        setOtp,
    ] = useState("");



    const [
        uid,
        setUid,
    ] = useState("");



    const [
        resetToken,
        setResetToken,
    ] = useState("");



    const [
        newPassword,
        setNewPassword,
    ] = useState("");



    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");



    const [
        showPassword,
        setShowPassword,
    ] = useState(false);



    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);



    const [
        loading,
        setLoading,
    ] = useState(false);



    const [
        resendTimer,
        setResendTimer,
    ] = useState(0);



    const [
        error,
        setError,
    ] = useState("");



    const [
        message,
        setMessage,
    ] = useState("");



    const passwordStrength =
        useMemo(
            () =>
                getPasswordStrength(
                    newPassword
                ),
            [
                newPassword
            ]
        );



    const passwordRules =
        useMemo(
            () =>
                getPasswordRules(
                    newPassword
                ),
            [
                newPassword
            ]
        );



    useEffect(() => {

        if (resendTimer <= 0) {
            return;
        }


        const timer =
            setInterval(
                () => {

                    setResendTimer(
                        current =>
                            current - 1
                    );

                },
                1000
            );


        return () => {
            clearInterval(timer);
        };


    }, [resendTimer]);



    const clearFeedback = () => {

        setError("");
        setMessage("");

    };



    const handleRequestOTP =
        async (
            event
        ) => {

            event.preventDefault();

            clearFeedback();


            if (!identifier.trim()) {

                setError(
                    "Enter your email address or phone number."
                );

                return;

            }


            setLoading(true);


            try {

                const response =
                    await fetch(
                        `${API_BASE}/auth/forgot-password/`,
                        {
                            method:
                                "POST",

                            headers:
                            {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    identifier:
                                        identifier.trim(),
                                }),
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(
                        getErrorMessage(data)
                    );

                    return;

                }


                setMessage(
                    data.message ||
                    "Password reset OTP has been sent."
                );


                setResendTimer(60);


                setStep(2);


            }
            catch {

                setError(
                    "Unable to connect to the server."
                );

            }
            finally {

                setLoading(false);

            }

        };



    const handleResendOTP =
        async () => {

            clearFeedback();


            if (resendTimer > 0) {
                return;
            }


            setLoading(true);


            try {

                const response =
                    await fetch(
                        `${API_BASE}/auth/resend-password-reset-otp/`,
                        {
                            method:
                                "POST",

                            headers:
                            {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    identifier:
                                        identifier.trim(),
                                }),
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(
                        getErrorMessage(data)
                    );

                    return;

                }


                setMessage(
                    data.message ||
                    "A new OTP has been sent."
                );


                setResendTimer(
                    data.resend_available_in ||
                    60
                );


            }
            catch {

                setError(
                    "Unable to connect to the server."
                );

            }
            finally {

                setLoading(false);

            }

        };    const handleVerifyOTP =
        async (
            event
        ) => {

            event.preventDefault();

            clearFeedback();


            if (!/^\d{6}$/.test(otp)) {

                setError(
                    "OTP must contain exactly 6 digits."
                );

                return;

            }


            setLoading(true);


            try {

                const response =
                    await fetch(
                        `${API_BASE}/auth/password-reset/verify-otp/`,
                        {
                            method:
                                "POST",

                            headers:
                            {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    identifier:
                                        identifier.trim(),

                                    otp,
                                }),
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(
                        getErrorMessage(data)
                    );

                    return;

                }


                setUid(
                    data.uid
                );


                setResetToken(
                    data.reset_token
                );


                setMessage(
                    data.message ||
                    "OTP verified successfully."
                );


                setStep(3);


            }
            catch {

                setError(
                    "Unable to connect to the server."
                );

            }
            finally {

                setLoading(false);

            }

        };



    const handleResetPassword =
        async (
            event
        ) => {

            event.preventDefault();

            clearFeedback();


            if (
                !newPassword ||
                !confirmPassword
            ) {

                setError(
                    "Enter and confirm your new password."
                );

                return;

            }


            if (
                !Object.values(passwordRules)
                    .every(Boolean)
            ) {

                setError(
                    "Please use a stronger password."
                );

                return;

            }


            if (
                newPassword !== confirmPassword
            ) {

                setError(
                    "Passwords do not match."
                );

                return;

            }


            setLoading(true);


            try {

                const response =
                    await fetch(
                        `${API_BASE}/auth/password-reset/confirm/`,
                        {
                            method:
                                "POST",

                            headers:
                            {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    uid,

                                    reset_token:
                                        resetToken,

                                    new_password:
                                        newPassword,

                                    confirm_password:
                                        confirmPassword,
                                }),
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    setError(
                        getErrorMessage(data)
                    );

                    return;

                }


                setMessage(
                    data.message ||
                    "Password reset successfully."
                );


                setStep(4);


            }
            catch {

                setError(
                    "Unable to connect to the server."
                );

            }
            finally {

                setLoading(false);

            }

        };



    const handleGeneratePassword =
        () => {

            const password =
                generateSecurePassword();


            setNewPassword(password);

            setConfirmPassword(password);

            setShowPassword(true);

            setShowConfirmPassword(true);

            clearFeedback();

        };



    return (

        <main className="forgot-page">


            <div className="forgot-topbar">


                <button
                    type="button"
                    className="forgot-brand"
                    onClick={() =>
                        navigate("/")
                    }
                >

                    <span className="forgot-brand-mark">
                        M
                    </span>


                    <span className="forgot-brand-text">

                        <strong>
                            MediTrack
                        </strong>

                        <small>
                            Healthcare Management System
                        </small>

                    </span>


                </button>



                <button
                    type="button"
                    className="back-login-button"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    Back to Sign In
                </button>


            </div>



            <section className="forgot-card">


                <div className="forgot-progress">

                    <div
                        className={
                            `forgot-step ${
                                step >= 1
                                    ? "active"
                                    : ""
                            }`
                        }
                    >
                        <span>
                            1
                        </span>

                        <small>
                            Account
                        </small>

                    </div>



                    <div
                        className={
                            `forgot-progress-line ${
                                step >= 2
                                    ? "active"
                                    : ""
                            }`
                        }
                    />



                    <div
                        className={
                            `forgot-step ${
                                step >= 2
                                    ? "active"
                                    : ""
                            }`
                        }
                    >
                        <span>
                            2
                        </span>

                        <small>
                            OTP
                        </small>

                    </div>



                    <div
                        className={
                            `forgot-progress-line ${
                                step >= 3
                                    ? "active"
                                    : ""
                            }`
                        }
                    />



                    <div
                        className={
                            `forgot-step ${
                                step >= 3
                                    ? "active"
                                    : ""
                            }`
                        }
                    >
                        <span>
                            3
                        </span>

                        <small>
                            Password
                        </small>

                    </div>


                </div>

                                {step === 1 && (

                    <form
                        className="forgot-form"
                        onSubmit={
                            handleRequestOTP
                        }
                    >

                        <span className="forgot-kicker">
                            Account Recovery
                        </span>


                        <h1>
                            Forgot Password?
                        </h1>


                        <p className="forgot-description">
                            Enter the email address or
                            Bangladesh phone number linked
                            to your MediTrack account.
                        </p>


                        <label>
                            Email or Phone Number
                        </label>


                        <input
                            type="text"
                            value={
                                identifier
                            }
                            onChange={
                                (event) =>
                                    setIdentifier(
                                        event.target.value
                                    )
                            }
                            placeholder="email@example.com / 01712345678"
                            autoComplete="username"
                        />


                        {
                            error && (

                                <div className="forgot-alert error">
                                    {error}
                                </div>

                            )
                        }


                        <button
                            type="submit"
                            className="forgot-primary-button"
                            disabled={
                                loading
                            }
                        >

                            {
                                loading
                                    ? "Sending..."
                                    : "Send Reset OTP"
                            }

                        </button>


                    </form>

                )}



                {step === 2 && (

                    <form
                        className="forgot-form"
                        onSubmit={
                            handleVerifyOTP
                        }
                    >

                        <span className="forgot-kicker">
                            Security Verification
                        </span>


                        <h1>
                            Verify OTP
                        </h1>


                        <p className="forgot-description">
                            Enter the 6 digit password
                            reset OTP sent to your
                            registered contact.
                        </p>


                        <div className="forgot-identifier-box">

                            <span>
                                Reset account
                            </span>


                            <strong>
                                {identifier}
                            </strong>

                        </div>


                        <label>
                            6 Digit OTP
                        </label>


                        <input
                            type="text"
                            className="reset-otp-input"
                            inputMode="numeric"
                            maxLength="6"
                            value={
                                otp
                            }
                            onChange={
                                (event) =>
                                    setOtp(
                                        event.target.value
                                            .replace(
                                                /\D/g,
                                                ""
                                            )
                                    )
                            }
                            placeholder="000000"
                        />


                        {
                            message && (

                                <div className="forgot-alert success">
                                    {message}
                                </div>

                            )
                        }


                        {
                            error && (

                                <div className="forgot-alert error">
                                    {error}
                                </div>

                            )
                        }



                        <button
                            type="submit"
                            className="forgot-primary-button"
                            disabled={
                                loading
                            }
                        >

                            {
                                loading
                                    ? "Verifying..."
                                    : "Verify OTP"
                            }

                        </button>



                        <button
                            type="button"
                            className="forgot-secondary-button"
                            onClick={
                                handleResendOTP
                            }
                            disabled={
                                loading ||
                                resendTimer > 0
                            }
                        >

                            {
                                resendTimer > 0
                                    ? `Resend OTP in ${resendTimer}s`
                                    : "Resend OTP"
                            }

                        </button>



                        <button
                            type="button"
                            className="forgot-secondary-button"
                            onClick={() => {

                                clearFeedback();

                                setOtp("");

                                setResendTimer(0);

                                setStep(1);

                            }}
                        >

                            Change Email or Phone

                        </button>


                    </form>

                )}
                                {step === 3 && (

                    <form
                        className="forgot-form"
                        onSubmit={
                            handleResetPassword
                        }
                    >

                        <span className="forgot-kicker">
                            New Password
                        </span>


                        <h1>
                            Create New Password
                        </h1>


                        <p className="forgot-description">
                            Choose a strong password that
                            you have not used for this
                            account before.
                        </p>



                        <label>
                            New Password
                        </label>


                        <div className="forgot-password-field">

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    newPassword
                                }
                                onChange={
                                    (event) =>
                                        setNewPassword(
                                            event.target.value
                                        )
                                }
                                autoComplete="new-password"
                            />


                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        current =>
                                            !current
                                    )
                                }
                            >

                                {
                                    showPassword
                                        ? "Hide"
                                        : "Show"
                                }

                            </button>

                        </div>



                        <div className="reset-password-strength">

                            <div className="reset-strength-track">

                                <span
                                    className={
                                        `reset-strength-fill reset-strength-${passwordStrength.score}`
                                    }
                                />

                            </div>


                            <span>
                                {
                                    passwordStrength.label
                                }
                            </span>

                        </div>



                        <p className="reset-password-hint">
                            Use 10 or more characters with
                            uppercase, lowercase, number
                            and special character.
                        </p>



                        <button
                            type="button"
                            className="generate-reset-password"
                            onClick={
                                handleGeneratePassword
                            }
                        >

                            Generate Secure Password

                        </button>



                        <label>
                            Confirm New Password
                        </label>


                        <div className="forgot-password-field">

                            <input
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    confirmPassword
                                }
                                onChange={
                                    (event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                }
                                autoComplete="new-password"
                            />


                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        current =>
                                            !current
                                    )
                                }
                            >

                                {
                                    showConfirmPassword
                                        ? "Hide"
                                        : "Show"
                                }

                            </button>

                        </div>



                        {
                            error && (

                                <div className="forgot-alert error">
                                    {error}
                                </div>

                            )
                        }



                        <button
                            type="submit"
                            className="forgot-primary-button"
                            disabled={
                                loading
                            }
                        >

                            {
                                loading
                                    ? "Updating..."
                                    : "Reset Password"
                            }

                        </button>


                    </form>

                )}



                {step === 4 && (

                    <div className="forgot-complete">


                        <div className="forgot-success-icon">

                            ✓

                        </div>



                        <span className="forgot-kicker">
                            Password Updated
                        </span>



                        <h1>
                            Reset Successful
                        </h1>



                        <p>
                            Your password has been changed
                            successfully. You can now sign
                            in using your new password.
                        </p>



                        <button
                            type="button"
                            className="forgot-primary-button"
                            onClick={() =>
                                navigate(
                                    "/",
                                    {
                                        replace:
                                            true,
                                    }
                                )
                            }
                        >

                            Continue to Sign In

                        </button>


                    </div>

                )}


            </section>


        </main>

    );

}



export default ForgotPasswordPage;