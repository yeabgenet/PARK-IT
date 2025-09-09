# core/views.py - CLEANED UP
from django.shortcuts import render
from django.middleware.csrf import get_token
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login
from .models import ParkingLot, ParkingSpot, Car, Driver, ServiceProvider, User, Role
from .serializers import ParkingLotSerializer,  CarSerializer, DriverSerializer, ServiceProviderSerializer
import logging
from rest_framework.decorators import action, api_view # <-- ADDED api_view here, alongside action

logger = logging.getLogger(__name__)

# core/views.py
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import ParkingLot

def parkinglot_image(request, pk):
    lot = get_object_or_404(ParkingLot, pk=pk)
    if lot.image_data:
        return HttpResponse(lot.image_data, content_type=lot.image_mime_type)
    return HttpResponse(status=404)



def index(request):
    return render(request, 'index.html')

@api_view(['GET'])
def get_csrf_token(request):
    """
    Function-based view to get CSRF token.
    Your frontend uses CsrfTokenView (class-based) at /api/csrf/,
    so this get_csrf_token might be redundant or for a different purpose.
    """
    return Response({'csrfToken': get_token(request)})

class UserView(APIView):
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            # Determine user role - check both role field and superuser status
            user_role = None
            if request.user.role:
                user_role = request.user.role.role_name.lower()
            elif request.user.is_superuser:
                user_role = 'admin'
            return Response({
                'user': {
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
        # Correctly using 'profile_image'
        image_urls = [request.build_absolute_uri(lot.profile_image.url) for lot in queryset if lot.profile_image]
        return Response(image_urls)


    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
'''
class ParkingSpotViewSet(viewsets.ModelViewSet):
    queryset = ParkingSpot.objects.all()
    serializer_class = ParkingSpotSerializer
'''
class DriverRegistrationView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = DriverSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Driver registered successfully!"}, status=status.HTTP_201_CREATED)
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class ServiceProviderRegistrationView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ServiceProviderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Service Provider registered successfully!"}, status=status.HTTP_201_CREATED)
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

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
            # Determine user role
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
            user.is_active = True
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

            login(request, user)
            logger.info(f"Driver {username} created and logged in successfully")
            return Response({
                'message': 'User created successfully',
                'user': {
                    'username': user.username,
                    'role': role.role_name.lower()
                }
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
            logger.debug(f"Missing required fields: username={username}, email={email}, phone_number={phone_number}, age={age}, country={country}, city={city}, address={address}, company_name={company_name}, contact_person={contact_person}")
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

        if ServiceProvider.objects.filter(phone_number=phone_number).exists():
            logger.debug(f"Phone number already exists: {phone_number}")
            return Response({
                'message': 'Phone number already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            role, _ = Role.objects.get_or_create(role_name='Service Provider')
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
            user.is_active = True
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

            login(request, user)
            logger.info(f"Service Provider {username} created and logged in successfully")
            return Response({
                'message': 'User created successfully',
                'user': {
                    'username': user.username,
                    'role': role.role_name.lower()
                }
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
        return Response({'csrfToken': token})