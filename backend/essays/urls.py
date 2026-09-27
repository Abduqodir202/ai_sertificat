from django.urls import path
from .views import CheckEssayAPIView

urlpatterns = [
    path("check-essay/", CheckEssayAPIView.as_view()),
]