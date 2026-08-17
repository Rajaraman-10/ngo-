from accounts.models import Role
from accounts.permissions import HasRole

ADMIN_TIERS = (
    Role.GLOBAL_ADMIN,
    Role.COUNTRY_ADMIN,
    Role.STATE_ADMIN,
    Role.REGIONAL_ADMIN,
    Role.TEAM_LEAD,
)


class IsMembershipAdmin(HasRole):
    """Any tier in the Swathi admin hierarchy — location scoping is enforced separately
    by HasRegionalAccess/user_can_access_region, not by this class."""

    allowed_roles = ADMIN_TIERS


def user_can_access_region(user, region):
    """The single mechanism behind "Coimbatore admin can't see Chennai's applications".
    GLOBAL_ADMIN and superusers bypass scope checks entirely, matching the existing
    HasRole superuser-bypass convention in accounts/permissions.py."""
    if not (user and user.is_authenticated):
        return False
    if user.is_superuser or user.role in (Role.ADMIN, Role.GLOBAL_ADMIN):
        return True
    if user.role not in ADMIN_TIERS:
        return False
    if region is None:
        return False
    return any(scope.covers_region(region) for scope in user.admin_scopes.all())


class HasRegionalAccess(IsMembershipAdmin):
    """Object-level permission: pass has_permission() first (role tier), then
    has_object_permission() checks the object's region against the user's AdminScope."""

    def has_object_permission(self, request, view, obj):
        region = getattr(obj, "region", None)
        return user_can_access_region(request.user, region)
