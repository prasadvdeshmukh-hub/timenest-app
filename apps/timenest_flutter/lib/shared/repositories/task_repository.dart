import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/task_model.dart';

/// Firestore CRUD for tasks at `users/{uid}/goals/{goalId}/tasks/{taskId}`.
class TaskRepository {
  final FirebaseFirestore _firestore;
  final FirebaseAuth _auth;

  TaskRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? auth,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance;

  String get _uid {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('User not authenticated');
    return uid;
  }

  CollectionReference<Map<String, dynamic>> _tasksRef(String goalId) {
    return _firestore
        .collection('users')
        .doc(_uid)
        .collection('goals')
        .doc(goalId)
        .collection('tasks');
  }

  /// Stream tasks for a specific goal.
  Stream<List<TaskModel>> watchTasksForGoal(String goalId) {
    return _tasksRef(goalId)
        .orderBy('deadlineDate')
        .snapshots()
        .map((snap) => snap.docs
            .map((doc) => TaskModel.fromFirestore(doc.id, doc.data()))
            .toList());
  }

  /// Stream all tasks across all goals by iterating each goal's tasks subcollection.
  Stream<List<TaskModel>> watchAllTasks(Stream<List<String>> goalIdsStream) {
    return goalIdsStream.asyncExpand((goalIds) {
      if (goalIds.isEmpty) return Stream.value(<TaskModel>[]);
      final streams = goalIds.map((gid) => watchTasksForGoal(gid));
      return streams.first.asyncExpand((_) {
        // Combine all goal task streams into one merged list.
        return Stream.fromFuture(Future.wait(
          goalIds.map((gid) => _tasksRef(gid)
              .orderBy('deadlineDate')
              .get()
              .then((snap) => snap.docs
                  .map((doc) => TaskModel.fromFirestore(doc.id, doc.data()))
                  .toList())),
        ).then((lists) => lists.expand((l) => l).toList()
          ..sort((a, b) => a.deadlineDate.compareTo(b.deadlineDate))));
      });
    });
  }

  /// Get all tasks across all goals (one-shot).
  Future<List<TaskModel>> getAllTasks(List<String> goalIds) async {
    final tasks = <TaskModel>[];
    for (final goalId in goalIds) {
      final snap = await _tasksRef(goalId).orderBy('deadlineDate').get();
      tasks.addAll(
        snap.docs.map((doc) => TaskModel.fromFirestore(doc.id, doc.data())),
      );
    }
    tasks.sort((a, b) => a.deadlineDate.compareTo(b.deadlineDate));
    return tasks;
  }

  /// Skip a task.
  Future<void> skipTask(String goalId, String taskId) async {
    await _tasksRef(goalId).doc(taskId).update({
      'status': 'skipped',
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }

  /// Snooze a task by pushing deadline forward by 1 hour.
  Future<void> snoozeTask(String goalId, String taskId) async {
    final doc = await _tasksRef(goalId).doc(taskId).get();
    if (!doc.exists) return;
    final task = TaskModel.fromFirestore(doc.id, doc.data()!);
    final newDeadline = task.deadlineDate.add(const Duration(hours: 1));
    await _tasksRef(goalId).doc(taskId).update({
      'deadlineDate': newDeadline.toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }

  /// Reschedule a task to a new date.
  Future<void> rescheduleTask(
      String goalId, String taskId, DateTime newDate) async {
    await _tasksRef(goalId).doc(taskId).update({
      'deadlineDate': newDate.toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }

  /// Get tasks due today across all goals for a specific goal set.
  Future<List<TaskModel>> getTasksDueToday(List<String> goalIds) async {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));

    final tasks = <TaskModel>[];
    for (final goalId in goalIds) {
      final snap = await _tasksRef(goalId)
          .where('deadlineDate',
              isGreaterThanOrEqualTo: startOfDay.toIso8601String())
          .where('deadlineDate', isLessThan: endOfDay.toIso8601String())
          .get();
      tasks.addAll(
        snap.docs.map((doc) => TaskModel.fromFirestore(doc.id, doc.data())),
      );
    }
    tasks.sort((a, b) => a.deadlineDate.compareTo(b.deadlineDate));
    return tasks;
  }

  /// Get a single task.
  Future<TaskModel?> getTask(String goalId, String taskId) async {
    final doc = await _tasksRef(goalId).doc(taskId).get();
    if (!doc.exists) return null;
    return TaskModel.fromFirestore(doc.id, doc.data()!);
  }

  /// Create a new task. Returns the generated document ID.
  Future<String> createTask(TaskModel task) async {
    final docRef = await _tasksRef(task.goalId).add(task.toFirestore());
    return docRef.id;
  }

  /// Update an existing task.
  Future<void> updateTask(TaskModel task) async {
    await _tasksRef(task.goalId).doc(task.id).update(task.toFirestore());
  }

  /// Mark a task as completed.
  Future<void> completeTask(String goalId, String taskId) async {
    await _tasksRef(goalId).doc(taskId).update({
      'status': TaskStatus.completed.name,
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }

  /// Delete a task.
  Future<void> deleteTask(String goalId, String taskId) async {
    await _tasksRef(goalId).doc(taskId).delete();
  }

  /// Update subtasks on a task.
  Future<void> updateSubtasks(
    String goalId,
    String taskId,
    List<Subtask> subtasks,
  ) async {
    await _tasksRef(goalId).doc(taskId).update({
      'subtasks': subtasks.map((s) => s.toMap()).toList(),
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }
}
