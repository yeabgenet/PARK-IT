# core/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.urls import reverse
from django.utils import timezone


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
    verification_code = models.CharField(max_length=6, null=True, blank=True)
    verification_code_created_at = models.DateTimeField(null=True, blank=True)

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
     # Added

    def __str__(self):
        return f"Provider: {self.company_name}"


# models.py
# models.py - CHANGE THIS
# core/models.py
class ParkingLot(models.Model):
    provider = models.ForeignKey('ServiceProvider', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    total_capacity = models.IntegerField()
    
    # Geolocation fields (simplified but production-ready)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Verification and status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Image fields
    image_data = models.BinaryField(null=True, blank=True)
    image_mime_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['is_verified', 'is_active']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def calculate_distance(self, user_lat, user_lon):
        """Haversine formula for accurate distance calculation"""
        if not all([self.latitude, self.longitude, user_lat, user_lon]):
            return None
            
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [
            float(self.latitude), 
            float(self.longitude), 
            float(user_lat), 
            float(user_lon)
        ])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371  # Radius of earth in kilometers
        
        return round(c * r, 2)

    @classmethod
    def find_nearby_lots(cls, user_lat, user_lon, radius_km=10, max_results=20):
        """Efficient nearby search using bounding box + Haversine"""
        # First filter by approximate bounding box for performance
        lat_range = 0.009 * radius_km  # ~1km per 0.009 degrees
        lon_range = 0.009 * radius_km * math.cos(math.radians(user_lat))
        
        lots = cls.objects.filter(
            is_verified=True,
            is_active=True,
            latitude__range=(user_lat - lat_range, user_lat + lat_range),
            longitude__range=(user_lon - lon_range, user_lon + lon_range)
        )
        
        # Calculate exact distances and filter
        lots_with_distance = []
        for lot in lots:
            distance = lot.calculate_distance(user_lat, user_lon)
            if distance and distance <= radius_km:
                lots_with_distance.append((lot, distance))
        
        # Sort by distance and return
        lots_with_distance.sort(key=lambda x: x[1])
        return [lot for lot, distance in lots_with_distance[:max_results]]
    @property
    def profile_image_url(self):
        """
        Returns the URL of an endpoint that serves this image from the database.
        """
        if self.image_data:
            # You will need to create a view named 'parkinglot_image' (see below)
            return reverse('parkinglot_image', kwargs={'pk': self.id})
        return None

# models.py - UPDATE ParkingSpot model
# models.py - UPDATE ParkingSpot model
class ParkingSpot(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Maintenance'),
    ]

    lot = models.ForeignKey(ParkingLot, on_delete=models.CASCADE, related_name='spots')
    spot_number = models.CharField(max_length=50)
    is_reserved = models.BooleanField(default=False)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='available')
    
    # Spot-specific location (optional)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Pricing (important for production)
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    
    # Image fields
    image_data = models.BinaryField(null=True, blank=True)
    image_mime_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    '''
    class Meta:
        unique_together = ['lot', 'spot_number']
        indexes = [
            models.Index(fields=['status', 'is_reserved']),
            models.Index(fields=['lot', 'status']),
        ]
        ordering = ['lot', 'spot_number']
'''
    def __str__(self):
        return f"{self.lot.name} - Spot {self.spot_number}"

    @property
    def effective_latitude(self):
        return self.latitude or self.lot.latitude

    @property
    def effective_longitude(self):
        return self.longitude or self.lot.longitude

    def calculate_distance(self, user_lat, user_lon):
        lat = self.effective_latitude
        lon = self.effective_longitude
        if not all([lat, lon, user_lat, user_lon]):
            return None
        return self.lot.calculate_distance(user_lat, user_lon)

    @classmethod
    def find_available_nearby_spots(cls, user_lat, user_lon, radius_km=5, max_results=50):
        """Find available spots with efficient spatial filtering"""
        # Use the lot's method for initial filtering
        nearby_lots = ParkingLot.find_nearby_lots(user_lat, user_lon, radius_km, max_results * 2)
        lot_ids = [lot.id for lot in nearby_lots]
        
        # Get available spots from those lots
        spots = cls.objects.filter(
            lot_id__in=lot_ids,
            status='available',
            is_reserved=False
        ).select_related('lot')[:max_results]
        
        return spots

    @property
    def image_url(self):
        """
        Returns the URL of an endpoint that serves this image from the database.
        """
        if self.image_data:
            return reverse('parkingspot_image', kwargs={'pk': self.id})
        return None

    def create_history_record(self, action, driver=None, previous_status=None, new_status=None, notes="", user=None):
        """
        Helper method to create history records
        """
        return ParkingSpotHistory.objects.create(
            spot=self,
            driver=driver,
            action=action,
            previous_status=previous_status or self.status,
            new_status=new_status or self.status,
            notes=notes,
            created_by=user
        )

        
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


