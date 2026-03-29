import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../domain/user_entity.dart';

/// Repository that wraps Firebase Auth and Firestore user operations.
class AuthRepository {
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;
  final GoogleSignIn _googleSignIn;

  AuthRepository({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
    GoogleSignIn? googleSignIn,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn();

  // ── Stream of auth state changes ──

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentFirebaseUser => _auth.currentUser;

  // ── Google Sign-In ──

  Future<UserEntity> signInWithGoogle() async {
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) {
      throw AuthException('Google sign-in was cancelled.');
    }

    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final userCredential = await _auth.signInWithCredential(credential);
    return _syncUserToFirestore(userCredential);
  }

  // ── Email + Password Sign-In ──

  Future<UserEntity> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final userCredential = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    return _syncUserToFirestore(userCredential);
  }

  // ── Email + Password Sign-Up ──

  Future<UserEntity> signUpWithEmail({
    required String email,
    required String password,
    String? displayName,
  }) async {
    final userCredential = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );

    // Set display name on the Firebase Auth user.
    if (displayName != null) {
      await userCredential.user?.updateDisplayName(displayName);
    }

    return _syncUserToFirestore(userCredential, isNewUser: true);
  }

  // ── Phone / Mobile Sign-In ──

  /// Starts phone number verification. Firebase will either:
  /// - Auto-verify on Android (call [onCompleted])
  /// - Send an SMS and call [onCodeSent] with a verificationId
  Future<void> verifyPhoneNumber({
    required String phoneNumber,
    required void Function(PhoneAuthCredential credential) onCompleted,
    required void Function(FirebaseAuthException e) onFailed,
    required void Function(String verificationId, int? resendToken) onCodeSent,
    required void Function(String verificationId) onCodeAutoRetrievalTimeout,
    Duration timeout = const Duration(seconds: 60),
  }) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: onCompleted,
      verificationFailed: onFailed,
      codeSent: onCodeSent,
      codeAutoRetrievalTimeout: onCodeAutoRetrievalTimeout,
      timeout: timeout,
    );
  }

  /// Complete phone sign-in with the OTP code.
  Future<UserEntity> signInWithPhoneOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    final userCredential = await _auth.signInWithCredential(credential);
    return _syncUserToFirestore(userCredential);
  }

  // ── Password Reset ──

  Future<void> sendPasswordResetEmail(String email) async {
    await _auth.sendPasswordResetEmail(email: email);
  }

  // ── Sign Out ──

  Future<void> signOut() async {
    await Future.wait([
      _auth.signOut(),
      _googleSignIn.signOut(),
    ]);
  }

  // ── Firestore User Sync ──

  /// After any sign-in, ensure the user document exists in Firestore
  /// and return a [UserEntity].
  Future<UserEntity> _syncUserToFirestore(
    UserCredential credential, {
    bool isNewUser = false,
  }) async {
    final firebaseUser = credential.user;
    if (firebaseUser == null) {
      throw AuthException('Sign-in succeeded but no user was returned.');
    }

    final userDocRef = _firestore.collection('users').doc(firebaseUser.uid);
    final userDoc = await userDocRef.get();

    final entity = UserEntity.fromFirebaseUser(
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      phoneNumber: firebaseUser.phoneNumber,
      photoUrl: firebaseUser.photoURL,
      firestoreData: userDoc.exists ? userDoc.data() : null,
    );

    // Create or update the user document.
    if (!userDoc.exists || isNewUser) {
      await userDocRef.set(entity.toFirestore());
    } else {
      await userDocRef.update({
        'lastLoginAt': DateTime.now().toIso8601String(),
      });
    }

    return entity;
  }

  /// Fetch the current user entity from Firestore.
  Future<UserEntity?> getCurrentUserEntity() async {
    final firebaseUser = _auth.currentUser;
    if (firebaseUser == null) return null;

    final userDoc = await _firestore
        .collection('users')
        .doc(firebaseUser.uid)
        .get();

    return UserEntity.fromFirebaseUser(
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      phoneNumber: firebaseUser.phoneNumber,
      photoUrl: firebaseUser.photoURL,
      firestoreData: userDoc.exists ? userDoc.data() : null,
    );
  }
}

/// Custom exception for auth failures.
class AuthException implements Exception {
  final String message;
  const AuthException(this.message);

  @override
  String toString() => 'AuthException: $message';
}
