@echo off
REM =====================================================================
REM commit-timenest.bat
REM Commits the TimeNest Flutter production app changes and pushes to
REM GitHub (origin/main).
REM
REM Run from:  C:\Users\Vihaan\OneDrive\ドキュメント\Playground
REM Usage:     double-click, or run `commit-timenest.bat` in Command Prompt
REM =====================================================================

chcp 65001 >nul
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo.
echo === TimeNest commit script ===
echo Repo: %CD%
echo.

REM --- 1. Clear any stale git lock -------------------------------------
if exist ".git\index.lock" (
    echo Removing stale .git\index.lock ...
    del /f /q ".git\index.lock"
)

REM --- 2. Sanity check: is this a git repo with the right remote? ------
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERROR: This folder is not a git repository.
    pause
    exit /b 1
)

for /f "delims=" %%R in ('git config --get remote.origin.url') do set ORIGIN=%%R
echo Remote origin: !ORIGIN!
echo.

REM --- 3. Renormalize line endings per .gitattributes ------------------
REM (.gitattributes was added to collapse the CRLF vs LF churn that made
REM  all 51 files appear modified without any real content change.)
echo Renormalizing line endings ...
git add --renormalize . >nul 2>&1

REM --- 4. Stage real changes -------------------------------------------
echo Staging changes ...

REM Line-ending policy + ignore rules
git add .gitattributes .gitignore

REM New Flutter production files
git add apps/timenest_flutter/lib/core/constants/auth_config.dart
git add apps/timenest_flutter/web/favicon.png
git add apps/timenest_flutter/web/icons

REM Any genuinely modified tracked files (docs, pdfs, real code edits)
git add -u apps/timenest_flutter
git add -u docs

REM --- 5. Show what will be committed ----------------------------------
echo.
echo === Staged changes ===
git diff --cached --stat
echo.

REM --- 6. Bail out if nothing staged -----------------------------------
git diff --cached --quiet
if not errorlevel 1 (
    echo Nothing to commit. Exiting.
    pause
    exit /b 0
)

REM --- 7. Commit --------------------------------------------------------
set "MSG=Flutter production app: wire Google OAuth, web icons, line-ending normalization"
set "BODY=- Add AuthConfig with Google OAuth 2.0 web client ID for Flutter Web sign-in^

- Add web favicon and PWA icons for timenest_flutter^

- Add .gitattributes to normalize line endings (eol=lf) and prevent CRLF churn^

- Ignore local headless browser test artifacts (.chrome-headless*, .edge-headless*)"

git commit -m "%MSG%" -m "%BODY%"
if errorlevel 1 (
    echo.
    echo ERROR: commit failed. See output above.
    pause
    exit /b 1
)

REM --- 8. Push ----------------------------------------------------------
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
