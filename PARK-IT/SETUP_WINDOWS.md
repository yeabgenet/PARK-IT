# Complete Windows Setup Guide for PARK-IT

## Step 1: Install Python 3.11+

1. **Download Python**
   - Go to: https://www.python.org/downloads/
   - Click "Download Python 3.11.x" (or latest 3.11/3.12 version)
   - **IMPORTANT**: During installation, CHECK ✅ "Add Python to PATH"

2. **Verify Installation**
   ```powershell
   python --version
   # Should show: Python 3.11.x or 3.12.x
   ```

## Step 2: Install Node.js 18+

1. **Download Node.js**
   - Go to: https://nodejs.org/
   - Download "LTS" version (recommended)
   - Run installer with default options

2. **Verify Installation**
   ```powershell
   node --version
   # Should show: v18.x.x or higher
   
   npm --version
   # Should show: 9.x.x or higher
   ```

## Step 3: Install PostgreSQL 14+

1. **Download PostgreSQL**
   - Go to: https://www.postgresql.org/download/windows/
   - Download installer for Windows
   - During installation:
     - Remember your password for 'postgres' user
     - Default port: 5432

2. **Create Database**
   
   Open PowerShell and run:
   ```powershell
   # Login to PostgreSQL (enter password when prompted)
   psql -U postgres
   ```
   
   In psql prompt, run:
   ```sql
   CREATE DATABASE parkit;
   CREATE USER ghost WITH PASSWORD 'yg1994#codetillyoudie';
   GRANT ALL PRIVILEGES ON DATABASE parkit TO ghost;
   \q
   ```

## Step 4: Install Redis

**Option A: Using WSL2 (Recommended)**
1. Enable WSL2:
   ```powershell
   wsl --install
   ```
2. Restart computer
3. Install Redis in WSL:
   ```bash
   sudo apt-get update
   sudo apt-get install redis-server
   sudo service redis-server start
   ```

**Option B: Using Windows Port**
1. Download from: https://github.com/tporadowski/redis/releases
2. Extract and run `redis-server.exe`

**Option C: Skip Redis (Use Default Cache)**
- System will work without Redis, just slower
- Comment out Redis cache in settings.py if skipping

## Step 5: Setup Backend (Python/Django)

1. **Navigate to Backend**
   ```powershell
   cd C:\Users\hp\Desktop\PARK-IT\PARK-IT\Backend
   ```

2. **Create Virtual Environment**
   ```powershell
   python -m venv venv
   ```

3. **Activate Virtual Environment**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   If you get execution policy error:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   # Then try activate again
   .\venv\Scripts\Activate.ps1
   ```

4. **Install Dependencies**
   ```powershell
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

5. **Run Migrations**
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create Superuser (Optional)**
   ```powershell
   python manage.py createsuperuser
   ```

## Step 6: Setup Frontend (Node.js/React)

1. **Navigate to Frontend**
   ```powershell
   cd C:\Users\hp\Desktop\PARK-IT\PARK-IT\Frontend
   ```

2. **Install Dependencies**
   ```powershell
   npm install
   ```
   
   This will install:
   - React, TypeScript, Vite
   - TailwindCSS
   - Lucide React (icons)
   - Axios, date-fns
   - All other dependencies

## Step 7: Start the Application

You'll need **3 separate PowerShell windows**:

### Terminal 1: Redis (if installed)
```powershell
# If using WSL
wsl
sudo service redis-server start

# If using Windows Redis
cd path\to\redis
redis-server.exe
```

### Terminal 2: Backend Server
```powershell
cd C:\Users\hp\Desktop\PARK-IT\PARK-IT\Backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

Backend will run at: **http://localhost:8000**

### Terminal 3: Frontend Server
```powershell
cd C:\Users\hp\Desktop\PARK-IT\PARK-IT\Frontend
npm run dev
```

Frontend will run at: **http://localhost:5173**

## Step 8: Access the Application

- **Main App**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin

## Common Issues & Solutions

### Issue 1: "pip not recognized"
**Solution**: Make sure Python is in PATH, or use:
```powershell
python -m pip install -r requirements.txt
```

### Issue 2: "Execution Policy Error"
**Solution**: 
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 3: PostgreSQL Connection Error
**Solution**: 
- Verify PostgreSQL is running
- Check credentials in `Backend/Parkit_Project/settings.py`
- Ensure database 'parkit' exists

### Issue 4: Node/NPM not found
**Solution**: 
- Restart PowerShell after Node.js installation
- Or restart computer
- Verify with `node --version`

### Issue 5: Port Already in Use
**Backend (8000)**:
```powershell
python manage.py runserver 8001
```

**Frontend (5173)**:
```powershell
npm run dev -- --port 5174
```

## Optional: YOLO Model Setup

For full AI parking detection:

1. Download YOLO v3 weights:
   - Visit: https://pjreddie.com/darknet/yolo/
   - Download `yolov3.weights` (~240MB)

2. Download config:
   - Visit: https://github.com/pjreddie/darknet/blob/master/cfg/yolov3.cfg
   - Save as `yolov3.cfg`

3. Place files in:
   ```
   C:\Users\hp\Desktop\PARK-IT\PARK-IT\Car_Parking_Space_Detection-main\Car_Parking_Space_Detection-main\Source Code\
   ```

**Note**: System works without YOLO (uses fallback detection)

## Verification Checklist

- [ ] Python installed (`python --version` works)
- [ ] Node.js installed (`node --version` works)
- [ ] PostgreSQL running and database created
- [ ] Redis running (optional)
- [ ] Virtual environment activated (see `(venv)` in prompt)
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed (`node_modules` folder exists)
- [ ] Migrations completed
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173

## Quick Commands Reference

**Activate venv (Backend)**:
```powershell
cd C:\Users\hp\Desktop\PARK-IT\PARK-IT\Backend
.\venv\Scripts\Activate.ps1
```

**Run Backend**:
```powershell
python manage.py runserver
```

**Run Frontend**:
```powershell
cd C:\Users\hp\Desktop\PARK-IT\PARK-IT\Frontend
npm run dev
```

**Make Migrations** (after model changes):
```powershell
python manage.py makemigrations
python manage.py migrate
```

**Install New Frontend Package**:
```powershell
npm install package-name
```

**Install New Backend Package**:
```powershell
pip install package-name
pip freeze > requirements.txt
```

## Need Help?

If you encounter issues:
1. Check if all services are running (PostgreSQL, Redis)
2. Verify virtual environment is activated
3. Check terminal output for specific error messages
4. Ensure all ports are available (8000, 5173, 5432, 6379)

Happy coding! 🚗🅿️
