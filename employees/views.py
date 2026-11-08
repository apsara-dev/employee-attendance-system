from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .models import Employee, Attendance, Leave, UserProfile
from .serializers import (
    EmployeeSerializer,
    AttendanceSerializer,
    LeaveSerializer,
    RegisterSerializer,
)


def get_user_profile(user):
    profile = getattr(user, 'userprofile', None)
    if profile is None and user.is_superuser:
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'Admin'}
        )
    elif profile is None:
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'Employee'}
        )
    return profile


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list(request):

    profile = get_user_profile(request.user)

    # Only Admin can access employee records
    if profile.role != 'Admin':
        return Response(
            {'error': 'Only Admin can access employee records.'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        employees = Employee.objects.all()
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = EmployeeSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def attendance_list(request):

    profile = get_user_profile(request.user)

    if request.method == 'GET':

        if profile.role == 'Admin':
            attendance_records = Attendance.objects.all()
        else:
            if not profile.employee:
                return Response(
                    {'error': 'Your account is not linked to an employee.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            attendance_records = Attendance.objects.filter(
                employee=profile.employee
            )

        serializer = AttendanceSerializer(
            attendance_records, many=True
        )
        return Response(serializer.data)

    elif request.method == 'POST':

        if profile.role != 'Admin':
            return Response(
                {'error': 'Only Admin can mark attendance.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AttendanceSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def leave_list(request):
    profile = get_user_profile(request.user)

    if request.method == 'GET':
        if profile.role == 'Admin':
            leaves = Leave.objects.all().order_by('-start_date')
        else:
            if not profile.employee:
                return Response(
                    {'error': 'Your account is not linked to an employee.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            leaves = Leave.objects.filter(
                employee=profile.employee
            ).order_by('-start_date')

        serializer = LeaveSerializer(leaves, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if profile.role == 'Admin':
            serializer = LeaveSerializer(data=request.data)
        else:
            if not profile.employee:
                return Response(
                    {'error': 'Your account is not linked to an employee.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = LeaveSerializer(data=request.data)

        if serializer.is_valid():
            if profile.role == 'Admin':
                employee_id = request.data.get('employee')
                serializer.save(employee_id=employee_id)
            else:
                serializer.save(employee=profile.employee)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_leave_status(request, leave_id):

    profile = get_user_profile(request.user)

    # Only Admin can approve or reject leave
    if profile.role != 'Admin':
        return Response(
            {'error': 'Only Admin can update leave status.'},
            status=status.HTTP_403_FORBIDDEN
        )

    leave = get_object_or_404(Leave, id=leave_id)

    new_status = request.data.get('status')

    if new_status not in ['Approved', 'Rejected']:
        return Response(
            {'error': 'Status must be Approved or Rejected.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if leave.status != 'Pending':
        return Response(
            {'error': 'This leave request has already been processed.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    leave.status = new_status
    leave.save(update_fields=['status'])

    serializer = LeaveSerializer(leave)
    return Response(serializer.data, status=status.HTTP_200_OK)
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def employee_detail(request, employee_id):

    profile = get_user_profile(request.user)

    if profile.role != 'Admin':
        return Response(
            {'error': 'Only Admin can manage employee records.'},
            status=status.HTTP_403_FORBIDDEN
        )

    employee = get_object_or_404(Employee, id=employee_id)

    if request.method == 'GET':
        serializer = EmployeeSerializer(employee)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = EmployeeSerializer(
            employee,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    elif request.method == 'DELETE':
        employee.delete()
        return Response(
            {'message': 'Employee deleted successfully.'},
            status=status.HTTP_200_OK
        )
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def attendance_detail(request, attendance_id):

    profile = get_user_profile(request.user)

    if profile.role != 'Admin':
        return Response(
            {'error': 'Only Admin can manage attendance records.'},
            status=status.HTTP_403_FORBIDDEN
        )

    attendance = get_object_or_404(
        Attendance,
        id=attendance_id
    )

    if request.method == 'GET':
        serializer = AttendanceSerializer(attendance)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = AttendanceSerializer(
            attendance,
            data=request.data
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    elif request.method == 'DELETE':
        attendance.delete()
        return Response(
            {'message': 'Attendance record deleted successfully.'},
            status=status.HTTP_200_OK
        )
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_report(request):

    profile = get_user_profile(request.user)

    if profile.role != 'Admin':
        return Response(
            {'error': 'Only Admin can access monthly reports.'},
            status=status.HTTP_403_FORBIDDEN
        )

    month = request.query_params.get('month')

    if not month:
        return Response(
            {'error': 'Please provide a month in YYYY-MM format.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        year, month_number = map(int, month.split('-'))

        if not 1 <= month_number <= 12:
            raise ValueError

    except ValueError:
        return Response(
            {'error': 'Invalid month. Use YYYY-MM format.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    attendance_records = Attendance.objects.filter(
        date__year=year,
        date__month=month_number
    )

    report = attendance_records.aggregate(
        total=Count('id'),
        present=Count('id', filter=Q(status='Present')),
        absent=Count('id', filter=Q(status='Absent')),
        late=Count('id', filter=Q(status='Late'))
    )

    return Response({
        'month': month,
        'summary': report,
        'attendance_records': AttendanceSerializer(
            attendance_records,
            many=True
        ).data
    })
@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        return Response(
            {
                'message': 'Registration successful.',
                'username': user.username,
                'role': user.userprofile.role
            },
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )
@api_view(['POST'])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')


    
    user = authenticate(
        username=username,
        password=password
    )
    
    print("LOGIN USERNAME:", username)
    print("USER FOUND:", user is not None)
    if user is not None:
        if not user.is_active:
            return Response(
                {'error': 'This account is inactive.'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        profile = getattr(user, 'userprofile', None)
        role = profile.role if profile else 'Admin' if user.is_superuser else None

        if role is None:
            return Response(
                {'error': 'User role is not configured.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            'message': 'Login successful.',
            'username': user.username,
            'role': role,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })

    return Response(
        {'error': 'Invalid username or password.'},
        status=status.HTTP_401_UNAUTHORIZED
    )