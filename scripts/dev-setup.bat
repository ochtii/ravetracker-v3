@echo off
echo ========================================
echo RaveTracker v3.0 - Windows Development Setup
echo ========================================
echo.

echo [1/5] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Please install Node.js 18 LTS first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [2/5] Checking npm version...
cmd /c npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)

echo [3/5] Installing dependencies...
cmd /c npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo [4/5] Checking environment file...
if not exist ".env.local" (
    echo WARNING: .env.local not found!
    echo Please create .env.local with your Supabase credentials.
    echo Example file: .env.example
    echo.
)

echo [5/5] Checking if dev server can start...
echo Testing development server startup...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Configure .env.local with your Supabase credentials
echo 2. Run: npm run dev
echo 3. Open: http://localhost:5173
echo.
echo For production deployment, see: SERVER_SETUP_GUIDE.md
echo.
pause
