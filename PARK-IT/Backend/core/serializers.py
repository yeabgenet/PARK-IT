# core/serializers.py
from rest_framework import serializers
from .models import ParkingLot, ParkingSpot, Car, Driver, ServiceProvider, User, Role
from django.contrib.auth.hashers import make_password

class ParkingSpotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingSpot
        fields = ['spot_id', 'lot_id', 'spot_number', 'image_url', 'status']

class ParkingLotSerializer(serializers.ModelSerializer):
    spots = ParkingSpotSerializer(many=True, read_only=True)
    class Meta:
        model = ParkingLot
        fields = ['lot_id', 'name', 'profile_image_url', 'spots']

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
    terminal_picture = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = ServiceProvider
        fields = [
            'username', 'password', 'email', 'first_name', 'last_name', 'gender',
            'company_name', 'contact_person', 'phone_number', 'age', 'country', 'city', 'address',
            'terminal_picture', 'profile_picture'
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
        terminal_picture = validated_data.pop('terminal_picture', None)

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
        if terminal_picture:
            provider.terminal_picture = terminal_picture
            provider.save()

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