from rest_framework import serializers

from .models import Approval, Donation, Expense, Invoice


class DonationPublicSerializer(serializers.ModelSerializer):
    donor_label = serializers.CharField(source="public_donor_label", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Donation
        fields = [
            "transaction_id",
            "donor_label",
            "source",
            "amount",
            "date",
            "project_name",
            "purpose",
            "status",
        ]


class DonationSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Donation
        fields = [
            "id",
            "transaction_id",
            "source",
            "donor",
            "donor_name",
            "donor_email",
            "display_donor_publicly",
            "amount",
            "date",
            "project",
            "project_name",
            "purpose",
            "payment_method",
            "payment_reference",
            "status",
            "void_reason",
            "recorded_by",
            "created_at",
        ]
        read_only_fields = ["id", "transaction_id", "donor", "status", "void_reason", "recorded_by", "created_at"]


class InvoiceSerializer(serializers.ModelSerializer):
    expense_transaction_id = serializers.CharField(source="expense.transaction_id", read_only=True)
    expense_title = serializers.CharField(source="expense.title", read_only=True)
    expense_vendor = serializers.CharField(source="expense.vendor", read_only=True)
    expense_amount = serializers.DecimalField(source="expense.amount", max_digits=14, decimal_places=2, read_only=True)
    expense_date = serializers.DateField(source="expense.date", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "expense",
            "expense_transaction_id",
            "expense_title",
            "expense_vendor",
            "expense_amount",
            "expense_date",
            "invoice_number",
            "payment_reference",
            "file",
            "uploaded_by",
            "uploaded_at",
        ]
        read_only_fields = ["id", "uploaded_by", "uploaded_at"]


class ApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Approval
        fields = ["id", "expense", "approver", "decision", "comment", "created_at"]
        read_only_fields = ["id", "approver", "created_at"]


class ExpensePublicSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    has_invoice = serializers.SerializerMethodField()
    invoice_url = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            "transaction_id",
            "title",
            "category",
            "vendor",
            "amount",
            "date",
            "project_name",
            "status",
            "has_invoice",
            "invoice_url",
        ]

    def get_has_invoice(self, obj):
        return hasattr(obj, "invoice")

    def get_invoice_url(self, obj):
        request = self.context.get("request")
        if not hasattr(obj, "invoice") or not obj.invoice.file:
            return None
        url = obj.invoice.file.url
        return request.build_absolute_uri(url) if request else url


class ExpenseSerializer(serializers.ModelSerializer):
    invoice = InvoiceSerializer(read_only=True)
    approvals = ApprovalSerializer(many=True, read_only=True)
    required_approvals = serializers.IntegerField(read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "transaction_id",
            "title",
            "category",
            "amount",
            "date",
            "project",
            "vendor",
            "payment_method",
            "description",
            "status",
            "void_reason",
            "created_by",
            "created_at",
            "updated_at",
            "invoice",
            "approvals",
            "required_approvals",
        ]
        read_only_fields = ["id", "transaction_id", "status", "void_reason", "created_by", "created_at", "updated_at"]
