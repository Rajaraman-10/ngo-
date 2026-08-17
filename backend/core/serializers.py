from rest_framework import serializers

from .models import Beneficiary, Project


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
