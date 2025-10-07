# management/commands/geocode_parking_lots.py
from django.core.management.base import BaseCommand
from core.models import ParkingLot

class Command(BaseCommand):
    help = 'Geocode all parking lots without coordinates'

    def handle(self, *args, **options):
        lots = ParkingLot.objects.filter(latitude__isnull=True) | ParkingLot.objects.filter(longitude__isnull=True)
        
        self.stdout.write(f"Geocoding {lots.count()} parking lots...")
        
        success_count = 0
        for lot in lots:
            if lot.geocode_address():
                success_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Geocoded {lot.name}: {lot.latitude}, {lot.longitude}")
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f"Failed to geocode {lot.name}")
                )
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully geocoded {success_count} parking lots")
        )