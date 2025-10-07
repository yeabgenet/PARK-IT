from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import ParkingLot, ParkingSpot, Car, Driver, ServiceProvider, User, Role , SpotHistory, ParkingSpot


class ParkingSpotRecommendationSerializer(serializers.ModelSerializer):
    lot_name = serializers.CharField(source='lot.name', read_only=True)
    lot_address = serializers.CharField(source='lot.address', read_only=True)
    distance_km = serializers.SerializerMethodField()
    
    class Meta:
        model = ParkingSpot
        fields = [
            'id', 'spot_number', 'status', 'is_reserved',
            'lot_name', 'lot_address', 'distance_km',
            'get_latitude', 'get_longitude'
        ]
    
    def get_distance_km(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user_location'):
            user_lat, user_lon = request.user_location
            return obj.calculate_distance(user_lat, user_lon)
        return None

class ParkingLotSerializer(serializers.ModelSerializer):
    # Extra field for image upload from frontend
    terminal_picture = serializers.ImageField(write_only=True, required=False)

    # This is what frontend will use to GET the image
    profile_image_url = serializers.SerializerMethodField()
    
    # Recommendation fields (read-only)
    available_spots_count = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = ParkingLot
        fields = [
            'id',
            'name',
            'address',
            'total_capacity',
            'city',
            'country',
            'latitude',           # Add new geolocation fields
            'longitude',          # Add new geolocation fields
            'is_verified',        # Add verification field
            'profile_image_url',   # exposed read-only URL
            'terminal_picture',    # only for upload
            'available_spots_count',  # for recommendations
            'distance_km',           # for recommendations
        ]
        read_only_fields = ['latitude', 'longitude', 'is_verified']

    def get_profile_image_url(self, obj):
        request = self.context.get('request')
        if obj.image_data and request:
            return request.build_absolute_uri(f'/api/parking-lot-image/{obj.id}/')
        return None

    def get_available_spots_count(self, obj):
        """Count available spots in this parking lot"""
        return obj.spots.filter(status='available', is_reserved=False).count()

    def get_distance_km(self, obj):
        """Calculate distance from user location if provided in context"""
        request = self.context.get('request')
        if request and hasattr(request, 'user_location'):
            user_lat, user_lon = request.user_location
            if obj.latitude and obj.longitude:
                from geopy.distance import geodesic
                lot_location = (obj.latitude, obj.longitude)
                user_location = (user_lat, user_lon)
                return round(geodesic(user_location, lot_location).kilometers, 2)
        return None

    def create(self, validated_data):
        picture = validated_data.pop('terminal_picture', None)
        lot = ParkingLot(**validated_data)

        if picture:
            lot.image_data = picture.read()
            lot.image_mime_type = picture.content_type

        # Auto-geocode if address is provided
        if lot.address and not (lot.latitude and lot.longitude):
            # You might want to make this async in production
            lot.save()  # Save first to get ID
            lot.geocode_address()
        else:
            lot.save()
            
        return lot

    def update(self, instance, validated_data):
        picture = validated_data.pop('terminal_picture', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if picture:
            instance.image_data = picture.read()
            instance.image_mime_type = picture.content_type

        # Re-geocode if address changed
        if 'address' in validated_data or 'city' in validated_data or 'country' in validated_data:
            instance.geocode_address()

        instance.save()
        return instance

class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = ['car_id', 'license_plate', 'make', 'model']


class DriverSerializer(serializers.ModelSerializer):
    # Explicitly define User model fields
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    gender = serializers.ChoiceField(choices=User.GENDER_CHOICES, write_only=True)
    profile_picture = serializers.ImageField(write_only=True, required=False)
    plate_number = serializers.CharField(write_only=True)  # For Car model

    class Meta:
        model = Driver
        fields = [
            'username', 'password', 'email', 'first_name', 'last_name', 'gender',
            'license_number', 'plate_number', 'phone_number', 'age', 'country', 'city', 'address',
            'profile_picture'
        ]

    def create(self, validated_data):
        # Extract User fields
        user_fields = {
            'username': validated_data.pop('username'),
            'password': make_password(validated_data.pop('password')),
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'gender': validated_data.pop('gender'),
        }
        profile_picture = validated_data.pop('profile_picture', None)
        plate_number = validated_data.pop('plate_number')

        # Create or get Role
        role, _ = Role.objects.get_or_create(role_name="Driver")
        user_fields['role'] = role

        # Create User
        user = User.objects.create(**user_fields)
        if profile_picture:
            user.profile_picture = profile_picture
            user.save()

        # Create Driver
        driver = Driver.objects.create(user=user, **validated_data)

        # Create Car
        Car.objects.create(driver=driver, license_plate=plate_number)

        return driver


class ServiceProviderSerializer(serializers.ModelSerializer):
    # Explicitly define User model fields
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    gender = serializers.ChoiceField(choices=User.GENDER_CHOICES, write_only=True)
    profile_picture = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = ServiceProvider
        fields = [
            'username', 'password', 'email', 'first_name', 'last_name', 'gender',
            'company_name', 'contact_person', 'phone_number', 'age', 'country', 'city', 'address',
            'profile_picture'
        ]

    def create(self, validated_data):
        # Extract User fields
        user_fields = {
            'username': validated_data.pop('username'),
            'password': make_password(validated_data.pop('password')),
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'gender': validated_data.pop('gender'),
        }
        profile_picture = validated_data.pop('profile_picture', None)

        # Create or get Role
        role, _ = Role.objects.get_or_create(role_name="Service Provider")
        user_fields['role'] = role

        # Create User
        user = User.objects.create(**user_fields)
        if profile_picture:
            user.profile_picture = profile_picture
            user.save()

        # Create ServiceProvider
        provider = ServiceProvider.objects.create(user=user, **validated_data)

        return provider


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name', 'gender', 'role']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


# serializers.py - UPDATE ParkingSpotSerializer
# serializers.py - Check your ParkingSpotSerializer
class ParkingSpotSerializer(serializers.ModelSerializer):
    spot_picture = serializers.ImageField(write_only=True, required=False)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ParkingSpot
        fields = ['id', 'lot', 'spot_number', 'is_reserved', 'status', 'image_url', 'spot_picture']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image_data and request:
            return request.build_absolute_uri(f'/api/parking-spot-image/{obj.id}/')
        return None

    def create(self, validated_data):
        picture = validated_data.pop('spot_picture', None)
        spot = ParkingSpot(**validated_data)

        if picture:
            spot.image_data = picture.read()
            spot.image_mime_type = picture.content_type

        spot.save()
        return spot

class SpotHistorySerializer(serializers.ModelSerializer):
    # Optional: Include related fields for better readability in API responses
    spot_number = serializers.CharField(source='spot.spot_number', read_only=True)
    lot_name = serializers.CharField(source='spot.lot.name', read_only=True)
    driver_name = serializers.SerializerMethodField()

    class Meta:
        model = SpotHistory
        fields = ['id', 'spot', 'spot_number', 'lot_name', 'status', 'driver', 'driver_name', 'start_time', 'end_time']

    def get_driver_name(self, obj):
        if obj.driver and obj.driver.user:
            return f"{obj.driver.user.first_name} {obj.driver.user.last_name}".strip() or obj.driver.user.username
        return None