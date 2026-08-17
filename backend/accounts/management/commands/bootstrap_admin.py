import os

from django.core.management.base import BaseCommand

from accounts.models import Role, User


class Command(BaseCommand):
    """Idempotently ensures a superuser login exists, driven by env vars
    (ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD). Safe to run on every deploy —
    exists so a fresh Postgres database always has a working admin login without
    needing Shell access, which Render's free plan doesn't include."""

    help = "Creates or updates the admin superuser from ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD env vars."

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME")
        password = os.environ.get("ADMIN_PASSWORD")
        email = os.environ.get("ADMIN_EMAIL", "")

        if not username or not password:
            self.stdout.write("ADMIN_USERNAME/ADMIN_PASSWORD not set — skipping admin bootstrap.")
            return

        user, created = User.objects.get_or_create(username=username, defaults={"email": email})
        user.email = email or user.email
        user.role = Role.ADMIN
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        self.stdout.write(f"Admin bootstrapped: {username} (created={created})")
