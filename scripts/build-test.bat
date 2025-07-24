@echo off
echo 🚀 RaveTracker v3.0 - Build Test Script
echo ======================================

echo 📋 Checking environment...
node --version
npm --version

echo.
echo 📦 Installing dependencies...
call npm ci
if %errorlevel% neq 0 (
    echo ❌ npm ci failed
    exit /b 1
)

echo.
echo 🔍 Running linting...
call npm run lint
if %errorlevel% neq 0 (
    echo ❌ Linting failed
    exit /b 1
)

echo.
echo 🔍 Running type checking...
call npm run check
if %errorlevel% neq 0 (
    echo ❌ Type checking failed
    exit /b 1
)

echo.
echo 🧪 Running tests...
call npm run test
if %errorlevel% neq 0 (
    echo ❌ Tests failed
    exit /b 1
)

echo.
echo 🏗️ Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

echo.
echo ✅ All checks passed successfully!
echo 📊 Build artifacts created in build/ directory
echo 🎉 RaveTracker v3.0 is ready for deployment!
