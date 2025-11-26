@echo off
echo ========================================
echo Starting PARK-IT Servers
echo ========================================
echo.
echo This will open 2 new windows:
echo - Backend Server (Django)
echo - Frontend Server (Vite)
echo.
echo Make sure PostgreSQL and Redis are running!
echo.
pause

cd Backend
start "PARK-IT Backend" cmd /k "venv\Scripts\activate.bat && python manage.py runserver"

cd ..\Frontend
start "PARK-IT Frontend" cmd /k "npm run dev"

echo.
echo Servers starting in new windows...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window (servers will keep running)
pause
