import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "admin", "Admin"
    FINANCE_MANAGER = "finance_manager", "Finance Manager"
    PROJECT_MANAGER = "project_manager", "Project Manager"
    ACCOUNTANT = "accountant", "Accountant"
    VOLUNTEER = "volunteer", "Volunteer"
    AUDITOR = "auditor", "Auditor"
    DONOR = "donor", "Donor"


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.VOLUNTEER)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
