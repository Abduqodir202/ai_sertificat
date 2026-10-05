from django.urls import path

from .views import (
    CheckEssayAPIView,
    OCRAPIView,
)

urlpatterns = [

    path(
        "check-essay/",
        CheckEssayAPIView.as_view(),
        name="check-essay"
    ),

    path(
        "ocr/",
        OCRAPIView.as_view(),
        name="ocr"
    ),

]