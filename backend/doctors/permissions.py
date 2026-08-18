from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)


class IsStaffOrReadOnly(BasePermission):
    """
    Authenticated users can view doctors.

    Only staff users can create,
    update, or delete doctor profiles.
    """

    message = (
        "Only staff users can create, update, "
        "or delete doctor profiles."
    )


    def has_permission(
        self,
        request,
        view,
    ):
        if request.method in SAFE_METHODS:
            return True

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )