import uuid
from datetime import date

from django.conf import settings
from django.db import models


def next_application_id():
    """Same convention as finance.models.next_transaction_id: Swathi-{year}-{seq:06d}."""
    year = date.today().year
    count = MembershipApplication.objects.filter(application_id__startswith=f"Swathi-{year}-").count() + 1
    return f"Swathi-{year}-{count:06d}"


def next_member_id(country_code, region_code):
    """Swathi-M-<COUNTRY>-<REGION>-NNNNN. Country/region codes come from the DB, never
    hardcoded — this function only formats whatever codes the region hierarchy has."""
    prefix = f"Swathi-M-{country_code}-{region_code}-"
    count = Member.objects.filter(member_id__startswith=prefix).count() + 1
    return f"{prefix}{count:05d}"


class Country(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=8, unique=True, help_text="e.g. IN, US, GB")
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "countries"

    def __str__(self):
        return self.name


class StateProvince(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="states")
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=8, blank=True)
    slug = models.SlugField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("country", "slug")]

    def __str__(self):
        return f"{self.name}, {self.country.name}"


class Region(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    state = models.ForeignKey(StateProvince, on_delete=models.CASCADE, related_name="regions")
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=8, blank=True)
    slug = models.SlugField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("state", "slug")]

    def __str__(self):
        return f"{self.name}, {self.state.name}"

    @property
    def country(self):
        return self.state.country


class AdminScope(models.Model):
    """One row per admin per area of authority. Country/state/region are all optional —
    exactly one is normally set, matching the admin's Role tier (COUNTRY_ADMIN sets
    `country` only, meaning every state/region under it; REGIONAL_ADMIN sets `region`).
    GLOBAL_ADMIN / is_superuser never need a row — they bypass scope checks entirely."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="admin_scopes")
    country = models.ForeignKey(Country, on_delete=models.CASCADE, null=True, blank=True, related_name="+")
    state = models.ForeignKey(StateProvince, on_delete=models.CASCADE, null=True, blank=True, related_name="+")
    region = models.ForeignKey(Region, on_delete=models.CASCADE, null=True, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        area = self.region or self.state or self.country or "no area set"
        return f"{self.user} — {area}"

    def covers_region(self, region):
        if not region:
            return False
        if self.region_id:
            return self.region_id == region.id
        if self.state_id:
            return self.state_id == region.state_id
        if self.country_id:
            return self.country_id == region.state.country_id
        return False


class OrganizationRole(models.Model):
    """Admin-manageable membership role types (Volunteer, Fundraiser, ...) — deliberately
    separate from accounts.Role (the auth/permission tier), so new role types can be
    added by any admin without a code change."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Skill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Team(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("region", "name")]

    def __str__(self):
        return f"{self.name} ({self.region.name})"


class RegionalNeed(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="needs")
    role = models.ForeignKey(OrganizationRole, on_delete=models.CASCADE, related_name="regional_needs")
    required_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="regional_needs_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["region__name", "role__name"]
        unique_together = [("region", "role")]

    def __str__(self):
        return f"{self.region.name} needs {self.required_count} {self.role.name}"

    @property
    def assigned(self):
        return Member.objects.filter(region=self.region, role=self.role, status=Member.Status.ACTIVE).count()

    @property
    def remaining(self):
        return max(self.required_count - self.assigned, 0)


