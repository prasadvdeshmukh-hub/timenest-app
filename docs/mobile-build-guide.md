# TimeNest mobile build & publish guide

End-to-end instructions for producing Android APKs, a Play Store AAB, and an
iOS IPA from the Flutter source in `apps/timenest_flutter/`, plus publishing to
Google Play Store and Microsoft Intune.

---

## 0. What you need, once

| Thing                                                             | Required for             |
|-------------------------------------------------------------------|--------------------------|
| Flutter SDK 3.24+ (https://docs.flutter.dev/get-started/install)  | Any local build          |
| JDK 17 (Temurin)                                                  | Android                  |
| Android Studio (for the Android SDK + emulator)                   | Android                  |
| macOS + Xcode 15+ + CocoaPods                                     | iOS local build          |
| Google Play Console account (one-time $25)                        | Play Store publishing    |
| Apple Developer account ($99/yr) or Enterprise ($299/yr)          | Signed .ipa + Intune iOS |
| Microsoft Intune admin access (you already have this)             | Intune LOB upload        |

If you don't have a Mac, use the **GitHub Actions** path in section 3 — it
produces both APK and IPA without any local setup.

---

## 1. First-time project setup

The Flutter project currently only has `lib/` and `web/`. The `android/` and
`ios/` folders are generated on demand. Run the bootstrap once:

```bash
git clone https://github.com/<you>/prasadvdeshmukh-hub.github.io.git timenest
cd timenest
bash apps/timenest_flutter/scripts/bootstrap-mobile.sh
```

That script:

1. Runs `flutter create --platforms=android,ios --org=com.timenest .`
2. Runs `scripts/patch-android.sh` — sets `applicationId = com.timenest.app`,
   wires the Google Services gradle plugin, adds INTERNET permission, and
   inserts the release signing config.
3. Runs `scripts/patch-ios.sh` (macOS only) — sets `PRODUCT_BUNDLE_IDENTIFIER =
   com.timenest.app`, bumps `IPHONEOS_DEPLOYMENT_TARGET` to 13.0, sets the
   display name to TimeNest.
4. Runs `flutter pub get`.
5. Warns if `google-services.json` / `GoogleService-Info.plist` are missing.

### Firebase native configs

Firebase's web-only config is already in place. For Android/iOS native builds
you must also register those platforms in the Firebase console:

1. Go to https://console.firebase.google.com/project/timenest-d97da/settings/general
2. "Your apps" → Add app → **Android** → package name `com.timenest.app` →
   download `google-services.json` → save to
   `apps/timenest_flutter/android/app/google-services.json`.
3. Repeat with **iOS** → bundle ID `com.timenest.app` → download
   `GoogleService-Info.plist` → save to
   `apps/timenest_flutter/ios/Runner/GoogleService-Info.plist`.

Or automate it:

```bash
cd apps/timenest_flutter
flutterfire configure --project=timenest-d97da
```

---

## 2. Local builds

### 2a. Debug APK (fastest — install on your phone in minutes)

```bash
cd apps/timenest_flutter
flutter build apk --debug
# → build/app/outputs/flutter-apk/app-debug.apk
```

Transfer to the phone any way you like (USB, Google Drive, email to yourself)
and install. Android will warn you because it's unsigned-for-release — accept
"Install from unknown source".

### 2b. Signed release APK + AAB (required for Play Store / Intune)

Generate the upload keystore once — **keep this file safe forever**:

```bash
bash apps/timenest_flutter/scripts/generate-keystore.sh
```

The script prompts for passwords, writes `android/upload-keystore.jks` +
`android/key.properties`, adds both to `.gitignore`, and prints the base64 blob
you'll need for GitHub Actions secrets.

Then:

```bash
cd apps/timenest_flutter
flutter build apk --release
# → build/app/outputs/flutter-apk/app-release.apk   (for Intune LOB + sideload)

flutter build appbundle --release
# → build/app/outputs/bundle/release/app-release.aab  (for Play Store)
```

### 2c. iOS IPA (macOS only)

```bash
cd apps/timenest_flutter/ios
pod install --repo-update
cd ..
open ios/Runner.xcworkspace
```

In Xcode:

1. Select "Any iOS Device (arm64)" as destination.
2. **Signing & Capabilities** → your Apple Developer team.
3. Product → Archive.
4. When the Organizer opens, Distribute App → **App Store Connect** (for App
   Store / Intune) or **Development** (for local install via `ios-deploy` /
   Apple Configurator).

An unsigned .ipa is also produced by the CI workflow — useful for inspection
but it will NOT install on a device without re-signing.

---

## 3. CI builds (no local Flutter needed)

A workflow at `.github/workflows/build-mobile.yml` produces all artifacts on
GitHub's infrastructure.

### How to run it

- **Automatic**: every push to `main` that touches `apps/timenest_flutter/**`.
- **Manual**: GitHub → Actions → "Build mobile binaries" → Run workflow.

### Artifacts

After the run completes, scroll to the bottom of the run summary. Under
"Artifacts" you'll see:

- `timenest-android-debug` — unsigned debug APK (always produced)
- `timenest-android-release` — signed release APK (only if you set the secrets
  below)
- `timenest-android-playstore-aab` — signed bundle ready for Play Store
- `timenest-ios-unsigned` — unsigned IPA (always produced on macOS job)

### Secrets to set (Settings → Secrets and variables → Actions)

| Secret name                 | What to paste                                                           |
|-----------------------------|-------------------------------------------------------------------------|
| `ANDROID_KEYSTORE_BASE64`   | Output of `base64 < android/upload-keystore.jks` (generate-keystore.sh prints it) |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password you chose                                         |
| `ANDROID_KEY_ALIAS`         | `upload` (default)                                                      |
| `ANDROID_KEY_PASSWORD`      | The key password you chose                                              |
| `GOOGLE_SERVICES_JSON`      | `base64 < apps/timenest_flutter/android/app/google-services.json`       |
| `GOOGLE_SERVICE_INFO_PLIST` | `base64 < apps/timenest_flutter/ios/Runner/GoogleService-Info.plist`    |

Without the Android secrets the workflow still produces a debug APK and the
iOS unsigned IPA.

---

## 4. Publish to Google Play Store

### One-time Play Console setup

1. https://play.google.com/console — pay the $25, verify identity, set up
   developer account.
2. Create app → App name "TimeNest", default language English (US), type App,
   free. Accept declarations.
3. **Set up app** section on the left — work through each card:
   - App access (if there's login, note that login is required; Google will
     review).
   - Ads (select No).
   - Content rating questionnaire.
   - Target audience — age 13+ recommended.
   - Data safety — you store email + Firebase user data. Declare: personal
     info (email, name, user IDs), app activity (task/goal content),
     transmitted + stored, encrypted in transit, users can request deletion.
   - Privacy policy URL — required. Host a simple page, e.g.
     `https://timenest-d97da.web.app/privacy.html`.
   - Main store listing — short description (80 chars), full description,
     screenshots (min 2 phone), feature graphic (1024×500), icon 512×512.

### Release

1. Testing → **Internal testing** → Create release → upload
   `app-release.aab` → add release notes → save → review → rollout to
   internal testers. Invite yourself as tester, install via the opt-in link,
   verify it works.
2. When ready for public: promote internal release → Production, fill store
   listing gaps, submit for review. First review typically takes 1–7 days.

### Version bumps

Every release must have a higher `versionCode`. Increment `pubspec.yaml`:

```yaml
version: 1.0.1+2   # 1.0.1 = versionName, +2 = versionCode
```

Commit, build, upload.

---

## 5. Publish to Microsoft Intune (Android LOB)

Because TimeNest isn't a managed Google Play app yet, you'll distribute the
APK directly as an Android Line-of-Business app in Intune. This works for
enrolled Android Enterprise devices.

1. Produce a signed release APK (`app-release.apk`) via section 2b or 3.
2. Intune admin center → Apps → Android → Add → App type: **Line-of-business
   app** → Next.
3. Upload `app-release.apk`. Intune reads the manifest — confirm package name
   `com.timenest.app`.
4. App information:
   - Name: TimeNest
   - Description: paste from your Play listing
   - Publisher: your company / "TimeNest"
   - Minimum OS: Android 6.0
   - Logo: upload the 512×512 icon
5. Assignments → Required / Available for enrolled devices → choose the
   group(s) of users/devices.
6. Review + create.

Updates: repeat with a new APK that has a higher `versionCode`. Intune will
push the update to enrolled devices automatically.

### iOS via Intune (heads up)

Distributing a custom iOS app through Intune requires one of:

- **App Store (public)** — submit to App Store, then add as Store app in
  Intune.
- **Apple Business Manager + Volume Purchase Program** — same as above but
  the app is licensed via your org (requires a public App Store listing or
  Custom App distribution).
- **Apple Developer Enterprise Program** ($299/yr, strict eligibility) —
  allows signing an .ipa with an enterprise cert for direct MDM push.

You currently don't have an Apple Developer account. Easiest path for iOS
later: enroll in the $99/yr program and publish to App Store, then wire it
into Intune as a Store app. The CI unsigned .ipa can be re-signed by anyone
with a Developer account for early testing in the meantime.

---

## 6. Common pitfalls

- **"Package name is already used"** on Play Console upload — someone
  registered `com.timenest.app` before you. Pick a new ID (e.g.
  `com.prasadvdeshmukh.timenest`), update
  `scripts/patch-android.sh` + `firebase_options_placeholder.dart`, re-run
  bootstrap.
- **Google sign-in fails on installed APK** — you need to register the SHA-1
  fingerprint of the signing key in Firebase console (Project settings →
  General → Your apps → Android → Add fingerprint). Get it with:

  ```bash
  keytool -list -v -keystore apps/timenest_flutter/android/upload-keystore.jks -alias upload
  ```

  Copy the `SHA1:` line into Firebase, then re-download `google-services.json`.
- **Play Console rejects AAB: "signed with debug key"** — you uploaded the
  debug build. Use `flutter build appbundle --release` and ensure
  `key.properties` exists.
- **iOS build fails: "No profile for team matching"** — Xcode needs an active
  Apple Developer team in Signing & Capabilities. Unsigned CI builds skip
  this; signed local builds require it.
- **Intune LOB APK upload: "APK is not signed"** — you uploaded the debug
  build. Only release-signed APKs are accepted.

---

## 7. Quick reference

```bash
# Local debug APK
(cd apps/timenest_flutter && flutter build apk --debug)

# Local signed release APK
(cd apps/timenest_flutter && flutter build apk --release)

# Local Play Store AAB
(cd apps/timenest_flutter && flutter build appbundle --release)

# iOS local (macOS + Xcode)
(cd apps/timenest_flutter && flutter build ios --release)

# CI: push to main OR
#   GitHub → Actions → Build mobile binaries → Run workflow
#   Download artifacts from the run summary.
```
