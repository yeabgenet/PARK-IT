# PARK-IT - Smart Parking Management System

A comprehensive smart parking system with YOLO AI-based spot detection, real-time reservations, dynamic pricing, and notifications.

## Features

### For Drivers
- **Find Parking Spots**: Real-time search for available parking spots based on your location
- **YOLO AI Detection**: Use your camera to detect if a parking spot is occupied using advanced AI
- **Make Reservations**: Reserve parking spots in advance
- **Live Timer & Pricing**: Real-time cost calculation based on actual parking duration
- **Reservation Management**: Track active and past reservations with detailed history

### For Service Providers
- **Parking Lot Management**: Create and manage parking lots and spots
- **Location Verification**: Accurate GPS-based location verification for recommendations
- **Real-time Notifications**: Get notified when drivers reserve, arrive, or depart
- **Revenue Analytics**: Track earnings and reservation statistics
- **History Dashboard**: View comprehensive parking history and analytics

### Technical Features
- YOLO v3-based car detection model
- Geolocation-based recommendations using Haversine formula
- Real-time WebSocket notifications (Django Channels)
- RESTful API backend (Django REST Framework)
- Modern React + TypeScript frontend
- PostgreSQL database for production-ready storage
- Redis caching for performance

## Tech Stack

### Backend
- **Framework**: Django 4.2.24
- **API**: Django REST Framework 3.16.1
- **Database**: PostgreSQL
- **Cache**: Redis
- **AI/ML**: OpenCV 4.10, YOLO v3
- **Real-time**: Django Channels 4.1.0
- **Geolocation**: GeoPy 2.4.1

### Frontend
- **Framework**: React 19.1
- **Language**: TypeScript 5.8
- **Build Tool**: Vite 7.0
- **Styling**: TailwindCSS 3.4
- **Icons**: Lucide React 0.263
- **HTTP Client**: Axios 1.12
- **Date Utilities**: date-fns 2.30

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Backend Setup

1. **Navigate to Backend directory**
```bash
cd Backend
```

2. **Create and activate virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure Database**

Create a PostgreSQL database:
```sql
CREATE DATABASE parkit;
CREATE USER ghost WITH PASSWORD 'yg1994#codetillyoudie';
GRANT ALL PRIVILEGES ON DATABASE parkit TO ghost;
```

Or update `Backend/Parkit_Project/settings.py` with your credentials:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_db_name',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

5. **Start Redis Server**
```bash
redis-server
```

6. **Run Migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

7. **Create Superuser (Optional)**
```bash
python manage.py createsuperuser
```

8. **Run Development Server**
```bash
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to Frontend directory**
```bash
cd Frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Run Development Server**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## YOLO Model Setup

The system uses YOLO v3 for parking spot detection. 

### Option 1: Use Existing Model
Place your trained YOLO model files in:
```
Car_Parking_Space_Detection-main/Car_Parking_Space_Detection-main/Source Code/
├── yolov3.weights
└── yolov3.cfg
```

### Option 2: Download Pre-trained Model
Download YOLOv3 weights from official sources:
```bash
cd Car_Parking_Space_Detection-main/Car_Parking_Space_Detection-main/Source\ Code/
wget https://pjreddie.com/media/files/yolov3.weights
wget https://github.com/pjreddie/darknet/blob/master/cfg/yolov3.cfg
```

Note: The system includes a fallback detection method if YOLO files are not available.

## API Endpoints

### Authentication
- `POST /api/register/driver/` - Register as driver
- `POST /api/register/service-provider/` - Register as service provider
- `POST /api/login/` - Login
- `GET /api/user/` - Get current user info

### Parking Lots & Spots
- `GET /api/parking-lots/` - List parking lots
- `POST /api/parking-lots/` - Create parking lot
- `GET /api/parking-spots/recommend/?lat={lat}&lon={lon}` - Get recommended spots
- `POST /api/detect-parking/` - Run YOLO detection on spot

