import {
    useEffect,
    useMemo,
    useState,
} from "react";

import "./AuthPage.css";

import {
    generateSecurePassword,
    getPasswordRules,
    getPasswordStrength,
    isValidBDPhone,
    isValidEmail,
} from "../utils/validators";


const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api";


const translations = {

    en: {
        brandSubtitle:
            "Healthcare Management System",

        signIn:
            "Sign In",

        signUp:
            "Sign Up",

        createAccount:
            "Create Account",

        welcomeBack:
            "Welcome Back!",

        welcomeText:
            "Sign in to continue managing your healthcare workspace.",

        newHere:
            "New to MediTrack?",

        newHereText:
            "Create your account and start managing healthcare records securely.",

        noAccount:
            "Don't have an account?",

        alreadyAccount:
            "Already have an account?",

        emailOrPhone:
            "Email or Phone Number",

        password:
            "Password",

        forgotPassword:
            "Forgot Password?",

        fullName:
            "Full Name",

        email:
            "Email Address",

        phone:
            "Bangladesh Phone Number",

        confirmPassword:
            "Confirm Password",

        generatePassword:
            "Generate Password",

        passwordRecommendation:
            "Use 10 or more characters with uppercase, lowercase, number and special character.",

        otpMethod:
            "Send OTP To",

        emailOption:
            "Email",

        phoneOption:
            "Phone",

        verifyAccount:
            "Verify Account",

        otpDescription:
            "Enter the 6 digit OTP that was sent to you.",

        verify:
            "Verify OTP",

        resend:
            "Resend OTP",

        resendIn:
            "Resend OTP in",

        seconds:
            "s",

        loginSuccess:
            "Login successful.",

        registrationSuccess:
            "Registration successful. Please verify your OTP.",

        requiredFields:
            "Please complete all required fields.",

        invalidEmail:
            "Please enter a valid email address.",

        invalidPhone:
            "Enter a valid Bangladesh phone number.",

        weakPassword:
            "Please use a stronger password.",

        passwordsDoNotMatch:
            "Passwords do not match.",

        show:
            "Show password",

        hide:
            "Hide password",

        validEmail:
            "Valid email",

        validPhone:
            "Valid phone",

        pleaseWait:
            "Please wait...",

        connectionError:
            "Unable to connect to the server.",

        otpInvalid:
            "OTP must contain exactly 6 digits.",
    },


    bn: {
        brandSubtitle:
            "হেলথকেয়ার ম্যানেজমেন্ট সিস্টেম",

        signIn:
            "সাইন ইন",

        signUp:
            "সাইন আপ",

        createAccount:
            "অ্যাকাউন্ট তৈরি করুন",

        welcomeBack:
            "আবারও স্বাগতম!",

        welcomeText:
            "আপনার হেলথকেয়ার ওয়ার্কস্পেস পরিচালনা করতে সাইন ইন করুন।",

        newHere:
            "MediTrack এ নতুন?",

        newHereText:
            "নিরাপদভাবে স্বাস্থ্যসেবা তথ্য পরিচালনা করতে আপনার অ্যাকাউন্ট তৈরি করুন।",

        noAccount:
            "অ্যাকাউন্ট নেই?",

        alreadyAccount:
            "আগেই অ্যাকাউন্ট আছে?",

        emailOrPhone:
            "ইমেইল অথবা ফোন নম্বর",

        password:
            "পাসওয়ার্ড",

        forgotPassword:
            "পাসওয়ার্ড ভুলে গেছেন?",

        fullName:
            "পূর্ণ নাম",

        email:
            "ইমেইল ঠিকানা",

        phone:
            "বাংলাদেশি ফোন নম্বর",

        confirmPassword:
            "পাসওয়ার্ড নিশ্চিত করুন",

        generatePassword:
            "পাসওয়ার্ড তৈরি করুন",

        passwordRecommendation:
            "১০ বা তার বেশি অক্ষর, বড় হাতের অক্ষর, ছোট হাতের অক্ষর, সংখ্যা এবং বিশেষ চিহ্ন ব্যবহার করুন।",

        otpMethod:
            "OTP পাঠান",

        emailOption:
            "ইমেইল",

        phoneOption:
            "ফোন",

        verifyAccount:
            "অ্যাকাউন্ট যাচাই করুন",

        otpDescription:
            "আপনাকে পাঠানো ৬ সংখ্যার OTP লিখুন।",

        verify:
            "OTP যাচাই করুন",

        resend:
            "আবার OTP পাঠান",

        resendIn:
            "আবার OTP পাঠানো যাবে",

        seconds:
            " সেকেন্ড পরে",

        loginSuccess:
            "সফলভাবে সাইন ইন হয়েছে।",

        registrationSuccess:
            "রেজিস্ট্রেশন সফল হয়েছে। OTP যাচাই করুন।",

        requiredFields:
            "প্রয়োজনীয় সব তথ্য পূরণ করুন।",

        invalidEmail:
            "সঠিক ইমেইল ঠিকানা লিখুন।",

        invalidPhone:
            "সঠিক বাংলাদেশি ফোন নম্বর লিখুন।",

        weakPassword:
            "আরও শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।",

        passwordsDoNotMatch:
            "পাসওয়ার্ড দুটি মিলছে না।",

        show:
            "পাসওয়ার্ড দেখুন",

        hide:
            "পাসওয়ার্ড লুকান",

        validEmail:
            "সঠিক ইমেইল",

        validPhone:
            "সঠিক ফোন নম্বর",

        pleaseWait:
            "অপেক্ষা করুন...",

        connectionError:
            "সার্ভারের সাথে সংযোগ করা যাচ্ছে না।",

        otpInvalid:
            "OTP অবশ্যই ৬ সংখ্যার হতে হবে।",
    },
};


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

    const messages = [];

    Object.values(data).forEach(
        (value) => {

            if (Array.isArray(value)) {
                messages.push(
                    value.join(" ")
                );
            }

            else if (
                typeof value === "string"
            ) {
                messages.push(value);
            }
        }
    );

    return (
        messages.join(" ") ||
        "Something went wrong."
    );
};


