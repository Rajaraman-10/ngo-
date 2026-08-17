"""
Reuses the project's existing email wiring (django.core.mail.send_mail, console backend
in dev, real SMTP via env vars — see config/settings.py and core/views.py's Inquiry
notifications) rather than building a second email system.

A failed send never loses application state: the status/history rows are always
committed by the caller *before* this is invoked, and every attempt — success or
failure — is logged to EmailNotification so delivery is inspectable.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import EmailNotification

logger = logging.getLogger(__name__)

SUBJECTS = {
    "application_received": "Swathi Application Received — {application_id}",
    "application_under_review": "Your Swathi Application Is Under Review — {application_id}",
    "application_shortlisted": "You've Been Shortlisted — {application_id}",
    "interview_required": "Next Step: Interview/Discussion — {application_id}",
    "role_assigned": "Your Swathi Role Assignment — {application_id}",
    "application_approved": "Welcome to Swathi! — {application_id}",
    "application_rejected": "Update on Your Swathi Application — {application_id}",
    "admin_new_application": "New Swathi Membership Application — {application_id}",
}


def send_application_email(application, template_name, recipient, extra_context=None):
    subject = SUBJECTS[template_name].format(application_id=application.application_id)
    context = {"application": application, "org_contact_email": settings.ORG_CONTACT_EMAIL}
    context.update(extra_context or {})

    try:
        html_body = render_to_string(f"membership/emails/{template_name}.html", context)
        send_mail(
            subject=subject,
            message=strip_tags(html_body),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            html_message=html_body,
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001 — any send failure must not raise into the caller
        logger.warning("Failed to send %s to %s: %s", template_name, recipient, exc)
        EmailNotification.objects.create(
            application=application,
            template_name=template_name,
            recipient=recipient,
            status=EmailNotification.Status.FAILED,
            error_message=str(exc),
        )
        return False

    EmailNotification.objects.create(
        application=application,
        template_name=template_name,
        recipient=recipient,
        status=EmailNotification.Status.SENT,
    )
    return True
