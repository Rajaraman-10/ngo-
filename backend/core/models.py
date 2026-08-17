import uuid

from django.db import models


class Project(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ON_HOLD = "on_hold", "On Hold"

    class FocusArea(models.TextChoices):
        EDUCATION = "education", "Education"
        EMPLOYMENT = "employment", "Employment"
        FOOD = "food", "Food"
        HOME = "home", "Home"
        CLEAN_INDIA = "clean_india", "Clean India"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    focus_area = models.CharField(max_length=20, choices=FocusArea.choices, default=FocusArea.OTHER)
    target_budget = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    cover_image = models.ImageField(upload_to="projects/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def funds_received(self):
        from finance.models import Donation

        return (
            Donation.objects.filter(project=self, status=Donation.Status.RECEIVED).aggregate(
                total=models.Sum("amount")
            )["total"]
            or 0
        )

    @property
    def funds_spent(self):
        from finance.models import Expense

        return (
            Expense.objects.filter(project=self, status=Expense.Status.APPROVED).aggregate(
                total=models.Sum("amount")
            )["total"]
            or 0
        )

    @property
    def funds_remaining(self):
        return self.funds_received - self.funds_spent


class Beneficiary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="beneficiaries")
    name = models.CharField(max_length=255)
    details = models.TextField(blank=True)
    added_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="beneficiaries_added"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