function PasswordToggle({
    visible,
    onClick,
    labels,
}) {

    return (
        <button
            type="button"
            className="password-toggle"
            onClick={onClick}
            aria-label={
                visible
                    ? labels.hide
                    : labels.show
            }
            title={
                visible
                    ? labels.hide
                    : labels.show
            }
        >
            {visible ? "🙈" : "👁"}
        </button>
    );
}


function AuthPage() {

    const [isRegister, setIsRegister] =
        useState(false);

    const [language, setLanguage] =
        useState("en");

    const t = translations[language];


    const [loginForm, setLoginForm] =
        useState({
            identifier: "",
            password: "",
        });


    const [registerForm, setRegisterForm] =
        useState({
            full_name: "",
            email: "",
            phone_number: "",
            password: "",
            confirm_password: "",
            otp_channel: "email",
        });


    const [
        showLoginPassword,
        setShowLoginPassword,
    ] = useState(false);


    const [
        showRegisterPassword,
        setShowRegisterPassword,
    ] = useState(false);


    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);


    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    const [otpSession, setOtpSession] =
        useState(null);

    const [otp, setOtp] =
        useState("");

    const [resendIn, setResendIn] =
        useState(0);


    const passwordStrength = useMemo(
        () =>
            getPasswordStrength(
                registerForm.password
            ),
        [registerForm.password]
    );


    const passwordRules = useMemo(
        () =>
            getPasswordRules(
                registerForm.password
            ),
        [registerForm.password]
    );


    useEffect(() => {

        if (resendIn <= 0) {
            return;
        }

        const timer = setInterval(
            () => {

                setResendIn(
                    (current) =>
                        Math.max(
                            current - 1,
                            0
                        )
                );

            },
            1000
        );

        return () =>
            clearInterval(timer);

    }, [resendIn]);


    const clearFeedback = () => {
        setError("");
        setMessage("");
    };


    const switchMode = (
        registerMode
    ) => {

        clearFeedback();

        setIsRegister(
            registerMode
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    const handleLoginChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;

        setLoginForm(
            (current) => ({
                ...current,
                [name]: value,
            })
        );
    };


    const handleRegisterChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;

        setRegisterForm(
            (current) => ({
                ...current,
                [name]: value,
            })
        );
    };


    const handleGeneratePassword = () => {

        const generated =
            generateSecurePassword();

        setRegisterForm(
            (current) => ({
                ...current,
                password: generated,
                confirm_password: generated,
            })
        );

        setShowRegisterPassword(true);

        setShowConfirmPassword(true);

        clearFeedback();
    };


    const handleLogin = async (
        event
    ) => {

        event.preventDefault();

        clearFeedback();


        if (
            !loginForm.identifier.trim() ||
            !loginForm.password
        ) {

            setError(
                t.requiredFields
            );

            return;
        }


        setLoading(true);


        try {

            const response = await fetch(
                `${API_BASE}/auth/login/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        loginForm
                    ),
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


            localStorage.setItem(
                "meditrack_access",
                data.tokens.access
            );


            localStorage.setItem(
                "meditrack_refresh",
                data.tokens.refresh
            );


            localStorage.setItem(
                "meditrack_user",
                JSON.stringify(
                    data.user
                )
            );


            setMessage(
                t.loginSuccess
            );


            console.log(
                "Logged in user:",
                data.user
            );

        }

        catch {

            setError(
                t.connectionError
            );
        }

        finally {

            setLoading(false);
        }
    };


    const handleRegister = async (
        event
    ) => {

        event.preventDefault();

        clearFeedback();


        if (
            !registerForm.full_name.trim() ||
            !registerForm.email.trim() ||
            !registerForm.phone_number.trim() ||
            !registerForm.password ||
            !registerForm.confirm_password
        ) {

            setError(
                t.requiredFields
            );

            return;
        }


        if (
            !isValidEmail(
                registerForm.email
            )
        ) {

            setError(
                t.invalidEmail
            );

            return;
        }


        if (
            !isValidBDPhone(
                registerForm.phone_number
            )
        ) {

            setError(
                t.invalidPhone
            );

            return;
        }


        if (
            !Object.values(
                passwordRules
            ).every(Boolean)
        ) {

            setError(
                t.weakPassword
            );

            return;
        }


        if (
            registerForm.password !==
            registerForm.confirm_password
        ) {

            setError(
                t.passwordsDoNotMatch
            );

            return;
        }


        setLoading(true);


        try {

            const response = await fetch(
                `${API_BASE}/auth/register/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        ...registerForm,
                        language,
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


            const identifier =
                registerForm.otp_channel ===
                "email"
                    ? registerForm.email
                    : registerForm.phone_number;


            setOtpSession({
                userId:
                    data.user_id,

                identifier,

                otpChannel:
                    data.otp_channel,
            });


            setOtp("");

            setResendIn(60);

            setMessage(
                t.registrationSuccess
            );

        }

        catch {

            setError(
                t.connectionError
            );
        }

        finally {

            setLoading(false);
        }
    };


    const handleVerifyOTP = async (
        event
    ) => {

        event.preventDefault();

        clearFeedback();


        if (
            !/^\d{6}$/.test(otp)
        ) {

            setError(
                t.otpInvalid
            );

            return;
        }


        setLoading(true);


        try {

            const response = await fetch(
                `${API_BASE}/auth/verify-otp/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        user_id:
                            otpSession.userId,

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


            setOtpSession(null);

            setOtp("");


            setLoginForm({
                identifier:
                    registerForm.email,

                password: "",
            });


            setIsRegister(false);

            setMessage(
                data.message
            );

        }

        catch {

            setError(
                t.connectionError
            );
        }

        finally {

            setLoading(false);
        }
    };


    const handleResendOTP = async () => {

        if (
            !otpSession ||
            resendIn > 0
        ) {

            return;
        }


        clearFeedback();

        setLoading(true);


        try {

            const response = await fetch(
                `${API_BASE}/auth/resend-registration-otp/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        identifier:
                            otpSession.identifier,

                        otp_channel:
                            otpSession.otpChannel,
                    }),
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                if (
                    response.status ===
                    429
                ) {

                    setResendIn(
                        data.retry_after ||
                        60
                    );
                }


                setError(
                    getErrorMessage(data)
                );

                return;
            }


            setResendIn(
                data.resend_available_in ||
                60
            );


            setMessage(
                data.message
            );

        }

        catch {

            setError(
                t.connectionError
            );
        }

        finally {

            setLoading(false);
        }
    };


    return (

        <main className="auth-page">

            <div className="auth-topbar">

                <div className="brand">

                    <div className="brand-mark">
                        M
                    </div>


                    <div className="brand-text">

                        <strong>
                            MediTrack
                        </strong>

                        <span>
                            {t.brandSubtitle}
                        </span>

                    </div>

                </div>


                <div className="language-switch">

                    <button
                        type="button"
                        className={
                            language === "en"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setLanguage("en")
                        }
                    >
                        EN
                    </button>


                    <button
                        type="button"
                        className={
                            language === "bn"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setLanguage("bn")
                        }
                    >
                        বাংলা
                    </button>

                </div>

            </div>


            <section
                className={
                    `auth-container ${
                        isRegister
                            ? "register-mode"
                            : ""
                    }`
                }
            >

                <div className="form-container sign-in-container">

                    <form
                        onSubmit={
                            handleLogin
                        }
                    >

                        <span className="form-kicker">
                            MediTrack
                        </span>


                        <h1>
                            {t.signIn}
                        </h1>


                        <p className="form-subtitle">
                            {t.welcomeText}
                        </p>


                        <label>
                            {t.emailOrPhone}
                        </label>


                        <input
                            type="text"
                            name="identifier"
                            value={
                                loginForm.identifier
                            }
                            onChange={
                                handleLoginChange
                            }
                            placeholder="email@example.com / 01712345678"
                            autoComplete="username"
                        />


                        <label>
                            {t.password}
                        </label>


                        <div className="password-field">

                            <input
                                type={
                                    showLoginPassword
                                        ? "text"
                                        : "password"
                                }
                                name="password"
                                value={
                                    loginForm.password
                                }
                                onChange={
                                    handleLoginChange
                                }
                                autoComplete="current-password"
                            />


                            <PasswordToggle
                                visible={
                                    showLoginPassword
                                }
                                onClick={() =>
                                    setShowLoginPassword(
                                        (value) =>
                                            !value
                                    )
                                }
                                labels={t}
                            />

                        </div>


                        <button
                            type="button"
                            className="forgot-button"
                        >
                            {t.forgotPassword}
                        </button>


                        {error &&
                            !isRegister &&
                            !otpSession && (

                                <div className="alert error">
                                    {error}
                                </div>

                            )}


                        {message &&
                            !isRegister &&
                            !otpSession && (

                                <div className="alert success">
                                    {message}
                                </div>

                            )}


                        <button
                            type="submit"
                            className="primary-button"
                            disabled={loading}
                        >
                            {
                                loading
                                    ? t.pleaseWait
                                    : t.signIn
                            }
                        </button>


                        <div className="mobile-auth-switch">

                            <span>
                                {t.noAccount}
                            </span>


                            <button
                                type="button"
                                onClick={() =>
                                    switchMode(true)
                                }
                            >
                                {t.signUp}
                            </button>

                        </div>

                    </form>

                </div>


                <div className="form-container sign-up-container">

                    <form
                        onSubmit={
                            handleRegister
                        }
                    >

                        <span className="form-kicker">
                            MediTrack
                        </span>


                        <h1>
                            {t.createAccount}
                        </h1>


                        <label>
                            {t.fullName}
                        </label>


                        <input
                            type="text"
                            name="full_name"
                            value={
                                registerForm.full_name
                            }
                            onChange={
                                handleRegisterChange
                            }
                            autoComplete="name"
                        />


                        <div className="two-column">

                            <div>

                                <label>
                                    {t.email}
                                </label>


                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        registerForm.email
                                    }
                                    onChange={
                                        handleRegisterChange
                                    }
                                    autoComplete="email"
                                />


                                {
                                    registerForm.email &&
                                    (

                                        <small
                                            className={
                                                isValidEmail(
                                                    registerForm.email
                                                )
                                                    ? "valid-text"
                                                    : "invalid-text"
                                            }
                                        >
                                            {
                                                isValidEmail(
                                                    registerForm.email
                                                )
                                                    ? t.validEmail
                                                    : t.invalidEmail
                                            }
                                        </small>

                                    )
                                }

                            </div>


                            <div>

                                <label>
                                    {t.phone}
                                </label>


                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={
                                        registerForm.phone_number
                                    }
                                    onChange={
                                        handleRegisterChange
                                    }
                                    placeholder="01712345678"
                                    autoComplete="tel"
                                />


                                {
                                    registerForm.phone_number &&
                                    (

                                        <small
                                            className={
                                                isValidBDPhone(
                                                    registerForm.phone_number
                                                )
                                                    ? "valid-text"
                                                    : "invalid-text"
                                            }
                                        >
                                            {
                                                isValidBDPhone(
                                                    registerForm.phone_number
                                                )
                                                    ? t.validPhone
                                                    : t.invalidPhone
                                            }
                                        </small>

                                    )
                                }

                            </div>

                        </div>


                        <label>
                            {t.password}
                        </label>


                        <div className="password-field">

                            <input
                                type={
                                    showRegisterPassword
                                        ? "text"
                                        : "password"
                                }
                                name="password"
                                value={
                                    registerForm.password
                                }
                                onChange={
                                    handleRegisterChange
                                }
                                autoComplete="new-password"
                            />


                            <PasswordToggle
                                visible={
                                    showRegisterPassword
                                }
                                onClick={() =>
                                    setShowRegisterPassword(
                                        (value) =>
                                            !value
                                    )
                                }
                                labels={t}
                            />

                        </div>


                        <div className="password-strength">

                            <div className="strength-track">

                                <span
                                    className={
                                        `strength-fill strength-${passwordStrength.score}`
                                    }
                                />

                            </div>


                            <span>
                                {
                                    passwordStrength.label
                                }
                            </span>

                        </div>


                        <p className="password-hint">
                            {t.passwordRecommendation}
                        </p>


                        <button
                            type="button"
                            className="secondary-button small"
                            onClick={
                                handleGeneratePassword
                            }
                        >
                            {t.generatePassword}
                        </button>


                        <label>
                            {t.confirmPassword}
                        </label>


                        <div className="password-field">

                            <input
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                name="confirm_password"
                                value={
                                    registerForm.confirm_password
                                }
                                onChange={
                                    handleRegisterChange
                                }
                                autoComplete="new-password"
                            />


                            <PasswordToggle
                                visible={
                                    showConfirmPassword
                                }
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (value) =>
                                            !value
                                    )
                                }
                                labels={t}
                            />

                        </div>


                        <div className="otp-method">

                            <span>
                                {t.otpMethod}
                            </span>


                            <label>

                                <input
                                    type="radio"
                                    name="otp_channel"
                                    value="email"
                                    checked={
                                        registerForm.otp_channel ===
                                        "email"
                                    }
                                    onChange={
                                        handleRegisterChange
                                    }
                                />

                                {t.emailOption}

                            </label>


                            <label>

                                <input
                                    type="radio"
                                    name="otp_channel"
                                    value="phone"
                                    checked={
                                        registerForm.otp_channel ===
                                        "phone"
                                    }
                                    onChange={
                                        handleRegisterChange
                                    }
                                />

                                {t.phoneOption}

                            </label>

                        </div>


                        {error &&
                            isRegister &&
                            !otpSession && (

                                <div className="alert error">
                                    {error}
                                </div>

                            )}


                        <button
                            type="submit"
                            className="primary-button"
                            disabled={loading}
                        >
                            {
                                loading
                                    ? t.pleaseWait
                                    : t.createAccount
                            }
                        </button>


                        <div className="mobile-auth-switch">

                            <span>
                                {t.alreadyAccount}
                            </span>


                            <button
                                type="button"
                                onClick={() =>
                                    switchMode(false)
                                }
                            >
                                {t.signIn}
                            </button>

                        </div>

                    </form>

                </div>


                <div className="overlay-container">

                    <div className="overlay">

                        <div className="overlay-panel overlay-left">

                            <span className="overlay-tag">
                                MediTrack
                            </span>


                            <h2>
                                {t.welcomeBack}
                            </h2>


                            <p>
                                {t.welcomeText}
                            </p>


                            <button
                                type="button"
                                className="ghost-button"
                                onClick={() =>
                                    switchMode(false)
                                }
                            >
                                {t.signIn}
                            </button>

                        </div>


                        <div className="overlay-panel overlay-right">

                            <span className="overlay-tag">
                                MediTrack
                            </span>


                            <h2>
                                {t.newHere}
                            </h2>


                            <p>
                                {t.newHereText}
                            </p>


                            <button
                                type="button"
                                className="ghost-button"
                                onClick={() =>
                                    switchMode(true)
                                }
                            >
                                {t.signUp}
                            </button>

                        </div>

                    </div>

                </div>

            </section>


            {otpSession && (

                <div className="modal-backdrop">

                    <div className="otp-modal">

                        <div className="otp-icon">
                            ✓
                        </div>


                        <h2>
                            {t.verifyAccount}
                        </h2>


                        <p>
                            {t.otpDescription}
                        </p>


                        <form
                            onSubmit={
                                handleVerifyOTP
                            }
                        >

                            <input
                                className="otp-input"
                                type="text"
                                inputMode="numeric"
                                maxLength="6"
                                value={otp}
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


                            {error && (

                                <div className="alert error">
                                    {error}
                                </div>

                            )}


                            {message && (

                                <div className="alert success">
                                    {message}
                                </div>

                            )}


                            <button
                                type="submit"
                                className="primary-button"
                                disabled={loading}
                            >
                                {
                                    loading
                                        ? t.pleaseWait
                                        : t.verify
                                }
                            </button>

                        </form>


                        <button
                            type="button"
                            className="resend-button"
                            disabled={
                                resendIn > 0 ||
                                loading
                            }
                            onClick={
                                handleResendOTP
                            }
                        >
                            {
                                resendIn > 0
                                    ? `${t.resendIn} ${resendIn}${t.seconds}`
                                    : t.resend
                            }
                        </button>

                    </div>

                </div>

            )}

        </main>
    );
}


export default AuthPage;