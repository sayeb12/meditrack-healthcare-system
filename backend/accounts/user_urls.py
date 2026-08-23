from django.urls import path

from .views import EligibleDoctorUsersView


urlpatterns = [

    path(
        "eligible-doctors/",
        EligibleDoctorUsersView.as_view(),
        name="eligible-doctor-users"
    ),

]
