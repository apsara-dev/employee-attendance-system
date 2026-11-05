
from django.contrib import admin
from .models import Employee, Attendance, Leave
from .models import UserProfile

admin.site.register(UserProfile)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        'employee_id',
        'name',
        'email',
        'department',
        'joining_date',
    )
    search_fields = ('employee_id', 'name', 'email')


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status')
    list_filter = ('date', 'status')
    search_fields = ('employee__name', 'employee__employee_id')


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ('employee', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'start_date')
    search_fields = ('employee__name', 'employee__employee_id')
