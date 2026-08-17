import hashlib
import hmac
import uuid

import requests
from django.conf import settings
from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import (
    CanApproveExpenses,
    CanManageDonations,
    CanManageExpenses,
    CanViewFinancials,
    IsAdmin,
    IsDonor,
    ReadOnlyOrHasRole,
)
from audit_log.services import log_action
from core.models import Beneficiary, Project

from .models import Approval, Donation, Expense, Invoice, PaymentOrder, next_transaction_id
from .serializers import (
    ApprovalSerializer,
    DonationPublicSerializer,
    DonationSerializer,
    ExpensePublicSerializer,
    ExpenseSerializer,
    InvoiceSerializer,
)


def build_project_impact(project, request=None):
    """Shared by VerifyTransactionView and MyDonationsView: what a donation's project has done with its funds."""
    if not project:
        return None
    target = project.target_budget
    spent = project.funds_spent
    progress_percent = round((spent / target) * 100, 1) if target else None
    recent_expenses = Expense.objects.filter(project=project, status=Expense.Status.APPROVED).order_by("-date")[:5]
    return {
        "project_name": project.name,
        "project_slug": project.slug,
        "project_status": project.status,
        "focus_area": project.focus_area,
        "target_budget": target,
        "funds_received": project.funds_received,
        "funds_spent": spent,
        "progress_percent": progress_percent,
        "recent_expenses": ExpensePublicSerializer(recent_expenses, many=True, context={"request": request}).data,
    }


class DonationPermission(ReadOnlyOrHasRole):
    write_permission_class = CanManageDonations


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all().order_by("-date")
    permission_classes = [DonationPermission]

    def _can_view_financials(self):
        return self.request.user.is_authenticated and CanViewFinancials().has_permission(self.request, self)

    def get_serializer_class(self):
        if self._can_view_financials():
            return DonationSerializer
        return DonationPublicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not self._can_view_financials():
            qs = qs.filter(status=Donation.Status.RECEIVED)
        project_slug = self.request.query_params.get("project")
        if project_slug:
            qs = qs.filter(project__slug=project_slug)
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

    def _can_view_financials(self):
        return self.request.user.is_authenticated and CanViewFinancials().has_permission(self.request, self)

    def get_serializer_class(self):
        if self._can_view_financials():
            return ExpenseSerializer
        return ExpensePublicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not self._can_view_financials():
            qs = qs.filter(status=Expense.Status.APPROVED)
        project_slug = self.request.query_params.get("project")
        if project_slug:
            qs = qs.filter(project__slug=project_slug)
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


