@echo off
echo ==========================================
echo Demarrage d'Expo depuis Windows
echo ==========================================
echo.
echo Cette methode evite les problemes de reseau WSL
echo.

cd /d "%~dp0"
cd \\wsl.localhost\Ubuntu\home\nonow\EPI\HUB\Game_changer

echo Demarrage d'Expo...
echo.
echo IMPORTANT: Assurez-vous que Node.js est installe sur Windows
echo.

npx expo start --clear

pause

