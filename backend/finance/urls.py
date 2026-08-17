from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DonateConfigView,
    DonateCreateOrderView,
    DonateMockConfirmView,
    DonateVerifyView,
    DonationViewSet,
    ExpenseViewSet,
    InvoiceViewSet,
    MyDonationsView,
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
    path("my-donations/", MyDonationsView.as_view(), name="my-donations"),
    path("donate/config/", DonateConfigView.as_view(), name="donate-config"),
    path("donate/create-order/", DonateCreateOrderView.as_view(), name="donate-create-order"),
    path("donate/verify/", DonateVerifyView.as_view(), name="donate-verify"),
    path("donate/mock-confirm/", DonateMockConfirmView.as_view(), name="donate-mock-confirm"),
] + router.urls
