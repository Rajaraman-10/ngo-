from rest_framework.routers import DefaultRouter

from .views import (
    ActivityViewSet,
    BeneficiaryViewSet,
    ImpactUpdateViewSet,
    InquiryViewSet,
    MissionViewSet,
    NewsletterSubscriberViewSet,
    NewsViewSet,
    ProjectViewSet,
    StoryViewSet,
)

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="project")
router.register("beneficiaries", BeneficiaryViewSet, basename="beneficiary")
router.register("missions", MissionViewSet, basename="mission")
router.register("activities", ActivityViewSet, basename="activity")
router.register("impact-updates", ImpactUpdateViewSet, basename="impactupdate")
router.register("stories", StoryViewSet, basename="story")
router.register("news", NewsViewSet, basename="news")
router.register("inquiries", InquiryViewSet, basename="inquiry")
router.register("newsletter", NewsletterSubscriberViewSet, basename="newslettersubscriber")

urlpatterns = router.urls
