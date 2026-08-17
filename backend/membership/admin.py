from django.contrib import admin

from .models import (
    AdminScope,
    ApplicationStatusHistory,
    Country,
    Department,
    EmailNotification,
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


class ApplicationStatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ["previous_status", "new_status", "changed_by", "note", "created_at"]
    can_delete = False


@admin.register(MembershipApplication)
class MembershipApplicationAdmin(admin.ModelAdmin):
    list_display = ["application_id", "full_name", "email", "region", "status", "created_at"]
    list_filter = ["status", "region"]
    search_fields = ["application_id", "full_name", "email"]
    inlines = [ApplicationStatusHistoryInline]


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ["member_id", "user", "region", "role", "status", "joined_date"]
    list_filter = ["status", "region"]
    search_fields = ["member_id"]


@admin.register(RegionalNeed)
class RegionalNeedAdmin(admin.ModelAdmin):
    list_display = ["region", "role", "required_count", "assigned", "remaining", "is_active"]
    list_filter = ["is_active", "region"]


@admin.register(EmailNotification)
class EmailNotificationAdmin(admin.ModelAdmin):
    list_display = ["template_name", "recipient", "status", "sent_at"]
    list_filter = ["status", "template_name"]
    readonly_fields = [f.name for f in EmailNotification._meta.fields]


admin.site.register(Country)
admin.site.register(StateProvince)
admin.site.register(Region)
admin.site.register(AdminScope)
admin.site.register(OrganizationRole)
admin.site.register(Skill)
admin.site.register(Department)
admin.site.register(Team)
admin.site.register(RoleAssignment)
