# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CarViewSet,
    ReservationViewSet, NotificationViewSet, YOLODetectionView,
    ServiceProviderHistoryView, PredictAvailabilityView
)
from .verification_views import VerifyEmailView, ResendVerificationCodeView

# Create router for ViewSets
router = DefaultRouter()
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Registration routes are now in main Parkit_Project/urls.py
    # Car registration
    path('register/car/', CarViewSet.as_view({'post': 'create'}), name='register-car'),
    
    # YOLO Detection
    path('detect-parking/', YOLODetectionView.as_view(), name='yolo-detection'),
    
    # Service Provider History
    path('provider/history/', ServiceProviderHistoryView.as_view(), name='provider-history'),
    
    # Prediction
    path('predict-availability/', PredictAvailabilityView.as_view(), name='predict-availability'),
    
    # Email Verification
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationCodeView.as_view(), name='resend-verification'),
    
    # Include router URLs
    path('', include(router.urls)),
]
