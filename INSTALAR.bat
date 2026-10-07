@echo off
title Instalador SKILL_DEY
where node >nul 2>&1
if %errorlevel%==0 ( node "%~dp0app\instalador\instalar.mjs" ) else ( powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0app\instalador\instalar-sin-node.ps1" )
echo.
pause
