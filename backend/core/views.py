from django.conf import settings
from django.core.mail import send_mail
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from accounts.permissions import CanLogActivity, CanManageContent, CanManageProjects, IsAdmin, ReadOnlyOrHasRole

from .models import Activity, Beneficiary, ImpactUpdate, Inquiry, Mission, News, NewsletterSubscriber, Project, Story
from .serializers import (
    ActivitySerializer,
    BeneficiarySerializer,
    ImpactUpdateSerializer,
    InquirySerializer,
    MissionSerializer,
    NewsletterSubscriberSerializer,
    NewsSerializer,
    ProjectSerializer,
    StorySerializer,
)


class ProjectPermission(ReadOnlyOrHasRole):
    write_permission_class = CanManageProjects


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-created_at")
    serializer_class = ProjectSerializer
    permission_classes = [ProjectPermission]
    lookup_field = "slug"


class BeneficiaryViewSet(viewsets.ModelViewSet):
    queryset = Beneficiary.objects.all().order_by("-created_at")
    serializer_class = BeneficiarySerializer
    permission_classes = [ProjectPermission]

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)


class MissionPermission(ReadOnlyOrHasRole):
    write_permission_class = CanManageContent


class MissionViewSet(viewsets.ModelViewSet):
    queryset = Mission.objects.all().order_by("focus_area")
    serializer_class = MissionSerializer
    permission_classes = [MissionPermission]
    lookup_field = "focus_area"


class ActivityPermission(ReadOnlyOrHasRole):
    write_permission_class = CanLogActivity


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [ActivityPermission]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ImpactUpdatePermission(ReadOnlyOrHasRole):
    write_permission_class = CanManageContent


class ImpactUpdateViewSet(viewsets.ModelViewSet):
    serializer_class = ImpactUpdateSerializer
    permission_classes = [ImpactUpdatePermission]

    def get_queryset(self):
        qs = ImpactUpdate.objects.all()
        if not (self.request.user.is_authenticated and CanManageContent().has_permission(self.request, self)):
            qs = qs.filter(is_published=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class StoryPermission(ReadOnlyOrHasRole):
    write_permission_class = CanManageContent


class StoryViewSet(viewsets.ModelViewSet):
    serializer_class = StorySerializer
    permission_classes = [StoryPermission]

    def get_queryset(self):
        qs = Story.objects.all()
        if not (self.request.user.is_authenticated and CanManageContent().has_permission(self.request, self)):
            qs = qs.filter(consent_given=True, is_published=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class NewsPermission(ReadOnlyOrHasRole):
    write_permission_class = CanManageContent


class NewsViewSet(viewsets.ModelViewSet):
    serializer_class = NewsSerializer
    permission_classes = [NewsPermission]

    def get_queryset(self):
        qs = News.objects.all()
        if not (self.request.user.is_authenticated and CanManageContent().has_permission(self.request, self)):
            qs = qs.filter(is_published=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        instance = serializer.save()
        send_mail(
            subject=f"New {instance.get_kind_display()} inquiry from {instance.name}",
            message=instance.message or "(no message provided)",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com"),
            recipient_list=[getattr(settings, "ORG_CONTACT_EMAIL", "contact@example.com")],
            fail_silently=True,
        )


class NewsletterSubscriberViewSet(viewsets.ModelViewSet):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAdmin()]