class SpotHistory(models.Model):
    spot = models.ForeignKey(ParkingSpot, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=50, choices=ParkingSpot.STATUS_CHOICES)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='parking_history')
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        driver_info = f" by {self.driver}" if self.driver else ""
        return f"{self.spot} - {self.status}{driver_info} from {self.start_time} to {self.end_time}"



# models.py - ADD THIS MODEL IF NOT EXISTS
class ParkingSpotHistory(models.Model):
    """
    Tracks all changes to parking spots including reservations and occupancy
    """
    ACTION_CHOICES = [
        ('reserved', 'Reserved'),
        ('occupied', 'Occupied'), 
        ('released', 'Released'),
        ('status_change', 'Status Change'),
    ]
    
    spot = models.ForeignKey(ParkingSpot, on_delete=models.CASCADE, related_name='spot_history')
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    previous_status = models.CharField(max_length=50, choices=ParkingSpot.STATUS_CHOICES, null=True, blank=True)
    new_status = models.CharField(max_length=50, choices=ParkingSpot.STATUS_CHOICES)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Parking Spot Histories"
    
    def __str__(self):
        driver_info = f" by {self.driver}" if self.driver else ""
        return f"{self.spot.spot_number} - {self.action}{driver_info} at {self.created_at}"


class Reservation(models.Model):
    """
    Represents a parking spot reservation by a driver
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    spot = models.ForeignKey(ParkingSpot, on_delete=models.CASCADE, related_name='reservations')
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='reservations')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='reservations')
    
    # Timing
    reservation_time = models.DateTimeField(auto_now_add=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    expected_duration_hours = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)
    
    # Pricing
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2)
    total_cost = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False)
    
    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['driver', 'status']),
            models.Index(fields=['spot', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Reservation {self.id} - {self.driver.user.username} at {self.spot}"
    
    def calculate_cost(self):
        """Calculate cost based on actual time spent"""
        if self.start_time and self.end_time:
            duration = (self.end_time - self.start_time).total_seconds() / 3600  # hours
            self.total_cost = round(duration * float(self.price_per_hour), 2)
            self.save()
            return self.total_cost
        return None
    
    def activate(self):
        """Activate the reservation when driver arrives"""
        self.status = 'active'
        self.start_time = timezone.now()
        self.spot.status = 'occupied'
        self.spot.is_reserved = False
        self.spot.save()
        self.save()
    
    def complete(self):
        """Complete the reservation and calculate final cost"""
        self.status = 'completed'
        self.end_time = timezone.now()
        self.spot.status = 'available'
        self.spot.save()
        self.calculate_cost()
        self.save()


class Notification(models.Model):
    """
    Notifications for service providers about parking events
    """
    NOTIFICATION_TYPES = [
        ('reservation', 'New Reservation'),
        ('arrival', 'Driver Arrived'),
        ('departure', 'Driver Departed'),
        ('cancellation', 'Reservation Cancelled'),
        ('payment', 'Payment Received'),
        ('system', 'System Notification'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Related objects
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, null=True, blank=True)
    parking_lot = models.ForeignKey(ParkingLot, on_delete=models.CASCADE, null=True, blank=True)
    parking_spot = models.ForeignKey(ParkingSpot, on_delete=models.CASCADE, null=True, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class SpotDetection(models.Model):
    """
    AI Detection results for parking spots using YOLO
    """
    spot = models.ForeignKey(ParkingSpot, on_delete=models.CASCADE, related_name='detections')
    
    # Detection data
    is_occupied = models.BooleanField(default=False)
    confidence = models.FloatField()  # Detection confidence (0-1)
    detection_image = models.BinaryField(null=True, blank=True)
    image_mime_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Metadata
    detected_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['spot', 'detected_at']),
        ]
    
    def __str__(self):
        status = "Occupied" if self.is_occupied else "Empty"
        return f"{self.spot} - {status} ({self.confidence:.2%})"