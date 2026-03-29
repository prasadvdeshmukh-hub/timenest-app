import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/goal_model.dart';

/// Firestore CRUD for goals at `users/{uid}/goals/{goalId}`.
class GoalRepository {
  final FirebaseFirestore _firestore;
  final FirebaseAuth _auth;

  GoalRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? auth,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance;

  CollectionReference<Map<String, dynamic>> get _goalsRef {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('User not authenticated');
    return _firestore.collection('users').doc(uid).collection('goals');
  }

  /// Stream all goals for the current user.
  Stream<List<GoalModel>> watchGoals() {
    return _goalsRef
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => GoalModel.fromFirestore(doc.id, doc.data()))
            .toList());
  }

  /// Stream goals filtered by type.
  Stream<List<GoalModel>> watchGoalsByType(GoalType type) {
    return _goalsRef
        .where('type', isEqualTo: type.name)
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => GoalModel.fromFirestore(doc.id, doc.data()))
            .toList());
  }

  /// Get a single goal by ID.
  Future<GoalModel?> getGoal(String goalId) async {
    final doc = await _goalsRef.doc(goalId).get();
    if (!doc.exists) return null;
    return GoalModel.fromFirestore(doc.id, doc.data()!);
  }

  /// Create a new goal. Returns the generated document ID.
  Future<String> createGoal(GoalModel goal) async {
    final docRef = await _goalsRef.add(goal.toFirestore());
    return docRef.id;
  }

  /// Update an existing goal.
  Future<void> updateGoal(GoalModel goal) async {
    await _goalsRef.doc(goal.id).update(goal.toFirestore());
  }

  /// Delete a goal and all its tasks.
  Future<void> deleteGoal(String goalId) async {
    // Delete child tasks first.
    final taskSnap = await _goalsRef.doc(goalId).collection('tasks').get();
    final batch = _firestore.batch();
    for (final doc in taskSnap.docs) {
      batch.delete(doc.reference);
    }
    batch.delete(_goalsRef.doc(goalId));
    await batch.commit();
  }

  /// Create the three default sample goals for a new user.
  Future<void> createDefaultGoals() async {
    final now = DateTime.now();
    final defaults = [
      GoalModel(
        id: '',
        name: 'Fitness Goal',
        description: 'Build a consistent 30-day workout routine.',
        type: GoalType.shortTerm,
        startDate: now,
        targetDate: now.add(const Duration(days: 30)),
        isDefaultSample: true,
        createdAt: now,
        updatedAt: now,
      ),
      GoalModel(
        id: '',
        name: 'Financial Goal',
        description: 'Set up an emergency fund and monthly budget tracker.',
        type: GoalType.shortTerm,
        startDate: now,
        targetDate: now.add(const Duration(days: 60)),
        isDefaultSample: true,
        createdAt: now,
        updatedAt: now,
      ),
      GoalModel(
        id: '',
        name: 'Learning Goal',
        description: 'Complete a Flutter course and build a portfolio project.',
        type: GoalType.longTerm,
        startDate: now,
        targetDate: now.add(const Duration(days: 180)),
        isDefaultSample: true,
        createdAt: now,
        updatedAt: now,
      ),
    ];

    for (final goal in defaults) {
      await createGoal(goal);
    }
  }
}
