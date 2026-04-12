# TimeNest — End-to-End Setup & Publishing Guide

**Flutter + Firebase + Web | Google Play + App Store + Firebase Hosting**

---

## Part 1: Firebase Project Setup

### 1.1 Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **"Add project"**
2. Name it `timenest-app` and click Continue
3. Enable or skip Google Analytics, then click **Create project**
4. Wait for provisioning, then click Continue

### 1.2 Enable Authentication Providers

Navigate to **Build → Authentication → Sign-in method** and enable:

- **Email/Password:** Toggle ON. Optionally enable email link sign-in.
- **Google:** Toggle ON. Select your support email and save.
- **Phone:** Toggle ON. Add a test phone number (e.g., `+91 9876543210`, OTP `123456`) to avoid charges during development.

### 1.3 Create Firestore Database

1. Go to **Build → Firestore Database → Create database**
2. Select **"Start in test mode"** (we will secure rules before publishing)
3. Choose region `asia-south1` (Mumbai) for India-based users

### 1.4 Register Your Apps

#### Web App

1. **Project Settings → General → Your apps** → click the web icon (`</>`)
2. Register as `timenest-web`
3. Copy the `firebaseConfig` object into `firebase-config.js` in your project root

#### Android App

1. Click **Add app → Android** icon
2. Package name: `com.timenest.app`
3. Download `google-services.json` and place in `apps/timenest_flutter/android/app/`
4. Add SHA-1 fingerprint (run: `cd android && ./gradlew signingReport`)

#### iOS App

1. Click **Add app → iOS** icon
2. Bundle ID: `com.timenest.app`
3. Download `GoogleService-Info.plist` and place in `apps/timenest_flutter/ios/Runner/`

---

## Part 2: Flutter App Setup

### 2.1 Install Flutter

1. Download Flutter SDK from [flutter.dev](https://flutter.dev/docs/get-started/install)
2. Add Flutter to your system PATH
3. Run: `flutter doctor` (fix any issues it reports)
4. Install Android Studio with Android SDK, or VS Code with Flutter extension

### 2.2 Install Firebase CLI

1. Run: `npm install -g firebase-tools`
2. Run: `firebase login`
3. Run: `dart pub global activate flutterfire_cli`

### 2.3 Configure Firebase in Flutter

1. `cd apps/timenest_flutter`
2. Run: `flutterfire configure --project=YOUR_FIREBASE_PROJECT_ID`
3. This auto-generates `firebase_options.dart` with all platform configs
4. Run: `flutter pub get`
5. Run: `flutter run` (verify it builds and shows the login screen)

### 2.4 Google Sign-In Setup (Android)

1. Get your SHA-1: `cd android && ./gradlew signingReport`
2. Add SHA-1 to **Firebase Console → Project Settings → Android app → Add fingerprint**
3. Re-download `google-services.json` and replace the one in `android/app/`

### 2.5 Google Sign-In Setup (iOS)

1. Open `ios/Runner.xcworkspace` in Xcode
2. Add the `REVERSED_CLIENT_ID` from `GoogleService-Info.plist` as a URL Scheme
3. **Runner → Info → URL Types** → add the reversed client ID value

---

## Part 3: Web Prototype Setup

### 3.1 Add Firebase Config

1. Open `firebase-config.js` in your project root
2. Replace all `YOUR_*` placeholders with values from **Firebase Console → Project Settings → Web app**
3. Save the file. The `auth.js` module auto-loads Firebase when any page loads.

### 3.2 Test Locally

1. Run: `node server.js` (starts on port 4173)
2. Open `http://localhost:4173/login.html` in Chrome
3. Click **"Continue with Google"** to test Google Sign-In
4. Click **"Login with Email"** to test email/password sign-in
5. Click **"Login with Mobile"** to test phone OTP flow

### 3.3 Deploy to Firebase Hosting

1. Run: `firebase init hosting`
2. Set public directory to `.` (current folder)
3. Say **No** to single-page app rewrite
4. Run: `firebase deploy --only hosting`
5. Your site will be live at `https://YOUR_PROJECT_ID.web.app`

---

## Part 4: Publishing to App Stores

### 4.1 Google Play Store (Android)

#### Prerequisites

- Google Play Developer account ($25 one-time fee) at [play.google.com/console](https://play.google.com/console)
- A signed release App Bundle (.aab)

#### Build Release

1. Create a keystore:
   ```
   keytool -genkey -v -keystore ~/timenest-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias timenest
   ```
2. Create `apps/timenest_flutter/android/key.properties`:
   ```
   storePassword=YOUR_STORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=timenest
   storeFile=C:\\Users\\Vihaan\\timenest-release.jks
   ```
3. Update `android/app/build.gradle` to use the signing config
4. Run: `flutter build appbundle --release`
5. Output: `build/app/outputs/bundle/release/app-release.aab`

#### Upload to Play Console

1. Go to **Play Console → Create app** → fill in app details
2. Complete the Dashboard checklist: app content, store listing, pricing
3. Upload store screenshots (phone, 7-inch tablet, 10-inch tablet)
4. **Production → Create new release** → Upload `app-release.aab`
5. Submit for review (typically takes 1-3 days for first app)

### 4.2 Apple App Store (iOS)

#### Prerequisites

- Apple Developer account ($99/year) at [developer.apple.com](https://developer.apple.com)
- A Mac with Xcode installed
- An App Store Connect listing

#### Build & Upload

1. Run: `flutter build ios --release`
2. Open `ios/Runner.xcworkspace` in Xcode
3. Set the Bundle Identifier to `com.timenest.app`
4. Select your Apple Developer team under **Signing & Capabilities**
5. **Product → Archive → Distribute App → App Store Connect → Upload**
6. Go to **App Store Connect** → create the app listing, add screenshots, description
7. Select the uploaded build and submit for review (typically 1-2 days)

---

## Part 5: Firestore Security Rules

Before publishing, lock down your Firestore rules. Replace the test-mode rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Part 6: Pre-Launch Checklist

- [ ] **Firebase config:** `firebase-config.js` has real values (not placeholders)
- [ ] **Auth providers:** Google, Email/Password, and Phone are all enabled in Firebase Console
- [ ] **SHA-1 fingerprint:** Added to Firebase for Android Google Sign-In
- [ ] **iOS URL Scheme:** `REVERSED_CLIENT_ID` added to Xcode URL Types
- [ ] **Firestore rules:** Switched from test mode to production rules
- [ ] **App icons:** Generated for all sizes (use `flutter_launcher_icons` package)
- [ ] **Splash screen:** Configured with `flutter_native_splash`
- [ ] **Store listings:** Screenshots, descriptions, and privacy policy URL ready
- [ ] **Privacy policy:** Required by both stores. Host on your Firebase Hosting site.
- [ ] **Test all auth flows:** Google, email, phone OTP on both web and mobile
- [ ] **Offline mode:** Verify Firestore persistence works when device is offline

---

*Generated for Prasad | TimeNest Project | March 2026*
