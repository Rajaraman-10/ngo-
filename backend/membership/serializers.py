from rest_framework import serializers

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


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ["id", "name", "code", "slug", "is_active"]


class StateProvinceSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name", read_only=True)

    class Meta:
        model = StateProvince
        fields = ["id", "country", "country_name", "name", "code", "slug", "is_active"]


class RegionSerializer(serializers.ModelSerializer):
    state_name = serializers.CharField(source="state.name", read_only=True)
    country_name = serializers.CharField(source="state.country.name", read_only=True)

    class Meta:
        model = Region
        fields = ["id", "state", "state_name", "country_name", "name", "code", "slug", "is_active"]


class OrganizationRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationRole
        fields = ["id", "name", "description", "is_active"]


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name"]


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "region", "name"]


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]


class RegionalNeedSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source="region.name", read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True)
    assigned = serializers.IntegerField(read_only=True)
    remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = RegionalNeed
        fields = [
            "id",
            "region",
            "region_name",
            "role",
            "role_name",
            "required_count",
            "assigned",
            "remaining",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MembershipApplicationCreateSerializer(serializers.ModelSerializer):
    """Public submission — deliberately has no `status`, `recommended_role`, or role
    field of any kind. Mirrors DonorRegisterSerializer's pattern of never trusting a
    client-submitted role/status; those are always set server-side."""

    skills = serializers.ListField(child=serializers.CharField(max_length=100), required=False, write_only=True)

    class Meta:
        model = MembershipApplication
        fields = [
            "id",
            "application_id",
            "full_name",
            "email",
            "phone",
            "date_of_birth",
            "address",
            "country",
            "state",
            "region",
            "education_level",
            "institution",
            "course",
            "graduation_year",
            "occupation",
            "organization",
            "years_of_experience",
            "skills",
            "volunteer_experience",
            "ngo_experience",
            "professional_experience",
            "hours_per_week",
            "available_weekdays",
            "available_weekends",
            "available_mornings",
            "available_afternoons",
            "available_evenings",
            "motivation",
            "contribution_interest",
            "resume",
            "portfolio_url",
            "profile_photo",
            "linkedin_url",
        ]
        read_only_fields = ["id", "application_id"]

    def validate_resume(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Resume must be under 5MB.")
        return value

    def validate_profile_photo(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Photo must be under 5MB.")
        return value

    def create(self, validated_data):
        skill_names = validated_data.pop("skills", [])
        application = MembershipApplication.objects.create(**validated_data)
        if skill_names:
            skills = [Skill.objects.get_or_create(name=name.strip())[0] for name in skill_names if name.strip()]
            application.skills.set(skills)
        return application


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.get_full_name", read_only=True)

    class Meta:
        model = ApplicationStatusHistory
        fields = ["id", "previous_status", "new_status", "changed_by_name", "note", "created_at"]


class RoleAssignmentSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    team_name = serializers.CharField(source="team.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = RoleAssignment
        fields = [
            "id",
            "role",
            "role_name",
            "team",
            "team_name",
            "department",
            "department_name",
            "supervisor",
            "start_date",
        ]


class MembershipApplicationListSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source="region.name", read_only=True)
    recommended_role_name = serializers.CharField(source="recommended_role.name", read_only=True)
    skills = SkillSerializer(many=True, read_only=True)

    class Meta:
        model = MembershipApplication
        fields = [
            "id",
            "application_id",
            "full_name",
            "email",
            "region",
            "region_name",
            "skills",
            "years_of_experience",
            "status",
            "recommended_role_name",
            "created_at",
        ]


class MemberSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source="region.name", read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True)
    team_name = serializers.CharField(source="team.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Member
        fields = [
            "id",
            "member_id",
            "full_name",
            "email",
            "country",
            "country_name",
            "region",
            "region_name",
            "role",
            "role_name",
            "team",
            "team_name",
            "department",
            "department_name",
            "joined_date",
            "status",
            "profile_photo",
        ]


class AdminScopeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True)
    state_name = serializers.CharField(source="state.name", read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True)

    class Meta:
        model = AdminScope
        fields = [
            "id",
            "user",
            "user_name",
            "country",
            "country_name",
            "state",
            "state_name",
            "region",
            "region_name",
            "created_at",
        ]


class MembershipApplicationDetailSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source="region.name", read_only=True)
    state_name = serializers.CharField(source="state.name", read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    recommended_role_name = serializers.CharField(source="recommended_role.name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.get_full_name", read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    role_assignment = RoleAssignmentSerializer(read_only=True)
    has_resume = serializers.SerializerMethodField()

    class Meta:
        model = MembershipApplication
        exclude = ["resume"]

    def get_has_resume(self, obj):
        return bool(obj.resume)
