#!/usr/bin/env bash
# Patch the `flutter create`-generated android/ scaffolding so TimeNest builds
# cleanly with Firebase, FCM, and the production applicationId.
#
# Usage:
#   bash scripts/patch-android.sh com.timenest.app
#
# Idempotent — safe to re-run.

set -euo pipefail

APPLICATION_ID="${1:-com.timenest.app}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${APP_DIR}"

if [ ! -d android ]; then
  echo "error: android/ not found. Run 'flutter create --platforms=android .' first." >&2
  exit 1
fi

echo "→ Setting applicationId to ${APPLICATION_ID}"

# ── 1. applicationId + namespace ────────────────────────────────────────────
APP_GRADLE="android/app/build.gradle"
APP_GRADLE_KTS="android/app/build.gradle.kts"

if [ -f "${APP_GRADLE_KTS}" ]; then
  BUILD_GRADLE="${APP_GRADLE_KTS}"
elif [ -f "${APP_GRADLE}" ]; then
  BUILD_GRADLE="${APP_GRADLE}"
else
  echo "error: no android/app/build.gradle(.kts) found" >&2
  exit 1
fi
echo "  patching ${BUILD_GRADLE}"

# applicationId "whatever" → applicationId "com.timenest.app"
sed -i.bak -E "s|applicationId(\s*=\s*|\s+)\"[^\"]+\"|applicationId\1\"${APPLICATION_ID}\"|" "${BUILD_GRADLE}"
# namespace "whatever" → namespace "com.timenest.app"
sed -i.bak -E "s|namespace(\s*=\s*|\s+)\"[^\"]+\"|namespace\1\"${APPLICATION_ID}\"|" "${BUILD_GRADLE}"
rm -f "${BUILD_GRADLE}.bak"

# ── 2. minSdk note ──────────────────────────────────────────────────────────
# flutter create sets minSdk=21 which is fine for firebase_auth 5.x.
# If you later need a higher minSdk, edit ${BUILD_GRADLE} manually.

# ── 3. Ensure Google services plugin is applied ─────────────────────────────
if ! grep -q "google-services" "${BUILD_GRADLE}"; then
  echo "  appending google-services plugin to ${BUILD_GRADLE}"
  printf '\napply plugin: "com.google.gms.google-services"\n' >> "${BUILD_GRADLE}"
fi

# Top-level build.gradle(.kts) needs the classpath / plugins block
TOP_GRADLE="android/build.gradle"
TOP_GRADLE_KTS="android/build.gradle.kts"
SETTINGS_GRADLE="android/settings.gradle"
SETTINGS_GRADLE_KTS="android/settings.gradle.kts"

# New Flutter template uses settings.gradle plugins{} — inject google-services there.
for f in "${SETTINGS_GRADLE_KTS}" "${SETTINGS_GRADLE}"; do
  if [ -f "$f" ] && ! grep -q "com.google.gms.google-services" "$f"; then
    echo "  adding com.google.gms.google-services plugin id to $f"
    # Insert after last 'id("...' line in plugins block
    python3 - "$f" <<'PY'
import re, sys, pathlib
p = pathlib.Path(sys.argv[1])
txt = p.read_text()
if 'com.google.gms.google-services' in txt:
    sys.exit(0)
# plugins { ... id("com.android.application") ...  }
m = re.search(r'(plugins\s*\{[^}]*?)(\n\s*\})', txt, re.DOTALL)
if m:
    inject = '\n    id("com.google.gms.google-services") version "4.4.2" apply false'
    txt = txt[:m.start(2)] + inject + txt[m.start(2):]
    p.write_text(txt)
PY
  fi
done

# Older template uses top-level build.gradle buildscript classpath
for f in "${TOP_GRADLE_KTS}" "${TOP_GRADLE}"; do
  if [ -f "$f" ] && ! grep -q "com.google.gms:google-services" "$f"; then
    echo "  adding classpath 'com.google.gms:google-services' to $f"
    python3 - "$f" <<'PY'
import re, sys, pathlib
p = pathlib.Path(sys.argv[1])
txt = p.read_text()
if 'com.google.gms:google-services' in txt:
    sys.exit(0)
# Try to inject into buildscript { dependencies { ... } }
m = re.search(r'(buildscript\s*\{[^{}]*dependencies\s*\{)', txt, re.DOTALL)
if m:
    end = m.end()
    inject = '\n        classpath("com.google.gms:google-services:4.4.2")'
    txt = txt[:end] + inject + txt[end:]
    p.write_text(txt)
PY
  fi
done

# ── 4. Manifest: INTERNET + FCM icon (optional) ─────────────────────────────
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "${MANIFEST}" ]; then
  if ! grep -q 'android.permission.INTERNET' "${MANIFEST}"; then
    echo "  adding INTERNET permission to AndroidManifest.xml"
    sed -i.bak 's|<manifest |<manifest xmlns:android="http://schemas.android.com/apk/res/android" |' "${MANIFEST}" 2>/dev/null || true
    sed -i.bak 's|<application |<uses-permission android:name="android.permission.INTERNET"/>\n    <application |' "${MANIFEST}"
    rm -f "${MANIFEST}.bak"
  fi
fi

# ── 5. key.properties wiring in app/build.gradle ─────────────────────────────
# Only apply if a signing block isn't already present.
if ! grep -q "keystoreProperties" "${BUILD_GRADLE}"; then
  echo "  wiring signingConfig release from key.properties"
  python3 - "${BUILD_GRADLE}" <<'PY'
import pathlib, sys, re
p = pathlib.Path(sys.argv[1])
txt = p.read_text()
if 'keystoreProperties' in txt:
    sys.exit(0)

groovy = p.suffix != '.kts'

if groovy:
    preamble = '''\
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

'''
    signing_block = '''\
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties["keyAlias"]
                keyPassword keystoreProperties["keyPassword"]
                storeFile file(keystoreProperties["storeFile"])
                storePassword keystoreProperties["storePassword"]
            }
        }
    }
'''
    # inject preamble before `android {`
    txt = re.sub(r'(android\s*\{)', preamble + r'\1', txt, count=1)
    # inject signingConfigs inside `android {`
    txt = re.sub(r'(android\s*\{)', r'\1\n' + signing_block, txt, count=1)
    # swap release buildType's signingConfig.debug → release (if keystore present)
    txt = re.sub(
        r'(buildTypes\s*\{[^}]*release\s*\{[^}]*?)signingConfig\s+signingConfigs\.debug',
        r'\1signingConfig keystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug',
        txt, flags=re.DOTALL)
else:
    # Kotlin DSL
    preamble = '''\
import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

'''
    signing_block = '''\
    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }
'''
    txt = re.sub(r'(android\s*\{)', preamble + r'\1', txt, count=1)
    txt = re.sub(r'(android\s*\{)', r'\1\n' + signing_block, txt, count=1)
    txt = re.sub(
        r'(buildTypes\s*\{[^}]*release\s*\{[^}]*?)signingConfig\s*=\s*signingConfigs\.getByName\("debug"\)',
        r'\1signingConfig = if (keystorePropertiesFile.exists()) signingConfigs.getByName("release") else signingConfigs.getByName("debug")',
        txt, flags=re.DOTALL)

p.write_text(txt)
PY
fi

echo "✓ Android patches applied"
