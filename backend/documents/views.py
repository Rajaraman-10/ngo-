from rest_framework import viewsets

from accounts.permissions import IsAdmin, ReadOnlyOrHasRole

from .models import Document
from .serializers import DocumentSerializer


class DocumentPermission(ReadOnlyOrHasRole):
    write_permission_class = IsAdmin


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [DocumentPermission]

    def get_queryset(self):
        qs = Document.objects.all()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_public=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
