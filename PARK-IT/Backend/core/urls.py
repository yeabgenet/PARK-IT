# core/urls.py
from django.urls import path
from .views import DriverRegistrationView, ServiceProviderRegistrationView, CarViewSet

urlpatterns = [
    path('register/driver/', DriverRegistrationView.as_view(), name='register-driver'),
    path('register/service-provider/', ServiceProviderRegistrationView.as_view(), name='register-service-provider'),
    path('register/car/', CarViewSet.as_view({'post': 'create'}), name='register-car'),
]
