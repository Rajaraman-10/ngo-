from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DonorRegisterView, UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("register/", DonorRegisterView.as_view(), name="donor-register"),
] + router.urls