### Reservations
- `GET /api/reservations/` - List user's reservations
- `POST /api/reservations/` - Create reservation
- `POST /api/reservations/{id}/activate/` - Activate reservation (driver arrived)
- `POST /api/reservations/{id}/complete/` - Complete reservation (driver leaving)
- `POST /api/reservations/{id}/cancel/` - Cancel reservation

### Notifications
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/{id}/mark_read/` - Mark as read
- `POST /api/notifications/mark_all_read/` - Mark all as read
- `GET /api/notifications/unread_count/` - Get unread count

### Service Provider
- `GET /api/provider/history/` - Get analytics and history
- `PATCH /api/parking-lots/{id}/verify/` - Verify parking lot location

## Usage

### As a Driver

1. **Register/Login**
   - Create a driver account with your license details
   - Add your vehicle information

2. **Find Parking**
   - Navigate to "Find Parking"
   - System automatically detects your location
   - View nearby available parking spots sorted by distance

3. **Use Camera Detection**
   - Click "View Live" on any spot
   - Allow camera access
   - Capture and detect if spot is actually available using AI

4. **Reserve a Spot**
   - Click "Reserve" on your preferred spot
   - Spot status changes to "Reserved"
   - Service provider receives notification

5. **Activate Parking**
   - When you arrive, go to "My Reservations"
   - Click "I've Arrived" to start the timer
   - Cost calculation begins automatically

6. **End Parking**
   - Click "End Parking" when leaving
   - View final cost and duration
   - Service provider gets notification

### As a Service Provider

1. **Register/Login**
   - Create service provider account with company details

2. **Add Parking Lot**
   - Create parking lot with name, address, capacity
   - System prompts for GPS coordinates

3. **Verify Location**
   - Use GPS or enter exact coordinates
   - System validates location for accurate recommendations

4. **Add Parking Spots**
   - Create individual spots within your lot
   - Set price per hour for each spot
   - Upload spot images (optional)

5. **Monitor Reservations**
   - View "History" dashboard for analytics
   - Track active reservations in real-time
   - Monitor total revenue

6. **Receive Notifications**
   - Get notified on new reservations
   - Track when drivers arrive and depart
   - Monitor cancellations

## Configuration

### Backend Settings

#### Location Verification
Adjust accuracy requirements in `settings.py`:
```python
RECOMMENDATION_CACHE_TIMEOUT = 300  # Cache duration in seconds
```

#### Redis Configuration
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### Frontend Configuration

#### API Base URL
Update in component files if backend runs on different port:
```typescript
const API_BASE = 'http://localhost:8000';
```

## Troubleshooting

### YOLO Detection Issues
**Problem**: Detection not working  
**Solution**: 
- Ensure YOLO model files are in correct directory
- System will use fallback detection method automatically
- Check browser camera permissions

### Location Verification
**Problem**: Service provider location not accurate  
**Solution**:
- Use browser's geolocation API for accuracy
- Manually enter exact GPS coordinates
- Verify coordinates match physical location

### Database Connection
**Problem**: Can't connect to PostgreSQL  
**Solution**:
- Verify PostgreSQL is running: `psql -U postgres`
- Check credentials in `settings.py`
- Ensure database exists

### Redis Connection
**Problem**: Cache errors  
**Solution**:
- Start Redis: `redis-server`
- Verify Redis is running: `redis-cli ping` (should return PONG)

## Development

### Running Tests
```bash
# Backend
python manage.py test

# Frontend
npm run test
```

### Database Migrations
```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate

# Rollback migration
python manage.py migrate core 0001_previous_migration
```

### Lint Code
```bash
# Frontend
npm run lint
```

## Production Deployment

### Backend
1. Set `DEBUG = False` in settings.py
2. Configure allowed hosts
3. Use production-grade WSGI server (gunicorn)
4. Set up SSL certificates
5. Configure static files serving

### Frontend
1. Build production bundle: `npm run build`
2. Serve from CDN or static file server
3. Update API endpoints to production URLs

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue in the repository
- Contact: support@park-it.com

## Acknowledgments

- YOLO v3 by Joseph Redmon
- Django REST Framework team
- React and Vite communities
- All contributors and testers
