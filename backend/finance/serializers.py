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
    class Meta:
        model = Donation
        fields = [
            "id",
            "transaction_id",
            "source",
            "donor_name",
            "donor_email",
            "display_donor_publicly",
            "amount",
            "date",
            "project",
            "purpose",
            "payment_method",
            "payment_reference",
            "status",
            "void_reason",
            "recorded_by",
            "created_at",
        ]
        read_only_fields = ["id", "transaction_id", "status", "void_reason", "recorded_by", "created_at"]


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ["id", "expense", "invoice_number", "payment_reference", "file", "uploaded_by", "uploaded_at"]
        read_only_fields = ["id", "uploaded_by", "uploaded_at"]


class ApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Approval
        fields = ["id", "expense", "approver", "decision", "comment", "created_at"]
        read_only_fields = ["id", "approver", "created_at"]


class ExpensePublicSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    has_invoice = serializers.SerializerMethodField()

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
        ]

    def get_has_invoice(self, obj):
        return hasattr(obj, "invoice")


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
