#!/usr/bin/env bash
# Patch the `flutter create`-generated ios/ scaffolding for TimeNest:
# - set PRODUCT_BUNDLE_IDENTIFIER = com.timenest.app
# - set Info.plist display name
# - ensure iOS deployment target >= 13 (Firebase requirement)
#
# Usage:
#   bash scripts/patch-ios.sh com.timenest.app

set -euo pipefail

BUNDLE_ID="${1:-com.timenest.app}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${APP_DIR}"

if [ ! -d ios ]; then
  echo "error: ios/ not found. Run 'flutter create --platforms=ios .' first." >&2
  exit 1
fi

PROJ="ios/Runner.xcodeproj/project.pbxproj"
if [ ! -f "${PROJ}" ]; then
  echo "error: ${PROJ} missing" >&2
  exit 1
fi

echo "→ Setting PRODUCT_BUNDLE_IDENTIFIER to ${BUNDLE_ID}"
sed -i.bak -E "s|PRODUCT_BUNDLE_IDENTIFIER = [^;]+;|PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID};|g" "${PROJ}"
rm -f "${PROJ}.bak"

echo "→ Setting IPHONEOS_DEPLOYMENT_TARGET to 13.0"
sed -i.bak -E "s|IPHONEOS_DEPLOYMENT_TARGET = [0-9]+\.[0-9]+;|IPHONEOS_DEPLOYMENT_TARGET = 13.0;|g" "${PROJ}"
rm -f "${PROJ}.bak"

PODFILE="ios/Podfile"
if [ -f "${PODFILE}" ]; then
  echo "→ Pinning Podfile platform :ios, '13.0'"
  sed -i.bak -E "s|# platform :ios, '[0-9.]+'|platform :ios, '13.0'|" "${PODFILE}" || true
  sed -i.bak -E "s|platform :ios, '[0-9.]+'|platform :ios, '13.0'|" "${PODFILE}"
  rm -f "${PODFILE}.bak"
fi

INFO="ios/Runner/Info.plist"
if [ -f "${INFO}" ]; then
  echo "→ Setting Info.plist CFBundleDisplayName → TimeNest"
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName TimeNest" "${INFO}" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string TimeNest" "${INFO}" 2>/dev/null || true
  # Sanitize bundle name too
  /usr/libexec/PlistBuddy -c "Set :CFBundleName TimeNest" "${INFO}" 2>/dev/null || true
fi

echo "✓ iOS patches applied"
