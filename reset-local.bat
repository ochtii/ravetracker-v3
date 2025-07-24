@echo off
REM RaveTracker v3.0 Server Reset Script (Windows)
REM Für lokale Entwicklung und Tests

echo.
echo ====================================
echo RaveTracker v3.0 Local Reset
echo ====================================
echo.

echo [WARNUNG] Dies wird lokale Dateien zurücksetzen!
echo.
set /p confirm="Fortfahren? (j/n): "
if /i not "%confirm%"=="j" (
    echo Abgebrochen.
    exit /b 0
)

echo.
echo [INFO] Stoppe lokale Services...

REM Stop Node.js processes
echo - Stoppe Node.js Prozesse...
taskkill /f /im node.exe 2>nul || echo   Keine Node.js Prozesse gefunden

REM Stop PM2 processes (if installed)
where pm2 >nul 2>nul
if %errorlevel%==0 (
    echo - Stoppe PM2 Prozesse...
    pm2 stop all 2>nul || echo   Keine PM2 Prozesse gefunden
    pm2 delete all 2>nul || echo   Keine PM2 Prozesse zu löschen
)

echo.
echo [INFO] Bereinige Verzeichnisse...

REM Clean build directories
if exist "build" (
    echo - Entferne build/...
    rmdir /s /q "build" 2>nul || echo   Konnte build/ nicht entfernen
)

if exist ".svelte-kit" (
    echo - Entferne .svelte-kit/...
    rmdir /s /q ".svelte-kit" 2>nul || echo   Konnte .svelte-kit/ nicht entfernen
)

if exist "node_modules" (
    echo - Entferne node_modules/...
    rmdir /s /q "node_modules" 2>nul || echo   Konnte node_modules/ nicht entfernen
)

REM Clean temporary files
if exist "temp" (
    echo - Entferne temp/...
    rmdir /s /q "temp" 2>nul || echo   Konnte temp/ nicht entfernen
)

echo.
echo [INFO] Installiere Dependencies neu...
call npm install

echo.
echo [SUCCESS] Lokaler Reset abgeschlossen!
echo.
echo Naechste Schritte:
echo 1. npm run dev - Development Server starten
echo 2. npm run build - Produktions-Build testen
echo 3. npm run preview - Build-Vorschau testen
echo.
pause
