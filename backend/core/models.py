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
    location = models.CharField(max_length=255, blank=True)
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


class Mission(models.Model):
    """One row per program pillar (Education, Employment, ...) — editable CMS content."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    focus_area = models.CharField(max_length=20, choices=Project.FocusArea.choices, unique=True)
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    why_it_matters = models.TextField(blank=True)
    programs = models.JSONField(default=list, blank=True)
    hero_image = models.ImageField(upload_to="missions/", blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.get_focus_area_display()


class Activity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="activities")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to="activities/%Y/", blank=True, null=True)
    date = models.DateField()
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="activities_logged"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        verbose_name_plural = "activities"

    def __str__(self):
        return self.title


class ImpactUpdate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="impact_updates")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    photo = models.ImageField(upload_to="impact_updates/%Y/", blank=True, null=True)
    people_impacted = models.PositiveIntegerField(default=0)
    date = models.DateField()
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="impact_updates_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.title


class Story(models.Model):
    """Beneficiary story. Requires BOTH consent_given and is_published to be public."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    person_name = models.CharField(max_length=255, blank=True, help_text="Pseudonym allowed.")
    situation_before = models.TextField(blank=True)
    support_received = models.TextField(blank=True)
    current_situation = models.TextField(blank=True)
    photo = models.ImageField(upload_to="stories/%Y/", blank=True, null=True)
    project = models.ForeignKey(
        Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="stories"
    )
    consent_given = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="stories_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "stories"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class News(models.Model):
    class Category(models.TextChoices):
        ANNOUNCEMENT = "announcement", "Announcement"
        EVENT = "event", "Event"
        SUCCESS_STORY = "success_story", "Success Story"
        REPORT = "report", "Report"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.ANNOUNCEMENT)
    photo = models.ImageField(upload_to="news/%Y/", blank=True, null=True)
    published_at = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="news_created"
    )

    class Meta:
        verbose_name_plural = "news"
        ordering = ["-published_at"]

    def __str__(self):
        return self.title


class Inquiry(models.Model):
    class Kind(models.TextChoices):
        VOLUNTEER = "volunteer", "Volunteer"
        PARTNER = "partner", "Partner With Us"
        EMPLOYER = "employer", "Provide Employment Opportunities"
        SPONSOR = "sponsor", "Sponsor a Project"
        FUNDRAISE = "fundraise", "Fundraise"
        AWARENESS = "awareness", "Spread Awareness"
        CONTACT = "contact", "General Contact"

    class Status(models.TextChoices):
        NEW = "new", "New"
        REVIEWED = "reviewed", "Reviewed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    message = models.TextField(blank=True)
    project = models.ForeignKey(
        Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="inquiries"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "inquiries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_kind_display()} — {self.name}"


class NewsletterSubscriber(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email
