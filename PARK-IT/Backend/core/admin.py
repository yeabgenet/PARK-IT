# core/admin.py
from django.utils.html import format_html
from .models import ParkingLot
from django.contrib import admin

class ParkingLotAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'address', 'total_capacity', 'city', 'country', 'provider', 'display_image']

    def display_image(self, obj):
        if obj.image_data and obj.image_mime_type:
            return format_html('<img src="data:{};base64,{}" width="50" />',
                               obj.image_mime_type,
                               obj.image_data.encode('base64').decode())
        return "(No image)"
    display_image.short_description = 'Image'

admin.site.register(ParkingLot, ParkingLotAdmin)
