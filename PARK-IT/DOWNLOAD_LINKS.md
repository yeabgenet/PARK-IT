# Download Links - Install Everything

Download and install in this order:

## 1. Python 3.11+ (Required)
**Download**: https://www.python.org/downloads/

**Installation**:
- Click "Download Python 3.11.x"
- Run installer
- ✅ **CHECK "Add Python to PATH"** (IMPORTANT!)
- Click "Install Now"

**Verify**:
```powershell
python --version
```

---

## 2. Node.js 18+ (Required)
**Download**: https://nodejs.org/

**Installation**:
- Download LTS version (recommended)
- Run installer with default settings
- Restart computer after installation

**Verify**:
```powershell
node --version
npm --version
```

---

## 3. PostgreSQL 14+ (Required)
**Download**: https://www.postgresql.org/download/windows/

**Installation**:
- Download Windows installer
- Remember the password you set for 'postgres' user
- Keep default port: 5432
- Install all components

**Setup Database**:
After installation, open PowerShell:
```powershell
# Login to psql (enter password when prompted)
psql -U postgres

# In psql, run these commands:
CREATE DATABASE parkit;
CREATE USER ghost WITH PASSWORD 'yg1994#codetillyoudie';
GRANT ALL PRIVILEGES ON DATABASE parkit TO ghost;
\q
```

**Verify**:
- PostgreSQL should be running in Services
- Can connect with: `psql -U postgres`

---

## 4. Redis (Optional but Recommended)

### Option A: WSL2 + Redis (Best for Windows)
1. **Install WSL2**:
   ```powershell
   # Run as Administrator
   wsl --install
   ```
   Restart computer after installation.

2. **Install Redis in WSL**:
   ```bash
   # In WSL terminal
   sudo apt-get update
   sudo apt-get install redis-server
   ```

3. **Start Redis**:
   ```bash
   sudo service redis-server start
   ```

### Option B: Windows Redis Port
**Download**: https://github.com/tporadowski/redis/releases

- Download latest .zip file
- Extract to a folder
- Run `redis-server.exe`

### Option C: Skip Redis
- System will work without it
- Performance will be slightly slower
- No real-time features

---

## 5. Git (Optional but Useful)
**Download**: https://git-scm.com/download/win

For version control and future updates.

---

## Quick Installation Commands

After installing Python and Node.js, run these automated scripts:

### Backend Setup
```powershell
cd C:\Users\hp\Desktop\PARK-IT\PARK-IT
.\setup_backend.bat
```

### Frontend Setup
```powershell
cd C:\Users\hp\Desktop\PARK-IT\PARK-IT
.\setup_frontend.bat
```

### Start Both Servers
```powershell
cd C:\Users\hp\Desktop\PARK-IT\PARK-IT
.\start_servers.bat
```

---

## Optional Downloads

### YOLO Model Files (For AI Detection)
**YOLOv3 Weights**: https://pjreddie.com/media/files/yolov3.weights (~240MB)
**YOLOv3 Config**: https://github.com/pjreddie/darknet/blob/master/cfg/yolov3.cfg

Place in:
```
C:\Users\hp\Desktop\PARK-IT\PARK-IT\Car_Parking_Space_Detection-main\Car_Parking_Space_Detection-main\Source Code\
```

### Visual Studio Code (Recommended IDE)
**Download**: https://code.visualstudio.com/

Recommended extensions:
- Python
- TypeScript
- ESLint
- Prettier

---

## Installation Order Summary

1. ✅ Python 3.11+ → **Add to PATH!**
2. ✅ Node.js 18+ LTS
3. ✅ PostgreSQL 14+ → Create 'parkit' database
4. ✅ Redis (WSL2 or Windows port)
5. ✅ Run `setup_backend.bat`
6. ✅ Run `setup_frontend.bat`
7. ✅ Run `start_servers.bat`

---

## Verification Checklist

After installation, verify everything works:

```powershell
# Check Python
python --version
pip --version

# Check Node.js
node --version
npm --version

# Check PostgreSQL
psql -U postgres -c "SELECT version();"

# Check Redis (if using WSL)
wsl
redis-cli ping
# Should return: PONG
exit

# Check if backend venv exists
dir Backend\venv

# Check if frontend node_modules exists
dir Frontend\node_modules
```

All commands should work without errors!

---

## Troubleshooting Links

- **Python not in PATH**: https://stackoverflow.com/questions/23708898/pip-is-not-recognized-as-an-internal-or-external-command
- **WSL2 Setup**: https://learn.microsoft.com/en-us/windows/wsl/install
- **PostgreSQL Setup**: https://www.postgresql.org/docs/current/tutorial-install.html
- **Node.js Troubleshooting**: https://docs.npmjs.com/troubleshooting

---

## Support

If you encounter any issues:
1. Check that all downloads are from official sources
2. Restart computer after installations
3. Run PowerShell as Administrator if needed
4. Check SETUP_WINDOWS.md for detailed troubleshooting