class InvoicePermission(ReadOnlyOrHasRole):
    write_permission_class = CanManageExpenses


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [InvoicePermission]

    def get_queryset(self):
        qs = Invoice.objects.all().order_by("-uploaded_at")
        can_view = self.request.user.is_authenticated and CanViewFinancials().has_permission(self.request, self)
        if not can_view:
            qs = qs.filter(expense__status=Expense.Status.APPROVED)
        return qs

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
        by_focus_area = {
            (row["project__focus_area"] or "other"): row["total"]
            for row in Expense.objects.filter(status=Expense.Status.APPROVED)
            .values("project__focus_area")
            .annotate(total=Sum("amount"))
        }
        beneficiaries_by_focus_area = {
            (row["project__focus_area"] or "other"): row["count"]
            for row in Beneficiary.objects.values("project__focus_area").annotate(count=Count("id"))
        }
        return Response(
            {
                "total_received": received,
                "total_spent": spent,
                "balance": received - spent,
                "utilization_percent": round((spent / received) * 100, 1) if received else 0,
                "donations_by_source": by_source,
                "expenses_by_category": by_category,
                "expenses_by_focus_area": by_focus_area,
                "total_beneficiaries": Beneficiary.objects.count(),
                "beneficiaries_by_focus_area": beneficiaries_by_focus_area,
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
        return Response(
            {
                "found": True,
                "type": "donation",
                **DonationPublicSerializer(donation).data,
                "project_impact": build_project_impact(donation.project, request),
            }
        )


class MyDonationsView(APIView):
    """A logged-in donor's own contribution history — never accessible by email lookup."""

    permission_classes = [IsAuthenticated, IsDonor]

    def get(self, request):
        donations = Donation.objects.filter(donor=request.user, status=Donation.Status.RECEIVED).order_by("-date")
        results = []
        for donation in donations:
            results.append(
                {
                    **DonationPublicSerializer(donation).data,
                    "project_impact": build_project_impact(donation.project, request),
                }
            )
        return Response(results)


class DonateConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        configured = bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)
        return Response({"configured": configured, "key_id": settings.RAZORPAY_KEY_ID if configured else None})


class DonateCreateOrderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not (settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET):
            return Response(
                {"reason": "gateway_not_configured", "detail": "Online payments aren't configured yet."},
                status=503,
            )

        try:
            amount = float(request.data.get("amount"))
        except (TypeError, ValueError):
            raise ValidationError({"amount": "A valid amount is required."})
        if amount <= 0:
            raise ValidationError({"amount": "Amount must be greater than zero."})

        project = None
        project_slug = request.data.get("project_slug")
        mission = request.data.get("mission")
        if project_slug:
            project = Project.objects.filter(slug=project_slug).first()
            if not project:
                raise ValidationError({"project_slug": "Unknown project."})
        elif mission and mission != "where_needed_most":
            # No specific project chosen — route to the longest-running active project
            # in that pillar so the mission choice isn't silently dropped.
            project = (
                Project.objects.filter(focus_area=mission, status=Project.Status.ACTIVE)
                .order_by("created_at")
                .first()
            )

        donor = request.user if (request.user.is_authenticated and request.user.role == "donor") else None
        receipt = f"donation-{uuid.uuid4().hex[:16]}"

        try:
            resp = requests.post(
                "https://api.razorpay.com/v1/orders",
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                json={"amount": int(amount * 100), "currency": "INR", "receipt": receipt},
                timeout=10,
            )
            resp.raise_for_status()
            gateway_order = resp.json()
        except requests.RequestException:
            return Response({"reason": "gateway_error", "detail": "Could not reach the payment gateway."}, status=502)

        order = PaymentOrder.objects.create(
            gateway_order_id=gateway_order["id"],
            amount=amount,
            project=project,
            donor=donor,
            donor_name=request.data.get("donor_name", ""),
            donor_email=request.data.get("donor_email", ""),
            display_donor_publicly=bool(request.data.get("display_donor_publicly", False)),
        )
        return Response(
            {
                "order_id": order.gateway_order_id,
                "amount": gateway_order["amount"],
                "currency": gateway_order["currency"],
                "key_id": settings.RAZORPAY_KEY_ID,
            }
        )


class DonateVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        order_id = request.data.get("razorpay_order_id")
        payment_id = request.data.get("razorpay_payment_id")
        signature = request.data.get("razorpay_signature")
        if not (order_id and payment_id and signature):
            raise ValidationError("razorpay_order_id, razorpay_payment_id and razorpay_signature are required.")

        order = PaymentOrder.objects.filter(gateway_order_id=order_id, status=PaymentOrder.Status.CREATED).first()
        if not order:
            return Response({"detail": "Unknown or already-processed order."}, status=404)

        expected_signature = hmac.new(
            key=settings.RAZORPAY_KEY_SECRET.encode(),
            msg=f"{order_id}|{payment_id}".encode(),
            digestmod=hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, signature):
            order.status = PaymentOrder.Status.FAILED
            order.save()
            return Response({"detail": "Payment verification failed."}, status=400)

        order.status = PaymentOrder.Status.PAID
        order.gateway_payment_id = payment_id
        order.gateway_signature = signature
        order.save()

        donation = Donation.objects.create(
            transaction_id=next_transaction_id(Donation, "DON"),
            source=Donation.Source.INDIVIDUAL,
            donor=order.donor,
            donor_name=order.donor_name,
            donor_email=order.donor_email,
            display_donor_publicly=order.display_donor_publicly,
            amount=order.amount,
            date=timezone.localdate(),
            project=order.project,
            purpose=order.project.name if order.project else "Where Needed Most",
            payment_method="Razorpay",
            payment_reference=payment_id,
            status=Donation.Status.RECEIVED,
        )
        order.donation = donation
        order.save()
        log_action(order.donor, "donation received via online payment", donation)

        return Response(
            {
                "transaction_id": donation.transaction_id,
                "amount": donation.amount,
                "date": donation.date,
                "project_name": order.project.name if order.project else None,
            }
        )
