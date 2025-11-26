# Parkit_Project/urls.py
import os
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.views.static import serve
from rest_framework.routers import DefaultRouter
from core.views import parkingspot_image #new one
from core.views import (
    parkinglot_image, 
    ParkingLotViewSet,
    ParkingSpotViewSet,
    CarViewSet,
    RegisterDriverView,
    RegisterServiceProviderView,
    LoginView,
    CsrfTokenView,
    TerminalListView,
    DriverViewSet,
    SpotHistoryViewSet,
    CheckDriverView, ParkingSpotStatusUpdateView,
    LocationBasedRecommendationView, 
    NearbyParkingLotsView , 
    ServiceProviderProfileView,
    ParkingLotVerificationView
    
    # get_csrf_token # <--- REMOVE THIS, or import it if you actually need this separate function view
)
from django.conf.urls.static import static # Keep this for the DEBUG block
from core import views

# Register viewsets for REST API
router = DefaultRouter()
router.register(r'parking-lots', ParkingLotViewSet)
router.register(r'parking-spots', ParkingSpotViewSet)
router.register(r'cars', CarViewSet)
router.register(r'drivers', DriverViewSet)
router.register(r'spot-history', SpotHistoryViewSet)

urlpatterns = [
    path('api/terminals/', views.TerminalListView.as_view(), name='terminals-list'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/', include('core.urls')), # This includes core's urls.py if it exists
    # path('csrf-token/', get_csrf_token, name='get_csrf_token'), # <--- EITHER FIX OR REMOVE THIS LINE
    path('api/register/driver/', views.RegisterDriverView.as_view(), name='register_driver'),
    path('api/register/service-provider/', views.RegisterServiceProviderView.as_view(), name='register_service_provider'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/csrf/', CsrfTokenView.as_view(), name='csrf_token'), # This is the one your frontend uses
    path('api/user/', views.UserView.as_view(), name='user'),
    path('api/parking-lot-image/<int:pk>/', parkinglot_image, name='parkinglot_image'),
    # path('', TemplateView.as_view(template_name='index.html'), name='home'), # This is duplicated by the catch-all
    path('api/parking-spot-image/<int:pk>/', parkingspot_image, name='parkingspot_image'),
    path('api/check-driver/', CheckDriverView.as_view(), name='check-driver'),
    path('api/parking-spots/<int:pk>/status/', ParkingSpotStatusUpdateView.as_view(), name='parking-spot-status-update'),
    path('api/recommendations/spots/', LocationBasedRecommendationView.as_view(), name='spot-recommendations'),
    path('api/recommendations/lots/', NearbyParkingLotsView.as_view(), name='lot-recommendations'),
    path('api/service-provider/profile/', ServiceProviderProfileView.as_view(), name='service-provider-profile'),
    path('api/parking-lots/<int:pk>/verify/', ParkingLotVerificationView.as_view(), name='parking-lot-verify'),
]

# Serve media and static files ONLY in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', serve, {
            'document_root': os.path.join(settings.FRONTEND_BUILD_DIR, 'assets'),
        }),
    ]

# Catch-all route for React frontend (must be last)
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='index'),
]