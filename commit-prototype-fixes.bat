@echo off
REM =====================================================================
REM commit-prototype-fixes.bat
REM Commits the Habits/Tasks/Notifications prototype polish and pushes
REM to GitHub (origin/main).
REM
REM Run from:  C:\Users\Vihaan\OneDrive\ドキュメント\Playground
REM Usage:     double-click, or run `commit-prototype-fixes.bat` in cmd
REM =====================================================================

chcp 65001 >nul
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo.
echo === TimeNest prototype-fixes commit script ===
echo Repo: %CD%
echo.

REM --- 1. Clear any stale git lock -------------------------------------
if exist ".git\index.lock" (
    echo Removing stale .git\index.lock ...
    del /f /q ".git\index.lock"
)

REM --- 2. Sanity check --------------------------------------------------
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERROR: This folder is not a git repository.
    pause
    exit /b 1
)

for /f "delims=" %%R in ('git config --get remote.origin.url') do set ORIGIN=%%R
echo Remote origin: !ORIGIN!
echo.

REM --- 3. Stage just the prototype files we changed --------------------
echo Staging prototype changes ...
git add daily-tasks.html habit-editor.html notifications.html notifications.js script.js store-ui.js styles.css

REM --- 4. Show what will be committed ----------------------------------
echo.
echo === Staged changes ===
git diff --cached --stat
echo.

REM --- 5. Bail if nothing staged ---------------------------------------
git diff --cached --quiet
if not errorlevel 1 (
    echo Nothing to commit. Exiting.
    pause
    exit /b 0
)

REM --- 6. Commit --------------------------------------------------------
set "MSG=Habits/Tasks/Notifications prototype polish"

git commit -m "%MSG%" -m "Habits tab: per-row Edit + Delete icons; delete requires double confirmation." ^
              -m "Habit editor: Habit Name/Schedule/Preferred Time mandatory with red *; Linked Goal is a dropdown of Active goals; form trimmed to Save + Cancel." ^
              -m "Notifications: direct notifications.js include; inbox Mark-all-read + Clear buttons restyled as pills with working event-delegated handlers; inbox styles moved into styles.css." ^
              -m "Tasks tab: + Add Task row pinned at top of the Task Streams list; per-task actions reduced to small Mark Complete / Edit / Delete icons."

if errorlevel 1 (
    echo.
    echo ERROR: commit failed. See output above.
    pause
    exit /b 1
)

REM --- 7. Push ----------------------------------------------------------
echo.
echo Pushing to origin main ...
git push origin HEAD:main
if errorlevel 1 (
    echo.
    echo Commit succeeded but push failed. Run `git push` manually.
    pause
    exit /b 1
)

echo.
echo === Done. Latest commit: ===
git log -1 --oneline
echo.
pause
endlocal
