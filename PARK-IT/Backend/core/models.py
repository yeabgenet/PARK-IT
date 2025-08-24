# core/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser


class Role(models.Model):
    """
    Represents the different roles a user can have in the system.
    """
    role_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.role_name


class User(AbstractUser):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
    )

    role = models.ForeignKey(Role, on_delete=models.CASCADE, null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)  # Added

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="core_user_set",
        related_query_name="core_user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="core_user_permissions_set",
        related_query_name="core_user_permission",
    )

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip() or self.username

class Driver(models.Model):
    """
    Represents a driver and their associated user account.
    New fields for a driver's specific address have been added.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    license_number = models.CharField(max_length=50, unique=True) 
    phone_number = models.CharField(max_length=20, unique=True)
    age = models.PositiveIntegerField(null=True, blank=True)

    # New fields for driver address
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
   

    def __str__(self):
        return f"Driver: {self.user.name}"


class Car(models.Model):
    """
    Represents a car owned by a driver.
    """
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE)
    license_plate = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.license_plate


class ServiceProvider(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    company_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, unique=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    terminal_picture = models.ImageField(upload_to='terminal_pics/', null=True, blank=True)  # Added

    def __str__(self):
        return f"Provider: {self.company_name}"


class ParkingLot(models.Model):
    """
    Represents a physical parking lot with its location and capacity.
    This model now has its own distinct address fields.
    """
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    
    # New fields for the parking lot's specific address
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
   
    
    total_capacity = models.IntegerField()
    profile_image_url = models.URLField(max_length=500, null=True, blank=True)

    def __str__(self):
        return self.name


class ParkingSpot(models.Model):
    """
    Represents an individual parking spot within a parking lot.
    """
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('reserved', 'Reserved'),
    ]

    lot = models.ForeignKey(ParkingLot, on_delete=models.CASCADE, related_name='spots')
    spot_number = models.CharField(max_length=50)
    is_reserved = models.BooleanField(default=False)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES ,default='available')
    image_url = models.URLField(max_length=500, null=True, blank=True)

    def __str__(self):
        return f"{self.lot.name} - Spot {self.spot_number}"


class ParkingSession(models.Model):
    """
    Represents a single parking session for a car at a specific spot.
    """
    spot = models.ForeignKey(ParkingSpot, on_delete=models.CASCADE)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    cost = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"Session {self.id} at {self.spot.lot.name}"


class AIModel(models.Model):
    """
    Represents an AI model used for parking management.
    """
    model_name = models.CharField(max_length=255)
    version = models.CharField(max_length=50)
    training_date = models.DateTimeField(auto_now_add=True)
    performance_metrics = models.JSONField(null=True, blank=True)
    lot = models.ForeignKey(ParkingLot, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.model_name} v{self.version}"




