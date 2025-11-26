@echo off
echo ========================================
echo PARK-IT Backend Setup Script
echo ========================================
echo.

cd Backend

echo Step 1: Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    echo Make sure Python is installed and in PATH
    pause
    exit /b 1
)
echo Virtual environment created successfully!
echo.

echo Step 2: Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)
echo.

echo Step 3: Upgrading pip...
python -m pip install --upgrade pip
echo.

echo Step 4: Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo Step 5: Running migrations...
python manage.py makemigrations
python manage.py migrate
if %errorlevel% neq 0 (
    echo WARNING: Migrations failed - check if PostgreSQL is running
    pause
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Make sure Redis is running (optional)
echo 3. Run: python manage.py runserver
echo.
pause
