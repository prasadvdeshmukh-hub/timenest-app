import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/goal_repository.dart';
import '../repositories/task_repository.dart';
import '../repositories/habit_repository.dart';
import '../models/goal_model.dart';
import '../models/task_model.dart';
import '../models/habit_model.dart';

/// Singleton providers for repositories.
final goalRepositoryProvider = Provider<GoalRepository>((ref) {
  return GoalRepository();
});

final taskRepositoryProvider = Provider<TaskRepository>((ref) {
  return TaskRepository();
});

final habitRepositoryProvider = Provider<HabitRepository>((ref) {
  return HabitRepository();
});

/// Stream of all habits for the current user.
final habitsStreamProvider = StreamProvider<List<HabitModel>>((ref) {
  return ref.watch(habitRepositoryProvider).watchHabits();
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

/// Validation helpers for models.
class ModelValidator {
  static String? validateGoal(GoalModel goal) {
    if (goal.name.trim().isEmpty) return 'Goal name is required';
    if (goal.name.trim().length < 3) return 'Goal name must be at least 3 characters';
    if (goal.targetDate.isBefore(goal.startDate)) {
      return 'Target date must be after start date';
    }
    return null;
  }

  static String? validateTask(TaskModel task) {
    if (task.name.trim().isEmpty) return 'Task name is required';
    if (task.name.trim().length < 3) return 'Task name must be at least 3 characters';
    if (task.goalId.isEmpty) return 'Task must be linked to a goal';
    final validPriorities = TaskPriority.values.map((e) => e.name);
    if (!validPriorities.contains(task.priority.name)) {
      return 'Invalid priority level';
    }
    return null;
  }
}
