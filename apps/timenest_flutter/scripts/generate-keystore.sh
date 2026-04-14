#!/usr/bin/env bash
# Generate a release signing keystore for Android + write key.properties.
#
# This is a ONE-TIME operation. KEEP THE RESULTING FILE SAFE:
#   - Back up apps/timenest_flutter/android/upload-keystore.jks
#   - Losing it means you cannot publish updates to Play Store under the same app.
#   - It is gitignored by default.
#
# Usage:
#   bash apps/timenest_flutter/scripts/generate-keystore.sh
#
# For CI (GitHub Actions signed release builds), also upload the base64 of the
# keystore as the ANDROID_KEYSTORE_BASE64 repo secret. This script prints the
# base64 at the end for convenience.

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${APP_DIR}"

KEYSTORE="android/upload-keystore.jks"
KEY_PROPS="android/key.properties"

if [ -f "${KEYSTORE}" ]; then
  echo "⚠  ${KEYSTORE} already exists. Refusing to overwrite."
  echo "   Delete it first if you really want a new keystore (will invalidate"
  echo "   all published APKs signed by the old one)."
  exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
  echo "error: keytool not found. Install a JDK (17 recommended)." >&2
  exit 1
fi

read -rp "Keystore password: " -s STORE_PW; echo
read -rp "Key password (press enter to reuse keystore password): " -s KEY_PW; echo
KEY_PW="${KEY_PW:-$STORE_PW}"

ALIAS="upload"
read -rp "Your name (CN) [Prasad Deshmukh]: " CN; CN="${CN:-Prasad Deshmukh}"
read -rp "Organization (O) [TimeNest]: " ORG; ORG="${ORG:-TimeNest}"
read -rp "City (L) [Pune]: " CITY; CITY="${CITY:-Pune}"
read -rp "State (ST) [Maharashtra]: " STATE; STATE="${STATE:-Maharashtra}"
read -rp "Country 2-letter code (C) [IN]: " C; C="${C:-IN}"

mkdir -p android
keytool -genkey -v \
  -keystore "${KEYSTORE}" \
  -alias "${ALIAS}" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "${STORE_PW}" -keypass "${KEY_PW}" \
  -dname "CN=${CN}, O=${ORG}, L=${CITY}, ST=${STATE}, C=${C}"

cat > "${KEY_PROPS}" <<EOF
storePassword=${STORE_PW}
keyPassword=${KEY_PW}
keyAlias=${ALIAS}
storeFile=../upload-keystore.jks
EOF
chmod 600 "${KEY_PROPS}"

echo
echo "✓ Keystore written to ${KEYSTORE}"
echo "✓ Gradle properties written to ${KEY_PROPS}"

GITIGNORE="android/.gitignore"
if [ -f "${GITIGNORE}" ]; then
  grep -q "upload-keystore.jks" "${GITIGNORE}" || echo "upload-keystore.jks" >> "${GITIGNORE}"
  grep -q "key.properties"    "${GITIGNORE}" || echo "key.properties"    >> "${GITIGNORE}"
fi

echo
echo "── For GitHub Actions signed-release builds, set these repo secrets:"
echo
echo "ANDROID_KEYSTORE_BASE64 = (paste the line below)"
base64 < "${KEYSTORE}" | tr -d '\n'
echo
echo
echo "ANDROID_KEYSTORE_PASSWORD = ${STORE_PW}"
echo "ANDROID_KEY_ALIAS         = ${ALIAS}"
echo "ANDROID_KEY_PASSWORD      = ${KEY_PW}"
echo
echo "⚠  Back up ${KEYSTORE} to a password manager. If you lose this file,"
echo "   you cannot ship updates to the same Play Store listing."
