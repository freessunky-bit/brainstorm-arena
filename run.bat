@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo Dev server will start; browser opens when ready (Vite).
echo Default URL: http://localhost:5173/  (or next port if 5173 is in use)
echo Stop with Ctrl+C
echo.

call npm run dev
if errorlevel 1 (
  echo.
  echo npm run dev failed. Check Node.js is installed.
  pause
  exit /b 1
)

endlocal
