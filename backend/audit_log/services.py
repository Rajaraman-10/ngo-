from .models import AuditLog


def log_action(actor, action, instance, details=None):
    AuditLog.objects.create(
        actor=actor,
        action=action,
        model_name=instance.__class__.__name__,
        object_id=str(instance.pk),
        details=details or {},
    )
