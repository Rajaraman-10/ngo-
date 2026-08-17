from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DonationViewSet,
    ExpenseViewSet,
    InvoiceViewSet,
    TransparencySummaryView,
    VerifyTransactionView,
)

router = DefaultRouter()
router.register("donations", DonationViewSet, basename="donation")
router.register("expenses", ExpenseViewSet, basename="expense")
router.register("invoices", InvoiceViewSet, basename="invoice")

urlpatterns = [
    path("summary/", TransparencySummaryView.as_view(), name="transparency-summary"),
    path("verify/<str:transaction_id>/", VerifyTransactionView.as_view(), name="verify-transaction"),
] + router.urls
