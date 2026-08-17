from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User
from .permissions import IsAdmin
from .serializers import DonorRegisterSerializer, MeSerializer, UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    """Admin-only member management."""

    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    @action(detail=False, methods=["get", "patch"], permission_classes=[IsAuthenticated])
    def me(self, request):
        if request.method == "PATCH":
            serializer = MeSerializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(MeSerializer(request.user).data)


class DonorRegisterView(generics.CreateAPIView):
    """Public self-registration. Always creates a donor account, regardless of payload."""

    queryset = User.objects.all()
    serializer_class = DonorRegisterSerializer
    permission_classes = [AllowAny]
