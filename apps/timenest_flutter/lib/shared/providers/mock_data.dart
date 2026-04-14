import '../models/goal_model.dart';
import '../models/task_model.dart';
import '../models/dashboard_summary.dart';

/// Empty data placeholders used before Firebase is connected.
///
/// Default sample goals, tasks, and habits have been removed so that
/// a fresh user lands on an empty dashboard. Screens read from these
/// lists as a safe fallback when Firestore streams are still loading
/// or have errored — they should always be empty in production.
class MockData {
  MockData._();

  static final DateTime now = DateTime.now();

  /// Zeroed dashboard summary — no default values shown to new users.
  static const DashboardSummary dashboardSummary = DashboardSummary(
    completedGoals: 0,
    inProgressGoals: 0,
    completedOnTime: 0,
    delayedGoals: 0,
    activeStreak: 0,
    snoozedReminders: 0,
    recurringTasksToday: 0,
    executionRhythm: 0,
  );

  /// No default sample goals.
  static final List<GoalModel> goals = <GoalModel>[];

  /// No default sample tasks for today.
  static final List<TaskModel> todaysTasks = <TaskModel>[];

  /// No default sample upcoming tasks.
  static final List<TaskModel> upcomingTasks = <TaskModel>[];
}
