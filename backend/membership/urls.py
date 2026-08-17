from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminScopeViewSet,
    AdminsOverviewView,
    ApplicationStatusView,
    CountryViewSet,
    DepartmentViewSet,
    GlobalDashboardView,
    MembershipApplicationViewSet,
    MyAdminScopesView,
    MyMemberProfileView,
    OrganizationRoleViewSet,
    RegionalDashboardView,
    RegionalNeedViewSet,
    RegionViewSet,
    SkillViewSet,
    StateProvinceViewSet,
    TeamViewSet,
)

router = DefaultRouter()
router.register("countries", CountryViewSet, basename="country")
router.register("states", StateProvinceViewSet, basename="stateprovince")
router.register("regions", RegionViewSet, basename="region")
router.register("roles", OrganizationRoleViewSet, basename="organizationrole")
router.register("skills", SkillViewSet, basename="skill")
router.register("departments", DepartmentViewSet, basename="department")
router.register("teams", TeamViewSet, basename="team")
router.register("regional-needs", RegionalNeedViewSet, basename="regionalneed")
router.register("applications", MembershipApplicationViewSet, basename="membershipapplication")
router.register("admin-scopes", AdminScopeViewSet, basename="adminscope")

urlpatterns = [
    path("applications/status/", ApplicationStatusView.as_view(), name="application-status"),
    path("my-member-profile/", MyMemberProfileView.as_view(), name="my-member-profile"),
    path("my-admin-scopes/", MyAdminScopesView.as_view(), name="my-admin-scopes"),
    path("regional-dashboard/", RegionalDashboardView.as_view(), name="regional-dashboard"),
    path("global-dashboard/", GlobalDashboardView.as_view(), name="global-dashboard"),
    path("admins-overview/", AdminsOverviewView.as_view(), name="admins-overview"),
] + router.urls
