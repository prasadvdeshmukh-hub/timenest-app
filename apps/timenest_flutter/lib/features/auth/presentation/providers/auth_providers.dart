import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/auth_repository.dart';
import '../../domain/auth_state.dart';
import '../../domain/user_entity.dart';

/// Singleton provider for [AuthRepository].
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

/// Streams Firebase auth state changes (logged in / logged out).
final authStateChangesProvider = StreamProvider<User?>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return repo.authStateChanges;
});

/// Main auth notifier that drives the UI.
final authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider), ref);
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repo;
  final Ref _ref;
  StreamSubscription<User?>? _authSub;

  AuthNotifier(this._repo, this._ref) : super(const AuthInitial()) {
    _listenToAuthChanges();
  }

  void _listenToAuthChanges() {
    _authSub = _repo.authStateChanges.listen((firebaseUser) async {
      if (firebaseUser == null) {
        state = const AuthUnauthenticated();
      } else {
        try {
          final entity = await _repo.getCurrentUserEntity();
          if (entity != null) {
            state = AuthAuthenticated(entity);
          } else {
            state = const AuthUnauthenticated();
          }
        } catch (e) {
          state = AuthError(e.toString());
        }
      }
    });
  }

  // ── Google Sign-In ──

  Future<void> signInWithGoogle() async {
    state = const AuthLoading();
    try {
      final user = await _repo.signInWithGoogle();
      state = AuthAuthenticated(user);
    } on AuthException catch (e) {
      state = AuthError(e.message);
    } on FirebaseAuthException catch (e) {
      state = AuthError(_mapFirebaseError(e));
    } catch (e) {
      state = AuthError('An unexpected error occurred. Please try again.');
    }
  }

  // ── Email Sign-In ──

  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    state = const AuthLoading();
    try {
      final user = await _repo.signInWithEmail(
        email: email,
        password: password,
      );
      state = AuthAuthenticated(user);
    } on FirebaseAuthException catch (e) {
      state = AuthError(_mapFirebaseError(e));
    } catch (e) {
      state = AuthError('An unexpected error occurred. Please try again.');
    }
  }

  // ── Email Sign-Up ──

  Future<void> signUpWithEmail({
    required String email,
    required String password,
    String? displayName,
  }) async {
    state = const AuthLoading();
    try {
      final user = await _repo.signUpWithEmail(
        email: email,
        password: password,
        displayName: displayName,
      );
      state = AuthAuthenticated(user);
    } on FirebaseAuthException catch (e) {
      state = AuthError(_mapFirebaseError(e));
    } catch (e) {
      state = AuthError('An unexpected error occurred. Please try again.');
    }
  }

  // ── Phone Verification ──

  /// Triggers the phone verification flow.
  /// Returns the verificationId via [onCodeSent] callback.
  Future<void> startPhoneVerification({
    required String phoneNumber,
    required void Function(String verificationId) onCodeSent,
    required void Function(String error) onError,
  }) async {
    state = const AuthLoading();
    await _repo.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      onCompleted: (credential) async {
        // Auto-verified on Android — sign in immediately.
        try {
          final userCredential =
              await FirebaseAuth.instance.signInWithCredential(credential);
          final entity = await _repo.getCurrentUserEntity();
          if (entity != null) {
            state = AuthAuthenticated(entity);
          }
        } catch (e) {
          state = AuthError(e.toString());
        }
      },
      onFailed: (e) {
        state = AuthError(_mapFirebaseError(e));
        onError(_mapFirebaseError(e));
      },
      onCodeSent: (verificationId, _) {
        state = const AuthUnauthenticated(); // back to input state
        onCodeSent(verificationId);
      },
      onCodeAutoRetrievalTimeout: (_) {},
    );
  }

  /// Complete phone sign-in with the OTP.
  Future<void> verifyPhoneOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    state = const AuthLoading();
    try {
      final user = await _repo.signInWithPhoneOtp(
        verificationId: verificationId,
        smsCode: smsCode,
      );
      state = AuthAuthenticated(user);
    } on FirebaseAuthException catch (e) {
      state = AuthError(_mapFirebaseError(e));
    } catch (e) {
      state = AuthError('Invalid OTP. Please try again.');
    }
  }

  // ── Password Reset ──

  Future<bool> sendPasswordReset(String email) async {
    try {
      await _repo.sendPasswordResetEmail(email);
      return true;
    } catch (e) {
      state = AuthError('Could not send reset email. Please check your email address.');
      return false;
    }
  }

  // ── Sign Out ──

  Future<void> signOut() async {
    await _repo.signOut();
    state = const AuthUnauthenticated();
  }

  // ── Helpers ──

  String _mapFirebaseError(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'No account found with this email.';
      case 'wrong-password':
        return 'Incorrect password. Please try again.';
      case 'email-already-in-use':
        return 'An account already exists with this email.';
      case 'weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'invalid-verification-code':
        return 'Invalid OTP code. Please try again.';
      case 'invalid-phone-number':
        return 'Please enter a valid phone number with country code.';
      default:
        return e.message ?? 'Authentication failed. Please try again.';
    }
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }
}
