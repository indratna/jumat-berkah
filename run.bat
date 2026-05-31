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
set LOCAL_DB_CONTAINER=jumat-berkah-postgres
set LOCAL_DB_NAME=jumat_berkah
set LOCAL_DB_USER=jumat_berkah_user
set LOCAL_DB_PASSWORD=jumat_berkah_password
set LOCAL_DB_PORT=54329

node scripts\resolve-local-db-env.cjs > "%TEMP%\jumat-berkah-local-db-env.cmd"
if errorlevel 1 (
  echo ERROR: Gagal membaca DATABASE_URL dari .env.local.
  goto :fail
)
call "%TEMP%\jumat-berkah-local-db-env.cmd"
if errorlevel 1 (
  echo ERROR: Gagal menerapkan konfigurasi database lokal.
  goto :fail
)

where docker >nul 2>nul
if errorlevel 1 (
  echo WARNING: Docker tidak tersedia di PATH. Lewati auto-start PostgreSQL lokal.
) else (
  echo Cek PostgreSQL lokal Docker container %LOCAL_DB_CONTAINER%...
  docker inspect %LOCAL_DB_CONTAINER% >nul 2>nul
  if errorlevel 1 (
    echo Container %LOCAL_DB_CONTAINER% belum ada. Membuat PostgreSQL lokal di port %LOCAL_DB_PORT% dengan user %LOCAL_DB_USER%...
    docker run --name %LOCAL_DB_CONTAINER% -e POSTGRES_DB=%LOCAL_DB_NAME% -e POSTGRES_USER=%LOCAL_DB_USER% -e POSTGRES_PASSWORD=%LOCAL_DB_PASSWORD% -p %LOCAL_DB_PORT%:5432 -d postgres:16
    if errorlevel 1 (
      echo ERROR: Gagal membuat container PostgreSQL lokal. Pastikan Docker Desktop hidup.
      goto :fail
    )
  ) else (
    docker inspect --format "{{range .Config.Env}}{{println .}}{{end}}" %LOCAL_DB_CONTAINER% | findstr /b /c:"POSTGRES_USER=%LOCAL_DB_USER%" >nul 2>nul
    if errorlevel 1 (
      echo ERROR: Container %LOCAL_DB_CONTAINER% sudah ada, tapi user PostgreSQL tidak cocok dengan DATABASE_URL di .env.local.
      echo DATABASE_URL sekarang memakai user %LOCAL_DB_USER% pada port %LOCAL_DB_PORT%.
      echo Jika data lokal boleh dihapus, jalankan command ini lalu ulangi run.bat:
      echo docker rm -f %LOCAL_DB_CONTAINER%
      goto :fail
    )
    echo Menyalakan container %LOCAL_DB_CONTAINER% jika belum jalan...
    docker start %LOCAL_DB_CONTAINER% >nul 2>nul
    if errorlevel 1 (
      echo ERROR: Gagal start PostgreSQL lokal. Pastikan Docker Desktop hidup dan port %LOCAL_DB_PORT% tidak dipakai.
      goto :fail
    )
  )
)

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
