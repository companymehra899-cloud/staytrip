#!/bin/bash
# Start backend API
node server/index.js &
BACKEND_PID=$!

# Start frontend (exposed preview port)
npm run dev

trap "kill $BACKEND_PID" EXIT
