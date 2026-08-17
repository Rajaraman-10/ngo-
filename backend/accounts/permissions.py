from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Role


class HasRole(BasePermission):
    """Base class: subclass and set `allowed_roles`. Superusers always pass."""

    allowed_roles: tuple[str, ...] = ()

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role == Role.ADMIN:
            return True
        return user.role in self.allowed_roles


class IsAdmin(HasRole):
    allowed_roles = ()


class CanManageExpenses(HasRole):
    """Create/edit expenses: finance manager, accountant, project manager."""

    allowed_roles = (Role.FINANCE_MANAGER, Role.ACCOUNTANT, Role.PROJECT_MANAGER)


class CanApproveExpenses(HasRole):
    allowed_roles = (Role.FINANCE_MANAGER,)


class CanManageDonations(HasRole):
    allowed_roles = (Role.FINANCE_MANAGER, Role.ACCOUNTANT)


class CanManageProjects(HasRole):
    allowed_roles = (Role.PROJECT_MANAGER,)


class IsAuditorReadOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role == Role.ADMIN:
            return True
        return user.role == Role.AUDITOR and request.method in SAFE_METHODS


class ReadOnlyOrHasRole(BasePermission):
    """Public/anonymous users get read-only; specific roles get write access."""

    write_permission_class: type[HasRole] = HasRole

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return self.write_permission_class().has_permission(request, view)
