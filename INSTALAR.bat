@echo off
setlocal
set "SDV=?"
if exist "%~dp0app\skill_dey\VERSION" set /p SDV=<"%~dp0app\skill_dey\VERSION"
title Instalador SKILL_DEY v%SDV%
echo.
echo   ==============================================
echo     SKILL_DEY v%SDV%  -  instalador (OpenCode, Claude Code, Gemini, Antigravity)
echo   ==============================================
echo.
set "USANODE=0"
where node >nul 2>&1 && node -e "process.exit(Number(process.versions.node.split('.')[0]) < 18 ? 1 : 0)" && set "USANODE=1"
if "%USANODE%"=="1" (
  node "%~dp0app\instalador\instalar.mjs"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0app\instalador\instalar-sin-node.ps1"
)
set "OCD=%USERPROFILE%\.config\opencode"
if defined OPENCODE_CONFIG_DIR set "OCD=%OPENCODE_CONFIG_DIR%"
set "INST=?"
if exist "%OCD%\skill_dey\VERSION" set /p INST=<"%OCD%\skill_dey\VERSION"
echo.
if "%INST%"=="%SDV%" (
  echo   [OK] Version instalada: v%INST%  ^(confirmado^)
) else (
  echo   [!] Esperaba v%SDV% y quedo v%INST%. Cierra OpenCode y vuelve a ejecutar INSTALAR.bat
)
echo   Cierra y abre tu IA. En OpenCode, para comprobar escribe:  /skill_dey version
echo.
pause
