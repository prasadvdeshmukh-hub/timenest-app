import 'package:equatable/equatable.dart';

/// Core user entity used across the app.
/// Maps to Firestore: collections/users/{userId}
class UserEntity extends Equatable {
  final String uid;
  final String? displayName;
  final String? email;
  final String? phoneNumber;
  final String? photoUrl;
  final String preferredLanguage;
  final String themeMode;
  final DateTime createdAt;
  final DateTime lastLoginAt;
  final bool onboardingCompleted;

  const UserEntity({
    required this.uid,
    this.displayName,
    this.email,
    this.phoneNumber,
    this.photoUrl,
    this.preferredLanguage = 'en',
    this.themeMode = 'dark',
    required this.createdAt,
    required this.lastLoginAt,
    this.onboardingCompleted = false,
  });

  /// Create from Firebase Auth user + optional Firestore data.
  factory UserEntity.fromFirebaseUser({
    required String uid,
    String? displayName,
    String? email,
    String? phoneNumber,
    String? photoUrl,
    Map<String, dynamic>? firestoreData,
  }) {
    final now = DateTime.now();
    return UserEntity(
      uid: uid,
      displayName: displayName ?? firestoreData?['displayName'],
      email: email ?? firestoreData?['email'],
      phoneNumber: phoneNumber ?? firestoreData?['phoneNumber'],
      photoUrl: photoUrl ?? firestoreData?['photoUrl'],
      preferredLanguage:
          firestoreData?['preferredLanguage'] as String? ?? 'en',
      themeMode: firestoreData?['themeMode'] as String? ?? 'dark',
      createdAt: firestoreData?['createdAt'] != null
          ? DateTime.parse(firestoreData!['createdAt'] as String)
          : now,
      lastLoginAt: now,
      onboardingCompleted:
          firestoreData?['onboardingCompleted'] as bool? ?? false,
    );
  }

  /// Serialize to Firestore document.
  Map<String, dynamic> toFirestore() => {
        'displayName': displayName,
        'email': email,
        'phoneNumber': phoneNumber,
        'photoUrl': photoUrl,
        'preferredLanguage': preferredLanguage,
        'themeMode': themeMode,
        'createdAt': createdAt.toIso8601String(),
        'lastLoginAt': lastLoginAt.toIso8601String(),
        'onboardingCompleted': onboardingCompleted,
      };

  UserEntity copyWith({
    String? displayName,
    String? email,
    String? phoneNumber,
    String? photoUrl,
    String? preferredLanguage,
    String? themeMode,
    bool? onboardingCompleted,
  }) =>
      UserEntity(
        uid: uid,
        displayName: displayName ?? this.displayName,
        email: email ?? this.email,
        phoneNumber: phoneNumber ?? this.phoneNumber,
        photoUrl: photoUrl ?? this.photoUrl,
        preferredLanguage: preferredLanguage ?? this.preferredLanguage,
        themeMode: themeMode ?? this.themeMode,
        createdAt: createdAt,
        lastLoginAt: lastLoginAt,
        onboardingCompleted: onboardingCompleted ?? this.onboardingCompleted,
      );

  @override
  List<Object?> get props => [
        uid,
        displayName,
        email,
        phoneNumber,
        photoUrl,
        preferredLanguage,
        themeMode,
        createdAt,
        lastLoginAt,
        onboardingCompleted,
      ];
}
