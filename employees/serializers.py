from rest_framework import serializers
from django.contrib.auth.models import User

from .models import Employee, Attendance, Leave, UserProfile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'
        extra_kwargs = {
            'employee_id': {'required': False, 'allow_blank': True}
        }


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'



class LeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leave
        fields = '__all__'
        read_only_fields = ['employee', 'status']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        try:
            profile = user.userprofile
            token['role'] = profile.role
        except UserProfile.DoesNotExist:
            token['role'] = 'Admin' if user.is_superuser else 'Employee'

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        try:
            profile = self.user.userprofile
            data['role'] = profile.role
            data['employee_id'] = (
                profile.employee.id if profile.employee else None
            )
        except UserProfile.DoesNotExist:
            data['role'] = 'Admin' if self.user.is_superuser else 'Employee'
            data['employee_id'] = None

        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)
    role = serializers.ChoiceField(
        choices=['Employee', 'Admin'],
        write_only=True
    )
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'employee']

    def validate_employee(self, value):
        if value and UserProfile.objects.filter(employee=value).exists():
            raise serializers.ValidationError(
                'This employee is already linked to an existing user account.'
            )
        return value

    def create(self, validated_data):
        role = validated_data.pop('role')
        employee = validated_data.pop('employee', None)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )

        if role == 'Admin':
            user.is_staff = True
            user.save(update_fields=['is_staff'])

        # If role is Employee and no employee was explicitly selected, try matching by email
        if role == 'Employee' and employee is None and user.email:
            matched_emp = Employee.objects.filter(email__iexact=user.email).first()
            if matched_emp and not UserProfile.objects.filter(employee=matched_emp).exists():
                employee = matched_emp

        UserProfile.objects.create(
            user=user,
            role=role,
            employee=employee if role == 'Employee' else None
        )

        return user