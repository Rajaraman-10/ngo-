"""
Payment gateway abstraction.

React Donation UI -> /api/finance/donate/create-order/ -> get_payment_service()
                                                                |
                                                    ------------+------------
                                                    |                       |
                                            MockPaymentService      RazorpayService
                                            (dev, no keys needed)   (real money, needs keys)

get_payment_service() picks RazorpayService whenever real keys are configured — in any
environment, including production, since that's the whole point of adding the keys.
MockPaymentService is only ever selected as a fallback, and only while DEBUG=True. It is
never available in production even if the real keys happen to be missing there, because a
mock donation looks exactly like a real one everywhere except the audit trail — it must
never be reachable outside local development.
"""

import hashlib
import hmac
import uuid

import requests
from django.conf import settings


class PaymentGatewayError(Exception):
    pass


class PaymentService:
    def create_order(self, amount, receipt):
        """Returns {"id": ..., "amount": paise, "currency": "INR"}."""
        raise NotImplementedError

    def verify_payment(self, order_id, payment_id, signature):
        raise NotImplementedError


class RazorpayService(PaymentService):
    def create_order(self, amount, receipt):
        try:
            resp = requests.post(
                "https://api.razorpay.com/v1/orders",
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                json={"amount": int(amount * 100), "currency": "INR", "receipt": receipt},
                timeout=10,
            )
            resp.raise_for_status()
        except requests.RequestException as exc:
            raise PaymentGatewayError("Could not reach the payment gateway.") from exc
        return resp.json()

    def verify_payment(self, order_id, payment_id, signature):
        expected = hmac.new(
            key=settings.RAZORPAY_KEY_SECRET.encode(),
            msg=f"{order_id}|{payment_id}".encode(),
            digestmod=hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


class MockPaymentService(PaymentService):
    """Simulates a payment gateway for local development and demos: no real money,
    no external network call, no gateway credentials required. Orders and payment IDs
    are tagged with a "mock_" prefix so every downstream view can tell them apart from
    a real Razorpay order on sight, and the resulting Donation is flagged is_test=True."""

    ORDER_PREFIX = "mock_order_"
    PAYMENT_PREFIX = "mock_pay_"
    _secret = "mock-payment-secret-dev-only"

    def create_order(self, amount, receipt):
        return {
            "id": f"{self.ORDER_PREFIX}{uuid.uuid4().hex[:20]}",
            "amount": int(amount * 100),
            "currency": "INR",
        }

    def sign(self, order_id, payment_id):
        return hmac.new(self._secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()

    def verify_payment(self, order_id, payment_id, signature):
        if not payment_id.startswith(self.PAYMENT_PREFIX):
            return False
        return hmac.compare_digest(self.sign(order_id, payment_id), signature)


def is_mock_order_id(order_id):
    return bool(order_id) and order_id.startswith(MockPaymentService.ORDER_PREFIX)


def get_payment_service():
    """None means "no gateway available" — callers should return the existing honest
    503 gateway_not_configured response, exactly as before this abstraction existed."""
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
        return RazorpayService()
    if settings.DEBUG:
        return MockPaymentService()
    return None
