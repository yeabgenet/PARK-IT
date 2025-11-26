# core/views.py
from django.shortcuts import render, get_object_or_404
from django.middleware.csrf import get_token
from django.http import HttpResponse
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action, api_view
from django.contrib.auth import authenticate, login
import math
import logging
import random
from datetime import timedelta

# Safe geopy import with fallback
try:
    from geopy.distance import geodesic
    GEOPY_AVAILABLE = True
except ImportError:
    GEOPY_AVAILABLE = False
    # Fallback distance calculation using Haversine formula
    def geodesic(point1, point2):
        class Distance:
            def __init__(self, km):
                self.km = km
            @property
            def kilometers(self):
                return self.km
        
        lat1, lon1 = point1
        lat2, lon2 = point2
        
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Radius of earth in kilometers
        
        return Distance(round(c * r, 2))

from .models import (
    ParkingLot, ParkingSpot, Car, Driver, ServiceProvider, User, Role, 
    SpotHistory, ParkingSpotHistory, Reservation, Notification, SpotDetection
)
from .serializers import (
    ParkingLotSerializer,
    CarSerializer,
    DriverSerializer,
    ServiceProviderSerializer,
    ParkingSpotSerializer,
    SpotHistorySerializer,
    ParkingSpotRecommendationSerializer,
    ReservationSerializer,
    NotificationSerializer,
    SpotDetectionSerializer
)

logger = logging.getLogger(__name__)

def parkinglot_image(request, pk):
    lot = get_object_or_404(ParkingLot, pk=pk)
    if lot.image_data:
        return HttpResponse(lot.image_data, content_type=lot.image_mime_type)
    return HttpResponse(status=404)

def parkingspot_image(request, pk):
    spot = get_object_or_404(ParkingSpot, pk=pk)
    if spot.image_data:
        return HttpResponse(spot.image_data, content_type=spot.image_mime_type)
    return HttpResponse(status=404)

def index(request):
    return render(request, 'index.html')

@api_view(['GET'])
def get_csrf_token(request):
    """
    Function-based view to get CSRF token.
    Your frontend uses CsrfTokenView (class-based) at /api/csrf/,
    so this might be redundant or for a different purpose.
    """
    return Response({'csrfToken': get_token(request)})

