from rest_framework.routers import DefaultRouter

from .views import BeneficiaryViewSet, ProjectViewSet

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="project")
router.register("beneficiaries", BeneficiaryViewSet, basename="beneficiary")

urlpatterns = router.urls
