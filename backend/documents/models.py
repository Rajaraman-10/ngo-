import uuid

from django.conf import settings
from django.db import models


class Document(models.Model):
    class Category(models.TextChoices):
        REGISTRATION = "registration", "Registration Certificate"
        TAX = "tax", "PAN / 12A / 80G"
        ANNUAL_REPORT = "annual_report", "Annual Report"
        AUDIT = "audit", "Audited Financial Statement"
        BUDGET = "budget", "Budget"
        PROJECT_REPORT = "project_report", "Project Report"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.OTHER)
    file = models.FileField(upload_to="documents/%Y/")
    financial_year = models.CharField(max_length=20, blank=True)
    is_public = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="documents_uploaded"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title
