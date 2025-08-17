#!/bin/bash

echo "🚀 Starting Chat Application..."
echo

echo "📡 Starting Backend Server..."
cd server && npm start &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🌐 Starting Frontend Server..."
cd ../client && npm run dev &
FRONTEND_PID=$!

echo
echo "✅ Both servers are starting..."
echo "📱 Frontend will open at: http://localhost:5173"
echo "🔌 Backend is running at: http://localhost:5000"
echo
echo "Press Ctrl+C to stop both servers..."

# Wait for user to stop
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
