/// TEMPORARY Firebase options until `flutterfire configure` is run.
///
/// To generate the proper file, run on your local machine:
///   cd apps/timenest_flutter
///   flutterfire configure --project=timenest-d97da
///
/// That will create the real firebase_options.dart with native platform keys.
/// For now, this provides the web config so the app can initialize Firebase.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDinsnfdoCG_jqS76T7VwZIiVKtufek2pk',
    appId: '1:523513677128:web:da05d89190ff7ae6921f7d',
    messagingSenderId: '523513677128',
    projectId: 'timenest-d97da',
    authDomain: 'timenest-d97da.firebaseapp.com',
    storageBucket: 'timenest-d97da.firebasestorage.app',
    measurementId: 'G-L03YXN8Z7J',
  );

  // TODO: Replace with real Android config after running flutterfire configure
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDinsnfdoCG_jqS76T7VwZIiVKtufek2pk',
    appId: '1:523513677128:web:da05d89190ff7ae6921f7d',
    messagingSenderId: '523513677128',
    projectId: 'timenest-d97da',
    storageBucket: 'timenest-d97da.firebasestorage.app',
  );

  // TODO: Replace with real iOS config after running flutterfire configure
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDinsnfdoCG_jqS76T7VwZIiVKtufek2pk',
    appId: '1:523513677128:web:da05d89190ff7ae6921f7d',
    messagingSenderId: '523513677128',
    projectId: 'timenest-d97da',
    storageBucket: 'timenest-d97da.firebasestorage.app',
    iosBundleId: 'com.timenest.app',
  );
}
