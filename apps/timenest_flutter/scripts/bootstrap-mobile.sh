#!/usr/bin/env bash
# Local bootstrap — prepares the Flutter project for Android + iOS builds.
#
# Run this ONCE on your development machine from the repo root:
#
#   bash apps/timenest_flutter/scripts/bootstrap-mobile.sh
#
# What it does:
#   1. Generates android/ and ios/ platform folders if missing.
#   2. Patches them with TimeNest-specific config (applicationId, FCM, etc).
#   3. Installs Dart dependencies.
#   4. Prints the next commands you need (build APK, build IPA, etc).
#
# Prerequisites:
#   - Flutter SDK installed (https://docs.flutter.dev/get-started/install)
#   - For Android: Android Studio with SDK + JDK 17
#   - For iOS: macOS + Xcode 15+ and CocoaPods (`sudo gem install cocoapods`)

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${APP_DIR}"

if ! command -v flutter >/dev/null 2>&1; then
  echo "error: flutter is not installed or not on PATH." >&2
  echo "Install from https://docs.flutter.dev/get-started/install" >&2
  exit 1
fi

echo "▸ Flutter:"
flutter --version | head -3
echo

if [ ! -d android ] || [ ! -d ios ]; then
  echo "▸ Generating android/ and ios/ platform folders"
  flutter create --platforms=android,ios --org=com.timenest .
  echo
fi

echo "▸ Applying Android patches"
bash "${APP_DIR}/scripts/patch-android.sh" com.timenest.app
echo

if [ "$(uname -s)" = "Darwin" ]; then
  echo "▸ Applying iOS patches"
  bash "${APP_DIR}/scripts/patch-ios.sh" com.timenest.app
  echo
else
  echo "▸ Skipping iOS patches (not on macOS)"
  echo
fi

echo "▸ flutter pub get"
flutter pub get
echo

# ── Firebase native config reminders ───────────────────────────────────────
missing=""
if [ ! -f android/app/google-services.json ]; then
  missing="${missing}\n  • android/app/google-services.json  (Firebase Console → Project settings → Your apps → Android → Download)"
fi
if [ "$(uname -s)" = "Darwin" ] && [ ! -f ios/Runner/GoogleService-Info.plist ]; then
  missing="${missing}\n  • ios/Runner/GoogleService-Info.plist  (Firebase Console → Your apps → iOS → Download)"
fi

if [ -n "$missing" ]; then
  echo "⚠  Firebase native config files still missing:"
  printf "%b\n" "$missing"
  echo "   Register com.timenest.app under the 'timenest-d97da' Firebase project"
  echo "   (or run: flutterfire configure --project=timenest-d97da) and drop the"
  echo "   downloaded files into the paths shown above."
  echo
fi

cat <<'EOF'
── Next steps ─────────────────────────────────────────────────────────────

Debug APK for quick install on Android:
  (cd apps/timenest_flutter && flutter build apk --debug)
  → apps/timenest_flutter/build/app/outputs/flutter-apk/app-debug.apk

Signed release APK (requires keystore — see generate-keystore.sh):
  bash apps/timenest_flutter/scripts/generate-keystore.sh
  (cd apps/timenest_flutter && flutter build apk --release)

Play Store AAB (release bundle, required for Play Console):
  (cd apps/timenest_flutter && flutter build appbundle --release)

iOS (macOS only):
  (cd apps/timenest_flutter && flutter build ios --release)
  Then open ios/Runner.xcworkspace in Xcode → Product → Archive → Distribute

No machine for Android/iOS? Use the GitHub Actions workflow instead:
  - Push to main, or trigger Actions → "Build mobile binaries" → Run workflow
  - Download APK/IPA artifacts from the run summary.

Full guide: docs/mobile-build-guide.md
EOF
