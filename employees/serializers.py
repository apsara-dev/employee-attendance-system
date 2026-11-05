from rest_framework import serializers
from django.contrib.auth.models import User

from .models import Employee, Attendance, Leave, UserProfile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'


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
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=['Employee', 'Admin'],
        write_only=True
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        role = validated_data.pop('role')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        UserProfile.objects.create(
            user=user,
            role='Employee'
        )

        if role == 'Admin':
            user.userprofile.role = 'Employee'
            user.userprofile.save()

        return user