# Quick Start Guide

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd Backend
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd Frontend
npm install
```

### 3. Setup Database
```bash
cd Backend
python manage.py makemigrations
python manage.py migrate
```

### 4. Start Redis (in separate terminal)
```bash
redis-server
```

### 5. Run Backend Server
```bash
cd Backend
python manage.py runserver
```

### 6. Run Frontend Server (in new terminal)
```bash
cd Frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

## What's Been Implemented

### ✅ Backend Features

1. **YOLO AI Integration** (`core/yolo_service.py`)
   - Car detection API endpoint: `/api/detect-parking/`
   - Supports base64 image upload from camera
   - Fallback detection if YOLO model not available
   - Updates spot status automatically based on detection

2. **Reservation System** (`models.Reservation`)
   - Create reservations: `POST /api/reservations/`
   - Activate when arrived: `POST /api/reservations/{id}/activate/`
   - Complete when leaving: `POST /api/reservations/{id}/complete/`
   - Cancel reservation: `POST /api/reservations/{id}/cancel/`
   - Real-time timer and cost calculation
   - Automatic price calculation based on duration

3. **Notification System** (`models.Notification`)
   - Get notifications: `GET /api/notifications/`
   - Mark as read: `POST /api/notifications/{id}/mark_read/`
   - Mark all read: `POST /api/notifications/mark_all_read/`
   - Unread count: `GET /api/notifications/unread_count/`
   - Automatic notifications for:
     - New reservations
     - Driver arrivals
     - Driver departures
     - Cancellations

4. **Location Verification** (`ParkingLot.latitude/longitude`)
   - Haversine formula for accurate distance calculation
   - GPS coordinate validation
   - Bounding box optimization for performance
   - Verify endpoint: `PATCH /api/parking-lots/{id}/verify/`

5. **Service Provider History**
   - Analytics endpoint: `GET /api/provider/history/`
   - Revenue tracking
   - Reservation statistics
   - Recent activity feed

### ✅ Frontend Features

1. **Driver Pages**
   - **FindParking.tsx**: Find nearby parking with camera detection
     - Geolocation-based search
     - Distance sorting
     - Live camera feed for YOLO detection
     - One-click reservations
   
   - **MyReservations.tsx**: Manage reservations
     - Active parking sessions with live timer
     - Real-time cost calculation
     - Activate/Complete/Cancel actions
     - Past reservation history

2. **Service Provider Pages**
   - **Notifications.tsx**: Real-time notification center
     - All/Unread filters
     - Mark as read functionality
     - Notification types with color coding
     - Auto-refresh every 30 seconds
   
   - **History.tsx**: Analytics dashboard
     - Revenue statistics
     - Reservation counts
     - Active sessions tracking
     - Detailed reservation table
     - Beautiful stat cards

## Testing the Features

### Test Driver Workflow

1. **Register as Driver**
```bash
POST http://localhost:8000/api/register/driver/
{
  "username": "testdriver",
  "email": "driver@test.com",
  "password": "test123",
  "phone_number": "1234567890",
  "license_number": "DL123456",
  "license_plate": "ABC123",
  ...other fields
}
```

2. **Find Parking Spots**
```bash
GET http://localhost:8000/api/parking-spots/recommend/?lat=37.7749&lon=-122.4194
```

3. **Reserve a Spot**
```bash
POST http://localhost:8000/api/reservations/
{
  "spot": 1,
  "expected_duration_hours": 2.0
}
```

4. **Use Camera Detection**
```bash
POST http://localhost:8000/api/detect-parking/
{
  "spot_id": 1,
  "image": "data:image/jpeg;base64,..."
}
```

### Test Service Provider Workflow

1. **Register as Service Provider**
```bash
POST http://localhost:8000/api/register/service-provider/
{
  "username": "testprovider",
  "email": "provider@test.com",
  "password": "test123",
  "company_name": "Test Parking Co",
  "contact_person": "John Doe",
  ...other fields
}
```

2. **Create Parking Lot**
```bash
POST http://localhost:8000/api/parking-lots/
{
  "name": "Downtown Parking",
  "address": "123 Main St",
  "city": "San Francisco",
  "country": "USA",
  "total_capacity": 50
}
```

3. **Verify Location**
```bash
PATCH http://localhost:8000/api/parking-lots/1/verify/
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "is_verified": true
}
```

4. **View History**
```bash
GET http://localhost:8000/api/provider/history/
```

## Important Notes

### TypeScript Errors
The TypeScript lint errors you see are expected and will disappear after running:
```bash
cd Frontend
npm install
```

These errors occur because:
- Dependencies haven't been installed yet
- `lucide-react` and `date-fns` are new additions
- React type definitions need to be resolved

### YOLO Model Setup
The system works without YOLO model files (uses fallback detection). To enable full YOLO:

1. Download YOLO v3 weights and config
2. Place in: `Car_Parking_Space_Detection-main/Car_Parking_Space_Detection-main/Source Code/`
3. Files needed:
   - `yolov3.weights`
   - `yolov3.cfg`

### Database Migrations
If you modify models, always run:
```bash
python manage.py makemigrations
python manage.py migrate
```

New models added:
- `Reservation` - Parking reservations
- `Notification` - System notifications  
- `SpotDetection` - YOLO detection results

## File Structure

```
PARK-IT/
├── Backend/
│   ├── core/
│   │   ├── models.py          # Updated with new models
│   │   ├── serializers.py     # New serializers added
│   │   ├── views.py           # New ViewSets and APIs
│   │   ├── urls.py            # Updated URL patterns
│   │   └── yolo_service.py    # NEW: YOLO detection service
│   ├── Parkit_Project/
│   │   └── settings.py        # Updated with channels
│   └── requirements.txt       # Updated dependencies
│
└── Frontend/
    ├── src/Components/
    │   ├── Pages/
    │   │   ├── FindParking.tsx      # NEW: Driver parking search
    │   │   └── MyReservations.tsx   # NEW: Driver reservations
    │   └── SpPages/
    │       ├── Notifications.tsx    # NEW: Provider notifications
    │       └── History.tsx          # NEW: Provider history
    └── package.json           # Updated dependencies
```

## Next Steps

1. **Run migrations**: `python manage.py migrate`
2. **Install npm packages**: `npm install` in Frontend directory
3. **Start both servers** (Backend + Frontend)
4. **Create test accounts** (Driver and Service Provider)
5. **Test the workflow** end-to-end

## Support

If you encounter issues:
1. Check terminal output for errors
2. Verify all services are running (Django, Redis, Vite)
3. Ensure database is properly configured
4. Check browser console for frontend errors

Enjoy your smart parking system! 🚗🅿️
