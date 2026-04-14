import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/habit_model.dart';

/// Firestore CRUD for habits at `users/{uid}/habits/{habitId}`.
class HabitRepository {
  final FirebaseFirestore _firestore;
  final FirebaseAuth _auth;

  HabitRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? auth,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance;

  CollectionReference<Map<String, dynamic>> get _habitsRef {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('User not authenticated');
    return _firestore.collection('users').doc(uid).collection('habits');
  }

  /// Stream all habits for the current user.
  Stream<List<HabitModel>> watchHabits() {
    return _habitsRef
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => HabitModel.fromFirestore(doc.id, doc.data()))
            .toList());
  }

  Future<HabitModel?> getHabit(String habitId) async {
    final doc = await _habitsRef.doc(habitId).get();
    if (!doc.exists) return null;
    return HabitModel.fromFirestore(doc.id, doc.data()!);
  }

  Future<String> createHabit(HabitModel habit) async {
    final ref = await _habitsRef.add(habit.toFirestore());
    return ref.id;
  }

  Future<void> updateHabit(HabitModel habit) async {
    await _habitsRef.doc(habit.id).update(habit.toFirestore());
  }

  Future<void> deleteHabit(String habitId) async {
    await _habitsRef.doc(habitId).delete();
  }

  /// Record a check-in for today. Increments the streak if the previous
  /// check-in was yesterday (or the habit has no history yet), otherwise
  /// resets to 1. No-op if already checked in today.
  Future<void> checkIn(String habitId) async {
    final habit = await getHabit(habitId);
    if (habit == null) return;
    if (habit.isCheckedToday) return;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    int nextStreak;
    if (habit.lastCheckIn != null) {
      final last = habit.lastCheckIn!;
      final lastDay = DateTime(last.year, last.month, last.day);
      if (lastDay == yesterday) {
        nextStreak = habit.streakDays + 1;
      } else if (lastDay == today) {
        nextStreak = habit.streakDays;
      } else {
        nextStreak = 1;
      }
    } else {
      nextStreak = 1;
    }

    final nextHistory = Map<String, bool>.from(habit.history);
    nextHistory[HabitModel.dateKey(today)] = true;

    final updated = habit.copyWith(
      streakDays: nextStreak,
      bestStreakDays:
          nextStreak > habit.bestStreakDays ? nextStreak : habit.bestStreakDays,
      lastCheckIn: now,
      history: nextHistory,
    );
    await updateHabit(updated);
  }

  /// Undo today's check-in (if any).
  Future<void> undoCheckIn(String habitId) async {
    final habit = await getHabit(habitId);
    if (habit == null) return;
    if (!habit.isCheckedToday) return;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final nextHistory = Map<String, bool>.from(habit.history);
    nextHistory.remove(HabitModel.dateKey(today));

    final updated = habit.copyWith(
      streakDays:
          habit.streakDays > 0 ? habit.streakDays - 1 : 0,
      // Don't mutate bestStreakDays on undo.
      lastCheckIn: null,
      history: nextHistory,
    );
    await updateHabit(updated);
  }
}
