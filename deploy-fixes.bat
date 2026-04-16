@echo off
echo ========================================
echo   TIMENEST - Deploy UI Fixes
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Staging changed files...
git add styles.css store-ui.js task-editor.html
echo.

echo [2/4] Committing...
git commit -m "UI fixes: compact goal/task inputs, habit cancel button, goal refresh, button layout"
echo.

echo [3/4] Pushing to GitHub...
git push origin main
echo.

echo [4/4] Deploying to Firebase Hosting...
call firebase deploy --only hosting
echo.

echo ========================================
echo   DONE! Check https://timenest-d97da.web.app
echo ========================================
pause
