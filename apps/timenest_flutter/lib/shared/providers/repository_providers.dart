import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/goal_repository.dart';
import '../repositories/task_repository.dart';
import '../models/goal_model.dart';
import '../models/task_model.dart';

/// Singleton providers for repositories.
final goalRepositoryProvider = Provider<GoalRepository>((ref) {
  return GoalRepository();
});

final taskRepositoryProvider = Provider<TaskRepository>((ref) {
  return TaskRepository();
});

/// Stream of all goals.
final goalsStreamProvider = StreamProvider<List<GoalModel>>((ref) {
  return ref.watch(goalRepositoryProvider).watchGoals();
});

/// Stream of short-term goals.
final shortTermGoalsProvider = StreamProvider<List<GoalModel>>((ref) {
  return ref
      .watch(goalRepositoryProvider)
      .watchGoalsByType(GoalType.shortTerm);
});

/// Stream of long-term goals.
final longTermGoalsProvider = StreamProvider<List<GoalModel>>((ref) {
  return ref
      .watch(goalRepositoryProvider)
      .watchGoalsByType(GoalType.longTerm);
});

/// Stream of tasks for a specific goal.
final tasksForGoalProvider =
    StreamProvider.family<List<TaskModel>, String>((ref, goalId) {
  return ref.watch(taskRepositoryProvider).watchTasksForGoal(goalId);
});
