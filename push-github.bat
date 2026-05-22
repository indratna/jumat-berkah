@echo off
setlocal

cd /d "%~dp0"

echo.
echo === Jumat Berkah GitHub Push ===
echo Folder: %CD%
echo.

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo ERROR: Folder ini bukan git repository.
  pause
  exit /b 1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo ERROR: Remote origin belum diset.
  echo Set dulu: git remote add origin ^<repo-url^>
  pause
  exit /b 1
)

echo Cek file rahasia...
git check-ignore .env.local >nul 2>&1
if errorlevel 1 (
  echo ERROR: .env.local tidak ter-ignore. Stop agar secret tidak ikut commit.
  pause
  exit /b 1
)

echo.
echo Status perubahan:
git status --short

echo.
set /p CONFIRM="Lanjut add, commit, push? (y/N): "
if /i not "%CONFIRM%"=="y" (
  echo Dibatalkan.
  pause
  exit /b 0
)

git add .
git add -f .env.example >nul 2>&1

for /f %%i in ('git status --porcelain') do set HAS_CHANGES=1
if not defined HAS_CHANGES (
  echo Tidak ada perubahan untuk commit.
  echo Push tetap dijalankan untuk memastikan remote sync.
  git push
  if errorlevel 1 goto push_failed
  echo Push selesai.
  pause
  exit /b 0
)

set COMMIT_MESSAGE=%*
if "%COMMIT_MESSAGE%"=="" (
  for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set TODAY=%%a-%%b-%%c
  for /f "tokens=1-2 delims=: " %%a in ("%time%") do set NOW=%%a%%b
  set COMMIT_MESSAGE=Update Jumat Berkah %TODAY% %NOW%
)

echo.
echo Commit: %COMMIT_MESSAGE%
git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 goto commit_failed

echo.
echo Push ke GitHub...
git push
if errorlevel 1 goto push_failed

echo.
echo Selesai push ke GitHub.
pause
exit /b 0

:commit_failed
echo.
echo ERROR: Commit gagal.
pause
exit /b 1

:push_failed
echo.
echo ERROR: Push gagal.
pause
exit /b 1
