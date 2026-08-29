from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import FileResponse, Http404
from django.utils.crypto import get_random_string
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from accounts.permissions import HasRole, ReadOnlyOrHasRole
from audit_log.services import log_action

from .emails import send_application_email
from .models import (
    AdminScope,
    ApplicationStatusHistory,
    Country,
    Department,
    Member,
    MembershipApplication,
    OrganizationRole,
    Region,
    RegionalNeed,
    RoleAssignment,
    Skill,
    StateProvince,
    Team,
)
from .permissions import ADMIN_TIERS, HasRegionalAccess, IsMembershipAdmin, user_can_access_region
from .recommendation import recommend_roles
from .serializers import (
    AdminScopeSerializer,
    CountrySerializer,
    DepartmentSerializer,
    MemberSerializer,
    MembershipApplicationCreateSerializer,
    MembershipApplicationDetailSerializer,
    MembershipApplicationListSerializer,
    OrganizationRoleSerializer,
    RegionalNeedSerializer,
    RegionSerializer,
    RoleAssignmentSerializer,
    SkillSerializer,
    StateProvinceSerializer,
    TeamSerializer,
)

User = get_user_model()


class IsGlobalAdmin(HasRole):
    """Country/state/region management is Global-Admin-only, per the spec: regional and
    country admins manage their area's members/needs, not the geography tree itself."""

    allowed_roles = (Role.GLOBAL_ADMIN,)


class GeographyPermission(ReadOnlyOrHasRole):
    write_permission_class = IsGlobalAdmin


class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [GeographyPermission]


class StateProvinceViewSet(viewsets.ModelViewSet):
    serializer_class = StateProvinceSerializer
    permission_classes = [GeographyPermission]

    def get_queryset(self):
        qs = StateProvince.objects.select_related("country").all()
        country_id = self.request.query_params.get("country")
        if country_id:
            qs = qs.filter(country_id=country_id)
        return qs


class RegionViewSet(viewsets.ModelViewSet):
    serializer_class = RegionSerializer
    permission_classes = [GeographyPermission]

    def get_queryset(self):
        qs = Region.objects.select_related("state__country").all()
        state_id = self.request.query_params.get("state")
        if state_id:
            qs = qs.filter(state_id=state_id)
        return qs


class OrganizationRolePermission(ReadOnlyOrHasRole):
    write_permission_class = IsMembershipAdmin


class OrganizationRoleViewSet(viewsets.ModelViewSet):
    queryset = OrganizationRole.objects.all()
    serializer_class = OrganizationRoleSerializer
    permission_classes = [OrganizationRolePermission]


class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [OrganizationRolePermission]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [OrganizationRolePermission]


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [OrganizationRolePermission]

    def get_queryset(self):
        qs = Team.objects.select_related("region").all()
        region_id = self.request.query_params.get("region")
        if region_id:
            qs = qs.filter(region_id=region_id)
        return qs

    def perform_create(self, serializer):
        region = serializer.validated_data["region"]
        if not user_can_access_region(self.request.user, region):
            raise PermissionDenied("You don't have access to this region.")
        serializer.save()


class RegionalNeedPermission(ReadOnlyOrHasRole):
    write_permission_class = IsMembershipAdmin


class RegionalNeedViewSet(viewsets.ModelViewSet):
    serializer_class = RegionalNeedSerializer
    permission_classes = [RegionalNeedPermission]

    def get_queryset(self):
        qs = RegionalNeed.objects.select_related("region", "role").all()
        region_id = self.request.query_params.get("region")
        if region_id:
            qs = qs.filter(region_id=region_id)
        if not self.request.query_params.get("include_inactive"):
            qs = qs.filter(is_active=True)
        return qs

    def _check_region_access(self, region):
        if not user_can_access_region(self.request.user, region):
            raise PermissionDenied("You don't have access to this region.")

    def perform_create(self, serializer):
        self._check_region_access(serializer.validated_data["region"])
        instance = serializer.save(created_by=self.request.user)
        log_action(self.request.user, "created regional need", instance)

    def perform_update(self, serializer):
        self._check_region_access(serializer.instance.region)
        instance = serializer.save()
        log_action(self.request.user, "updated regional need", instance)

    def perform_destroy(self, instance):
        self._check_region_access(instance.region)
        log_action(self.request.user, "deleted regional need", instance)
        instance.delete()