class UserView(APIView):
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            user_role = None
            if request.user.role:
                user_role = request.user.role.role_name.lower()
            elif request.user.is_superuser:
                user_role = 'admin'
            return Response({
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'role': user_role,
                    'is_superuser': request.user.is_superuser,
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'Not authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)

class ParkingLotViewSet(viewsets.ModelViewSet):
    queryset = ParkingLot.objects.all()
    serializer_class = ParkingLotSerializer

    def get_queryset(self):
        user = self.request.user
        logger.debug(f"User: {user}, Authenticated: {user.is_authenticated}")
        if user.is_authenticated:
            logger.debug(f"Superuser: {user.is_superuser}, Role: {user.role.role_name if user.role else 'None'}")
            if user.is_superuser:
                logger.debug("Returning all parking lots for superuser")
                return ParkingLot.objects.all()
            if hasattr(user, 'serviceprovider') and user.role and user.role.role_name.lower() == 'service provider':
                logger.debug(f"ServiceProvider: {user.serviceprovider}, Parking Lots: {ParkingLot.objects.filter(provider=user.serviceprovider)}")
                return ParkingLot.objects.filter(provider=user.serviceprovider)
        logger.debug("Returning empty queryset for unauthenticated user")
        return ParkingLot.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'serviceprovider'):
            serializer.save(provider=user.serviceprovider)
        else:
            raise serializers.ValidationError("User is not a service provider")

    @action(detail=False, methods=['get'])
    def images(self, request):
        queryset = self.get_queryset()
        image_urls = [request.build_absolute_uri(lot.profile_image.url) for lot in queryset if lot.profile_image]
        return Response(image_urls)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

# Old serializer-based registration views removed - now using RegisterDriverView and RegisterServiceProviderView with email verification

class CarViewSet(viewsets.ModelViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer

class LoginView(APIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        logger.debug(f"Attempting to authenticate user: {username}")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            user_role = None
            if user.role:
                user_role = user.role.role_name.lower()
            elif user.is_superuser:
                user_role = 'admin'
            logger.debug(f"User authenticated: {user.username}, Role: {user_role}, Superuser: {user.is_superuser}")
            login(request, user)
            return Response({
                'message': 'Login successful',
                'user': {
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user_role,
                    'is_superuser': user.is_superuser
                }
            }, status=status.HTTP_200_OK)
        else:
            logger.debug(f"Invalid credentials for user: {username}")
            logger.debug(f"Request data: {request.data}")
            return Response({
                'message': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

class RegisterDriverView(APIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        gender = request.data.get('gender', '')
        phone_number = request.data.get('phone_number')
        age = request.data.get('age')
        country = request.data.get('country')
        city = request.data.get('city')
        address = request.data.get('address')
        license_number = request.data.get('license_number')
        license_plate = request.data.get('license_plate')
        profile_picture = request.FILES.get('profile_picture')
        role_name = request.data.get('role', 'Driver').lower()

        logger.debug(f"Registering driver: {username}, email: {email}, role: {role_name}")
        logger.debug(f"Request data: {request.data}")

        if not all([username, email, password, phone_number, age, country, city, address, license_number, license_plate]):
            logger.debug(f"Missing required fields: username={username}, email={email}, phone_number={phone_number}, age={age}, country={country}, city={city}, address={address}, license_number={license_number}, license_plate={license_plate}")
            return Response({
                'message': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            logger.debug(f"Username already exists: {username}")
            return Response({
                'message': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            logger.debug(f"Email already exists: {email}")
            return Response({
                'message': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        if Driver.objects.filter(phone_number=phone_number).exists():
            logger.debug(f"Phone number already exists: {phone_number}")
            return Response({
                'message': 'Phone number already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        if Car.objects.filter(license_plate=license_plate).exists():
            logger.debug(f"License plate already exists: {license_plate}")
            return Response({
                'message': 'License plate already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            role, _ = Role.objects.get_or_create(role_name='Driver')
            
            # Generate 6-digit verification code
            verification_code = str(random.randint(100000, 999999))
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                gender=gender,
                role=role
            )
            user.profile_picture = profile_picture
            user.is_active = False  # User must verify email first
            user.verification_code = verification_code
            user.verification_code_created_at = timezone.now()
            user.save()

            driver = Driver.objects.create(
                user=user,
                phone_number=phone_number,
                age=int(age),
                country=country,
                city=city,
                address=address,
                license_number=license_number
            )

            Car.objects.create(
                driver=driver,
                license_plate=license_plate
            )

            # Send verification email
            try:
                send_mail(
                    subject='ParkIt - Email Verification Code',
                    message=f'Your verification code is: {verification_code}\n\nThis code will expire in 10 minutes.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                logger.info(f"Verification email sent to {email}")
            except Exception as email_error:
                logger.error(f"Failed to send verification email: {str(email_error)}")

            logger.info(f"Driver {username} created, awaiting email verification")
            return Response({
                'message': 'Registration successful. Please check your email for verification code.',
                'email': email,
                'requires_verification': True
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating driver: {str(e)}")
            return Response({
                'message': f'Error creating user: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

class RegisterServiceProviderView(APIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        gender = request.data.get('gender', '')
        phone_number = request.data.get('phone_number')
        age = request.data.get('age')
        country = request.data.get('country')
        city = request.data.get('city')
        address = request.data.get('address')
        company_name = request.data.get('company_name')
        contact_person = request.data.get('contact_person')
        profile_picture = request.FILES.get('profile_picture')
        role_name = request.data.get('role', 'Service Provider').lower()

        logger.debug(f"Registering service provider: {username}, email: {email}, role: {role_name}")

        if not all([username, email, password, phone_number, age, country, city, address, company_name, contact_person]):
            logger.debug(f"Missing required fields")
            return Response({
                'message': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'message': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if ServiceProvider.objects.filter(phone_number=phone_number).exists():
            return Response({'message': 'Phone number already exists'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            role, _ = Role.objects.get_or_create(role_name='Service Provider')
            
            # Generate 6-digit verification code
            verification_code = str(random.randint(100000, 999999))
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                gender=gender,
                role=role
            )
            if profile_picture:
                user.profile_picture = profile_picture
            user.is_active = False
            user.verification_code = verification_code
            user.verification_code_created_at = timezone.now()
            user.save()

            ServiceProvider.objects.create(
                user=user,
                phone_number=phone_number,
                age=int(age),
                country=country,
                city=city,
                address=address,
                company_name=company_name,
                contact_person=contact_person
            )

            # Send verification email
            try:
                send_mail(
                    subject='ParkIt - Email Verification Code',
                    message=f'Your verification code is: {verification_code}\n\nThis code will expire in 10 minutes.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                logger.info(f"Verification email sent to {email}")
            except Exception as email_error:
                logger.error(f"Failed to send verification email: {str(email_error)}")

            logger.info(f"Service Provider {username} created, awaiting email verification")
            return Response({
                'message': 'Registration successful. Please check your email for verification code.',
                'email': email,
                'requires_verification': True
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating service provider: {str(e)}")
            return Response({
                'message': f'Error creating user: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

class CsrfTokenView(APIView):
    def get(self, request, *args, **kwargs):
        token = get_token(request)
        logger.debug(f"CSRF token generated: {token}")
        response = Response({'csrfToken': token})
        response.set_cookie(
            'csrftoken',
            token,
            max_age=31449600,  # 1 year
            httponly=False,
            samesite='Lax',
            secure=False
        )
        return response

class TerminalListView(APIView):
    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if hasattr(user, 'serviceprovider'):
            terminals = ParkingLot.objects.filter(provider=user.serviceprovider)
            serializer = ParkingLotSerializer(terminals, many=True, context={'request': request})
            return Response(serializer.data)
        else:
            return Response({'error': 'User is not a service provider'}, status=status.HTTP_403_FORBIDDEN)

class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer

    def get_queryset(self):
        return Driver.objects.all()  # Adjust permissions as needed

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

class ParkingSpotViewSet(viewsets.ModelViewSet):
    queryset = ParkingSpot.objects.all()
    serializer_class = ParkingSpotSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = ParkingSpot.objects.none()

        if user.is_authenticated and hasattr(user, 'serviceprovider'):
            queryset = ParkingSpot.objects.filter(lot__provider=user.serviceprovider)
            lot_id = self.request.query_params.get('lot_id')
            if lot_id:
                queryset = queryset.filter(lot_id=lot_id)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'serviceprovider'):
            lot_id = serializer.validated_data.get('lot').id
            if ParkingLot.objects.filter(id=lot_id, provider=user.serviceprovider).exists():
                instance = serializer.save()
                SpotHistory.objects.create(spot=instance, status=instance.status)
            else:
                raise serializers.ValidationError("Invalid terminal selection")
        else:
            raise serializers.ValidationError("User is not a service provider")

    def perform_update(self, serializer):
        instance = serializer.instance
        old_status = instance.status
        driver_id = self.request.data.get('driver_id')
        driver = None

        if driver_id:
            try:
                driver = Driver.objects.get(user__id=driver_id)
            except Driver.DoesNotExist:
                raise serializers.ValidationError("Invalid driver ID")

        serializer.save()
        new_status = instance.status

        if old_status != new_status:
            last_history = instance.history.filter(end_time__isnull=True).last()
            if last_history:
                last_history.end_time = timezone.now()
                last_history.save()

            SpotHistory.objects.create(
                spot=instance,
                status=new_status,
                driver=driver if new_status == 'occupied' else None
            )

class SpotHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SpotHistory.objects.all()
    serializer_class = SpotHistorySerializer  # Fixed to use SpotHistorySerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and hasattr(user, 'serviceprovider'):
            spot_id = self.request.query_params.get('spot_id')
            if spot_id:
                return SpotHistory.objects.filter(spot__lot__provider=user.serviceprovider, spot_id=spot_id)
            return SpotHistory.objects.filter(spot__lot__provider=user.serviceprovider)
        return SpotHistory.objects.none()

class CheckDriverView(APIView):
    """
    Check if driver exists by username
    """
    def get(self, request):
        username = request.GET.get('username', '').strip()
        if not username:
            return Response({'error': 'Username parameter required'}, status=400)
        
        print(f"Checking driver with username: {username}")  # Debug log
        
        try:
            # Case-insensitive search for username
            user = User.objects.get(username__iexact=username)
            driver = Driver.objects.get(user=user)
            print(f"Driver found: {user.username}")  # Debug log
            return Response({
                'exists': True,
                'driver_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'driver_id': driver.user.id
            })
        except User.DoesNotExist:
            print(f"User not found: {username}")  # Debug log
            return Response({'exists': False})
        except Driver.DoesNotExist:
            print(f"User found but not a driver: {username}")  # Debug log
            return Response({'exists': False})

class ParkingSpotStatusUpdateView(APIView):
    """
    Update parking spot status with username
    """
    def patch(self, request, pk):
        try:
            spot = ParkingSpot.objects.get(id=pk)
            new_status = request.data.get('status')
            username = request.data.get('username')
            
            print(f"Updating spot {pk} to {new_status} with username: {username}")
            
            if new_status not in ['available', 'occupied']:
                return Response({'error': 'Invalid status'}, status=400)
            
            # Store previous status for history
            previous_status = spot.status
            driver = None
            
            if new_status == 'occupied':
                if not username:
                    return Response({'error': 'Username required for occupied status'}, status=400)
                
                try:
                    # Case-insensitive search
                    user = User.objects.get(username__iexact=username.strip())
                    driver = Driver.objects.get(user=user)
                    print(f"Driver found for occupation: {user.username}")
                except User.DoesNotExist:
                    print(f"User not found: {username}")
                    return Response({'error': 'Driver with this username does not exist'}, status=404)
                except Driver.DoesNotExist:
                    print(f"User found but not a driver: {username}")
                    return Response({'error': 'User exists but is not registered as a driver'}, status=404)
                
                spot.status = 'occupied'
                history_action = 'occupied'
                
            else:  # available
                spot.status = 'available'
                history_action = 'released'
                # Clear any driver association when making available
                username = None
            
            spot.save()
            
            # Create history record
            ParkingSpotHistory.objects.create(
                spot=spot,
                driver=driver,
                action=history_action,
                previous_status=previous_status,
                new_status=new_status,
                notes=f"Status changed via toggle by service provider",
                created_by=request.user
            )
            
            return Response({
                'message': f'Spot status updated to {new_status}',
                'spot': ParkingSpotSerializer(spot, context={'request': request}).data
            })
            
        except ParkingSpot.DoesNotExist:
            return Response({'error': 'Parking spot not found'}, status=404)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response({'error': 'Internal server error'}, status=500)

class LocationBasedRecommendationView(APIView):
    """
    Get parking spot recommendations based on user location
    """
    def get(self, request):
        # Get user location from request (could be from IP, GPS, or manual input)
        user_lat = request.GET.get('lat')
        user_lon = request.GET.get('lon')
        
        if not user_lat or not user_lon:
            return Response(
                {'error': 'User location coordinates (lat, lon) are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_lat = float(user_lat)
            user_lon = float(user_lon)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid coordinates'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store user location in request for serializers
        request.user_location = (user_lat, user_lon)
        
        # Get available spots from verified parking lots
        available_spots = ParkingSpot.objects.filter(
            status='available',
            is_reserved=False,
            lot__is_verified=True
        ).select_related('lot')
        
        # Calculate distance for each spot and sort by distance
        spots_with_distance = []
        for spot in available_spots:
            distance = spot.calculate_distance(user_lat, user_lon)
            if distance is not None:
                spots_with_distance.append((spot, distance))
        
        # Sort by distance and get top 10 closest spots
        spots_with_distance.sort(key=lambda x: x[1])
        recommended_spots = [spot for spot, distance in spots_with_distance[:10]]
        
        serializer = ParkingSpotRecommendationSerializer(
            recommended_spots, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'user_location': {'latitude': user_lat, 'longitude': user_lon},
            'recommended_spots': serializer.data
        })

class NearbyParkingLotsView(APIView):
    """
    Get nearby verified parking lots within a radius
    """
    def get(self, request):
        user_lat = request.GET.get('lat')
        user_lon = request.GET.get('lon')  # Fixed typo - was 'lat' instead of 'lon'
        radius_km = float(request.GET.get('radius', 5))  # Default 5km radius
        
        if not user_lat or not user_lon:
            return Response(
                {'error': 'User location coordinates (lat, lon) are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_lat = float(user_lat)
            user_lon = float(user_lon)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid coordinates'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store user location in request for serializers
        request.user_location = (user_lat, user_lon)
        
        # Get verified parking lots with coordinates
        verified_lots = ParkingLot.objects.filter(
            is_verified=True,
            latitude__isnull=False,
            longitude__isnull=False
        )
        
        # Filter lots within radius
        nearby_lots = []
        for lot in verified_lots:
            distance = geodesic(
                (user_lat, user_lon), 
                (float(lot.latitude), float(lot.longitude))
            ).kilometers
            
            if distance <= radius_km:
                nearby_lots.append(lot)
        
        # Sort by available spots count (descending) then by distance
        nearby_lots.sort(key=lambda x: (
            -x.spots.filter(status='available', is_reserved=False).count(),
            geodesic((user_lat, user_lon), (float(x.latitude), float(x.longitude))).kilometers
        ))
        
        serializer = ParkingLotSerializer(
            nearby_lots, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'user_location': {'latitude': user_lat, 'longitude': user_lon},
            'search_radius_km': radius_km,
            'nearby_parking_lots': serializer.data
        })

    
# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpRequest
from typing import Dict, Any

# Add this temporary test view to debug
# Add this to your views.py
class ServiceProviderProfileView(APIView):
    def get(self, request):
        """
        Get ServiceProvider profile for the currently authenticated user
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Not authenticated'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            service_provider = ServiceProvider.objects.get(user=request.user)
            
            # Get parking lot statistics
            parking_lots = ParkingLot.objects.filter(provider=service_provider)
            total_spots = ParkingSpot.objects.filter(lot__in=parking_lots).count()
            available_spots = ParkingSpot.objects.filter(
                lot__in=parking_lots, 
                status='available', 
                is_reserved=False
            ).count()
            
            profile_data = {
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'email': request.user.email,
                'gender': request.user.gender,
                'profile_picture': request.build_absolute_uri(request.user.profile_picture.url) if request.user.profile_picture else None,
                'company_name': service_provider.company_name,
                'contact_person': service_provider.contact_person,
                'phone_number': service_provider.phone_number,
                'age': service_provider.age,
                'country': service_provider.country,
                'city': service_provider.city,
                'address': service_provider.address,
                'parking_lots_count': parking_lots.count(),
                'total_spots_count': total_spots,
                'available_spots_count': available_spots,
            }
            
            return Response(profile_data)
            
        except ServiceProvider.DoesNotExist:
            return Response(
                {'error': 'User is not a service provider'}, 
                status=status.HTTP_403_FORBIDDEN
            )

# Add to your views.py
class ParkingLotVerificationView(APIView):
    """
    Verify parking lot by adding coordinates
    """
    def patch(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            parking_lot = ParkingLot.objects.get(id=pk, provider__user=request.user)
            
            # Extract verification data
            latitude = request.data.get('latitude')
            longitude = request.data.get('longitude')
            is_verified = request.data.get('is_verified', False)
            
            # Validate coordinates
            if latitude is not None and longitude is not None:
                try:
                    latitude = float(latitude)
                    longitude = float(longitude)
                    
                    if not (-90 <= latitude <= 90):
                        return Response(
                            {'error': 'Latitude must be between -90 and 90'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    if not (-180 <= longitude <= 180):
                        return Response(
                            {'error': 'Longitude must be between -180 and 180'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    parking_lot.latitude = latitude
                    parking_lot.longitude = longitude
                    
                except (TypeError, ValueError):
                    return Response(
                        {'error': 'Invalid coordinate format'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            parking_lot.is_verified = is_verified
            parking_lot.save()
            
            serializer = ParkingLotSerializer(parking_lot, context={'request': request})
            return Response(serializer.data)
            
        except ParkingLot.DoesNotExist:
            return Response(
                {'error': 'Parking lot not found or access denied'}, 
                status=status.HTTP_404_NOT_FOUND
            )


# ============= NEW VIEWS FOR RESERVATION, NOTIFICATION, AND YOLO =============

class ReservationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing parking reservations
    """
    serializer_class = ReservationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Reservation.objects.none()
        
        # Drivers see their own reservations
        if hasattr(user, 'driver'):
            return Reservation.objects.filter(driver=user.driver)
        
        # Service providers see reservations for their parking lots
        if hasattr(user, 'serviceprovider'):
            lot_ids = ParkingLot.objects.filter(
                provider=user.serviceprovider
            ).values_list('id', flat=True)
            return Reservation.objects.filter(spot__lot_id__in=lot_ids)
        
        # Admins see all
        if user.is_superuser:
            return Reservation.objects.all()
        
        return Reservation.objects.none()
    
    def create(self, request):
        """Create a new reservation"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not hasattr(request.user, 'driver'):
            return Response(
                {'error': 'Only drivers can make reservations'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        spot_id = request.data.get('spot')
        expected_duration = request.data.get('expected_duration_hours', 1.0)
        
        try:
            spot = ParkingSpot.objects.get(id=spot_id)
            
            # Check if spot is available
            if spot.status != 'available' or spot.is_reserved:
                return Response(
                    {'error': 'Parking spot is not available'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get driver's car
            driver = request.user.driver
            car = Car.objects.filter(driver=driver).first()
            
            if not car:
                return Response(
                    {'error': 'Driver must have a registered car'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create reservation
            reservation = Reservation.objects.create(
                spot=spot,
                driver=driver,
                car=car,
                price_per_hour=spot.price_per_hour,
                expected_duration_hours=expected_duration,
                status='pending'
            )
            
            # Update spot status
            spot.status = 'reserved'
            spot.is_reserved = True
            spot.save()
            
            # Create notification for service provider
            Notification.objects.create(
                recipient=spot.lot.provider.user,
                notification_type='reservation',
                title='New Parking Reservation',
                message=f'{driver.user.username} reserved spot {spot.spot_number} at {spot.lot.name}',
                reservation=reservation,
                parking_lot=spot.lot,
                parking_spot=spot
            )
            
            serializer = self.get_serializer(reservation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ParkingSpot.DoesNotExist:
            return Response(
                {'error': 'Parking spot not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a reservation when driver arrives"""
        reservation = self.get_object()
        
        if reservation.status != 'pending':
            return Response(
                {'error': 'Only pending reservations can be activated'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.activate()
        
        # Notify service provider
        Notification.objects.create(
            recipient=reservation.spot.lot.provider.user,
            notification_type='arrival',
            title='Driver Arrived',
            message=f'{reservation.driver.user.username} has arrived at spot {reservation.spot.spot_number}',
            reservation=reservation,
            parking_lot=reservation.spot.lot,
            parking_spot=reservation.spot
        )
        
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete a reservation when driver leaves"""
        reservation = self.get_object()
        
        if reservation.status != 'active':
            return Response(
                {'error': 'Only active reservations can be completed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.complete()
        
        # Notify service provider
        Notification.objects.create(
            recipient=reservation.spot.lot.provider.user,
            notification_type='departure',
            title='Driver Departed',
            message=f'{reservation.driver.user.username} has left spot {reservation.spot.spot_number}. Total: ${reservation.total_cost}',
            reservation=reservation,
            parking_lot=reservation.spot.lot,
            parking_spot=reservation.spot
        )
        
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a reservation"""
        reservation = self.get_object()
        
        if reservation.status in ['completed', 'cancelled']:
            return Response(
                {'error': 'Reservation cannot be cancelled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'cancelled'
        reservation.spot.status = 'available'
        reservation.spot.is_reserved = False
        reservation.spot.save()
        reservation.save()
        
        # Notify service provider
        Notification.objects.create(
            recipient=reservation.spot.lot.provider.user,
            notification_type='cancellation',
            title='Reservation Cancelled',
            message=f'{reservation.driver.user.username} cancelled reservation for spot {reservation.spot.spot_number}',
            reservation=reservation,
            parking_lot=reservation.spot.lot,
            parking_spot=reservation.spot
        )
        
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notifications
    """
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Notification.objects.none()
        
        return Notification.objects.filter(recipient=user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        notifications = self.get_queryset().filter(is_read=False)
        for notification in notifications:
            notification.mark_as_read()
        return Response({'message': f'{notifications.count()} notifications marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})


class YOLODetectionView(APIView):
    """
    API endpoint for YOLO-based parking spot detection
    """
    
    def post(self, request):
        """
        Detect if a parking spot is occupied using YOLO
        Expects: {
            "spot_id": int,
            "image": base64_encoded_image
        }
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        spot_id = request.data.get('spot_id')
        image_data = request.data.get('image')
        
        if not spot_id or not image_data:
            return Response(
                {'error': 'spot_id and image are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            spot = ParkingSpot.objects.get(id=spot_id)
            
            # Import and use YOLO service
            try:
                from .yolo_service import get_detector
                detector = get_detector()
            except ImportError as ie:
                logger.error(f"Failed to import YOLO service: {str(ie)}")
                return Response(
                    {
                        'error': 'YOLO detection service not available',
                        'details': 'Missing required dependencies (opencv-python, pillow). Please install them.',
                        'fallback': 'Using manual status update instead'
                    }, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Perform detection
            result = detector.detect_from_base64(image_data)
            
            # Check if detection had errors
            if 'error' in result:
                logger.error(f"Detection error: {result['error']}")
                return Response(
                    {
                        'error': 'Detection processing failed',
                        'details': result.get('error', 'Unknown error'),
                        'note': result.get('note', '')
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Save detection result
            detection = SpotDetection.objects.create(
                spot=spot,
                is_occupied=result.get('is_occupied', False),
                confidence=result.get('confidence', 0.0)
            )
            
            # Update spot status based on detection
            old_status = spot.status
            confidence_threshold = 0.6  # Lowered threshold slightly
            
            is_occupied = result.get('is_occupied', False)
            confidence = result.get('confidence', 0.0)
            
            if is_occupied and confidence > confidence_threshold:
                if spot.status == 'available':
                    spot.status = 'occupied'
                    spot.save()
            elif not is_occupied and confidence > confidence_threshold:
                if spot.status == 'occupied':
                    spot.status = 'available'
                    spot.save()
            
            serializer = SpotDetectionSerializer(detection)
            return Response({
                'success': True,
                'detection': serializer.data,
                'previous_status': old_status,
                'updated_spot_status': spot.status,
                'method': result.get('method', 'yolo'),
                'note': result.get('note', ''),
                'processed_image': result.get('processed_image', None)
            })
            
        except ParkingSpot.DoesNotExist:
            return Response(
                {'error': 'Parking spot not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in YOLO detection: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return Response(
                {
                    'error': 'Detection failed',
                    'details': str(e),
                    'type': type(e).__name__
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ServiceProviderHistoryView(APIView):
    """
    Get parking history and analytics for service providers
    """
    
    def get(self, request):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not hasattr(request.user, 'serviceprovider'):
            return Response(
                {'error': 'Only service providers can access this'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        provider = request.user.serviceprovider
        
        # Get provider's parking lots
        lots = ParkingLot.objects.filter(provider=provider)
        lot_ids = lots.values_list('id', flat=True)
        
        # Get reservations
        reservations = Reservation.objects.filter(
            spot__lot_id__in=lot_ids
        ).select_related('spot', 'driver__user', 'car')
        
        # Calculate statistics
        total_reservations = reservations.count()
        active_reservations = reservations.filter(status='active').count()
        completed_reservations = reservations.filter(status='completed').count()
        total_revenue = sum(
            r.total_cost for r in reservations.filter(status='completed', total_cost__isnull=False)
        )
        
        # Get recent history
        recent_reservations = ReservationSerializer(
            reservations.order_by('-created_at')[:20], 
            many=True,
            context={'request': request}
        ).data
        
        return Response({
            'statistics': {
                'total_parking_lots': lots.count(),
                'total_reservations': total_reservations,
                'active_reservations': active_reservations,
                'completed_reservations': completed_reservations,
                'total_revenue': float(total_revenue) if total_revenue else 0.0
            },
            'recent_reservations': recent_reservations
        })


class PredictAvailabilityView(APIView):
    """
    Predict when a parking spot will become available
    """
    def get(self, request):
        spot_id = request.GET.get('spot_id')
        if not spot_id:
            return Response({'error': 'spot_id required'}, status=400)
        
        try:
            spot = ParkingSpot.objects.get(id=spot_id)
            
            if spot.status == 'available':
                return Response({
                    'status': 'available',
                    'message': 'Spot is currently available',
                    'minutes_until_available': 0
                })
                
            # Check active reservation
            reservation = Reservation.objects.filter(
                spot=spot, 
                status='active'
            ).first()
            
            if reservation:
                # Calculate expected end time
                start_time = reservation.start_time
                duration_hours = float(reservation.expected_duration_hours)
                elapsed_hours = (timezone.now() - start_time).total_seconds() / 3600
                
                remaining_hours = max(0, duration_hours - elapsed_hours)
                minutes = int(remaining_hours * 60)
                
                return Response({
                    'status': 'occupied',
                    'message': f'Spot expected to be available in {minutes} minutes',
                    'minutes_until_available': minutes,
                    'confidence': 0.85  # Mock confidence
                })
            
            # If occupied but no reservation (e.g. drive-in), assume 2 hours average
            return Response({
                'status': 'occupied',
                'message': 'Spot expected to be available in approx. 60 minutes',
                'minutes_until_available': 60,
                'confidence': 0.60
            })
            
        except ParkingSpot.DoesNotExist:
            return Response({'error': 'Spot not found'}, status=404)