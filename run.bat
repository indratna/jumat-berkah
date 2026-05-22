@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo  Jumat Berkah - Manual Test Runner
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js belum terpasang atau belum ada di PATH.
  echo Install Node.js LTS lalu jalankan file ini lagi.
  goto :fail
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm belum tersedia di PATH.
  goto :fail
)

if not exist ".env.local" (
  echo ERROR: .env.local belum ada.
  echo Buat .env.local dari .env.example lalu isi DATABASE_URL, AUTH_SECRET, ADMIN_LOGIN_CODE, DONOR_LOGIN_CODE, dan Midtrans config bila ingin tes pembayaran.
  goto :fail
)

set DOTENV_CONFIG_PATH=.env.local
set PORT=3037

if not exist "node_modules" (
  echo node_modules belum ada. Menjalankan npm install...
  call npm install
  if errorlevel 1 (
    echo ERROR: npm install gagal.
    goto :fail
  )
)

echo Generate Prisma client...
call npm run db:generate
if errorlevel 1 (
  echo ERROR: Prisma generate gagal.
  goto :fail
)

echo Cek status migration database...
call npx prisma migrate status
if errorlevel 1 (
  echo Migration status gagal. Mencoba menjalankan migration dev...
  call npm run db:migrate
  if errorlevel 1 (
    echo ERROR: Migration database gagal. Pastikan PostgreSQL hidup dan DATABASE_URL benar.
    goto :fail
  )
)

echo Seed admin jika ADMIN_EMAIL dan ADMIN_NAME tersedia...
call npm run seed:admin
if errorlevel 1 (
  echo WARNING: Seed admin gagal. Aplikasi tetap dijalankan, tapi login admin mungkin belum bisa.
)

echo.
echo Aplikasi akan jalan di http://localhost:3037
echo Tekan Ctrl+C untuk berhenti.
echo.

echo Cek dev server lama untuk project ini...
for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$cwd=(Get-Location).Path; Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node' -and $_.CommandLine -match 'next' -and $_.CommandLine -match [regex]::Escape($cwd) } | ForEach-Object { $_.ProcessId }"`) do (
  echo Menghentikan dev server lama PID %%P...
  taskkill /PID %%P /F >nul 2>nul
)

call npm run dev -- --port 3037
if errorlevel 1 (
  echo ERROR: Dev server berhenti karena error.
  goto :fail
)

endlocal
echo.
echo Dev server berhenti.
pause
exit /b 0

:fail
echo.
echo Script berhenti karena error. Baca pesan di atas.
echo Jika perlu, kirim screenshot atau salin error terakhir.
pause
endlocal
exit /b 1
