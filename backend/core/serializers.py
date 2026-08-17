from rest_framework import serializers

from .models import (
    Activity,
    Beneficiary,
    ImpactUpdate,
    Inquiry,
    Mission,
    News,
    NewsletterSubscriber,
    Project,
    Story,
)


class ProjectSerializer(serializers.ModelSerializer):
    funds_received = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    funds_spent = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    funds_remaining = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "status",
            "focus_area",
            "location",
            "target_budget",
            "start_date",
            "end_date",
            "cover_image",
            "funds_received",
            "funds_spent",
            "funds_remaining",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BeneficiarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Beneficiary
        fields = ["id", "project", "name", "details", "added_by", "created_at"]
        read_only_fields = ["id", "added_by", "created_at"]


class MissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mission
        fields = ["id", "focus_area", "tagline", "description", "why_it_matters", "programs", "hero_image", "updated_at"]
        read_only_fields = ["id", "updated_at"]


class ActivitySerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Activity
        fields = ["id", "project", "project_name", "title", "description", "photo", "date", "created_by", "created_at"]
        read_only_fields = ["id", "created_by", "created_at"]


class ImpactUpdateSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    focus_area = serializers.CharField(source="project.focus_area", read_only=True)

    class Meta:
        model = ImpactUpdate
        fields = [
            "id",
            "project",
            "project_name",
            "focus_area",
            "title",
            "description",
            "photo",
            "people_impacted",
            "date",
            "is_published",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]


class StorySerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Story
        fields = [
            "id",
            "title",
            "person_name",
            "situation_before",
            "support_received",
            "current_situation",
            "photo",
            "project",
            "project_name",
            "consent_given",
            "is_published",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]


class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = ["id", "title", "body", "category", "photo", "published_at", "is_published", "created_by"]
        read_only_fields = ["id", "created_by"]


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = ["id", "kind", "name", "email", "phone", "message", "project", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "subscribed_at"]
        read_only_fields = ["id", "subscribed_at"]
