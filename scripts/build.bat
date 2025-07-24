@echo off
echo ========================================
echo RaveTracker v3.0 - Windows Build Script
echo ========================================
echo.

echo [1/4] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)

echo [2/4] Installing/updating dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo [3/4] Running SvelteKit build...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo [4/4] Build completed successfully!
echo.
echo Build output: ./build/
echo.
echo For production deployment:
echo 1. Push to GitHub: git push origin main
echo 2. GitHub Actions will auto-deploy
echo.
echo For manual deployment, see: SERVER_SETUP_GUIDE.md
echo.
pause
