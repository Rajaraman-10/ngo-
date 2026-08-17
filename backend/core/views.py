from rest_framework import viewsets

from accounts.permissions import CanManageProjects, ReadOnlyOrHasRole

from .models import Beneficiary, Project
from .serializers import BeneficiarySerializer, ProjectSerializer


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
