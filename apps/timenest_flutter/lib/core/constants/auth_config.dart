/// Google OAuth 2.0 Web Client ID for Google Sign-In on Flutter Web.
///
/// To get this value:
/// 1. Go to https://console.firebase.google.com → timenest-d97da
/// 2. Authentication → Sign-in method → Google → Enable if not already
/// 3. Go to https://console.cloud.google.com/apis/credentials?project=timenest-d97da
/// 4. Under "OAuth 2.0 Client IDs", find the "Web client" entry
/// 5. Copy the Client ID (format: 523513677128-xxxx.apps.googleusercontent.com)
/// 6. Paste it below replacing the empty string.
///
/// Without this value, Google Sign-In will silently fail on Flutter Web.
class AuthConfig {
  AuthConfig._();

  static const String googleWebClientId =
      '523513677128-hv4j8iqum3blgov6p3k0uso9smknkcut.apps.googleusercontent.com';

  /// Google OAuth scopes requested during sign-in.
  static const List<String> googleScopes = [
    'email',
    'profile',
  ];
}
