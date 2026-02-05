@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 Kutuphanе Yonetim Sistemi - Kurulum Baslatiliyor...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js bulunmadi!
    echo Lutfen Node.js'i su adresten indirin: https://nodejs.org/en/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js bulundu: %NODE_VERSION%
echo ✅ npm bulundu: %NPM_VERSION%
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json bulunmadi!
    echo Lutfen stitch klasöründe olduğunuzdan emin olun.
    pause
    exit /b 1
)

echo 📦 Bagimliliklar yukleniyor...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm install basarısız oldu!
    pause
    exit /b 1
)

echo.
echo ✅ Kurulum tamamlandi!
echo.
echo 📊 Sunucuyu baslatmak icin:
echo    npm start
echo.
echo 🔄 Development modunda baslatmak icin:
echo    npm run dev
echo.
echo 📍 http://localhost:3000
echo.
echo 📚 Demo Hesaplari:
echo    Admin: admin / 1234
echo    User: user1 / 1234
echo.
pause
