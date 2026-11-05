
from django.urls import path
from . import views

urlpatterns = [
    # Employee URLs
    path(
        'employees/',
        views.employee_list,
        name='employee-list'
    ),
    path(
        'employees/<int:employee_id>/',
        views.employee_detail,
        name='employee-detail'
    ),

    # Attendance URLs
    path(
        'attendance/',
        views.attendance_list,
        name='attendance-list'
    ),
    path(
        'attendance/<int:attendance_id>/',
        views.attendance_detail,
        name='attendance-detail'
    ),

    # Leave URLs
    path(
        'leaves/',
        views.leave_list,
        name='leave-list'
    ),
    path(
        'leaves/<int:leave_id>/status/',
        views.update_leave_status,
        name='update-leave-status'
    ),
        # Monthly Report URL
    path(
        'reports/',
        views.monthly_report,
        name='monthly-report'
    ),
        # Registration URL
    path(
        'register/',
        views.register_user,
        name='register'
    ),
    path(
    'login/',
    views.login_user,
    name='login'
),
]
