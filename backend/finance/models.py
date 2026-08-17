import uuid
from datetime import date

from django.conf import settings
from django.db import models


def next_transaction_id(model, prefix):
    year = date.today().year
    count = model.objects.filter(transaction_id__startswith=f"NGO-{year}-{prefix}-").count() + 1
    return f"NGO-{year}-{prefix}-{count:06d}"


class Donation(models.Model):
    class Status(models.TextChoices):
        RECEIVED = "received", "Received"
        VOIDED = "voided", "Voided"

    class Source(models.TextChoices):
        INDIVIDUAL = "individual", "Individual"
        CORPORATE = "corporate", "Corporate / CSR"
        GRANT = "grant", "Government / Grant"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_id = models.CharField(max_length=32, unique=True, editable=False)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.INDIVIDUAL)
    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations",
        help_text="Set only when a logged-in donor completes the payment flow themselves.",
    )
    donor_name = models.CharField(max_length=255, blank=True)
    donor_email = models.EmailField(blank=True)
    display_donor_publicly = models.BooleanField(default=False)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField()
    project = models.ForeignKey(
        "core.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="donations"
    )
    purpose = models.CharField(max_length=255, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECEIVED)
    void_reason = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="donations_recorded"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = next_transaction_id(Donation, "DON")
        super().save(*args, **kwargs)

    def public_donor_label(self):
        if self.display_donor_publicly and self.donor_name:
            return self.donor_name
        return {
            self.Source.INDIVIDUAL: "Individual Donor",
            self.Source.CORPORATE: "Corporate Donor",
            self.Source.GRANT: "Government / Grant",
        }.get(self.source, "Donor")

    def __str__(self):
        return f"{self.transaction_id} - {self.amount}"


class Expense(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        VOIDED = "voided", "Voided"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_id = models.CharField(max_length=32, unique=True, editable=False)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField()
    project = models.ForeignKey(
        "core.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses"
    )
    vendor = models.CharField(max_length=255, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    void_reason = models.TextField(blank=True)
    superseded_by = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="supersedes"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="expenses_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = next_transaction_id(Expense, "EXP")
        super().save(*args, **kwargs)

    def required_approvals(self):
        if self.amount <= 10_000:
            return 1
        if self.amount <= 50_000:
            return 2
        return 2  # admin + finance, enforced by ApprovalPermission at the view layer

    def __str__(self):
        return f"{self.transaction_id} - {self.title}"


class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    expense = models.OneToOneField(Expense, on_delete=models.CASCADE, related_name="invoice")
    invoice_number = models.CharField(max_length=100, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    file = models.FileField(upload_to="invoices/%Y/%m/")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="invoices_uploaded"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice for {self.expense.transaction_id}"


class Approval(models.Model):
    class Decision(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name="approvals")
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="approvals_made")
    decision = models.CharField(max_length=20, choices=Decision.choices)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("expense", "approver")

    def __str__(self):
        return f"{self.approver} {self.decision} {self.expense.transaction_id}"


class PaymentOrder(models.Model):
    """A gateway checkout attempt. Becomes a Donation only once payment is verified."""

    class Status(models.TextChoices):
        CREATED = "created", "Created"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gateway_order_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    project = models.ForeignKey(
        "core.Project", on_delete=models.SET_NULL, null=True, blank=True, related_name="payment_orders"
    )
    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="payment_orders"
    )
    donor_name = models.CharField(max_length=255, blank=True)
    donor_email = models.EmailField(blank=True)
    display_donor_publicly = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)
    gateway_payment_id = models.CharField(max_length=100, blank=True)
    gateway_signature = models.CharField(max_length=255, blank=True)
    donation = models.OneToOneField(
        Donation, on_delete=models.SET_NULL, null=True, blank=True, related_name="payment_order"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.gateway_order_id} ({self.status})"
