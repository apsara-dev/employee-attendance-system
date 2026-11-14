
import os
import random
import re
from django.db import models
from django.contrib.auth.models import User

# Default Company Code (can be changed here or via COMPANY_CODE in .env)
COMPANY_CODE = os.getenv('COMPANY_CODE', 'EMP')


def generate_employee_id(name, company_code=None):
    code = (company_code or COMPANY_CODE).strip().upper()
    cleaned_name = re.sub(r'[^A-Za-z0-9]', '', name or '').upper()
    name_prefix = (cleaned_name[:3]).ljust(3, 'X')

    for _ in range(100):
        random_digits = random.randint(1000, 9999)
        candidate = f"{code}{random_digits}{name_prefix}"
        if not Employee.objects.filter(employee_id=candidate).exists():
            return candidate

    return f"{code}{random.randint(1000, 9999)}{name_prefix}"


class Employee(models.Model):
    employee_id = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100)
    joining_date = models.DateField()

    def save(self, *args, **kwargs):
        if not self.employee_id:
            self.employee_id = generate_employee_id(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE
    )
    date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES
    )

    class Meta:
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee.name} - {self.date} - {self.status}"
    
class Leave(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='Pending'
    )

    def __str__(self):
        return f"{self.employee.name} - {self.start_date}"
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Employee', 'Employee'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='Employee'
    )

    employee = models.OneToOneField(
        Employee,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.role}"   


