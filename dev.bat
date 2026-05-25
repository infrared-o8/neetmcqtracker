@echo off
echo Starting NEET MCQ Tracker Development Environment...

:: Start the Vite frontend
echo Launching Frontend (Port 5173)...
start "NEET Tracker - Frontend" cmd /c "npm run dev"

:: Start the Express backend
echo Launching Backend (Port 3847)...
start "NEET Tracker - Backend" cmd /c "npm run server"

:: Start Ngrok for the backend
echo Launching Ngrok Tunnel for Port 3847...
start "NEET Tracker - Ngrok" cmd /c "ngrok http 3847"

:: Wait for Vite to initialize
echo Waiting for services to start...
timeout /t 5 /nobreak > nul

:: Open the browser
echo Opening browser to http://localhost:5173...
start http://localhost:5173

echo.
echo All services are launching in separate windows.
echo Close the individual windows to stop the services.
pause