class MembershipApplication(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under Review"
        SHORTLISTED = "shortlisted", "Shortlisted"
        INTERVIEW_REQUIRED = "interview_required", "Interview Required"
        ROLE_ASSIGNMENT = "role_assignment", "Role Assignment"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"

    class EducationLevel(models.TextChoices):
        HIGH_SCHOOL = "high_school", "High School"
        UNDERGRADUATE = "undergraduate", "Undergraduate"
        GRADUATE = "graduate", "Graduate"
        POSTGRADUATE = "postgraduate", "Postgraduate"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application_id = models.CharField(max_length=32, unique=True, editable=False)

    # Personal
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    country = models.ForeignKey(Country, on_delete=models.PROTECT, related_name="applications")
    state = models.ForeignKey(StateProvince, on_delete=models.PROTECT, related_name="applications")
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="applications")

    # Education
    education_level = models.CharField(max_length=20, choices=EducationLevel.choices, blank=True)
    institution = models.CharField(max_length=255, blank=True)
    course = models.CharField(max_length=255, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)

    # Professional
    occupation = models.CharField(max_length=255, blank=True)
    organization = models.CharField(max_length=255, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)

    # Skills & experience
    skills = models.ManyToManyField(Skill, blank=True, related_name="applications")
    volunteer_experience = models.TextField(blank=True)
    ngo_experience = models.TextField(blank=True)
    professional_experience = models.TextField(blank=True)

    # Availability
    hours_per_week = models.PositiveIntegerField(null=True, blank=True)
    available_weekdays = models.BooleanField(default=False)
    available_weekends = models.BooleanField(default=False)
    available_mornings = models.BooleanField(default=False)
    available_afternoons = models.BooleanField(default=False)
    available_evenings = models.BooleanField(default=False)

    # Why / how
    motivation = models.TextField(blank=True)
    contribution_interest = models.TextField(blank=True)

    # Optional attachments — resume is private; see membership/views.py ResumeDownloadView.
    resume = models.FileField(upload_to="applications/resumes/%Y/%m/", blank=True, null=True)
    portfolio_url = models.URLField(blank=True)
    profile_photo = models.ImageField(upload_to="applications/photos/%Y/", blank=True, null=True)
    linkedin_url = models.URLField(blank=True)

    status = models.CharField(max_length=30, choices=Status.choices, default=Status.SUBMITTED)
    recommended_role = models.ForeignKey(
        OrganizationRole,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        help_text="System-computed suggestion only — never the final assignment.",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="applications_reviewed"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.application_id:
            self.application_id = next_application_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.application_id} — {self.full_name}"


class ApplicationStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(MembershipApplication, on_delete=models.CASCADE, related_name="status_history")
    previous_status = models.CharField(max_length=30, blank=True)
    new_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name_plural = "application status history"

    def __str__(self):
        return f"{self.application.application_id}: {self.previous_status} -> {self.new_status}"


class RoleAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.OneToOneField(MembershipApplication, on_delete=models.CASCADE, related_name="role_assignment")
    role = models.ForeignKey(OrganizationRole, on_delete=models.PROTECT, related_name="assignments")
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments")
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="supervises"
    )
    start_date = models.DateField(null=True, blank=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.application.application_id} -> {self.role.name}"


class EmailNotification(models.Model):
    class Status(models.TextChoices):
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        MembershipApplication, on_delete=models.CASCADE, null=True, blank=True, related_name="email_notifications"
    )
    template_name = models.CharField(max_length=100)
    recipient = models.EmailField()
    status = models.CharField(max_length=10, choices=Status.choices)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-sent_at"]

    def __str__(self):
        return f"{self.template_name} -> {self.recipient} ({self.status})"


class Member(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member_id = models.CharField(max_length=64, unique=True, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="member_profile")
    application = models.OneToOneField(
        MembershipApplication, on_delete=models.SET_NULL, null=True, blank=True, related_name="member"
    )
    country = models.ForeignKey(Country, on_delete=models.PROTECT, related_name="members")
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name="members")
    role = models.ForeignKey(OrganizationRole, on_delete=models.PROTECT, related_name="members")
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name="members")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="members")
    profile_photo = models.ImageField(upload_to="members/photos/%Y/", blank=True, null=True)
    joined_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["-joined_date"]

    def save(self, *args, **kwargs):
        if not self.member_id:
            self.member_id = next_member_id(self.country.code, self.region.code or self.region.slug.upper())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.member_id} — {self.user.get_full_name() or self.user.username}"