STATUS_EMAIL_TEMPLATES = {
    MembershipApplication.Status.UNDER_REVIEW: "application_under_review",
    MembershipApplication.Status.SHORTLISTED: "application_shortlisted",
    MembershipApplication.Status.INTERVIEW_REQUIRED: "interview_required",
}


def _notify_new_application(application):
    send_application_email(application, "application_received", application.email)

    admin_recipients = set(
        User.objects.filter(role=Role.GLOBAL_ADMIN, is_active=True).values_list("email", flat=True)
    )
    for scope in AdminScope.objects.select_related("user").filter(user__is_active=True):
        if scope.covers_region(application.region) and scope.user.email:
            admin_recipients.add(scope.user.email)

    review_url = f"{settings.FRONTEND_BASE_URL}/dashboard?tab=applications&application={application.id}"
    skills_summary = ", ".join(s.name for s in application.skills.all()) or "—"
    for recipient in admin_recipients:
        send_application_email(
            application,
            "admin_new_application",
            recipient,
            {"review_url": review_url, "skills_summary": skills_summary},
        )


class MembershipApplicationViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.action == "create":
            return MembershipApplicationCreateSerializer
        if self.action == "list":
            return MembershipApplicationListSerializer
        return MembershipApplicationDetailSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsMembershipAdmin()]

    def get_queryset(self):
        qs = MembershipApplication.objects.select_related(
            "region", "state", "country", "recommended_role", "reviewed_by"
        ).prefetch_related("skills", "status_history", "role_assignment")
        user = self.request.user
        if not (user.is_authenticated and user.role in (Role.GLOBAL_ADMIN, Role.ADMIN) or user.is_superuser):
            # Build the queryset from every scope row this admin holds (region-only,
            # state-wide, or country-wide) rather than a single flat filter.
            scopes = AdminScope.objects.filter(user=user)
            if not scopes.exists():
                return qs.none()

            q = Q()
            for scope in scopes:
                if scope.region_id:
                    q |= Q(region_id=scope.region_id)
                elif scope.state_id:
                    q |= Q(region__state_id=scope.state_id)
                elif scope.country_id:
                    q |= Q(region__state__country_id=scope.country_id)
            qs = qs.filter(q) if q else qs.none()
        return qs

    def perform_create(self, serializer):
        application = serializer.save()
        _notify_new_application(application)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_region_access(instance)
        return super().retrieve(request, *args, **kwargs)

    def check_region_access(self, application):
        if not user_can_access_region(self.request.user, application.region):
            raise PermissionDenied("You don't have access to this application's region.")

    def _apply_status(self, application, new_status, note=""):
        if application.status == new_status:
            return False  # no-op: never duplicate a history row or email for a re-save
        previous = application.status
        application.status = new_status
        application.reviewed_by = self.request.user
        application.save()

        ApplicationStatusHistory.objects.create(
            application=application,
            previous_status=previous,
            new_status=new_status,
            changed_by=self.request.user,
            note=note,
        )
        log_action(self.request.user, f"application status -> {new_status}", application, {"note": note})
        return True

    @action(detail=True, methods=["post"], url_path="change-status")
    def change_status(self, request, pk=None):
        application = self.get_object()
        self.check_region_access(application)
        new_status = request.data.get("status")
        note = request.data.get("note", "")
        valid = dict(MembershipApplication.Status.choices)
        if new_status not in valid:
            raise ValidationError({"status": "Not a valid status."})
        if new_status == MembershipApplication.Status.APPROVED:
            raise ValidationError({"status": "Use the approve action to approve an application."})

        changed = self._apply_status(application, new_status, note)
        if changed:
            template = STATUS_EMAIL_TEMPLATES.get(new_status)
            if template:
                send_application_email(application, template, application.email, {"note": note})
        return Response(MembershipApplicationDetailSerializer(application).data)

    @action(detail=True, methods=["get"])
    def recommendation(self, request, pk=None):
        application = self.get_object()
        self.check_region_access(application)
        return Response(recommend_roles(application))

    @action(detail=True, methods=["post"], url_path="assign-role")
    def assign_role(self, request, pk=None):
        application = self.get_object()
        self.check_region_access(application)

        role_id = request.data.get("role")
        if not role_id:
            raise ValidationError({"role": "A role is required."})
        role = OrganizationRole.objects.filter(id=role_id).first()
        if not role:
            raise ValidationError({"role": "Unknown role."})

        assignment, _ = RoleAssignment.objects.update_or_create(
            application=application,
            defaults={
                "role": role,
                "team_id": request.data.get("team") or None,
                "department_id": request.data.get("department") or None,
                "supervisor_id": request.data.get("supervisor") or None,
                "start_date": request.data.get("start_date") or None,
                "assigned_by": request.user,
            },
        )
        log_action(request.user, "assigned role", application, {"role": role.name})
        self._apply_status(application, MembershipApplication.Status.ROLE_ASSIGNMENT)

        send_application_email(
            application,
            "role_assigned",
            application.email,
            {
                "role_name": role.name,
                "team_name": assignment.team.name if assignment.team else "",
                "department_name": assignment.department.name if assignment.department else "",
            },
        )
        return Response(MembershipApplicationDetailSerializer(application).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        application = self.get_object()
        self.check_region_access(application)

        if application.status == MembershipApplication.Status.APPROVED:
            # Already approved — return as-is rather than re-provisioning the member
            # account or sending a second welcome email for a repeated click/request.
            return Response(MembershipApplicationDetailSerializer(application).data)

        assignment = getattr(application, "role_assignment", None)
        if not assignment:
            raise ValidationError("Assign a role before approving this application.")

        user = User.objects.filter(email__iexact=application.email).first()
        temp_password = None
        if not user:
            base_username = application.email.split("@")[0][:20] or "member"
            username = base_username
            suffix = 1
            while User.objects.filter(username=username).exists():
                suffix += 1
                username = f"{base_username}{suffix}"
            temp_password = get_random_string(12)
            names = application.full_name.split(" ", 1)
            user = User(
                username=username,
                email=application.email,
                first_name=names[0],
                last_name=names[1] if len(names) > 1 else "",
                phone=application.phone,
                role=Role.MEMBER,
            )
            user.set_password(temp_password)
            user.save()
        elif user.role not in (Role.MEMBER, *ADMIN_TIERS, Role.ADMIN):
            # Don't silently downgrade/repurpose an existing donor/staff account.
            raise ValidationError(
                "An account with this email already exists with a different role — resolve manually."
            )

        member, created = Member.objects.get_or_create(
            user=user,
            defaults={
                "application": application,
                "country": application.country,
                "region": application.region,
                "role": assignment.role,
                "team": assignment.team,
                "department": assignment.department,
            },
        )

        self._apply_status(application, MembershipApplication.Status.APPROVED)
        log_action(request.user, "approved application", application, {"member_id": member.member_id})

        send_application_email(
            application,
            "application_approved",
            application.email,
            {
                "member_id": member.member_id,
                "role_name": assignment.role.name,
                "temp_password": temp_password,
            },
        )
        return Response(MembershipApplicationDetailSerializer(application).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        application = self.get_object()
        self.check_region_access(application)
        note = request.data.get("note", "")
        changed = self._apply_status(application, MembershipApplication.Status.REJECTED, note)
        if changed:
            send_application_email(application, "application_rejected", application.email, {"note": note})
        return Response(MembershipApplicationDetailSerializer(application).data)

    @action(detail=True, methods=["get"])
    def resume(self, request, pk=None):
        application = self.get_object()
        self.check_region_access(application)
        if not application.resume:
            raise Http404("No resume on file.")
        return FileResponse(application.resume.open("rb"), as_attachment=True, filename=application.resume.name.split("/")[-1])


class ApplicationStatusView(APIView):
    """Public lookup by application_id + email — the only way anyone outside amma
    admin can see an application's status. Mirrors VerifyTransactionView's shape."""

    permission_classes = [AllowAny]

    def post(self, request):
        application_id = request.data.get("application_id", "").strip()
        email = request.data.get("email", "").strip()
        if not (application_id and email):
            raise ValidationError("application_id and email are required.")

        application = MembershipApplication.objects.filter(
            application_id=application_id, email__iexact=email
        ).first()
        if not application:
            return Response({"found": False}, status=404)

        assignment = getattr(application, "role_assignment", None)
        return Response(
            {
                "found": True,
                "application_id": application.application_id,
                "region_name": application.region.name,
                "status": application.status,
                "submitted_date": application.created_at,
                "last_updated": application.updated_at,
                "assigned_role": assignment.role.name if assignment else None,
            }
        )


class MyMemberProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = getattr(request.user, "member_profile", None)
        if not member:
            return Response({"detail": "No member profile for this account."}, status=404)
        return Response(MemberSerializer(member).data)


class MyAdminScopesView(APIView):
    """A membership admin's own areas of authority — e.g. so a Regional Admin's UI
    knows which region(s) to offer when creating a RegionalNeed. Global admins get an
    empty list here (they aren't scope-restricted; they use the full org endpoints)."""

    permission_classes = [IsMembershipAdmin]

    def get(self, request):
        scopes = AdminScope.objects.filter(user=request.user).select_related("country", "state", "region")
        return Response(AdminScopeSerializer(scopes, many=True).data)


class RegionalDashboardView(APIView):
    permission_classes = [IsMembershipAdmin]

    def get(self, request):
        region_id = request.query_params.get("region")
        if not region_id:
            raise ValidationError({"region": "region query param is required."})
        region = Region.objects.filter(id=region_id).select_related("state__country").first()
        if not region:
            raise Http404
        if not user_can_access_region(request.user, region):
            raise PermissionDenied("You don't have access to this region.")

        members = Member.objects.filter(region=region)
        applications = MembershipApplication.objects.filter(region=region)
        needs = RegionalNeed.objects.filter(region=region, is_active=True).select_related("role")

        return Response(
            {
                "region_name": region.name,
                "total_members": members.count(),
                "active_members": members.filter(status=Member.Status.ACTIVE).count(),
                "pending_applications": applications.filter(
                    status=MembershipApplication.Status.SUBMITTED
                ).count(),
                "under_review_applications": applications.filter(
                    status=MembershipApplication.Status.UNDER_REVIEW
                ).count(),
                "needs": RegionalNeedSerializer(needs, many=True).data,
            }
        )


class GlobalDashboardView(APIView):
    permission_classes = [IsGlobalAdmin]

    def get(self, request):
        return Response(
            {
                "countries": Country.objects.count(),
                "states": StateProvince.objects.count(),
                "regions": Region.objects.count(),
                "total_members": Member.objects.filter(status=Member.Status.ACTIVE).count(),
                "total_applications": MembershipApplication.objects.count(),
                "pending_applications": MembershipApplication.objects.filter(
                    status__in=[
                        MembershipApplication.Status.SUBMITTED,
                        MembershipApplication.Status.UNDER_REVIEW,
                    ]
                ).count(),
            }
        )


class AdminScopeViewSet(viewsets.ModelViewSet):
    queryset = AdminScope.objects.select_related("user", "country", "state", "region").all()
    serializer_class = AdminScopeSerializer
    permission_classes = [IsGlobalAdmin]


# Everyone who can actually change something on the site. Donors, plain volunteers,
# and approved members have no write access beyond their own data, so they're left
# out — this is deliberately "who has edit power," not "who has an account."
NON_ADMIN_ROLES = (Role.DONOR, Role.VOLUNTEER, Role.MEMBER)


class AdminsOverviewView(APIView):
    """Founder/global-admin visibility: every account with any edit power, plus the
    region/state/country each amma-tier admin is actually scoped to. Stays readable
    at any account count since it only ever lists the (small, deliberate) admin set,
    never the full user table."""

    permission_classes = [IsGlobalAdmin]

    def get(self, request):
        users = (
            User.objects.exclude(role__in=NON_ADMIN_ROLES)
            .order_by("-is_superuser", "role", "username")
        )
        scopes_by_user = {}
        for scope in AdminScope.objects.select_related("country", "state", "region"):
            scopes_by_user.setdefault(scope.user_id, []).append(scope)

        data = []
        for u in users:
            scope_labels = []
            for scope in scopes_by_user.get(u.id, []):
                if scope.region:
                    scope_labels.append(f"Region: {scope.region.name}")
                elif scope.state:
                    scope_labels.append(f"State: {scope.state.name}")
                elif scope.country:
                    scope_labels.append(f"Country: {scope.country.name}")
            data.append(
                {
                    "id": str(u.id),
                    "username": u.username,
                    "email": u.email,
                    "role": u.role,
                    "role_display": u.get_role_display(),
                    "is_superuser": u.is_superuser,
                    "is_active": u.is_active,
                    "date_joined": u.date_joined,
                    "last_login": u.last_login,
                    "scopes": scope_labels,
                }
            )
        return Response(data)
