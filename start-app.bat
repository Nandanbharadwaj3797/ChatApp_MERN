@echo off
echo 🚀 Starting Chat Application...
echo.

echo 📡 Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm start"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🌐 Starting Frontend Server...
start "Frontend Server" cmd /k "cd client && npm run dev"

echo.
echo ✅ Both servers are starting...
echo 📱 Frontend will open at: http://localhost:5173
echo 🔌 Backend is running at: http://localhost:5000
echo.
echo Press any key to close this window...
pause >nul
