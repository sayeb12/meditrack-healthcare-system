from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    VerifyOTPView,
    LoginView,
    CurrentUserView,
    LogoutView,
    ForgotPasswordView,
    VerifyPasswordResetOTPView,
    PasswordResetConfirmView,
)


urlpatterns = [

    path(
        "register/",
        RegisterView.as_view(),
        name="register"
    ),

    path(
        "verify-otp/",
        VerifyOTPView.as_view(),
        name="verify-otp"
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="login"
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh"
    ),

    path(
        "me/",
        CurrentUserView.as_view(),
        name="current-user"
    ),

    path(
    "logout/",
    LogoutView.as_view(),
    name="logout"
    ),

    path(
    "forgot-password/",
    ForgotPasswordView.as_view(),
    name="forgot-password"
    ),

    path(
    "password-reset/verify-otp/",
    VerifyPasswordResetOTPView.as_view(),
    name="password-reset-verify-otp"
    ),

    path(
    "password-reset/confirm/",
    PasswordResetConfirmView.as_view(),
    name="password-reset-confirm"
    ),

]