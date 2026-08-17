from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import (
    CanApproveExpenses,
    CanManageDonations,
    CanManageExpenses,
    IsAdmin,
    ReadOnlyOrHasRole,
)
from audit_log.services import log_action

from .models import Approval, Donation, Expense, Invoice
from .serializers import (
    ApprovalSerializer,
    DonationPublicSerializer,
    DonationSerializer,
    ExpensePublicSerializer,
    ExpenseSerializer,
    InvoiceSerializer,
)


class DonationPermission(ReadOnlyOrHasRole):
    write_permission_class = CanManageDonations


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all().order_by("-date")
    permission_classes = [DonationPermission]

    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            return DonationSerializer
        return DonationPublicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            qs = qs.filter(status=Donation.Status.RECEIVED)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(recorded_by=self.request.user)
        log_action(self.request.user, "created donation", instance)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def void(self, request, pk=None):
        donation = self.get_object()
        reason = request.data.get("reason", "")
        if not reason:
            raise ValidationError({"reason": "A reason is required to void a donation."})
        donation.status = Donation.Status.VOIDED
        donation.void_reason = reason
        donation.save()
        log_action(request.user, "voided donation", donation, {"reason": reason})
        return Response(DonationSerializer(donation).data)


class ExpensePermission(ReadOnlyOrHasRole):
    write_permission_class = CanManageExpenses


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by("-date")
    permission_classes = [ExpensePermission]

    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            return ExpenseSerializer
        return ExpensePublicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            qs = qs.filter(status=Expense.Status.APPROVED)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, status=Expense.Status.DRAFT)
        log_action(self.request.user, "created expense", instance)

    @action(detail=True, methods=["post"], permission_classes=[CanManageExpenses])
    def submit(self, request, pk=None):
        expense = self.get_object()
        if expense.status != Expense.Status.DRAFT:
            raise ValidationError("Only draft expenses can be submitted for approval.")
        if not hasattr(expense, "invoice"):
            raise ValidationError("Upload an invoice before submitting for approval.")
        expense.status = Expense.Status.PENDING_APPROVAL
        expense.save()
        log_action(request.user, "submitted expense for approval", expense)
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=["post"], permission_classes=[CanApproveExpenses])
    def approve(self, request, pk=None):
        expense = self.get_object()
        if expense.status != Expense.Status.PENDING_APPROVAL:
            raise ValidationError("Only expenses pending approval can be approved.")
        Approval.objects.update_or_create(
            expense=expense,
            approver=request.user,
            defaults={"decision": Approval.Decision.APPROVED, "comment": request.data.get("comment", "")},
        )
        approvals_count = expense.approvals.filter(decision=Approval.Decision.APPROVED).count()
        if approvals_count >= expense.required_approvals():
            expense.status = Expense.Status.APPROVED
            expense.save()
            log_action(request.user, "approved expense (published)", expense)
        else:
            log_action(request.user, "approved expense (awaiting further approval)", expense)
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=["post"], permission_classes=[CanApproveExpenses])
    def reject(self, request, pk=None):
        expense = self.get_object()
        if expense.status != Expense.Status.PENDING_APPROVAL:
            raise ValidationError("Only expenses pending approval can be rejected.")
        Approval.objects.update_or_create(
            expense=expense,
            approver=request.user,
            defaults={"decision": Approval.Decision.REJECTED, "comment": request.data.get("comment", "")},
        )
        expense.status = Expense.Status.REJECTED
        expense.save()
        log_action(request.user, "rejected expense", expense, {"comment": request.data.get("comment", "")})
        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def void(self, request, pk=None):
        expense = self.get_object()
        reason = request.data.get("reason", "")
        if not reason:
            raise ValidationError({"reason": "A reason is required to void an expense."})
        expense.status = Expense.Status.VOIDED
        expense.void_reason = reason
        expense.save()
        log_action(request.user, "voided expense", expense, {"reason": reason})
        return Response(ExpenseSerializer(expense).data)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [CanManageExpenses]

    def perform_create(self, serializer):
        expense = serializer.validated_data["expense"]
        if expense.status != Expense.Status.DRAFT:
            raise PermissionDenied("Invoices can only be attached while an expense is in draft.")
        instance = serializer.save(uploaded_by=self.request.user)
        log_action(self.request.user, "uploaded invoice", instance)


class TransparencySummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        received = Donation.objects.filter(status=Donation.Status.RECEIVED).aggregate(total=Sum("amount"))[
            "total"
        ] or 0
        spent = Expense.objects.filter(status=Expense.Status.APPROVED).aggregate(total=Sum("amount"))["total"] or 0
        by_source = {
            row["source"]: row["total"]
            for row in Donation.objects.filter(status=Donation.Status.RECEIVED)
            .values("source")
            .annotate(total=Sum("amount"))
        }
        by_category = list(
            Expense.objects.filter(status=Expense.Status.APPROVED)
            .values("category")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        return Response(
            {
                "total_received": received,
                "total_spent": spent,
                "balance": received - spent,
                "utilization_percent": round((spent / received) * 100, 1) if received else 0,
                "donations_by_source": by_source,
                "expenses_by_category": by_category,
            }
        )


class VerifyTransactionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, transaction_id):
        if "EXP" in transaction_id:
            expense = Expense.objects.filter(
                transaction_id=transaction_id, status=Expense.Status.APPROVED
            ).first()
            if not expense:
                return Response({"found": False}, status=404)
            return Response({"found": True, "type": "expense", **ExpensePublicSerializer(expense).data})
        donation = Donation.objects.filter(
            transaction_id=transaction_id, status=Donation.Status.RECEIVED
        ).first()
        if not donation:
            return Response({"found": False}, status=404)
        return Response({"found": True, "type": "donation", **DonationPublicSerializer(donation).data})
